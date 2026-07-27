import { getState, setState } from './index';
import { searchImages, analyzeImage } from '../services/api/llm.service';
import { registerBlobTexture, registerDataUrlTexture } from '../services/texture/texture.service';
import {
    debounce,
    generateAppendedGridPositions,
    generateAppendedSpherePositions,
} from '../utils/math.utils';
import {
    saveUserImagesToDB,
    getAllUserImagesFromDB,
    type StoredUserImage,
} from '../utils/db.utils';
import { DEBOUNCE, DATA_FILES, GRID_LAYOUT } from '../utils/constants';
import type { LayoutType, ImageMetadata, NodePositions, Position3D } from '../types';

// =============================================================================
// Cache
// =============================================================================

const MAX_QUERY_CACHE_SIZE = 50;
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
        const [images, sphere, umapGrid, storedUserImages] = await Promise.all([
            fetch(DATA_FILES.META).then((res) => res.json()) as Promise<ImageMetadata[]>,
            fetch(DATA_FILES.SPHERE).then((res) => res.json()) as Promise<NodePositions>,
            fetch(DATA_FILES.UMAP_GRID).then((res) => res.json()) as Promise<
                Record<string, [number, number]>
            >,
            getAllUserImagesFromDB(),
        ]);

        // Base planar grid — same transform as the original photosphere data
        const gridPositions: NodePositions = Object.fromEntries(
            Object.entries(umapGrid).map(([k, [x, y]]) => [
                k,
                [x, y / GRID_LAYOUT.ASPECT_RATIO + GRID_LAYOUT.Y_OFFSET, 0.5],
            ])
        );

        if (storedUserImages.length > 0) {
            // Always recompute layout coords from the live base lattice so older
            // IndexedDB records with wrong formulas still land on the next free row.
            const sphereSlots = generateAppendedSpherePositions(sphere, storedUserImages.length);
            const gridSlots = generateAppendedGridPositions(gridPositions, storedUserImages.length);

            const correctedRecords: StoredUserImage[] = [];

            storedUserImages.forEach((record, i) => {
                const sPos = sphereSlots[i];
                const gPos = gridSlots[i];
                if (!sPos || !gPos) return;

                registerDataUrlTexture(record.id, record.dataUrl);
                images.push({ id: record.id, description: record.description });

                sphere[record.id] = sPos;
                gridPositions[record.id] = gPos;

                correctedRecords.push({
                    ...record,
                    spherePos: sPos,
                    gridPos: gPos,
                });
            });

            // Persist corrected positions so next loads stay consistent
            void saveUserImagesToDB(correctedRecords);
        }

        setState((state) => {
            state.images = images;
            state.layouts = {
                sphere,
                grid: gridPositions,
            };
            // Start centered; setLayout will snap to sphere immediately after
            state.nodePositions = Object.fromEntries(
                images.map(({ id }) => [id, [0.5, 0.5, 0.5] as Position3D])
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

// =============================================================================
// Search Actions
// =============================================================================

const debouncedSearch = debounce(async (query: string) => {
    const state = getState();
    const cacheKey = query.toLowerCase().trim();

    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey)!;
        setState((draft) => {
            draft.highlightNodes = cached.highlightNodes;
            draft.caption = cached.caption;
            draft.isFetching = false;
        });
        return;
    }

    if (!state.images) {
        console.warn('Arama için görsel listesi mevcut değil');
        setState((draft) => {
            draft.isFetching = false;
        });
        return;
    }

    try {
        const result = await searchImages(state.images, query);

        const cacheEntry = {
            highlightNodes: result.filenames,
            caption: result.commentary,
        };

        if (queryCache.size >= MAX_QUERY_CACHE_SIZE) {
            const firstKey = queryCache.keys().next().value;
            if (firstKey) queryCache.delete(firstKey);
        }

        queryCache.set(cacheKey, cacheEntry);

        setState((draft) => {
            draft.highlightNodes = cacheEntry.highlightNodes;
            draft.caption = cacheEntry.caption;
            draft.isFetching = false;
        });
    } catch (error) {
        console.error('Arama hatası:', error);
        setState((draft) => {
            draft.caption = `"${query}" araması sırasında hata oluştu`;
            draft.highlightNodes = null;
            draft.isFetching = false;
        });
    }
}, DEBOUNCE.SEARCH_QUERY);

export const sendQuery = (query: string): void => {
    if (!query?.trim()) return;

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

    // Do not clear highlightNodes here — search filter stays until clearQuery().
    setState((state) => {
        state.targetImage = newTarget;
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

// =============================================================================
// Dynamic Image Upload & Processing Actions
// =============================================================================

type UploadMeta = ImageMetadata & { dataUrl?: string };

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const commaIndex = result.indexOf(',');
            const base64 = commaIndex !== -1 ? result.slice(commaIndex + 1) : result;
            resolve({ base64, mimeType: file.type || 'image/jpeg' });
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
};

export const uploadAndProcessImages = async (files: File[]): Promise<void> => {
    if (!files || files.length === 0) return;

    setState((state) => {
        state.isFetching = true;
        state.caption = `${files.length} görsel yükleniyor ve Kensai ile analiz ediliyor...`;
    });

    const currentImages = getState().images ?? [];
    const newMetadata: UploadMeta[] = [];
    const dbRecordsToSave: StoredUserImage[] = [];

    const BATCH_SIZE = 5;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);

        await Promise.all(
            batch.map(async (file, idx) => {
                const uniqueId = `upload_${Date.now()}_${i + idx}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;

                registerBlobTexture(uniqueId, file);

                let description = `Yüklenen görsel: ${file.name}`;
                let dataUrl = '';
                try {
                    const { base64, mimeType } = await fileToBase64(file);
                    dataUrl = `data:${mimeType};base64,${base64}`;
                    // Also register durable data URL so reload + sidebar stay in sync
                    registerDataUrlTexture(uniqueId, dataUrl);
                    const aiDescription = await analyzeImage(base64, mimeType);
                    if (aiDescription?.trim()) {
                        description = aiDescription.trim();
                    }
                } catch (err) {
                    console.warn(
                        `Görsel analiz edilemedi (${file.name}), varsayılan metin kullanılıyor:`,
                        err
                    );
                }

                newMetadata.push({
                    id: uniqueId,
                    description,
                    ...(dataUrl ? { dataUrl } : {}),
                });
            })
        );
    }

    const updatedImages = [
        ...currentImages,
        ...newMetadata.map(({ id, description }) => ({ id, description })),
    ];

    const currentSphere: NodePositions = { ...(getState().layouts?.sphere ?? {}) };
    const currentGrid: NodePositions = { ...(getState().layouts?.grid ?? {}) };

    // Place only the new items on the next free lattice / sphere slots
    const sphereSlots = generateAppendedSpherePositions(currentSphere, newMetadata.length);
    const gridSlots = generateAppendedGridPositions(currentGrid, newMetadata.length);

    newMetadata.forEach((img, i) => {
        const sPos = sphereSlots[i];
        const gPos = gridSlots[i];
        if (!sPos || !gPos) return;

        currentSphere[img.id] = sPos;
        currentGrid[img.id] = gPos;

        if (img.dataUrl) {
            dbRecordsToSave.push({
                id: img.id,
                description: img.description,
                dataUrl: img.dataUrl,
                spherePos: sPos,
                gridPos: gPos,
                timestamp: Date.now(),
            });
        }
    });

    if (dbRecordsToSave.length > 0) {
        await saveUserImagesToDB(dbRecordsToSave);
    }

    const currentLayout = getState().layout;

    setState((state) => {
        state.images = updatedImages;
        state.layouts = {
            sphere: currentSphere,
            grid: currentGrid,
        };
        state.nodePositions = currentLayout === 'grid' ? currentGrid : currentSphere;
        state.isFetching = false;
        state.caption = `${files.length} görsel 3D uzaya ve arama indeksine başarıyla eklendi! ✨`;
    });
};

// =============================================================================
// Auto-init removed: init() is called via useEffect in App component
// =============================================================================
