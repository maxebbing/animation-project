'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * The six scrollable DOM sections that sit over the fixed 3D canvas. Each holds
 * a block of editorial copy (M4) inside a single [data-reveal] wrapper and is
 * biased to the LEFT or RIGHT to match the side the car is framed AWAY from in
 * that scene, so the copy lands in the negative space:
 *
 *   hero      copy LEFT   (car right)
 *   blueprint copy RIGHT  (car left, spans wide/low -> block high-right)
 *   clay      copy LEFT   (car right)
 *   gloss     copy RIGHT  (car left)
 *   orbit     copy LEFT   (car right)
 *   cta       CENTER      (rear-3/4 hero centred on the glowing tail)
 *
 * Content is pinned (sticky) inside each tall section and fades in as the
 * section enters the viewport / out as it leaves — synced to the same scroll
 * the master cinematic runs on. The fade wiring below is unchanged from M3.
 */

type Align = 'left' | 'right' | 'center';

const SECTIONS: {
  id: string;
  height: string;
  align: Align;
}[] = [
  { id: 'hero', height: '100vh', align: 'left' },
  { id: 'blueprint', height: '100vh', align: 'right' },
  { id: 'clay', height: '100vh', align: 'left' },
  { id: 'gloss', height: '100vh', align: 'right' },
  { id: 'orbit', height: '180vh', align: 'left' },
  { id: 'cta', height: '120vh', align: 'center' },
];

const JUSTIFY: Record<Align, string> = {
  left: 'justify-start text-left',
  right: 'justify-end text-right',
  center: 'justify-center text-center',
};

// Vertical placement inside each sticky viewport. Blueprint frames the car
// wide + low, so its block sits high; everything else centres.
const VALIGN: Record<string, string> = {
  blueprint: 'items-start pt-[13vh]',
};

// A soft directional scrim behind the copy so type stays legible over the
// brightest frames of the car without ever reading as a hard panel. Anchored
// to the copy side and fully transparent well before the car's hero side.
const SCRIM: Record<string, string> = {
  blueprint:
    'absolute inset-y-0 right-0 w-[70%] bg-[linear-gradient(to_left,rgba(10,10,10,0.92)_0%,rgba(10,10,10,0.66)_38%,transparent_72%)]',
  clay: 'absolute inset-y-0 left-0 w-[64%] bg-[linear-gradient(to_right,rgba(10,10,10,0.82)_0%,rgba(10,10,10,0.5)_34%,transparent_64%)]',
  gloss:
    'absolute inset-y-0 right-0 w-[64%] bg-[linear-gradient(to_left,rgba(10,10,10,0.82)_0%,rgba(10,10,10,0.5)_34%,transparent_64%)]',
  orbit:
    'absolute inset-y-0 left-0 w-[66%] bg-[linear-gradient(to_right,rgba(10,10,10,0.84)_0%,rgba(10,10,10,0.52)_36%,transparent_66%)]',
  cta: 'absolute inset-0 bg-[radial-gradient(62%_46%_at_50%_40%,rgba(10,10,10,0.66)_0%,transparent_72%)]',
};

// --- shared editorial atoms ------------------------------------------------

function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="mb-6 font-mono text-[0.7rem] uppercase tracking-[0.34em] text-accent/90">
      {children}
    </p>
  );
}

function Support({ children }: { children: ReactNode }) {
  return (
    <p className="mt-7 font-mono text-[0.82rem] font-light leading-relaxed tracking-tight text-foreground/60">
      {children}
    </p>
  );
}

// --- per-section content ---------------------------------------------------

function HeroContent() {
  return (
    <div data-reveal className="max-w-[38rem]">
      <p className="mb-8 font-mono text-[0.72rem] uppercase tracking-[0.38em] text-foreground/55">
        Marque
        <span className="mx-3 text-foreground/25">/</span>
        Design &amp; Engineering Studio
      </p>
      <h1 className="font-display text-[clamp(2.9rem,6.4vw,5.6rem)] font-normal leading-[0.98] tracking-[-0.01em] text-foreground">
        We build brands
        <br />
        to a finer tolerance.
      </h1>
      <p className="mt-7 max-w-[19rem] font-mono text-[0.82rem] font-light leading-relaxed tracking-tight text-foreground/60">
        A design and engineering studio taking digital products from first line
        to finished surface.
      </p>
      <p className="mt-14 flex items-center gap-3 font-mono text-[0.66rem] uppercase tracking-[0.3em] text-foreground/45">
        <span className="inline-block h-8 w-px bg-foreground/30" />
        Scroll — watch it take shape
      </p>
    </div>
  );
}

function PhaseContent({
  kicker,
  display,
  body,
  align,
}: {
  kicker: string;
  display: ReactNode;
  body: string;
  align: Align;
}) {
  return (
    <div
      data-reveal
      className={`max-w-[34rem] ${align === 'right' ? 'ml-auto' : ''}`}
    >
      <Kicker>{kicker}</Kicker>
      <h2 className="font-display text-[clamp(2.4rem,5vw,4.2rem)] font-normal leading-[1.02] tracking-[-0.01em] text-foreground">
        {display}
      </h2>
      <Support>{body}</Support>
    </div>
  );
}

