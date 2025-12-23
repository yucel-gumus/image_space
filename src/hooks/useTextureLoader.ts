import { useState, useEffect, useMemo } from 'react';
import { Texture } from 'three';
import { preloadTexture, getTexture, loadTextureSync } from '../services/texture/texture.service';

interface UseTextureLoaderResult {
    texture: Texture | null;
    isLoading: boolean;
    error: Error | null;
}
export const useTextureLoader = (imageId: string): UseTextureLoaderResult => {
    const [texture, setTexture] = useState<Texture | null>(() => getTexture(imageId));
    const [isLoading, setIsLoading] = useState(!texture);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Zaten cache'de varsa yükleme yapma
        const cached = getTexture(imageId);
        if (cached) {
            setTexture(cached);
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        setIsLoading(true);

        preloadTexture(imageId)
            .then((loadedTexture) => {
                if (isMounted) {
                    setTexture(loadedTexture);
                    setIsLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err);
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [imageId]);

    return { texture, isLoading, error };
};
export const useTextureSyn = (imageId: string): Texture => {
    return useMemo(() => loadTextureSync(imageId), [imageId]);
};
