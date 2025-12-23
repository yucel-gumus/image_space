import { TextureLoader, Texture } from 'three';
import { STORAGE, TEXTURE_FILTERS } from '../../utils/constants';

// =============================================================================
// Cache
// =============================================================================

const textureCache = new Map<string, Texture>();
const loadingPromises = new Map<string, Promise<Texture>>();
const loader = new TextureLoader();

// =============================================================================
// Private Helpers
// =============================================================================

const optimizeTexture = (texture: Texture): void => {
    texture.generateMipmaps = false;
    texture.minFilter = TEXTURE_FILTERS.LINEAR;
    texture.magFilter = TEXTURE_FILTERS.LINEAR;
};

// =============================================================================
// Public API
// =============================================================================

export const getImageUrl = (imageId: string): string => {
    return `${STORAGE.ROOT_URL}${imageId}`;
};

export const preloadTexture = (imageId: string): Promise<Texture> => {
    const url = getImageUrl(imageId);

    // Cache'de varsa hemen döndür
    if (textureCache.has(url)) {
        return Promise.resolve(textureCache.get(url)!);
    }

    // Zaten yükleniyor mu kontrol et
    if (loadingPromises.has(url)) {
        return loadingPromises.get(url)!;
    }

    // Yeni yükleme başlat
    const promise = new Promise<Texture>((resolve, reject) => {
        loader.load(
            url,
            (texture) => {
                optimizeTexture(texture);
                textureCache.set(url, texture);
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
    const url = getImageUrl(imageId);

    if (textureCache.has(url)) {
        return textureCache.get(url)!;
    }

    // Cache'de yoksa yüklemeyi tetikle
    preloadTexture(imageId);
    return null;
};

export const loadTextureSync = (imageId: string): Texture => {
    const url = getImageUrl(imageId);

    if (textureCache.has(url)) {
        return textureCache.get(url)!;
    }

    const texture = loader.load(url);
    optimizeTexture(texture);
    textureCache.set(url, texture);

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
};

export const getCacheStats = () => ({
    cachedCount: textureCache.size,
    loadingCount: loadingPromises.size,
});
