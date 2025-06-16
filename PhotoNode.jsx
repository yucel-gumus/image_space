import React, { Suspense, useMemo, useEffect, memo } from "react";

import { useLoader } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { motion } from "framer-motion-3d";
import { TextureLoader } from "three";
import { setTargetImage } from "./actions";

const aspectRatio = 16 / 16;
const thumbHeight = 16;
const thumbWidth = thumbHeight * aspectRatio;
const storageRoot = 'https://www.gstatic.com/aistudio/starter-apps/photosphere/'

// Texture cache'i için Map kullanıyoruz
const textureCache = new Map();
const loadingPromises = new Map();

// Texture preloader fonksiyonu
const preloadTexture = (url) => {
  if (textureCache.has(url) || loadingPromises.has(url)) {
    return loadingPromises.get(url) || Promise.resolve(textureCache.get(url));
  }

  const loader = new TextureLoader();
  const promise = new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        // Texture optimizasyonları
        texture.generateMipmaps = false;
        texture.minFilter = 1006; // LinearFilter
        texture.magFilter = 1006; // LinearFilter
        
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

const PhotoNodeContent = memo(({
  id,
  x = 0,
  y = 0,
  z = 0,
  highlight,
  dim,
  description,
}) => {
  const textureUrl = `${storageRoot}${id}`;
  
  // Texture'ı preload et
  useEffect(() => {
    preloadTexture(textureUrl);
  }, [textureUrl]);

  // Texture'ı cache'den al veya yükle
  const texture = useMemo(() => {
    if (textureCache.has(textureUrl)) {
      return textureCache.get(textureUrl);
    }
    
    // Eğer cache'de yoksa, useLoader ile yükle
    const loader = new TextureLoader();
    const loadedTexture = loader.load(textureUrl);
    // Texture optimizasyonları
    loadedTexture.generateMipmaps = false;
    loadedTexture.minFilter = 1006; // LinearFilter
    loadedTexture.magFilter = 1006; // LinearFilter
    return loadedTexture;
  }, [textureUrl]);

  const opacity = highlight ? 1 : dim ? 0.1 : 1;
  
  // Position hesaplamasını memoize et
  const position = useMemo(() => [x * 600, y * 600, z * 600], [x, y, z]);
  const animateProps = useMemo(() => ({
    x: x * 600,
    y: y * 600,
    z: z * 600,
    transition: { duration: 1, ease: "circInOut" },
  }), [x, y, z]);

  // Description'ı memoize et
  const displayDescription = useMemo(() => 
    description.split(".")[0] + ".", [description]
  );

  const handleClick = useMemo(() => (e) => {
    e.stopPropagation();
    setTargetImage(id);
  }, [id]);

  return (
    <motion.group
      onClick={handleClick}
      position={position}
      animate={animateProps}
    >
      <Billboard>
        <mesh scale={[thumbWidth, thumbHeight, 1]}>
          <planeGeometry />
          <motion.meshStandardMaterial
            map={texture}
            initial={{ opacity: 0 }}
            animate={{ opacity }}
            transition={{ duration: 0.5 }}
            color="#fff"
          />
        </mesh>
      </Billboard>

      <Billboard>
        <Text
          fontSize={1}
          color="white"
          anchorX="start"
          anchorY="middle"
          position={[-(thumbWidth / 2) + 2, 0, 1]}
          maxWidth={thumbWidth - 4}
          fillOpacity={0}
          fontFamily="'Google Sans Display', sans-serif"
        >
          {displayDescription}
        </Text>
      </Billboard>
    </motion.group>
  );
});

PhotoNodeContent.displayName = 'PhotoNodeContent';

// Fallback component for loading state
const LoadingPlaceholder = memo(({ x, y, z }) => {
  const position = useMemo(() => [x * 600, y * 600, z * 600], [x, y, z]);
  
  return (
    <motion.group position={position}>
      <Billboard>
        <mesh scale={[thumbWidth, thumbHeight, 1]}>
          <planeGeometry />
          <meshStandardMaterial color="#333" opacity={0.3} transparent />
        </mesh>
      </Billboard>
    </motion.group>
  );
});

LoadingPlaceholder.displayName = 'LoadingPlaceholder';

const PhotoNode = memo((props) => {
  return (
    <Suspense fallback={<LoadingPlaceholder x={props.x} y={props.y} z={props.z} />}>
      <PhotoNodeContent {...props} />
    </Suspense>
  );
});

PhotoNode.displayName = 'PhotoNode';

export default PhotoNode;
