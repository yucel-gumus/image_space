import type { NodePositions, Position3D } from '../types';
import { GRID_LATTICE, SCENE_SCALE, SPHERE_SHELL_RADIUS } from './constants';

// =============================================================================
// Spatial transforms
// =============================================================================

export const calculateWorldPosition = (
    x: number,
    y: number,
    z: number = 0,
    scale: number = SCENE_SCALE
): Position3D => [x * scale, y * scale, z * scale];

/**
 * Normalize layout coords from [0,1]-ish space (center at 0.5) into world units.
 * Missing Z defaults to 0.5 so planar grids sit on z=0 after centering.
 */
export const nodeToWorldPosition = (
    nodePos: readonly number[],
    scale: number = SCENE_SCALE
): Position3D => {
    const x = nodePos[0] ?? 0.5;
    const y = nodePos[1] ?? 0.5;
    const z = nodePos[2] ?? 0.5;
    return [(x - 0.5) * scale, (y - 0.5) * scale, (z - 0.5) * scale];
};

export const distanceSquared = (p1: Position3D, p2: Position3D): number => {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    const dz = p1[2] - p2[2];
    return dx * dx + dy * dy + dz * dz;
};

/** Yaw rotation around Y + optional group Z translation. */
export const localToWorld = (
    localX: number,
    localY: number,
    localZ: number,
    rotationY: number,
    offsetZ: number = 0
): Position3D => {
    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    return [
        localX * cosY - localZ * sinY,
        localY,
        localX * sinY + localZ * cosY + offsetZ,
    ];
};

export const normalizeAndScale = (
    x: number,
    y: number,
    z: number,
    scale: number
): Position3D => {
    const length = Math.hypot(x, y, z);
    if (length < 1e-12) {
        return [0, 0, scale];
    }
    const factor = scale / length;
    return [x * factor, y * factor, z * factor];
};

// =============================================================================
// Grid layout analysis & append
// =============================================================================

export interface GridLayoutMetrics {
    cols: number;
    rows: number;
    xMin: number;
    yMin: number;
    xStep: number;
    yStep: number;
    /** Number of cells already occupied (base + previous uploads). */
    occupied: number;
}

const COORD_PRECISION = 6;

const uniqueSorted = (values: number[]): number[] => {
    const set = new Set(values.map((v) => Number(v.toFixed(COORD_PRECISION))));
    return [...set].sort((a, b) => a - b);
};

const medianStep = (sorted: number[], fallback: number): number => {
    if (sorted.length < 2) return fallback;
    const diffs: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
        const a = sorted[i];
        const b = sorted[i - 1];
        if (a === undefined || b === undefined) continue;
        const d = a - b;
        if (d > 1e-9) diffs.push(d);
    }
    if (diffs.length === 0) return fallback;
    diffs.sort((a, b) => a - b);
    return diffs[Math.floor(diffs.length / 2)] ?? fallback;
};

const isUserUploadId = (id: string): boolean => id.startsWith('upload_');

const defaultGridMetrics = (occupied: number = 0): GridLayoutMetrics => ({
    cols: GRID_LATTICE.COLS,
    rows: 0,
    xMin: GRID_LATTICE.X_MIN,
    yMin: GRID_LATTICE.Y_MIN,
    xStep: GRID_LATTICE.X_STEP,
    yStep: GRID_LATTICE.Y_STEP,
    occupied,
});

/**
 * Infer the regular grid structure from existing layout positions.
 * Metrics are derived from base (non-upload) samples so a few bad upload
 * coords cannot skew column spacing. `occupied` still counts everyone.
 */
export const analyzeGridLayout = (positions: NodePositions): GridLayoutMetrics => {
    const allIds = Object.keys(positions);
    const occupied = allIds.length;

    const baseEntries: number[][] = [];
    for (const id of allIds) {
        if (isUserUploadId(id)) continue;
        const p = positions[id];
        if (p) baseEntries.push(p);
    }

    const sample: number[][] =
        baseEntries.length > 0 ? baseEntries : Object.values(positions).map((p) => [...p]);

    if (sample.length === 0) {
        return defaultGridMetrics(0);
    }

    const xs = uniqueSorted(sample.map((p) => p[0] ?? 0));
    const ys = uniqueSorted(sample.map((p) => p[1] ?? 0));

    if (xs.length === 0 || ys.length === 0) {
        return defaultGridMetrics(occupied);
    }

    const cols = Math.max(xs.length, 1);
    const rows = ys.length;
    const xMin = xs[0] ?? GRID_LATTICE.X_MIN;
    const yMin = ys[0] ?? GRID_LATTICE.Y_MIN;
    const xStep = medianStep(xs, GRID_LATTICE.X_STEP);
    const yStep = medianStep(ys, GRID_LATTICE.Y_STEP);

    return {
        cols,
        rows,
        xMin,
        yMin,
        xStep,
        yStep,
        occupied,
    };
};

