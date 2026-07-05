'use client';

import { useEffect, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * Module-level handle to the live Lenis instance (or null when reduced-motion
 * has disabled smooth scroll and we're on native scroll instead). SiteChrome
 * reads this to route nav-anchor clicks through Lenis's own scrollTo so
 * in-page jumps stay on the same smooth-scroll rig as everything else,
 * instead of a native instant jump that fights Lenis's virtual scroll
 * position on the next frame.
 */
let lenisInstance: Lenis | null = null;

export function getLenis(): Lenis | null {
  return lenisInstance;
}

/**
 * Wires Lenis smooth-scroll into GSAP's ScrollTrigger/ticker so later passes
 * can drive a scrubbed master timeline off native scroll position. Renders
 * nothing itself — mount once near the root and let children (if any)
 * pass through untouched.
 *
 * Respects prefers-reduced-motion: when set, Lenis is never instantiated and
 * the page just uses native scroll — ScrollTrigger still drives the master
 * timeline (see ScrollChoreography), it just tracks native scroll position
 * directly instead of Lenis's smoothed virtual position.
 */
export default function ScrollRig({ children }: { children?: ReactNode }) {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReduced) {
      lenisInstance = null;
      return;
    }

    const lenis = new Lenis();
    lenisInstance = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  return children ?? null;
}
