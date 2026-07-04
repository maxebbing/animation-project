'use client';

import {
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { buildCarRig, type CarRig } from './useCarMaterials';

const MODEL_PATH = '/models/car.glb';

function setRef(ref: React.ForwardedRef<CarRig>, value: CarRig | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

/**
 * Loads the car glTF, centres it at the origin (resting on y=0), builds the
 * imperative material rig (wireframe / clay / gloss + light ignition) and
 * forwards a {@link CarRig} ref so later passes (dev harness now, GSAP
 * choreography in M3) can scrub the material acts at 60fps.
 *
 * The rig is built in a layout effect on a *fresh* clone that is then the exact
 * object rendered — so StrictMode's double-invoke and HMR can never leave the
 * driven rig pointing at a different material set than the one on screen.
 */
const CarModel = forwardRef<CarRig, ThreeElements['group']>(
  function CarModel(props, ref) {
    const { scene } = useGLTF(MODEL_PATH);
    const groupRef = useRef<THREE.Group>(null);
    // The prepared (cloned + rigged) scene actually rendered.
    const [prepared, setPrepared] = useState<THREE.Object3D | null>(null);

    useLayoutEffect(() => {
      const cloned = scene.clone(true);

      // Re-centre: horizontal centre at x/z = 0, lowest point at y = 0.
      const box = new THREE.Box3().setFromObject(cloned);
      const center = box.getCenter(new THREE.Vector3());
      cloned.position.x -= center.x;
      cloned.position.z -= center.z;
      cloned.position.y -= box.min.y;

      const rig = buildCarRig(cloned, groupRef.current ?? new THREE.Group());
      setPrepared(cloned);
      setRef(ref, rig);

      return () => {
        setRef(ref, null);
        rig.dispose();
      };
    }, [scene, ref]);

    return (
      <group ref={groupRef} {...props}>
        {prepared && <primitive object={prepared} />}
      </group>
    );
  }
);

export default CarModel;

useGLTF.preload(MODEL_PATH);
