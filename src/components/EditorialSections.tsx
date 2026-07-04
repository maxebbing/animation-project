'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * The six scrollable DOM sections that sit over the fixed 3D canvas. Each holds
 * a placeholder single word (M4 replaces these with real editorial copy) and is
 * biased to the LEFT or RIGHT to match the side the car is framed AWAY from in
 * that scene, so the copy lands in the negative space:
 *
 *   hero      copy LEFT   (car right)
 *   blueprint copy RIGHT  (car left)
 *   clay      copy LEFT   (car right)
 *   gloss     copy RIGHT  (car left)
 *   orbit     copy LEFT   (car right)
 *   cta       CENTER      (rear-3/4 hero centred on the glowing tail)
 *
 * Content is pinned (sticky) inside each tall section and fades in as the
 * section enters the viewport / out as it leaves — synced to the same scroll
 * the master cinematic runs on, so M4 inherits working copy reveals.
 */

type Align = 'left' | 'right' | 'center';

const SECTIONS: {
  id: string;
  label: string;
  height: string;
  align: Align;
}[] = [
  { id: 'hero', label: 'Hero', height: '100vh', align: 'left' },
  { id: 'blueprint', label: 'Blueprint', height: '100vh', align: 'right' },
  { id: 'clay', label: 'Clay', height: '100vh', align: 'left' },
  { id: 'gloss', label: 'Gloss', height: '100vh', align: 'right' },
  { id: 'orbit', label: 'Orbit', height: '180vh', align: 'left' },
  { id: 'cta', label: 'CTA', height: '120vh', align: 'center' },
];

const JUSTIFY: Record<Align, string> = {
  left: 'justify-start text-left',
  right: 'justify-end text-right',
  center: 'justify-center text-center',
};

export default function EditorialSections() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const contents = gsap.utils.toArray<HTMLElement>('[data-reveal]');
      for (const el of contents) {
        const section = el.closest('section') as HTMLElement;
        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          })
          .fromTo(
            el,
            { autoAlpha: 0, y: 26 },
            { autoAlpha: 1, y: 0, duration: 0.28, ease: 'power1.out' }
          )
          .to(el, { autoAlpha: 1, duration: 0.44 })
          .to(el, { autoAlpha: 0, y: -26, duration: 0.28, ease: 'power1.in' });
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={rootRef} className="relative z-10">
      {SECTIONS.map(({ id, label, height, align }) => (
        <section key={id} id={id} className="relative" style={{ height }}>
          <div
            className={`sticky top-0 flex h-screen items-center px-[8vw] ${JUSTIFY[align]}`}
          >
            <span
              data-reveal
              className="text-2xl font-medium tracking-tight text-foreground/90"
            >
              {label}
            </span>
          </div>
        </section>
      ))}
    </main>
  );
}
