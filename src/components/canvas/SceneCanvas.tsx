'use client';

import dynamic from 'next/dynamic';

// Next.js App Router only allows `ssr: false` inside a Client Component,
// so this thin wrapper exists purely to host the dynamic import — the
// actual scene lives in Scene.tsx.
const Scene = dynamic(() => import('./Scene'), { ssr: false });

export default function SceneCanvas() {
  return <Scene />;
}
