'use client';

import { useEffect, useRef } from 'react';
import { getLenis } from './ScrollRig';

/**
 * Fixed editorial chrome that lives above the cinematic canvas: the wordmark,
 * a couple of section anchors, a small "Start a project" CTA, and an
 * unobtrusive scroll-progress hairline. Everything sits over a soft top scrim
 * so it survives the brightest specular frames. The whole bar is
 * pointer-events-none except the actual links, so it never intercepts anything
 * meant for the scene beneath it.
 */

const NAV = [
  { label: 'Process', href: '#blueprint' },
  { label: 'Capabilities', href: '#orbit' },
];

export default function SiteChrome() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.body.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(target as HTMLElement);
    } else {
      // reduced-motion / Lenis disabled: fall back to native smooth scroll
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      {/* scrim so the bar reads over bright bloom frames */}
      <div className="absolute inset-x-0 top-0 -z-10 h-28 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />

      <nav className="mx-auto flex max-w-[1600px] items-center justify-between px-[6vw] py-5">
        <a
          href="#hero"
          onClick={handleAnchorClick}
          className="pointer-events-auto font-mono text-[0.82rem] font-medium uppercase tracking-[0.42em] text-foreground transition-opacity hover:opacity-70"
        >
          Marque
        </a>

        <div className="flex items-center gap-7 font-mono text-[0.7rem] uppercase tracking-[0.24em] text-foreground/70">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={handleAnchorClick}
              className="pointer-events-auto hidden transition-colors hover:text-foreground sm:inline"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#cta"
            onClick={handleAnchorClick}
            className="pointer-events-auto rounded-full border border-foreground/25 px-4 py-1.5 text-foreground/90 transition-colors hover:border-accent hover:text-accent"
          >
            Start a project
          </a>
        </div>
      </nav>

      {/* scroll-progress hairline */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-foreground/10">
        <div
          ref={barRef}
          className="h-px origin-left bg-accent/80"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
    </header>
  );
}
