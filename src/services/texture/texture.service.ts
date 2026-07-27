import { TextureLoader, Texture } from 'three';
import { STORAGE, TEXTURE_FILTERS } from '../../utils/constants';

// =============================================================================
// Cache
// =============================================================================

const MAX_TEXTURE_CACHE_SIZE = 150;
const textureCache = new Map<string, Texture>();
const loadingPromises = new Map<string, Promise<Texture>>();
/** Maps logical imageId → displayable URL (blob: / data: / remote) */
const imageUrlMap = new Map<string, string>();
const loader = new TextureLoader();

// =============================================================================
// Private Helpers
// =============================================================================

const optimizeTexture = (texture: Texture): void => {
    texture.generateMipmaps = false;
    texture.minFilter = TEXTURE_FILTERS.LINEAR;
    texture.magFilter = TEXTURE_FILTERS.LINEAR;
};

const setCacheTexture = (url: string, texture: Texture): void => {
    if (textureCache.size >= MAX_TEXTURE_CACHE_SIZE && !textureCache.has(url)) {
        const oldestUrl = textureCache.keys().next().value;
        if (oldestUrl) {
            const oldestTexture = textureCache.get(oldestUrl);
            oldestTexture?.dispose();
            textureCache.delete(oldestUrl);
        }
    }
    textureCache.set(url, texture);
};

const isDirectUrl = (value: string): boolean =>
    value.startsWith('blob:') ||
    value.startsWith('data:') ||
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/');

// =============================================================================
// Public API
// =============================================================================

/**
 * Resolve a displayable image URL for an image id.
 * User uploads are stored under ids like `upload_…` and must map to
 * the registered blob:/data: URL — never return the bare id as a src.
 */
export const getImageUrl = (imageId: string): string => {
    if (isDirectUrl(imageId)) {
        return imageId;
    }

    const registered = imageUrlMap.get(imageId);
    if (registered) {
        return registered;
    }

    // Fallback for ids that somehow only live in the texture cache keyed by URL
    for (const [key] of textureCache) {
        if (key === imageId) continue;
        if (isDirectUrl(key) && textureCache.get(imageId) === textureCache.get(key)) {
            return key;
        }
    }

    return `${STORAGE.ROOT_URL}${imageId}`;
};

/** Register the real URL for a logical image id (used by sidebar + texture loader). */
export const registerImageUrl = (imageId: string, url: string): void => {
    if (!imageId || !url) return;
    imageUrlMap.set(imageId, url);
};

export const registerBlobTexture = (imageId: string, file: File | Blob): string => {
    const objectUrl = URL.createObjectURL(file);
    registerImageUrl(imageId, objectUrl);

    const texture = loader.load(objectUrl, (loadedTexture) => {
        loadedTexture.needsUpdate = true;
        optimizeTexture(loadedTexture);
    });
    optimizeTexture(texture);
    setCacheTexture(objectUrl, texture);
    setCacheTexture(imageId, texture);
    return objectUrl;
};

export const registerDataUrlTexture = (imageId: string, dataUrl: string): Texture => {
    registerImageUrl(imageId, dataUrl);

    if (textureCache.has(imageId)) {
        const cached = textureCache.get(imageId)!;
        cached.needsUpdate = true;
        return cached;
    }

    const texture = loader.load(dataUrl, (loadedTexture) => {
        loadedTexture.needsUpdate = true;
        optimizeTexture(loadedTexture);
    });

    optimizeTexture(texture);
    setCacheTexture(dataUrl, texture);
    setCacheTexture(imageId, texture);

    return texture;
};

export const preloadTexture = (imageId: string): Promise<Texture> => {
    if (textureCache.has(imageId)) {
        return Promise.resolve(textureCache.get(imageId)!);
    }

    const url = getImageUrl(imageId);

    if (textureCache.has(url)) {
        const tex = textureCache.get(url)!;
        setCacheTexture(imageId, tex);
        return Promise.resolve(tex);
    }

    if (loadingPromises.has(url)) {
        return loadingPromises.get(url)!;
    }

    const promise = new Promise<Texture>((resolve, reject) => {
        loader.load(
            url,
            (texture) => {
                optimizeTexture(texture);
                setCacheTexture(url, texture);
                setCacheTexture(imageId, texture);
                loadingPromises.delete(url);
                resolve(texture);
            },
            undefined,
            (error) => {
                loadingPromises.delete(url);
                reject(error);
            }
        );
    });

    loadingPromises.set(url, promise);
    return promise;
};

export const getTexture = (imageId: string): Texture | null => {
    if (textureCache.has(imageId)) {
        return textureCache.get(imageId)!;
    }

    const url = getImageUrl(imageId);

    if (textureCache.has(url)) {
        return textureCache.get(url)!;
    }

    preloadTexture(imageId);
    return null;
};

export const loadTextureSync = (imageId: string): Texture => {
    if (textureCache.has(imageId)) {
        return textureCache.get(imageId)!;
    }

    const url = getImageUrl(imageId);

    if (textureCache.has(url)) {
        const tex = textureCache.get(url)!;
        setCacheTexture(imageId, tex);
        return tex;
    }

    const texture = loader.load(url);
    optimizeTexture(texture);
    setCacheTexture(url, texture);
    setCacheTexture(imageId, texture);

    return texture;
};

export const preloadTextures = (imageIds: string[]): Promise<Texture[]> => {
    return Promise.all(imageIds.map(preloadTexture));
};

export const clearCache = (disposeTextures: boolean = true): void => {
    if (disposeTextures) {
        textureCache.forEach((texture) => texture.dispose());
    }
    textureCache.clear();
    loadingPromises.clear();
    imageUrlMap.clear();
};

export const getCacheStats = () => ({
    cachedCount: textureCache.size,
    loadingCount: loadingPromises.size,
    urlMapCount: imageUrlMap.size,
});
