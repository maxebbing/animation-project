'use client';

import { useEffect, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * Wires Lenis smooth-scroll into GSAP's ScrollTrigger/ticker so later passes
 * can drive a scrubbed master timeline off native scroll position. Renders
 * nothing itself — mount once near the root and let children (if any)
 * pass through untouched.
 */
export default function ScrollRig({ children }: { children?: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis();

    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return children ?? null;
}
