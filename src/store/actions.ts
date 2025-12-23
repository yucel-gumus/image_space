import { getState, setState } from './index';
import { searchImages } from '../services/api/llm.service';
import { debounce } from '../utils/math.utils';
import { DEBOUNCE, DATA_FILES } from '../utils/constants';
import type { LayoutType, ImageMetadata, NodePositions } from '../types';

// =============================================================================
// Cache
// =============================================================================

const queryCache = new Map<string, { highlightNodes: string[]; caption: string }>();

// =============================================================================
// Initialization
// =============================================================================

export const init = async (): Promise<void> => {
    if (getState().didInit) {
        return;
    }

    setState((state) => {
        state.didInit = true;
    });

    try {
        const [images, sphere, umapGrid] = await Promise.all([
            fetch(DATA_FILES.META).then((res) => res.json()) as Promise<ImageMetadata[]>,
            fetch(DATA_FILES.SPHERE).then((res) => res.json()) as Promise<NodePositions>,
            fetch(DATA_FILES.UMAP_GRID).then((res) => res.json()) as Promise<Record<string, [number, number]>>,
        ]);

        setState((state) => {
            state.images = images;
            state.layouts = {
                sphere,
                grid: Object.fromEntries(
                    Object.entries(umapGrid).map(([k, [x, y]]) => [
                        k,
                        [x, y / (16 / 9) + 0.25],
                    ])
                ),
            };
            state.nodePositions = Object.fromEntries(
                images.map(({ id }) => [id, [0.5, 0.5, 0.5]])
            );
        });

        setLayout('sphere');
    } catch (error) {
        console.error('Uygulama başlatma hatası:', error);
    }
};

// =============================================================================
// Layout Actions
// =============================================================================

export const setLayout = (layout: LayoutType): void => {
    setState((state) => {
        state.layout = layout;
        if (state.layouts) {
            state.nodePositions = state.layouts[layout];
        }
    });
};

export const setSphereLayout = (positions: NodePositions): void => {
    setState((state) => {
        if (state.layouts) {
            state.layouts.sphere = positions;
        }
    });
};

// =============================================================================
// Search Actions
// =============================================================================

const debouncedSearch = debounce(async (query: string) => {
    const state = getState();
    const cacheKey = query.toLowerCase().trim();

    // Cache kontrolü
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey)!;
        setState((state) => {
            state.highlightNodes = cached.highlightNodes;
            state.caption = cached.caption;
            state.isFetching = false;
        });
        return;
    }

    if (!state.images) {
        console.warn('Arama için görsel listesi mevcut değil');
        setState((state) => {
            state.isFetching = false;
        });
        return;
    }

    try {
        const result = await searchImages(state.images, query);

        const cacheEntry = {
            highlightNodes: result.filenames,
            caption: result.commentary,
        };

        queryCache.set(cacheKey, cacheEntry);

        setState((state) => {
            state.highlightNodes = cacheEntry.highlightNodes;
            state.caption = cacheEntry.caption;
            state.isFetching = false;
        });
    } catch (error) {
        console.error('Arama hatası:', error);
        setState((state) => {
            state.caption = `"${query}" araması sırasında hata oluştu`;
            state.highlightNodes = null;
            state.isFetching = false;
        });
    }
}, DEBOUNCE.SEARCH_QUERY);

export const sendQuery = (query: string): void => {
    if (!query?.trim()) {
        return;
    }

    setState((state) => {
        state.isFetching = true;
        state.caption = `"${query}" aranıyor...`;
        state.targetImage = null;
        state.resetCam = true;
    });

    debouncedSearch(query);
};

export const clearQuery = (): void => {
    setState((state) => {
        state.highlightNodes = null;
        state.caption = null;
        state.targetImage = null;
    });
};

// =============================================================================
// Image Selection Actions
// =============================================================================

export const setTargetImage = (targetImage: string | null): void => {
    const currentTarget = getState().targetImage;
    const newTarget = targetImage === currentTarget ? null : targetImage;

    setState((state) => {
        state.targetImage = newTarget;
        state.highlightNodes = null;
    });
};

// =============================================================================
// UI Actions
// =============================================================================

export const setSidebarOpen = (isOpen: boolean): void => {
    setState((state) => {
        state.isSidebarOpen = isOpen;
    });
};

export const setResetCam = (reset: boolean): void => {
    setState((state) => {
        state.resetCam = reset;
    });
};

// =============================================================================
// Auto-init
// =============================================================================

init();
