'use client';

import { Component, type ReactNode } from 'react';

/**
 * Minimal graceful fallback for the 3D layer. If Canvas/Scene throws while
 * creating a WebGL context (or anything else during the R3F render), this
 * swallows it and renders nothing instead of taking the whole page down —
 * SceneCanvas is a sibling of SiteChrome/EditorialSections (see
 * src/app/page.tsx), so the dark body background and all editorial copy
 * keep rendering normally with just the car missing.
 */
export default class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('3D scene failed to initialize; falling back to no canvas.', error);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
