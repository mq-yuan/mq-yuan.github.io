// Candidate A — "splat cloud": instanced anisotropic Gaussian footprints
// drifting along a camera-arc band; pointer focus condenses and sharpens.
// The layout mirrors the static SVG composition (SplatField.astro) so the
// canvas can fade in over the placeholder without a visual jump.

import * as THREE from "three";
import type { Palette, SceneFactory, SceneHandle } from "../shell";
import vert from "../shaders/splat.vert?raw";
import frag from "../shaders/splat.frag?raw";

const lcg = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
};

/** Parameterized factory so the gate can reduce instance count on small/slow
 * devices (doc 08 §4). */
export const makeSplatScene =
  (COUNT: number): SceneFactory =>
  (viewport, palette) => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -viewport.width / 2,
      viewport.width / 2,
      viewport.height / 2,
      -viewport.height / 2,
      -10,
      10,
    );

    const rand = lcg(20260825);
    const gauss = () => (rand() + rand() + rand()) / 1.5 - 1;

    // Band from lower-left to upper-right in normalized units, mapped to px.
    const bezier = (t: number) => {
      const p0 = { x: -0.55, y: -0.35 };
      const p1 = { x: 0.0, y: 0.05 };
      const p2 = { x: 0.55, y: 0.4 };
      return {
        x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x,
        y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y,
      };
    };

    const w = viewport.width;
    const h = viewport.height;
    const centers = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT * 2);
    const rots = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT);
    const kinds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const t = rand();
      const { x, y } = bezier(t);
      const spread = 0.1 + 0.1 * Math.sin(t * Math.PI);
      const px = (x + gauss() * spread * 0.6) * w;
      const py = (y + gauss() * spread) * h;
      centers[i * 3] = px;
      centers[i * 3 + 1] = py;
      centers[i * 3 + 2] = rand();
      const major = 3 + rand() * rand() * 26;
      scales[i * 2] = major;
      scales[i * 2 + 1] = major * (0.3 + rand() * 0.4);
      rots[i] = Math.atan2(0.75 * h, w) + gauss() * 0.5;
      seeds[i] = rand();
      const k = rand();
      kinds[i] = k < 0.5 ? 0 : k < 0.8 ? 1 : 2;
    }

    const base = new THREE.PlaneGeometry(1, 1);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = base.index;
    geometry.setAttribute("position", base.getAttribute("position"));
    geometry.setAttribute(
      "iCenter",
      new THREE.InstancedBufferAttribute(centers, 3),
    );
    geometry.setAttribute(
      "iScale",
      new THREE.InstancedBufferAttribute(scales, 2),
    );
    geometry.setAttribute("iRot", new THREE.InstancedBufferAttribute(rots, 1));
    geometry.setAttribute(
      "iSeed",
      new THREE.InstancedBufferAttribute(seeds, 1),
    );
    geometry.setAttribute(
      "iKind",
      new THREE.InstancedBufferAttribute(kinds, 1),
    );
    geometry.instanceCount = COUNT;

    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(1e6, 1e6) },
        uFocusRadius: { value: Math.min(w, h) * 0.28 },
        uAccent: { value: palette.accent.clone() },
        uNeutral: { value: palette.neutral.clone() },
        uAlpha: { value: palette.isDark ? 0.5 : 0.34 },
      },
    });

    const applyBlending = (p: Palette) => {
      material.blending = p.isDark
        ? THREE.AdditiveBlending
        : THREE.NormalBlending;
      material.needsUpdate = true;
    };
    applyBlending(palette);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    const handle: SceneHandle = {
      scene,
      camera,
      update(elapsed, _delta, pointer) {
        material.uniforms.uTime!.value = elapsed;
        material.uniforms.uPointer!.value.set(
          (pointer.x * camera.right) as number,
          (pointer.y * camera.top) as number,
        );
      },
      setPalette(p) {
        material.uniforms.uAccent!.value.copy(p.accent);
        material.uniforms.uNeutral!.value.copy(p.neutral);
        material.uniforms.uAlpha!.value = p.isDark ? 0.5 : 0.34;
        applyBlending(p);
      },
      dispose() {
        geometry.dispose();
        base.dispose();
        material.dispose();
      },
    };
    return handle;
  };
