import React from 'react';
import { Canvas } from '@react-three/fiber';
import SceneContent from '../SceneContent';
import { setTargetImage } from '../../../store/actions';
import { CAMERA } from '../../../utils/constants';

const PhotoViz: React.FC = () => {
    const handlePointerMissed = () => {
        setTargetImage(null);
    };

    return (
        <Canvas
            camera={{
                position: [...CAMERA.INITIAL_POSITION],
                near: CAMERA.NEAR,
                far: CAMERA.FAR,
            }}
            onPointerMissed={handlePointerMissed}
        >
            <SceneContent />
        </Canvas>
    );
};

export default PhotoViz;
