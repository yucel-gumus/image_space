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
            className="photo-viz"
            camera={{
                position: [...CAMERA.INITIAL_POSITION],
                near: CAMERA.NEAR,
                far: CAMERA.FAR,
            }}
            onPointerMissed={handlePointerMissed}
            // Warm terracotta scene — cream UI chrome floats above
            style={{ background: 'transparent' }}
            gl={{
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance',
            }}
        >
            <color attach="background" args={['#2a1814']} />
            <fog attach="fog" args={['#2a1814', 420, 1400]} />
            <SceneContent />
        </Canvas>
    );
};

export default PhotoViz;
