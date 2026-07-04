import * as THREE from 'three';

/**
 * Imperative material rig for the hero car.
 *
 * The three "acts" of the site (WIREFRAME / CLAY / GLOSS) plus the
 * headlight/taillight ignition are all driven through a tiny ref-style API so
 * the later choreography pass can scrub them straight off a GSAP timeline at
 * 60fps. Everything is imperative and allocation-free per call: `setBlend` /
 * `setLights` only mutate existing THREE.Color / material-uniform values using
 * module-level scratch objects — there is no React state and nothing is cloned
 * per frame.
 *
 *   setBlend(wireframeToClay, clayToGloss)
 *     wireframeToClay 0 -> full glowing wireframe blueprint
 *                     1 -> solid body (start of the clay act)
 *     clayToGloss     0 -> matte studio clay
 *                     1 -> finished lustrous paint / real materials
 *
 *   setLights(intensity)  0..1 emissive ignition of the head/tail/turn lights
 *
 * All three inputs are latched on the rig and a single private `apply()` folds
 * them together, so calling either setter in any order (or every frame, in
 * either direction) is safe.
 */
export interface CarRig {
  group: THREE.Group;
  /** the four wheel_* nodes, for the choreography pass (spin / motion) */
  wheels: THREE.Object3D[];
  /** scrub-safe, allocation-free; both args clamped to 0..1 */
  setBlend(wireframeToClay: number, clayToGloss: number): void;
  /** 0..1 head/tail/turn-signal ignition; blooms via postprocessing */
  setLights(intensity: number): void;
  /** release GPU resources for cloned materials / overlays */
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Art-direction constants
// ---------------------------------------------------------------------------

/** deep sapphire "expensive" body paint — see report for rationale */
const BODY_PAINT = new THREE.Color('#132a52');
/** warm putty sculpting clay */
const CLAY_COLOR = new THREE.Color('#b7ad9f');
/** near-black body sitting under the glowing wireframe */
const BODY_DARK = new THREE.Color('#04060a');
/** electric blueprint line colour (kept > 1-ish & un-tonemapped so it blooms) */
const WIRE_LINE = new THREE.Color('#59b8ff');

// Emissive ignition targets
const HEAD_EMISSIVE = new THREE.Color('#f2f6ff'); // cool white xenon
const TAIL_EMISSIVE = new THREE.Color('#ff1114'); // deep red
const TURN_EMISSIVE = new THREE.Color('#ff6a00'); // amber indicator

// Material name → role
const PAINT_NAMES = new Set(['Body_Color']); // upgraded to clearcoat physical
const CLAYABLE = new Set([
  'Body_Color',
  'Carbon_Fiber',
  'Glass_Gray',
  'Projector_Glass',
  'Taillight_Glass',
  'Turn_Signal_LED',
  'metal_chrome',
  'metal_gray',
  'plastic_gray',
  '_0098_DodgerBlue',
  'Ferrari_Yellow',
]);
const LIGHT_NAMES = new Set([
  'Projector_Glass',
  'Turn_Signal_LED',
  'Taillight_Glass',
]);

// ---------------------------------------------------------------------------
// Scratch objects (never allocate inside setBlend / setLights / apply)
// ---------------------------------------------------------------------------
const _color = new THREE.Color();
const lerp = THREE.MathUtils.lerp;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

type StdMat = THREE.MeshStandardMaterial;

interface MatState {
  mat: StdMat;
  physical: boolean;

  // GLOSS (finished-car) targets, captured from the source material
  glossColor: THREE.Color;
  glossRough: number;
  glossMetal: number;
  glossEnv: number;
  glossOpacity: number;
  glossClearcoat: number;

  // CLAY targets
  clayColor: THREE.Color;
  clayRough: number;
  clayMetal: number;
  clayEnv: number;
  clayOpacity: number;
  clayClearcoat: number;

  // fixed at build: transparent flag never toggles at runtime (avoids recompiles)
  transparent: boolean;

