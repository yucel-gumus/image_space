import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createSelectorFunctions } from 'auto-zustand-selectors-hook';
import type { AppState } from '../types';

// =============================================================================
// Initial State
// =============================================================================

const initialState: AppState = {
    didInit: false,
    images: null,
    layout: 'sphere',
    layouts: null,
    nodePositions: null,
    highlightNodes: null,
    isFetching: false,
    targetImage: null,
    caption: null,
    resetCam: false,
    isSidebarOpen: false,
};

// =============================================================================
// Store
// =============================================================================

const useStoreBase = create<AppState>()(
    immer(() => initialState)
);

// =============================================================================
// Selectors with auto-generated hooks
// =============================================================================

const useStore = createSelectorFunctions(useStoreBase);

export default useStore;

// =============================================================================
// Store Accessors (for actions)
// =============================================================================

export const getState = useStoreBase.getState;
export const setState = useStoreBase.setState;
