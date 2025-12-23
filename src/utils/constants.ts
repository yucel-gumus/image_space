export const SCENE_SCALE = 600;

export const THUMBNAIL = {
    WIDTH: 16,
    HEIGHT: 16,
    ASPECT_RATIO: 16 / 16,
} as const;

export const CAMERA = {
    INITIAL_POSITION: [0, 0, 300] as const,
    NEAR: 0.1,
    FAR: 10000,
    FOCUS_DISTANCE: 25,
    MIN_DISTANCE: 20,
    MAX_DISTANCE: 1000,
} as const;

// =============================================================================
// Animation Constants
// =============================================================================

export const ANIMATION = {
    CAMERA_DURATION: 0.8,
    OPACITY_DURATION: 0.5,
    NODE_TRANSITION_DURATION: 1,
    EASE: 'easeInOut',
    EASE_CIRC: 'circInOut',
} as const;

export const AUTO_ROTATION = {
    INITIAL_DELAY: 2000,
    INACTIVITY_TIMEOUT: 5000,
    TARGET_SPEED: 0.05,
    ACCELERATION: 0.3,
    MIN_VELOCITY: 0.0001,
} as const;

// =============================================================================
// Performance Constants
// =============================================================================

export const CULLING = {
    VISIBILITY_DISTANCE_SQUARED: 1440000,
    CHECK_INTERVAL_FRAMES: 30,
} as const;

export const DEBOUNCE = {
    SEARCH_QUERY: 300,
} as const;

// =============================================================================
// API Constants
// =============================================================================

export const STORAGE = {
    ROOT_URL: 'https://www.gstatic.com/aistudio/starter-apps/photosphere/',
    SPINNER_URL: 'https://storage.googleapis.com/experiments-uploads/g2demos/photo-applet/spinner.svg',
} as const;

export const DATA_FILES = {
    META: 'meta.json',
    SPHERE: 'sphere.json',
    UMAP_GRID: 'umap-grid.json',
} as const;

// =============================================================================
// UI Constants
// =============================================================================

export const SEARCH_PRESETS = ['kış', 'yapraklar', 'köpek', 'tabela'] as const;

export const SEARCH_PRESET_INTERVAL = 5000;

export const LAYOUT_OFFSETS = {
    sphere: 0,
    grid: 150,
    cluster3d: -300,
} as const;

// =============================================================================
// Three.js Filter Constants  
// =============================================================================

export const TEXTURE_FILTERS = {
    LINEAR: 1006,
} as const;
