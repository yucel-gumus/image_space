import React from "react";

import { useLoader } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { motion } from "framer-motion-3d";
import { TextureLoader } from "three";
import { setTargetImage } from "./actions";

const aspectRatio = 16 / 16;
const thumbHeight = 16;
const thumbWidth = thumbHeight * aspectRatio;
const storageRoot = 'https://www.gstatic.com/aistudio/starter-apps/photosphere/'

export default function PhotoNode({
  id,
  x = 0,
  y = 0,
  z = 0,
  highlight,
  dim,
  description,
}) {
  const texture = useLoader(TextureLoader, `${storageRoot}${id}`);
  const opacity = highlight ? 1 : dim ? 0.1 : 1;

  return !texture ? null : (
    <motion.group
      onClick={(e) => {
        e.stopPropagation();
        setTargetImage(id);
      }}
      position={[x, y, z].map((n) => n * 500)}
      animate={{
        x: x * 600,
        y: y * 600,
        z: z * 600,

        transition: { duration: 1, ease: "circInOut" },
      }}
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
          {description.split(".")[0] + "."}
        </Text>
      </Billboard>
    </motion.group>
  );
}
