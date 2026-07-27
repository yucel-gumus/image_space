import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { animate } from 'motion';
import useStore, { setState } from '../../../store';
import PhotoNode from '../PhotoNode';
import { useAutoRotation } from '../../../hooks/useAutoRotation';
import { useCameraAnimation } from '../../../hooks/useCameraAnimation';
import { getCameraPosition } from '../../../hooks/useVisibleImages';
import { nodeToWorldPosition, localToWorld, distanceSquared } from '../../../utils/math.utils';
import {
    CAMERA,
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

    // State & Ref for visible images
    const [visibleImages, setVisibleImages] = useState(images ?? []);
    const visibleImagesRef = useRef(visibleImages);

    // Sync visibleImages whenever store images array changes (upload or load)
    useEffect(() => {
        if (images) {
            setVisibleImages(images);
            visibleImagesRef.current = images;
        }
    }, [images]);

    useEffect(() => {
        visibleImagesRef.current = visibleImages;
    }, [visibleImages]);

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
            const targetPos: Position3D = [...CAMERA.INITIAL_POSITION];
            const targetLookAt: Position3D = [...CAMERA.LOOK_AT];
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

        // Görünür görselleri periyodik güncelle (gerçek 3D dünya koordinatlarına göre)
        if (frameCountRef.current % CULLING.CHECK_INTERVAL_FRAMES === 0) {
            if (images && nodePositions && camera) {
                const cameraPos = getCameraPosition(camera);
                if (cameraPos) {
                    const groupRotY = groupRef.current ? groupRef.current.rotation.y : 0;
                    const groupPosZ = groupRef.current ? groupRef.current.position.z : 0;

                    const filtered = images.filter((image) => {
                        const nodePos = nodePositions[image.id];
                        if (!nodePos) return false;

                        const [localX, localY, localZ] = nodeToWorldPosition(nodePos);
                        const worldPos = localToWorld(localX, localY, localZ, groupRotY, groupPosZ);
                        const distSq = distanceSquared(cameraPos, worldPos);

                        return distSq < CULLING.VISIBILITY_DISTANCE_SQUARED;
                    });

                    const currentVisible = visibleImagesRef.current;
                    const isDifferent =
                        filtered.length !== currentVisible.length ||
                        filtered.some((img, idx) => img.id !== currentVisible[idx]?.id);

                    if (isDifferent) {
                        setVisibleImages(filtered);
                        visibleImagesRef.current = filtered;
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

                // Center layout coords (0.5,0.5,0.5) → local origin.
                // Missing Z defaults to 0.5 so planar grids stay flat at z=0.
                const lx = (nodePos[0] ?? 0.5) - 0.5;
                const ly = (nodePos[1] ?? 0.5) - 0.5;
                const lz = (nodePos[2] ?? 0.5) - 0.5;

                return (
                    <PhotoNode
                        key={image.id}
                        id={image.id}
                        description={image.description}
                        x={lx}
                        y={ly}
                        z={lz}
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
            <OrbitControls
                ref={controlsRef as React.RefObject<any>}
                onStart={onInteractionStart}
                onEnd={onInteractionEnd}
                enableDamping
                dampingFactor={0.05}
                rotateSpeed={0.6}
                zoomSpeed={0.8}
                minDistance={CAMERA.MIN_DISTANCE}
                maxDistance={CAMERA.MAX_DISTANCE}
                enablePan={false}
            />
            <group ref={groupRef as React.RefObject<any>}>
                {renderedImages}
            </group>
        </>
    );
};

export default SceneContent;
