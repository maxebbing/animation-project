# Marque

A cinematic, scroll-driven 3D showcase for a fictional design & engineering
studio. A hypercar materializes from glowing wireframe blueprint, through
sculptor's clay, to finished gloss paint across a single scrubbed 700vh
timeline — then a drone orbit and a taillight-ignition CTA close it out.
Editorial copy sections are choreographed to fade in sync with the same
scroll position that drives the camera and car.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [drei](https://github.com/pmndrs/drei) + [three.js](https://threejs.org) — the 3D scene, materials, and post-processing
- [GSAP](https://gsap.com) + ScrollTrigger — the master scrubbed camera/material timeline and editorial fades
- [Lenis](https://github.com/darkroomengineering/lenis) — smooth scrolling
- [Tailwind CSS v4](https://tailwindcss.com) — layout and type

## Getting started

```bash
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Works on [Vercel](https://vercel.com) out of the box — no extra configuration
needed.

## Attribution

Ferrari 458 Spider model by vicent091036, from the three.js examples — used
for demonstration.