  // light ignition
  isLight: boolean;
  lightColor: THREE.Color;
  lightMax: number;
}

/**
 * Walks the (already cloned & centred) car scene graph, clones every material
 * so the shared useGLTF cache is never mutated, upgrades the body paint to a
 * clearcoat MeshPhysicalMaterial, attaches a wireframe overlay to every mesh,
 * and returns the imperative CarRig.
 */
export function buildCarRig(root: THREE.Object3D, group: THREE.Group): CarRig {
  const wheels: THREE.Object3D[] = [];
  for (const name of ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr']) {
    const node = root.getObjectByName(name);
    if (node) wheels.push(node);
  }

  const states: MatState[] = [];
  const overlays: THREE.MeshBasicMaterial[] = [];
  const disposables: Array<THREE.Material> = [];
  const matCache = new Map<string, THREE.Material>();

  const resolveMaterial = (src: THREE.Material): THREE.Material => {
    const cached = matCache.get(src.uuid);
    if (cached) return cached;

    const std = src as StdMat;
    const isPaint = PAINT_NAMES.has(std.name);

    let out: StdMat;
    if (isPaint) {
      // Upgrade to physical for a real clearcoat wet-paint read. Copy only the
      // standard-material props — MeshPhysicalMaterial.copy() assumes the source
      // also has physical-only vectors (clearcoatNormalScale, etc).
      const phys = new THREE.MeshPhysicalMaterial();
      THREE.MeshStandardMaterial.prototype.copy.call(phys, std);
      phys.map = null; // paint is flat colour — drop any baked albedo tint
      phys.color.copy(BODY_PAINT);
      phys.metalness = 0.6;
      phys.roughness = 0.26;
      phys.envMapIntensity = 1.75;
      phys.clearcoat = 1;
      phys.clearcoatRoughness = 0.04;
      out = phys;
    } else {
      // Clone so we never touch the cached GLTF materials.
      out = std.clone();
    }
    disposables.push(out);
    matCache.set(src.uuid, out);
    buildState(out, isPaint);
    return out;
  };

  const buildState = (mat: StdMat, physical: boolean) => {
    const name = mat.name;
    const clayable = CLAYABLE.has(name);
    const isLight = LIGHT_NAMES.has(name);

    const glossColor = mat.color.clone();
    const glossRough = mat.roughness;
    const glossMetal = mat.metalness;
    const glossEnv = mat.envMapIntensity ?? 1;
    const glossOpacity = mat.opacity;
    const glossClearcoat = physical
      ? (mat as THREE.MeshPhysicalMaterial).clearcoat
      : 0;

    let lightColor = HEAD_EMISSIVE;
    let lightMax = 0;
    if (isLight) {
      if (name === 'Taillight_Glass') {
        lightColor = TAIL_EMISSIVE;
        lightMax = 12;
      } else if (name === 'Turn_Signal_LED') {
        lightColor = TURN_EMISSIVE;
        lightMax = 20;
      } else {
        // thin DRL/projector strip behind tinted glass — needs a big push to
        // bloom into a visible light signature.
        lightColor = HEAD_EMISSIVE;
        lightMax = 40;
      }
    }

    // Materials that are ever see-through must keep transparent=true for their
    // whole life so we never toggle the flag (which would churn render order).
    const transparent = glossOpacity < 0.99 || isLight || (clayable && glossOpacity < 1);

    const state: MatState = {
      mat,
      physical,
      glossColor,
      glossRough,
      glossMetal,
      glossEnv,
      glossOpacity,
      glossClearcoat,
      clayColor: clayable ? CLAY_COLOR : glossColor,
      clayRough: clayable ? 0.82 : glossRough,
      clayMetal: clayable ? 0.0 : glossMetal,
      clayEnv: clayable ? 0.4 : glossEnv,
      clayOpacity: clayable ? 1.0 : glossOpacity,
      clayClearcoat: 0.02,
      transparent,
      isLight,
      lightColor,
      lightMax,
    };

    if (transparent) mat.transparent = true;
    if (isLight) {
      mat.emissive.copy(lightColor);
      mat.emissiveIntensity = 0;
      mat.toneMapped = true;
    }
    states.push(state);
  };

  // Snapshot meshes BEFORE mutating — we add overlay child meshes below, and
  // traversing while adding children would recurse into them forever.
  const meshes: THREE.Mesh[] = [];
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) meshes.push(obj as THREE.Mesh);
  });

  // Walk the graph: remap materials + attach a wireframe overlay per mesh.
  for (const mesh of meshes) {
    const src = mesh.material;
    if (Array.isArray(src)) {
      mesh.material = src.map((m) => resolveMaterial(m));
    } else {
      mesh.material = resolveMaterial(src);
    }

    // Wireframe blueprint overlay: additive glowing lines over the dark body.
    const wireMat = new THREE.MeshBasicMaterial({
      color: WIRE_LINE,
      wireframe: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const overlay = new THREE.Mesh(mesh.geometry, wireMat);
    overlay.renderOrder = 3;
    overlay.frustumCulled = false;
    overlay.matrixAutoUpdate = false; // inherits parent transform at identity
    mesh.add(overlay);
    overlays.push(wireMat);
    disposables.push(wireMat);
  }

  // -------------------------------------------------------------------------
  // Latched inputs + folding
  // -------------------------------------------------------------------------
  let w2c = 1; // default: solid...
  let c2g = 1; // ...finished gloss car on first paint
  let lights = 0;

  const apply = () => {
    const wire = 1 - clamp01(w2c);
    const g = clamp01(c2g);
    const lit = clamp01(lights);

    for (let i = 0; i < states.length; i++) {
      const s = states[i];
      const m = s.mat;

      // clay -> gloss base colour, then fade toward the dark blueprint body.
      _color.copy(s.clayColor).lerp(s.glossColor, g);
      _color.lerp(BODY_DARK, wire);
      m.color.copy(_color);

      const baseRough = lerp(s.clayRough, s.glossRough, g);
      m.roughness = lerp(baseRough, 0.95, wire);
      m.metalness = lerp(s.clayMetal, s.glossMetal, g) * (1 - wire);
      m.envMapIntensity = lerp(s.clayEnv, s.glossEnv, g) * (1 - 0.85 * wire);

      if (s.physical) {
        const cc = lerp(s.clayClearcoat, s.glossClearcoat, g) * (1 - wire);
        // never hit exactly 0 -> keeps USE_CLEARCOAT define stable (no recompile)
        (m as THREE.MeshPhysicalMaterial).clearcoat = cc < 0.02 ? 0.02 : cc;
      }

      if (s.transparent) {
        m.opacity = lerp(s.clayOpacity, s.glossOpacity, g);
      }

      if (s.isLight) {
        // Ignition only reads on the finished car (g) and never under wireframe.
        m.emissiveIntensity = lit * s.lightMax * g * (1 - wire);
      }
    }

    const wireOpacity = wire * 0.85;
    for (let i = 0; i < overlays.length; i++) {
      overlays[i].opacity = wireOpacity;
      overlays[i].visible = wireOpacity > 0.001;
    }
  };

  apply(); // establish the default look

  return {
    group,
    wheels,
    setBlend(wireframeToClay: number, clayToGloss: number) {
      w2c = wireframeToClay;
      c2g = clayToGloss;
      apply();
    },
    setLights(intensity: number) {
      lights = intensity;
      apply();
    },
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}
