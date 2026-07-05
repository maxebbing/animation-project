'use client';

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Environment,
  Lightformer,
  ContactShadows,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import CarModel from './CarModel';
import ScrollChoreography from './ScrollChoreography';
import type { CarRig } from './useCarMaterials';

/**
 * Fixed full-viewport background canvas — the persistent cinematic backdrop
 * behind the scrollable DOM content (see src/app/page.tsx).
 *
 * M2 art direction:
 *  - dark studio "void" lighting rig (Lightformer env for specular streaks on
 *    paint, key + cool rim + soft fill real lights, ContactShadows to ground)
 *  - three material acts driven imperatively via the CarRig ref
 *  - tasteful post grade (thresholded Bloom, subtle Vignette + film grain)
 */
export default function Scene() {
  const carRef = useRef<CarRig>(null);

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, toneMappingExposure: 1.05 }}
        camera={{ fov: 33, position: [4.6, 1.25, 4.9] }}
        onCreated={({ camera, gl }) => {
          camera.lookAt(0, 0.35, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
        }}
      >
        <Suspense fallback={null}>
          <StudioLighting />
          <CarModel ref={carRef} />
          <ContactShadows
            position={[0, 0.001, 0]}
            scale={12}
            far={4}
            blur={3.2}
            opacity={0.78}
            color="#000000"
            resolution={1024}
            frames={1}
          />
          <Grade />
          {/* the master scroll-scrubbed cinematic: drives camera + CarRig */}
          <ScrollChoreography carRef={carRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}

/**
 * Dark expensive studio: an <Environment> full of Lightformers paints the
 * crisp reflection streaks the paint needs, while a few real lights carve the
 * silhouette out of the #0a0a0a void.
 */
function StudioLighting() {
  return (
    <>
      <color attach="background" args={['#0a0a0a']} />
      {/* faint ambient so the shadow side never goes fully dead */}
      <ambientLight intensity={0.12} color="#20304a" />

      {/* KEY — strong, slightly warm, high and to camera-left */}
      <spotLight
        position={[6, 9, 4]}
        angle={0.5}
        penumbra={0.9}
        intensity={140}
        distance={40}
        color="#fff4e6"
      />
      {/* COOL RIM — behind/right, draws the edge against black */}
      <directionalLight position={[-7, 4, -6]} intensity={2.2} color="#7fb2ff" />
      {/* SOFT FILL — low, front, cool and gentle */}
      <directionalLight position={[0, 2, 8]} intensity={0.5} color="#8ea6c8" />

      <Environment resolution={256} frames={1} background={false}>
        {/* dim base so the env isn't pure black (kills totally dead reflections) */}
        <color attach="background" args={['#050608']} />

        {/* big soft top strip — the primary specular sweep across the roof */}
        <Lightformer
          form="rect"
          intensity={2.3}
          color="#eaf2ff"
          position={[0, 6, 1]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 6, 1]}
        />
        {/* long vertical streaks down each flank — the "expensive" body line */}
        <Lightformer
          form="rect"
          intensity={3.4}
          color="#dce8ff"
          position={[6, 2.2, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[9, 2.6, 1]}
        />
        {/* lower flank sliver — gives the doors/sills a graded reflection */}
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#bcd2ff"
          position={[5.5, 0.4, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[10, 0.7, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#cfe0ff"
          position={[-6, 2, -1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[9, 2.2, 1]}
        />
        {/* warm kicker from front-left for a hint of colour in the highlights */}
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#ffd9a8"
          position={[-3, 1, 6]}
          rotation={[0, 0, 0]}
          scale={[4, 3, 1]}
        />
        {/* tight bar for a hot chrome/edge glint (kept controlled) */}
        <Lightformer
          form="rect"
          intensity={3.4}
          color="#ffffff"
          position={[2, 4, -5]}
          rotation={[0, Math.PI, 0]}
          scale={[2.4, 0.35, 1]}
        />
      </Environment>
    </>
  );
}

/**
 * Post grade. Bloom is thresholded so ONLY hot speculars and the ignited
 * emissives blow out — the body paint stays controlled. Vignette + a whisper
 * of film grain finish the cinematic look.
 */
function Grade() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        mipmapBlur
        intensity={0.7}
        luminanceThreshold={0.95}
        luminanceSmoothing={0.22}
        radius={0.7}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.72} />
      <Noise
        premultiply
        blendFunction={BlendFunction.OVERLAY}
        opacity={0.05}
      />
    </EffectComposer>
  );
}
