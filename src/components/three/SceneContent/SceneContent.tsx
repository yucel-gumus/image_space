import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { TrackballControls } from '@react-three/drei';
import { animate } from 'motion';
import useStore, { setState } from '../../../store';
import PhotoNode from '../PhotoNode';
import { useAutoRotation } from '../../../hooks/useAutoRotation';
import { useCameraAnimation } from '../../../hooks/useCameraAnimation';
import { getCameraPosition } from '../../../hooks/useVisibleImages';
import {
    SCENE_SCALE,
    ANIMATION,
    LAYOUT_OFFSETS,
    CULLING,
    AUTO_ROTATION,
} from '../../../utils/constants';
import type { Position3D } from '../../../types';

// =============================================================================
// Types
// =============================================================================

interface GroupRef {
    rotation: { x: number; y: number; z: number };
    position: { x: number; y: number; z: number };
}

interface ControlsRef {
    target: { x: number; y: number; z: number; set: (x: number, y: number, z: number) => void; clone: () => { x: number; y: number; z: number } };
    update: () => void;
}

// =============================================================================
// SceneContent Component
// =============================================================================

const SceneContent: React.FC = () => {
    // Store state
    const images = useStore.use.images();
    const nodePositions = useStore.use.nodePositions();
    const layout = useStore.use.layout();
    const highlightNodes = useStore.use.highlightNodes();
    const targetImage = useStore.use.targetImage();
    const resetCam = useStore.use.resetCam();

    // Three.js hooks
    const { camera } = useThree();

    // Refs
    const groupRef = useRef<GroupRef>(null!);
    const controlsRef = useRef<ControlsRef>(null!);
    const frameCountRef = useRef(0);

    // State
    const [visibleImages, setVisibleImages] = useState(images ?? []);

    // Custom hooks
    const {
        onInteractionStart,
        onInteractionEnd,
        updateVelocity,
        stop: stopRotation,
    } = useAutoRotation();

    const { focusOnNode } = useCameraAnimation();

    // ==========================================================================
    // Target Image Focus Effect
    // ==========================================================================

    useEffect(() => {
        if (
            targetImage &&
            nodePositions &&
            layout &&
            camera &&
            controlsRef.current &&
            groupRef.current
        ) {
            stopRotation();

            focusOnNode(
                targetImage,
                nodePositions,
                camera,
                controlsRef.current,
                groupRef.current.rotation.y,
                groupRef.current.position.z
            );
        }
    }, [targetImage, nodePositions, layout, camera, focusOnNode, stopRotation]);

    // ==========================================================================
    // Layout Change Effect
    // ==========================================================================

    useEffect(() => {
        const controls = controlsRef.current;
        const group = groupRef.current;
        const duration = ANIMATION.CAMERA_DURATION;
        const ease = ANIMATION.EASE;

        // Kamera ve controls sıfırla
        if (controls && camera) {
            const targetPos: Position3D = [0, 0, 300];
            const targetLookAt: Position3D = [0, 0, 0];
            const currentTarget = controls.target.clone();

            const animations = [
                animate(camera.position.x, targetPos[0], {
                    duration,
                    ease,
                    onUpdate: (latest) => { camera.position.x = latest; },
                }),
                animate(camera.position.y, targetPos[1], {
                    duration,
                    ease,
                    onUpdate: (latest) => { camera.position.y = latest; },
                }),
                animate(camera.position.z, targetPos[2], {
                    duration,
                    ease,
                    onUpdate: (latest) => { camera.position.z = latest; },
                }),
                animate(currentTarget.x, targetLookAt[0], {
                    duration,
                    ease,
                    onUpdate: (latest) => {
                        if (controlsRef.current) controlsRef.current.target.x = latest;
                    },
                }),
                animate(currentTarget.y, targetLookAt[1], {
                    duration,
                    ease,
                    onUpdate: (latest) => {
                        if (controlsRef.current) controlsRef.current.target.y = latest;
                    },
                }),
                animate(currentTarget.z, targetLookAt[2], {
                    duration,
                    ease,
                    onUpdate: (latest) => {
                        if (controlsRef.current) controlsRef.current.target.z = latest;
                    },
                }),
            ];

            Promise.all(animations.map((a) => a.finished)).then(() => {
                if (controlsRef.current && camera) {
                    camera.position.set(...targetPos);
                    controlsRef.current.target.set(...targetLookAt);
                }
            });
        }

        // Group pozisyon ve rotasyon animasyonu
        if (group) {
            const targetZ = LAYOUT_OFFSETS[layout] ?? 0;

            animate(group.position.z, targetZ, {
                duration,
                ease,
                onUpdate: (latest) => { group.position.z = latest; },
            });

            ['x', 'y', 'z'].forEach((axis) => {
                animate(group.rotation[axis as keyof typeof group.rotation], 0, {
                    duration,
                    ease,
                    onUpdate: (latest) => { group.rotation[axis as keyof typeof group.rotation] = latest; },
                });
            });
        }

        // Reset cam flag'ini temizle
        setState((state) => {
            state.resetCam = false;
        });
    }, [layout, camera, resetCam]);

    // ==========================================================================
    // Frame Loop
    // ==========================================================================

    useFrame((_, delta) => {
        frameCountRef.current += 1;

        // Auto-rotation
        const velocity = updateVelocity(delta);

        if (
            groupRef.current &&
            Math.abs(velocity) > AUTO_ROTATION.MIN_VELOCITY &&
            layout !== 'grid'
        ) {
            groupRef.current.rotation.y += velocity * delta;
        }

        // Controls update
        if (controlsRef.current) {
            controlsRef.current.update();
        }

        // Görünür görselleri periyodik güncelle
        if (frameCountRef.current % CULLING.CHECK_INTERVAL_FRAMES === 0) {
            if (images && nodePositions && camera) {
                const cameraPos = getCameraPosition(camera);
                if (cameraPos) {
                    const filtered = images.filter((image) => {
                        const nodePos = nodePositions[image.id];
                        if (!nodePos) return false;

                        const worldX = (nodePos[0] - 0.5) * SCENE_SCALE;
                        const worldY = (nodePos[1] - 0.5) * SCENE_SCALE;
                        const worldZ = ((nodePos[2] ?? 0) - 0.5) * SCENE_SCALE;

                        const dx = cameraPos[0] - worldX;
                        const dy = cameraPos[1] - worldY;
                        const dz = cameraPos[2] - worldZ;
                        const distanceSquared = dx * dx + dy * dy + dz * dz;

                        return distanceSquared < CULLING.VISIBILITY_DISTANCE_SQUARED;
                    });

                    if (filtered.length !== visibleImages.length) {
                        setVisibleImages(filtered);
                    }
                }
            }
        }
    });

    // ==========================================================================
    // Rendered Images
    // ==========================================================================

    const renderedImages = useMemo(() => {
        const imagesToRender = visibleImages.length > 0 ? visibleImages : images ?? [];

        return imagesToRender
            .map((image) => {
                const isHighlighted = highlightNodes?.includes(image.id);
                const nodePos = nodePositions?.[image.id];

                if (!nodePos) return null;

                return (
                    <PhotoNode
                        key={image.id}
                        id={image.id}
                        description={image.description}
                        x={nodePos[0] - 0.5}
                        y={nodePos[1] - 0.5}
                        z={(nodePos[2] ?? 0) - 0.5}
                        highlight={
                            (highlightNodes && isHighlighted) ||
                            (targetImage !== null && targetImage === image.id)
                        }
                        dim={
                            (highlightNodes && !isHighlighted) ||
                            (targetImage !== null && targetImage !== image.id)
                        }
                    />
                );
            })
            .filter(Boolean);
    }, [visibleImages, images, nodePositions, highlightNodes, targetImage]);

    // ==========================================================================
    // Render
    // ==========================================================================

    return (
        <>
            <ambientLight intensity={2.3} />
            <TrackballControls
                ref={controlsRef as React.RefObject<any>}
                onStart={onInteractionStart}
                onEnd={onInteractionEnd}
                minDistance={20}
                maxDistance={1000}
                noPan
            />
            <group ref={groupRef as React.RefObject<any>}>
                {renderedImages}
            </group>
        </>
    );
};

export default SceneContent;