/**
 * Absolute cell index → grid coordinate matching the base lattice.
 * Continues onto the next row after the last filled row (no gaps / no drift).
 */
export const generateGridPosition = (
    absoluteIndex: number,
    metrics?: GridLayoutMetrics
): Position3D => {
    const m = metrics ?? defaultGridMetrics();

    const cols = Math.max(m.cols, 1);
    const col = ((absoluteIndex % cols) + cols) % cols;
    const row = Math.floor(absoluteIndex / cols);

    const x = m.xMin + col * m.xStep;
    const y = m.yMin + row * m.yStep;

    // Planar grid: Z at center (0.5) so nodeToWorld / PhotoNode land on z=0
    return [x, y, 0.5];
};

/**
 * Append `count` new cells after currently occupied ones.
 * Returns positions in order for the new items only.
 */
export const generateAppendedGridPositions = (
    existing: NodePositions,
    count: number
): Position3D[] => {
    const metrics = analyzeGridLayout(existing);
    const result: Position3D[] = [];
    for (let i = 0; i < count; i++) {
        result.push(generateGridPosition(metrics.occupied + i, metrics));
    }
    return result;
};

// =============================================================================
// Sphere layout analysis & append
// =============================================================================

/**
 * Mean radius of existing sphere samples around the unit-cube center (0.5,0.5,0.5).
 * Base sphere.json averages ~0.155 — not the previous hard-coded 0.10.
 */
export const analyzeSphereRadius = (positions: NodePositions): number => {
    const sample: number[][] = [];
    for (const [id, p] of Object.entries(positions)) {
        if (isUserUploadId(id)) continue;
        sample.push(p);
    }
    if (sample.length === 0) {
        for (const p of Object.values(positions)) sample.push(p);
    }

    if (sample.length === 0) return SPHERE_SHELL_RADIUS;

    let sum = 0;
    let n = 0;
    for (const p of sample) {
        if (p.length < 3) continue;
        const dx = (p[0] ?? 0.5) - 0.5;
        const dy = (p[1] ?? 0.5) - 0.5;
        const dz = (p[2] ?? 0.5) - 0.5;
        const r = Math.hypot(dx, dy, dz);
        if (r > 1e-6) {
            sum += r;
            n++;
        }
    }
    return n > 0 ? sum / n : SPHERE_SHELL_RADIUS;
};

/**
 * Fibonacci sphere sample. Uses the same radius as the base photosphere cloud
 * so uploads sit on the shell instead of collapsing inward.
 */
export const generateSpherePosition = (
    index: number,
    total: number,
    radius: number = SPHERE_SHELL_RADIUS
): Position3D => {
    if (total <= 1) return [0.5, 0.5, 0.5];

    const safeTotal = Math.max(total, 1);
    const safeIndex = Math.max(0, Math.min(index, safeTotal - 1));

    // Equal-area latitude rings (Fibonacci / golden-angle spiral)
    const phi = Math.acos(1 - (2 * (safeIndex + 0.5)) / safeTotal);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const theta = safeIndex * goldenAngle;

    const sinPhi = Math.sin(phi);
    const x = sinPhi * Math.cos(theta);
    const y = Math.cos(phi);
    const z = sinPhi * Math.sin(theta);

    return [0.5 + x * radius, 0.5 + y * radius, 0.5 + z * radius];
};

/**
 * Append `count` new points on the sphere shell without moving existing ones.
 * Indices continue after `occupied` so points fill residual surface gaps.
 */
export const generateAppendedSpherePositions = (
    existing: NodePositions,
    count: number
): Position3D[] => {
    const occupied = Object.keys(existing).length;
    const total = occupied + count;
    const radius = analyzeSphereRadius(existing);
    const result: Position3D[] = [];
    for (let i = 0; i < count; i++) {
        result.push(generateSpherePosition(occupied + i, total, radius));
    }
    return result;
};

// =============================================================================
// Misc
// =============================================================================

export const debounce = <T extends (...args: never[]) => unknown>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