const SERVICES = [
  'Brand & Strategy',
  'Product & Interface Design',
  'Design Systems',
  'Web Engineering',
  'Motion & 3D',
  'Prototyping & R&D',
];

function OrbitContent() {
  return (
    <div data-reveal className="max-w-[40rem]">
      <Kicker>Capabilities</Kicker>
      <h2 className="font-display text-[clamp(2.2rem,4.4vw,3.6rem)] font-normal leading-[1.03] tracking-[-0.01em] text-foreground">
        End to end,
        <br />
        under one roof.
      </h2>
      <ul className="mt-9 grid grid-cols-1 gap-x-10 gap-y-3 font-mono text-[0.82rem] tracking-tight text-foreground/80 sm:grid-cols-2">
        {SERVICES.map((s, i) => (
          <li
            key={s}
            className="flex items-baseline gap-3 border-t border-foreground/10 pt-3"
          >
            <span className="text-[0.62rem] text-accent/80">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
      <Support>
        Selected partners — Aperture, Northvane, Oré Financial, Halden Type, and
        Method Bank. Full case studies under NDA, on request.
      </Support>
    </div>
  );
}

function CtaContent() {
  return (
    <div data-reveal className="mx-auto max-w-[42rem]">
      <Kicker>
        <span className="text-accent/90">Ignition</span>
      </Kicker>
      <h2 className="font-display text-[clamp(2.8rem,6vw,5rem)] font-normal leading-[1.0] tracking-[-0.01em] text-foreground">
        Start something
        <br />
        built to last.
      </h2>
      <p className="mx-auto mt-7 max-w-[30rem] font-mono text-[0.82rem] font-light leading-relaxed text-foreground/60">
        Tell us what you&apos;re making. We&apos;ll tell you how we would build
        it.
      </p>
      <a
        href="mailto:hello@marque.studio"
        className="pointer-events-auto mt-9 inline-block font-display text-[clamp(1.5rem,3vw,2.4rem)] italic text-foreground underline decoration-accent/40 decoration-1 underline-offset-[6px] transition-colors hover:text-accent hover:decoration-accent"
      >
        hello@marque.studio
      </a>

      <footer className="mt-24 flex flex-col items-center gap-4 text-center font-mono text-[0.64rem] uppercase tracking-[0.22em] text-foreground/40">
        <div className="flex items-center gap-5">
          <span>© 2026 Marque</span>
          <span className="text-foreground/20">·</span>
          <a
            href="#"
            className="pointer-events-auto transition-colors hover:text-foreground/70"
          >
            Instagram
          </a>
          <a
            href="#"
            className="pointer-events-auto transition-colors hover:text-foreground/70"
          >
            LinkedIn
          </a>
          <a
            href="#"
            className="pointer-events-auto transition-colors hover:text-foreground/70"
          >
            Are.na
          </a>
        </div>
        <p className="max-w-[34rem] text-[0.58rem] tracking-[0.14em] text-foreground/25">
          3D model: Ferrari 458 Spider by vicent091036 (three.js examples), used
          for demonstration.
        </p>
      </footer>
    </div>
  );
}

function SectionContent({ id, align }: { id: string; align: Align }) {
  switch (id) {
    case 'hero':
      return <HeroContent />;
    case 'blueprint':
      return (
        <PhaseContent
          align={align}
          kicker="01 — Blueprint"
          display="Structure before surface."
          body="Every engagement begins as a drawing: architecture, positioning, and the logic beneath the interface. We resolve the hard decisions on paper, where they are still cheap to change."
        />
      );
    case 'clay':
      return (
        <PhaseContent
          align={align}
          kicker="02 — Form"
          display={<>Shape it in the open.</>}
          body="Design and prototype move as one, refined in the browser rather than a static frame. We iterate on the real thing until the form is undeniable."
        />
      );
    case 'gloss':
      return (
        <PhaseContent
          align={align}
          kicker="03 — Finish"
          display="The finish is the difference."
          body="Engineering and craft land last — performance, motion, and the detail you feel before you notice. We ship only when the surface holds up under scrutiny."
        />
      );
    case 'orbit':
      return <OrbitContent />;
    case 'cta':
      return <CtaContent />;
    default:
      return null;
  }
}

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
      {SECTIONS.map(({ id, height, align }) => (
        <section key={id} id={id} className="relative" style={{ height }}>
          <div
            className={`pointer-events-none sticky top-0 flex h-screen px-[8vw] ${
              VALIGN[id] ?? 'items-center'
            } ${JUSTIFY[align]}`}
          >
            {SCRIM[id] && <div aria-hidden className={SCRIM[id]} />}
            <SectionContent id={id} align={align} />
          </div>
        </section>
      ))}
    </main>
  );
}
