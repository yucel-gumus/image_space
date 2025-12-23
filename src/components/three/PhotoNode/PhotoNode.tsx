/* eslint-disable @typescript-eslint/ban-ts-comment */

import { memo, useMemo, useEffect, Suspense } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { motion } from 'framer-motion-3d';
import { preloadTexture, loadTextureSync } from '../../../services/texture/texture.service';
import { setTargetImage } from '../../../store/actions';
import { calculateWorldPosition } from '../../../utils/math.utils';
import { getFirstSentence } from '../../../utils/text.utils';
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
    description,
}) => {
    // Texture'ı preload et
    useEffect(() => {
        preloadTexture(id);
    }, [id]);

    // Texture'ı senkron yükle
    const texture = useMemo(() => loadTextureSync(id), [id]);

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

    // Açıklamanın ilk cümlesini al
    const displayDescription = useMemo(
        () => getFirstSentence(description),
        [description]
    );

    // Click handler
    const handleClick = useMemo(
        () => (e: { stopPropagation: () => void }) => {
            e.stopPropagation();
            setTargetImage(id);
        },
        [id]
    );

    // Motion group props - framer-motion-3d tipleri eksik olduğu için any kullanılıyor
    const motionGroupProps = {
        onClick: handleClick,
        position,
        animate: animateProps,
    } as Record<string, unknown>;

    // Motion material props
    const motionMaterialProps = {
        map: texture,
        initial: { opacity: 0 },
        animate: { opacity },
        transition: { duration: ANIMATION.OPACITY_DURATION },
        color: '#fff',
    } as Record<string, unknown>;

    return (
        // @ts-ignore - framer-motion-3d tip tanımlamaları eksik
        <motion.group {...motionGroupProps}>
            {/* Fotoğraf */}
            <Billboard>
                <mesh scale={[THUMBNAIL.WIDTH, THUMBNAIL.HEIGHT, 1]}>
                    <planeGeometry />
                    {/* @ts-ignore - framer-motion-3d tip tanımlamaları eksik */}
                    <motion.meshStandardMaterial {...motionMaterialProps} />
                </mesh>
            </Billboard>

            {/* Açıklama metni (şu an görünmez) */}
            <Billboard>
                <Text
                    fontSize={1}
                    color="white"
                    anchorX="left"
                    anchorY="middle"
                    position={[-(THUMBNAIL.WIDTH / 2) + 2, 0, 1]}
                    maxWidth={THUMBNAIL.WIDTH - 4}
                    fillOpacity={0}
                >
                    {displayDescription}
                </Text>
            </Billboard>
        </motion.group>
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

    return (
        // @ts-ignore - framer-motion-3d tip tanımlamaları eksik
        <motion.group position={position}>
            <Billboard>
                <mesh scale={[THUMBNAIL.WIDTH, THUMBNAIL.HEIGHT, 1]}>
                    <planeGeometry />
                    <meshStandardMaterial color="#333" opacity={0.3} transparent />
                </mesh>
            </Billboard>
        </motion.group>
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
