'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import CarModel from './CarModel';

/**
 * Fixed full-viewport background canvas. Sits behind the scrollable DOM
 * content (see src/app/page.tsx) so the 3D scene reads as a persistent
 * backdrop while sections scroll over it.
 *
 * Lighting/environment here are placeholders only — the art-direction pass
 * (M2) replaces the single directional light and city preset with real
 * lighting and a proper HDRI/studio setup.
 */
export default function Scene() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true }}
        camera={{ fov: 35, position: [4.5, 1.3, 4.5] }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 0, 0);
        }}
      >
        <Suspense fallback={null}>
          <Environment preset="city" />
          <directionalLight position={[5, 8, 5]} intensity={1.2} />
          <CarModel />
        </Suspense>
      </Canvas>
    </div>
  );
}
