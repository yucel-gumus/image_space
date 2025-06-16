import React from "react";

import {Canvas, useFrame, useThree} from '@react-three/fiber'
import {TrackballControls} from '@react-three/drei'
import {useRef, useState, useEffect, useMemo, useCallback} from 'react'
import {animate} from 'motion'
import useStore from './store'
import PhotoNode from './PhotoNode'
import {setTargetImage} from './actions'
import { Frustum, Matrix4 } from 'three'

function SceneContent() {
  const images = useStore.use.images()
  const nodePositions = useStore.use.nodePositions()
  const layout = useStore.use.layout()
  const highlightNodes = useStore.use.highlightNodes()
  const targetImage = useStore.use.targetImage()
  const resetCam = useStore.use.resetCam()
  const {camera} = useThree()
  const groupRef = useRef()
  const controlsRef = useRef()
  const [isAutoRotating, setIsAutoRotating] = useState(false)
  const inactivityTimerRef = useRef(null)
  const rotationVelocityRef = useRef(0)
  const [visibleImages, setVisibleImages] = useState([])
  const frameCountRef = useRef(0)

  const cameraDistance = 25
  const targetSpeed = 0.05
  const acceleration = 0.3

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setIsAutoRotating(true);
    }, 2000);

    return () => clearTimeout(initialTimer);
  }, []);

  const restartInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimerRef.current)
    inactivityTimerRef.current = setTimeout(() => {
      setIsAutoRotating(true)
    }, 5000)
  }, []);

  const handleInteractionStart = useCallback(() => {
    setIsAutoRotating(false)
    clearTimeout(inactivityTimerRef.current)
    rotationVelocityRef.current = 0
  }, []);

  const handleInteractionEnd = useCallback(() => {
    restartInactivityTimer()
  }, [restartInactivityTimer]);

  useEffect(() => {
    if (
      targetImage &&
      nodePositions &&
      layout &&
      camera &&
      controlsRef.current &&
      groupRef.current
    ) {
      setIsAutoRotating(false)
      clearTimeout(inactivityTimerRef.current)
      rotationVelocityRef.current = 0

      const nodePos = nodePositions[targetImage]
      if (!nodePos) {
        console.warn(`No node position found for targetImage: ${targetImage}`)
        return
      }

      const nodeLocalX = (nodePos[0] - 0.5) * 600
      const nodeLocalY = (nodePos[1] - 0.5) * 600
      const nodeLocalZ = ((nodePos[2] || 0) - 0.5) * 600

      const groupRotationY = groupRef.current.rotation.y
      const groupPositionZ = groupRef.current.position.z

      const targetNodeWorldVec = {
        x:
          nodeLocalX * Math.cos(groupRotationY) -
          nodeLocalZ * Math.sin(groupRotationY),
        y: nodeLocalY,
        z:
          nodeLocalX * Math.sin(groupRotationY) +
          nodeLocalZ * Math.cos(groupRotationY) +
          groupPositionZ
      }

      const duration = 0.8
      const ease = 'easeInOut'

      const currentControlsTarget = controlsRef.current.target.clone()
      const controlsTargetAnimations = [
        animate(currentControlsTarget.x, targetNodeWorldVec.x, {
          duration,
          ease,
          onUpdate: latest => {
            if (controlsRef.current) {
              controlsRef.current.target.x = latest
            }
          }
        }),
        animate(currentControlsTarget.y, targetNodeWorldVec.y, {
          duration,
          ease,
          onUpdate: latest => {
            if (controlsRef.current) {
              controlsRef.current.target.y = latest
            }
          }
        }),
        animate(currentControlsTarget.z, targetNodeWorldVec.z, {
          duration,
          ease,
          onUpdate: latest => {
            if (controlsRef.current) {
              controlsRef.current.target.z = latest
            }
          }
        })
      ]

      const offsetDirection = camera.position
        .clone()
        .sub(controlsRef.current.target)

      if (offsetDirection.lengthSq() === 0) {
        offsetDirection.set(0, 0, 1)
      }
      offsetDirection.normalize().multiplyScalar(cameraDistance)

      const targetCameraPositionVec = {
        x: targetNodeWorldVec.x + offsetDirection.x,
        y: targetNodeWorldVec.y + offsetDirection.y,
        z: targetNodeWorldVec.z + offsetDirection.z
      }

      const cameraPositionAnimations = [
        animate(camera.position.x, targetCameraPositionVec.x, {
          duration,
          ease,
          onUpdate: latest => (camera.position.x = latest)
        }),
        animate(camera.position.y, targetCameraPositionVec.y, {
          duration,
          ease,
          onUpdate: latest => (camera.position.y = latest)
        }),
        animate(camera.position.z, targetCameraPositionVec.z, {
          duration,
          ease,
          onUpdate: latest => (camera.position.z = latest)
        })
      ]

      const allAnimations = [
        ...controlsTargetAnimations,
        ...cameraPositionAnimations
      ]

      Promise.all(allAnimations.map(a => a.finished)).then(() => {
        if (controlsRef.current && camera) {
          camera.position.set(
            targetCameraPositionVec.x,
            targetCameraPositionVec.y,
            targetCameraPositionVec.z
          )
          controlsRef.current.target.set(
            targetNodeWorldVec.x,
            targetNodeWorldVec.y,
            targetNodeWorldVec.z
          )
        }
      })

    } else if (!targetImage) {
      restartInactivityTimer()
    }
  }, [targetImage, nodePositions, layout, camera, controlsRef, groupRef])

  useEffect(() => {
    const controls = controlsRef.current
    const targetLayoutPosition = [0, 0, 300]
    const targetControlsTarget = [0, 0, 0]
    const duration = 0.8
    const ease = 'easeInOut'

    if (controls && camera) {
      const currentCameraTarget = controls.target.clone()

      const cameraAndTargetAnimations = [
        animate(camera.position.x, targetLayoutPosition[0], {
          duration,
          ease,
          onUpdate: latest => (camera.position.x = latest)
        }),
        animate(camera.position.y, targetLayoutPosition[1], {
          duration,
          ease,
          onUpdate: latest => (camera.position.y = latest)
        }),
        animate(camera.position.z, targetLayoutPosition[2], {
          duration,
          ease,
          onUpdate: latest => (camera.position.z = latest)
        }),
        animate(currentCameraTarget.x, targetControlsTarget[0], {
          duration,
          ease,
          onUpdate: latest => {
            if (controlsRef.current) {
              controlsRef.current.target.x = latest
            }
          }
        }),
        animate(currentCameraTarget.y, targetControlsTarget[1], {
          duration,
          ease,
          onUpdate: latest => {
            if (controlsRef.current) {
              controlsRef.current.target.y = latest
            }
          }
        }),
        animate(currentCameraTarget.z, targetControlsTarget[2], {
          duration,
          ease,
          onUpdate: latest => {
            if (controlsRef.current) {
              controlsRef.current.target.z = latest
            }
          }
        })
      ]

      Promise.all(cameraAndTargetAnimations.map(a => a.finished)).then(() => {
        if (controlsRef.current && camera) {
          camera.position.set(...targetLayoutPosition)
          controlsRef.current.target.set(...targetControlsTarget)
        }
      })
    }

    if (groupRef.current) {
      const duration = 0.8
      const ease = 'easeInOut'

      animate(
        groupRef.current.position.z,
        layout === 'cluster3d' ? -300 : layout === 'grid' ? 150 : 0,
        {
          duration,
          ease,
          onUpdate: latest => (groupRef.current.position.z = latest)
        }
      )
      animate(groupRef.current.rotation.x, 0, {
        duration,
        ease,
        onUpdate: latest => (groupRef.current.rotation.x = latest)
      })
      animate(groupRef.current.rotation.y, 0, {
        duration,
        ease,
        onUpdate: latest => (groupRef.current.rotation.y = latest)
      })
      animate(groupRef.current.rotation.z, 0, {
        duration,
        ease,
        onUpdate: latest => (groupRef.current.rotation.z = latest)
      })
    }
    useStore.setState(state=>{
      state.resetCam = false;
    })
  }, [layout, camera, resetCam])

  useFrame((_, delta) => {
    frameCountRef.current += 1;
    
    let currentVelocity = rotationVelocityRef.current

    if (isAutoRotating) {
      currentVelocity += (targetSpeed - currentVelocity) * acceleration * delta
    } else {
      currentVelocity += (0 - currentVelocity) * acceleration * delta
    }

    rotationVelocityRef.current = currentVelocity

    if (
      groupRef.current &&
      Math.abs(currentVelocity) > 0.0001 &&
      layout !== 'grid'
    ) {
      groupRef.current.rotation.y += currentVelocity * delta
    }

    if (controlsRef.current) {
      controlsRef.current.update()
    }

    // Görünür fotoğrafları güncelle (her 30 frame'de bir - yaklaşık 0.5 saniyede bir)
    if (frameCountRef.current % 30 === 0) {
      if (images && nodePositions && camera) {
        const newVisibleImages = updateVisibleImages;
        if (newVisibleImages.length !== visibleImages.length) {
          setVisibleImages(newVisibleImages);
        }
      }
    }
  })

  // Frustum culling için görünür fotoğrafları hesapla
  const updateVisibleImages = useMemo(() => {
    if (!images || !nodePositions || !camera) return images || [];
    
    return images.filter(image => {
      const nodePos = nodePositions[image.id];
      if (!nodePos) return false;
      
      const worldX = (nodePos[0] - 0.5) * 600;
      const worldY = (nodePos[1] - 0.5) * 600;
      const worldZ = ((nodePos[2] || 0) - 0.5) * 600;
      
      // Kameradan uzaklığı hesapla
      const dx = camera.position.x - worldX;
      const dy = camera.position.y - worldY;
      const dz = camera.position.z - worldZ;
      const distanceSquared = dx * dx + dy * dy + dz * dz;
      
      return distanceSquared < 1440000; // 1200^2 - sqrt hesaplamasından kaçın
    });
  }, [images, nodePositions, camera?.position?.x, camera?.position?.y, camera?.position?.z]);

  // Rendered images'ı memoize et
  const renderedImages = useMemo(() => {
    const imagesToRender = visibleImages.length > 0 ? visibleImages : images || [];
    
    return imagesToRender.map(image => {
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
          z={(nodePos[2] || 0) - 0.5}
          highlight={
            (highlightNodes && isHighlighted) ||
            (targetImage && targetImage === image.id)
          }
          dim={
            (highlightNodes && !isHighlighted) ||
            (targetImage && targetImage !== image.id)
          }
        />
      );
    }).filter(Boolean);
  }, [visibleImages, images, nodePositions, highlightNodes, targetImage]);

  return (
    <>
      <ambientLight intensity={2.3} />
      <TrackballControls
        ref={controlsRef}
        onStart={handleInteractionStart}
        onEnd={handleInteractionEnd}
        minDistance={20}
        maxDistance={1000}
        noPan
      />
      <group ref={groupRef}>
        {renderedImages}
      </group>
    </>
  )
}

export default function PhotoViz() {
  return (
    <Canvas
      camera={{position: [0, 0, 300], near: 0.1, far: 10000}}
      onPointerMissed={() => setTargetImage(null)}
    >
      <SceneContent />
    </Canvas>
  )
}
