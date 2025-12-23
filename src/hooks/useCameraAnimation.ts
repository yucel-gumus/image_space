import { useCallback } from 'react';
import { Camera } from 'three';
import { ANIMATION, CAMERA, SCENE_SCALE } from '../utils/constants';
import { localToWorld, normalizeAndScale } from '../utils/math.utils';
import type { Position3D, NodePositions } from '../types';

interface CameraAnimationControls {
    controls: {
        target: { x: number; y: number; z: number; set: (x: number, y: number, z: number) => void };
    };
}

interface UseCameraAnimationResult {
    focusOnNode: (
        nodeId: string,
        nodePositions: NodePositions,
        camera: Camera,
        controls: CameraAnimationControls['controls'],
        groupRotation: number,
        groupPositionZ: number
    ) => void;
    resetCamera: (
        camera: Camera,
        controls: CameraAnimationControls['controls']
    ) => void;
}

// Easing fonksiyonu (easeInOut)
const easeInOut = (t: number): number => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

export const useCameraAnimation = (): UseCameraAnimationResult => {
    const focusOnNode = useCallback(
        (
            nodeId: string,
            nodePositions: NodePositions,
            camera: Camera,
            controls: CameraAnimationControls['controls'],
            groupRotation: number,
            groupPositionZ: number
        ) => {
            const nodePos = nodePositions[nodeId];

            if (!nodePos) {
                console.warn(`Node pozisyonu bulunamadı: ${nodeId}`);
                return;
            }

            const localX = (nodePos[0] - 0.5) * SCENE_SCALE;
            const localY = (nodePos[1] - 0.5) * SCENE_SCALE;
            const localZ = ((nodePos[2] ?? 0) - 0.5) * SCENE_SCALE;
            const targetWorld = localToWorld(localX, localY, localZ, groupRotation, groupPositionZ);

            const duration = ANIMATION.CAMERA_DURATION * 1000;

            // Kamera pozisyonu hesapla
            const offsetDir = normalizeAndScale(
                camera.position.x - controls.target.x,
                camera.position.y - controls.target.y,
                camera.position.z - controls.target.z,
                CAMERA.FOCUS_DISTANCE
            );

            const targetCameraPos: Position3D = [
                targetWorld[0] + offsetDir[0],
                targetWorld[1] + offsetDir[1],
                targetWorld[2] + offsetDir[2],
            ];

            // Başlangıç değerleri
            const startCameraPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
            const startTargetPos = { x: controls.target.x, y: controls.target.y, z: controls.target.z };
            const startTime = performance.now();

            // Animasyon loop'u
            const animateFrame = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const rawProgress = Math.min(elapsed / duration, 1);
                const progress = easeInOut(rawProgress);

                camera.position.x = startCameraPos.x + (targetCameraPos[0] - startCameraPos.x) * progress;
                camera.position.y = startCameraPos.y + (targetCameraPos[1] - startCameraPos.y) * progress;
                camera.position.z = startCameraPos.z + (targetCameraPos[2] - startCameraPos.z) * progress;

                controls.target.x = startTargetPos.x + (targetWorld[0] - startTargetPos.x) * progress;
                controls.target.y = startTargetPos.y + (targetWorld[1] - startTargetPos.y) * progress;
                controls.target.z = startTargetPos.z + (targetWorld[2] - startTargetPos.z) * progress;

                if (rawProgress < 1) {
                    requestAnimationFrame(animateFrame);
                }
            };

            requestAnimationFrame(animateFrame);
        },
        []
    );

    const resetCamera = useCallback(
        (camera: Camera, controls: CameraAnimationControls['controls']) => {
            const targetPos = CAMERA.INITIAL_POSITION;
            const targetLookAt: Position3D = [0, 0, 0];
            const duration = ANIMATION.CAMERA_DURATION * 1000;

            const startCameraPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
            const startTargetPos = { x: controls.target.x, y: controls.target.y, z: controls.target.z };
            const startTime = performance.now();

            const animateFrame = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const rawProgress = Math.min(elapsed / duration, 1);
                const progress = easeInOut(rawProgress);

                camera.position.x = startCameraPos.x + (targetPos[0] - startCameraPos.x) * progress;
                camera.position.y = startCameraPos.y + (targetPos[1] - startCameraPos.y) * progress;
                camera.position.z = startCameraPos.z + (targetPos[2] - startCameraPos.z) * progress;

                controls.target.x = startTargetPos.x + (targetLookAt[0] - startTargetPos.x) * progress;
                controls.target.y = startTargetPos.y + (targetLookAt[1] - startTargetPos.y) * progress;
                controls.target.z = startTargetPos.z + (targetLookAt[2] - startTargetPos.z) * progress;

                if (rawProgress < 1) {
                    requestAnimationFrame(animateFrame);
                } else {
                    camera.position.set(...targetPos);
                    controls.target.set(...targetLookAt);
                }
            };

            requestAnimationFrame(animateFrame);
        },
        []
    );

    return { focusOnNode, resetCamera };
};
