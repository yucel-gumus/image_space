import { useMemo } from 'react';
import { Camera } from 'three';
import { CULLING } from '../utils/constants';
import { nodeToWorldPosition, distanceSquared } from '../utils/math.utils';
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

            const worldPos = nodeToWorldPosition(nodePos);
            const distSq = distanceSquared(cameraPosition, worldPos);

            return distSq < CULLING.VISIBILITY_DISTANCE_SQUARED;
        });
    }, [images, nodePositions, cameraPosition?.[0], cameraPosition?.[1], cameraPosition?.[2]]);
};

export const getCameraPosition = (camera: Camera | null): Position3D | null => {
    if (!camera) return null;
    return [camera.position.x, camera.position.y, camera.position.z];
};
