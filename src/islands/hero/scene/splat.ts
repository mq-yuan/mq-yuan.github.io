// The signature scene — "splat cloud": instanced anisotropic Gaussian
// footprints streaming along a camera-arc band (curve evaluation lives in the
// vertex shader; the CPU does zero per-frame work). Pointer focus condenses
// and sharpens the field. The static SVG placeholder (SplatField.astro) shows
// the same band composition, so the canvas fades in without a visual jump.

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

    const t0s = new Float32Array(COUNT);
    const offs = new Float32Array(COUNT);
    const scales = new Float32Array(COUNT * 2);
    const rotJitters = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT);
    const kinds = new Float32Array(COUNT);
    const depths = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      t0s[i] = rand();
      offs[i] = gauss();
      const major = 3 + rand() * rand() * 26;
      scales[i * 2] = major;
      scales[i * 2 + 1] = major * (0.3 + rand() * 0.4);
      rotJitters[i] = gauss() * 0.5;
      seeds[i] = rand();
      const k = rand();
      kinds[i] = k < 0.5 ? 0 : k < 0.8 ? 1 : 2;
      depths[i] = rand();
    }

    const base = new THREE.PlaneGeometry(1, 1);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = base.index;
    geometry.setAttribute("position", base.getAttribute("position"));
    geometry.setAttribute("iT0", new THREE.InstancedBufferAttribute(t0s, 1));
    geometry.setAttribute("iOff", new THREE.InstancedBufferAttribute(offs, 1));
    geometry.setAttribute(
      "iScale",
      new THREE.InstancedBufferAttribute(scales, 2),
    );
    geometry.setAttribute(
      "iRotJitter",
      new THREE.InstancedBufferAttribute(rotJitters, 1),
    );
    geometry.setAttribute(
      "iSeed",
      new THREE.InstancedBufferAttribute(seeds, 1),
    );
    geometry.setAttribute(
      "iKind",
      new THREE.InstancedBufferAttribute(kinds, 1),
    );
    geometry.setAttribute(
      "iDepth",
      new THREE.InstancedBufferAttribute(depths, 1),
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
        uFocusRadius: {
          value: Math.min(viewport.width, viewport.height) * 0.28,
        },
        uViewport: {
          value: new THREE.Vector2(viewport.width, viewport.height),
        },
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
          pointer.x * camera.right,
          pointer.y * camera.top,
        );
      },
      resize(width, height) {
        material.uniforms.uViewport!.value.set(width, height);
        material.uniforms.uFocusRadius!.value = Math.min(width, height) * 0.28;
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
