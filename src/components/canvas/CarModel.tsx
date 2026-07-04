'use client';

import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { Group } from 'three';
import type { ThreeElements } from '@react-three/fiber';

const MODEL_PATH = '/models/car.glb';

/**
 * Loads the car glTF, centers it at the origin so it sits on y=0, and forwards
 * a ref to the wrapping group so later passes (art direction, choreography)
 * can reach into the scene graph (named nodes/materials) via userData or
 * traversal from the ref.
 */
const CarModel = forwardRef<Group, ThreeElements['group']>(
  function CarModel(props, ref) {
    const { scene } = useGLTF(MODEL_PATH);
    const innerRef = useRef<THREE.Group>(null);

    // Clone once so hot-reloads / multiple instances don't share transforms.
    const clonedScene = useMemo(() => scene.clone(true), [scene]);

    useEffect(() => {
      const target = innerRef.current;
      if (!target) return;

      // Compute bounding box of the loaded model and re-center it so the
      // model's horizontal center sits at x=0/z=0 and its lowest point sits
      // at y=0 (resting on the "ground").
      const box = new THREE.Box3().setFromObject(clonedScene);
      const center = box.getCenter(new THREE.Vector3());
      const min = box.min;

      clonedScene.position.x -= center.x;
      clonedScene.position.z -= center.z;
      clonedScene.position.y -= min.y;
    }, [clonedScene]);

    return (
      <group ref={ref} {...props}>
        <group ref={innerRef}>
          <primitive object={clonedScene} />
        </group>
      </group>
    );
  }
);

export default CarModel;

useGLTF.preload(MODEL_PATH);
