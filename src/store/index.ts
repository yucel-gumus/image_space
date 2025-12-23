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

// =============================================================================
// Typed Selectors (for external use)
// =============================================================================

export const selectDidInit = (state: AppState) => state.didInit;
export const selectImages = (state: AppState) => state.images;
export const selectLayout = (state: AppState) => state.layout;
export const selectLayouts = (state: AppState) => state.layouts;
export const selectNodePositions = (state: AppState) => state.nodePositions;
export const selectHighlightNodes = (state: AppState) => state.highlightNodes;
export const selectIsFetching = (state: AppState) => state.isFetching;
export const selectTargetImage = (state: AppState) => state.targetImage;
export const selectCaption = (state: AppState) => state.caption;
export const selectResetCam = (state: AppState) => state.resetCam;
export const selectIsSidebarOpen = (state: AppState) => state.isSidebarOpen;
