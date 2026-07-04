'use client';

import { useLayoutEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import type { CarRig } from './useCarMaterials';

gsap.registerPlugin(ScrollTrigger);

/**
 * The master cinematic. ONE continuous scroll-scrubbed GSAP timeline that drives
 * BOTH the camera (via a proxy tweened here, applied to the real camera in
 * useFrame) and the CarRig material acts + light ignition.
 *
 * Narrative — "watch our process, then admire the result":
 *   ACT 1 (process, ~57% of scroll)
 *     hero      wireframe hero, slow drifting front-3/4
 *     blueprint low slow pass down the flank, still wireframe
 *     clay      wireframe -> clay materialises DURING a rise over the fender
 *     gloss     clay -> gloss lands as the camera pulls into a wide specular 3/4
 *   ACT 2 (result, ~43%)
 *     orbit     one sweeping drone orbit: low front rake -> high flank -> rear 3/4
 *     cta       settle on the rear-3/4 hero, taillights ignite as the CTA lands
 *
 * Camera is driven through a single proxy so the whole move reads as ONE
 * continuous drone shot; eases are mostly 'none'/power1 so labels never cut.
 */

// Per-keyframe convention for `bias`: POSITIVE = car framed to the RIGHT of the
// screen (copy sits LEFT), NEGATIVE = car LEFT (copy RIGHT). BIAS_SIGN maps that
// intent to the actual look-target offset direction (flip once if inverted).
const BIAS_SIGN = -1;
const WORLD_UP = new THREE.Vector3(0, 1, 0);

type Cam = {
  // camera position
  px: number;
  py: number;
  pz: number;
  // base look target
  tx: number;
  ty: number;
  tz: number;
  // screen-space framing bias (see BIAS_SIGN)
  bias: number;
  vbias: number;
  // CarRig drive
  w2c: number; // wireframe -> clay   (0 wire .. 1 clay)
  c2g: number; // clay -> gloss       (0 clay .. 1 gloss)
  lights: number; // taillight ignition 0..1
  spin: number; // scrubbed wheel drift (radians)
};

export default function ScrollChoreography({
  carRef,
}: {
  carRef: React.RefObject<CarRig | null>;
}) {
  const { camera } = useThree();

  // The proxy the timeline mutates; useFrame reads it every frame and applies
  // it to the real camera + rig. No React state per frame. Held in a ref and
  // only ever touched inside effects / useFrame (never during render).
  const proxyRef = useRef<Cam>({
    px: 4.4,
    py: 1.4,
    pz: -4.2,
    tx: 0,
    ty: 0.55,
    tz: -0.2,
    bias: 0.95,
    vbias: 0,
    w2c: 0,
    c2g: 0,
    lights: 0,
    spin: 0,
  });

  // Per-frame scratch + captured wheel base-rotations (allocation-free at 60fps).
  const scratchRef = useRef({
    pos: new THREE.Vector3(),
    tgt: new THREE.Vector3(),
    fwd: new THREE.Vector3(),
    right: new THREE.Vector3(),
    baseSpin: new WeakMap<THREE.Object3D, number>(),
  });

  useLayoutEffect(() => {
    const cam = proxyRef.current;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });

      // --- durations mirror each section's vh share of the 700vh document ---
      const HERO = 14.3;
      const BLUE = 14.3;
      const CLAY = 14.3;
      const GLOSS = 14.3;
      const ORBIT = 25.7; // long sweep
      // cta = remainder to 100

      // ACT 1 -------------------------------------------------------------
      // hero: gentle drift on the wireframe front-3/4 (car RIGHT / copy LEFT)
      tl.to(
        cam,
        { px: 5.0, py: 1.12, pz: -3.3, tx: 0.1, ty: 0.5, tz: 0.15, duration: HERO },
        0
      );

      // blueprint: drop low + slide down the flank toward the tail, still wire
      // (car LEFT / copy RIGHT)
      tl.to(cam, {
        px: 6.7,
        py: 0.6,
        pz: 0.3,
        tx: 0,
        ty: 0.5,
        tz: 0.5,
        duration: BLUE,
      });

      // clay: rise up and forward over the front-right fender/wheel WHILE the
      // body materialises wireframe -> clay (car RIGHT / copy LEFT)
      tl.to(cam, {
        px: 3.7,
        py: 1.05,
        pz: -3.35,
        tx: 0.15,
        ty: 0.38,
        tz: -1.35,
        duration: CLAY,
        ease: 'power1.inOut',
      });
      tl.to(cam, { w2c: 1, duration: CLAY, ease: 'power1.inOut' }, '<');

      // gloss: pull into a wide high front-3/4 as the paint lands on the most
      // flattering specular angle (car LEFT / copy RIGHT)
      tl.to(cam, {
        px: 5.9,
        py: 2.0,
        pz: -4.7,
        tx: 0,
        ty: 0.62,
        tz: 0,
        duration: GLOSS,
        ease: 'power1.inOut',
      });
      tl.to(cam, { c2g: 1, duration: GLOSS, ease: 'power1.inOut' }, '<');

      // ACT 2 -------------------------------------------------------------
      // orbit: one continuous drone sweep in three beats (car RIGHT / copy LEFT)
      const orbitStart = HERO + BLUE + CLAY + GLOSS; // 57.2
      // beat 1 — low front rake
      tl.to(cam, {
        px: 2.6,
        py: 0.68,
        pz: -5.0,
        tx: 0,
        ty: 0.5,
        tz: -0.4,
        duration: ORBIT / 3,
        ease: 'power1.inOut',
      });
      // beat 2 — sweep up the right flank into a hint of top-down
      tl.to(cam, {
        px: 6.6,
        py: 2.5,
        pz: 0.2,
        tx: 0,
        ty: 0.4,
        tz: 0.3,
        duration: ORBIT / 3,
      });
      // beat 3 — settle down into the rear-3/4
      tl.to(cam, {
        px: 4.7,
        py: 1.4,
        pz: 5.0,
        tx: 0,
        ty: 0.5,
        tz: 0.9,
        duration: ORBIT / 3,
        ease: 'power1.inOut',
      });
      // subtle scrubbed wheel drift across the whole orbit
      tl.to(cam, { spin: 0.55, duration: ORBIT, ease: 'none' }, orbitStart);

      // cta: settle onto the rear-3/4 hero, centred on the tail, small push-in
      tl.to(cam, {
        px: 4.05,
        py: 1.18,
        pz: 4.55,
        tx: 0,
        ty: 0.55,
        tz: 1.0,
        duration: 100 - orbitStart - ORBIT, // fill to 100
        ease: 'power1.inOut',
      });
      // taillights ignite in the last beat as the CTA lands
      tl.to(cam, { lights: 1, duration: 7, ease: 'power2.in' }, 93);

      // --- BIAS TRACK (added last, absolute positions) -------------------
      // Held CONSTANT through each scene so the car sits firmly on one side
      // during the copy's on-screen peak, then flipped quickly in the gap
      // between scenes (while the copy is fading out/in). This gives clean
      // alternating negative space:  hero R · blueprint L · clay R · gloss L
      // · orbit ~centre · cta centre.  (proxy starts at bias 0.95 = car RIGHT.)
      tl.to(cam, { bias: -0.92, duration: 3, ease: 'power1.inOut' }, 13.0); // -> blueprint (L)
      tl.to(cam, { bias: 0.9, duration: 3, ease: 'power1.inOut' }, 27.3); //   -> clay (R)
      tl.to(cam, { bias: -0.85, duration: 3, ease: 'power1.inOut' }, 41.6); // -> gloss (L)
      tl.to(cam, { bias: 0.28, duration: 4, ease: 'power1.inOut' }, 55.5); //  -> orbit (slight R)
      tl.to(cam, { bias: 0.0, duration: 5, ease: 'power1.inOut' }, 84.0); //   -> cta (centre)

      ScrollTrigger.refresh();
    });

    if (process.env.NODE_ENV !== 'production') {
      const w = window as unknown as Record<string, unknown>;
      w.__cam = camera;
      w.__proxy = cam;
      w.__carRef = carRef;
    }

    return () => ctx.revert();
  }, [camera, carRef]);

  useFrame((state) => {
    const cam = proxyRef.current;
    const s = scratchRef.current;
    const t = state.clock.elapsedTime;

    s.pos.set(cam.px, cam.py, cam.pz);
    s.tgt.set(cam.tx, cam.ty, cam.tz);

    // idle "breathe" — a tiny continuous drone hover so even a still frame lives
    s.pos.x += Math.cos(t * 0.27) * 0.05;
    s.pos.y += Math.sin(t * 0.35) * 0.05;

    // off-centre framing: shift the look target laterally so the car sits in a
    // third of the frame, leaving negative space for the editorial copy.
    s.fwd.copy(s.tgt).sub(s.pos).normalize();
    s.right.crossVectors(s.fwd, WORLD_UP).normalize();
    s.tgt.addScaledVector(s.right, cam.bias * BIAS_SIGN);
    s.tgt.y += cam.vbias;

    camera.position.copy(s.pos);
    camera.lookAt(s.tgt);

    const rig = carRef.current;
    if (rig) {
      rig.setBlend(cam.w2c, cam.c2g);
      rig.setLights(cam.lights);
      for (const wheel of rig.wheels) {
        let base = s.baseSpin.get(wheel);
        if (base === undefined) {
          base = wheel.rotation.x;
          s.baseSpin.set(wheel, base);
        }
        // Imperatively driving the three.js scene graph is the intended R3F
        // pattern here (same as camera.position / rig.setBlend below); the
        // rig only reaches us via a ref, which the compiler treats as frozen.
        // eslint-disable-next-line react-hooks/immutability
        wheel.rotation.x = base + cam.spin;
      }
    }
  });

  return null;
}
