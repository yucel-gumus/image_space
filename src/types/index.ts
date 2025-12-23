export interface ImageMetadata {
    /** Görsel benzersiz kimliği (dosya adı) */
    id: string;
    /** Görsel açıklaması */
    description: string;
}

export type Position3D = [number, number, number];
export type Position2D = [number, number];

export type NodePositions = Record<string, Position3D | Position2D>;

export type LayoutType = 'sphere' | 'grid';

export interface Layouts {
    sphere: NodePositions;
    grid: NodePositions;
}

// =============================================================================
// Store Types
// =============================================================================

export interface AppState {
    didInit: boolean;
    images: ImageMetadata[] | null;
    layout: LayoutType;
    layouts: Layouts | null;
    nodePositions: NodePositions | null;
    highlightNodes: string[] | null;
    isFetching: boolean;
    targetImage: string | null;
    caption: string | null;
    resetCam: boolean;
    isSidebarOpen: boolean;
}

// =============================================================================
// LLM Types
// =============================================================================

export interface LlmQueryParams {
    prompt: string;
    image?: string;
}

export interface LlmSearchResponse {
    filenames: string[];
    commentary: string;
}

// =============================================================================
// Component Props Types
// =============================================================================

export interface PhotoNodeProps {
    id: string;
    x?: number;
    y?: number;
    z?: number;
    highlight?: boolean;
    dim?: boolean;
    description: string;
}

export interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: (query: string) => void;
    onClear: () => void;
    isLoading: boolean;
    hasResults: boolean;
    placeholder?: string;
}
export interface LayoutControlsProps {
    activeLayout: LayoutType;
    onLayoutChange: (layout: LayoutType) => void;
}

export interface CameraTarget {
    position: Position3D;
    lookAt: Position3D;
}

export interface AnimationConfig {
    duration: number;
    ease: string;
}
