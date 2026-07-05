'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import CanvasErrorBoundary from './CanvasErrorBoundary';

// Next.js App Router only allows `ssr: false` inside a Client Component,
// so this thin wrapper exists purely to host the dynamic import — the
// actual scene lives in Scene.tsx.
const Scene = dynamic(() => import('./Scene'), { ssr: false });

/** Cheap synchronous probe: can this browser/GPU create a WebGL context at all? */
function canCreateWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

/**
 * Guards the 3D layer with two independent nets:
 *  - a proactive WebGL support probe, so unsupported browsers/GPUs never
 *    even attempt to mount the Canvas
 *  - a reactive error boundary around it, so a context-creation failure (or
 *    any other render error) inside Scene degrades to no canvas rather than
 *    taking the page down
 * Either way the dark background + editorial copy (siblings in page.tsx)
 * keep rendering untouched.
 */
export default function SceneCanvas() {
  // Assume supported for the very first render on BOTH server and client —
  // this has to match hydration exactly, and WebGL support can only ever be
  // known client-side. The real probe runs in an effect below, strictly
  // after hydration has already reconciled, so flipping this to false is a
  // normal follow-up render rather than a hydration mismatch.
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // Syncing from a real external system (GPU/browser capability) that
    // cannot be read during render/SSR — an effect is the correct tool
    // here, not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(canCreateWebGL());
  }, []);

  if (!supported) return null;

  return (
    <CanvasErrorBoundary>
      <Scene />
    </CanvasErrorBoundary>
  );
}
