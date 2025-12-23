import { Position3D } from '../types';
import { SCENE_SCALE } from './constants';
export const calculateWorldPosition = (
    x: number,
    y: number,
    z: number = 0,
    scale: number = SCENE_SCALE
): Position3D => {
    return [x * scale, y * scale, z * scale];
};

export const distanceSquared = (p1: Position3D, p2: Position3D): number => {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    const dz = p1[2] - p2[2];
    return dx * dx + dy * dy + dz * dz;
};

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
    const length = Math.sqrt(x * x + y * y + z * z);

    if (length === 0) {
        return [0, 0, scale];
    }

    const factor = scale / length;
    return [x * factor, y * factor, z * factor];
};

export const debounce = <T extends (...args: string[]) => unknown>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
