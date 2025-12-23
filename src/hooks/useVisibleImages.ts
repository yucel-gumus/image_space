import { useMemo } from 'react';
import { Camera } from 'three';
import { CULLING, SCENE_SCALE } from '../utils/constants';
import type { ImageMetadata, NodePositions, Position3D } from '../types';

interface UseVisibleImagesParams {
    images: ImageMetadata[] | null;
    nodePositions: NodePositions | null;
    cameraPosition: Position3D | null;
}

export const useVisibleImages = ({
    images,
    nodePositions,
    cameraPosition,
}: UseVisibleImagesParams): ImageMetadata[] => {
    return useMemo(() => {
        if (!images || !nodePositions || !cameraPosition) {
            return images ?? [];
        }

        return images.filter((image) => {
            const nodePos = nodePositions[image.id];
            if (!nodePos) return false;

            // Dünya koordinatlarına dönüştür
            const worldX = (nodePos[0] - 0.5) * SCENE_SCALE;
            const worldY = (nodePos[1] - 0.5) * SCENE_SCALE;
            const worldZ = ((nodePos[2] ?? 0) - 0.5) * SCENE_SCALE;

            // Kameradan mesafe (kare - sqrt'den kaçın)
            const dx = cameraPosition[0] - worldX;
            const dy = cameraPosition[1] - worldY;
            const dz = cameraPosition[2] - worldZ;
            const distanceSquared = dx * dx + dy * dy + dz * dz;

            return distanceSquared < CULLING.VISIBILITY_DISTANCE_SQUARED;
        });
    }, [images, nodePositions, cameraPosition?.[0], cameraPosition?.[1], cameraPosition?.[2]]);
};

export const getCameraPosition = (camera: Camera | null): Position3D | null => {
    if (!camera) return null;
    return [camera.position.x, camera.position.y, camera.position.z];
};
