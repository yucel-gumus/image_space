import { memo, useMemo, useEffect, Suspense } from 'react';
import { Billboard } from '@react-three/drei';
import { motion } from 'framer-motion-3d';
import { preloadTexture, loadTextureSync } from '../../../services/texture/texture.service';
import { setTargetImage } from '../../../store/actions';
import { calculateWorldPosition } from '../../../utils/math.utils';
import { THUMBNAIL, ANIMATION, SCENE_SCALE } from '../../../utils/constants';
import type { PhotoNodeProps } from '../../../types';

// =============================================================================
// PhotoNode Content (Main Component)
// =============================================================================

interface PhotoNodeContentProps extends PhotoNodeProps { }

const PhotoNodeContent = memo<PhotoNodeContentProps>(({
    id,
    x = 0,
    y = 0,
    z = 0,
    highlight = false,
    dim = false,
}) => {
    // Texture'ı preload ve GPU update tetikle
    useEffect(() => {
        preloadTexture(id);
    }, [id]);

    // Texture'ı senkron yükle
    const texture = useMemo(() => loadTextureSync(id), [id]);

    useEffect(() => {
        if (texture) {
            texture.needsUpdate = true;
        }
    }, [texture]);

    // Opacity hesapla
    const opacity = highlight ? 1 : dim ? 0.1 : 1;

    // Pozisyon hesaplamaları
    const position = useMemo(
        () => calculateWorldPosition(x, y, z, SCENE_SCALE),
        [x, y, z]
    );

    const animateProps = useMemo(
        () => ({
            x: x * SCENE_SCALE,
            y: y * SCENE_SCALE,
            z: z * SCENE_SCALE,
            transition: { duration: ANIMATION.NODE_TRANSITION_DURATION, ease: ANIMATION.EASE_CIRC },
        }),
        [x, y, z]
    );

    // Click handler
    const handleClick = useMemo(
        () => (e: { stopPropagation: () => void }) => {
            e.stopPropagation();
            setTargetImage(id);
        },
        [id]
    );

    // Motion group props
    const motionGroupProps = {
        onClick: handleClick,
        position,
        animate: animateProps,
    };

    // Motion material props
    const motionMaterialProps = {
        map: texture,
        initial: { opacity: 0 },
        animate: { opacity },
        transition: { duration: ANIMATION.OPACITY_DURATION },
        color: '#fff',
    };

    const MotionGroup = motion.group as any;
    const MotionMeshStandardMaterial = motion.meshStandardMaterial as any;

    return (
        <MotionGroup {...motionGroupProps}>
            {/* Fotoğraf */}
            <Billboard>
                <mesh scale={[THUMBNAIL.WIDTH, THUMBNAIL.HEIGHT, 1]}>
                    <planeGeometry />
                    <MotionMeshStandardMaterial {...motionMaterialProps} />
                </mesh>
            </Billboard>
        </MotionGroup>
    );
});

PhotoNodeContent.displayName = 'PhotoNodeContent';

// =============================================================================
// Loading Placeholder
// =============================================================================

interface LoadingPlaceholderProps {
    x: number;
    y: number;
    z: number;
}

const LoadingPlaceholder = memo<LoadingPlaceholderProps>(({ x, y, z }) => {
    const position = useMemo(
        () => calculateWorldPosition(x, y, z, SCENE_SCALE),
        [x, y, z]
    );

    const MotionGroup = motion.group as any;

    return (
        <MotionGroup position={position}>
            <Billboard>
                <mesh scale={[THUMBNAIL.WIDTH, THUMBNAIL.HEIGHT, 1]}>
                    <planeGeometry />
                    <meshStandardMaterial color="#333" opacity={0.3} transparent />
                </mesh>
            </Billboard>
        </MotionGroup>
    );
});

LoadingPlaceholder.displayName = 'LoadingPlaceholder';

// =============================================================================
// PhotoNode (with Suspense)
// =============================================================================

const PhotoNode = memo<PhotoNodeProps>((props) => {
    return (
        <Suspense fallback={<LoadingPlaceholder x={props.x ?? 0} y={props.y ?? 0} z={props.z ?? 0} />}>
            <PhotoNodeContent {...props} />
        </Suspense>
    );
});

PhotoNode.displayName = 'PhotoNode';

export default PhotoNode;
