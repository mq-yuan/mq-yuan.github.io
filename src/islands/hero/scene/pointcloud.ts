// Candidate B (reduced proof) — "reconstruction": a point cloud oscillating
// between a scattered state and a structured target (a Gaussian-mixture
// "object"), with gentle pointer repulsion. CPU-updated positions; a full
// implementation would move advection to GPGPU.

import * as THREE from "three";
import type { SceneFactory, SceneHandle } from "../shell";

const COUNT = 15000;

const lcg = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
};

export const createPointcloudScene: SceneFactory = (_viewport, palette) => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 50);
  camera.position.set(0, 0.4, 6);

  const rand = lcg(42);
  const gauss = () => (rand() + rand() + rand() + rand() - 2) / 2;

  // Target: a mixture of anisotropic Gaussians arranged like a loose object.
  const blobs = [
    { c: [0, 0, 0], s: [1.4, 0.5, 0.9] },
    { c: [-1.2, 0.7, -0.4], s: [0.5, 0.5, 0.5] },
    { c: [1.3, 0.5, 0.3], s: [0.6, 0.3, 0.5] },
    { c: [0.4, -0.8, -0.6], s: [0.8, 0.3, 0.6] },
  ] as const;

  const targets = new Float32Array(COUNT * 3);
  const scattered = new Float32Array(COUNT * 3);
  const phases = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const b = blobs[Math.floor(rand() * blobs.length)]!;
    targets[i * 3] = b.c[0] + gauss() * b.s[0];
    targets[i * 3 + 1] = b.c[1] + gauss() * b.s[1];
    targets[i * 3 + 2] = b.c[2] + gauss() * b.s[2];
    scattered[i * 3] = (rand() * 2 - 1) * 5;
    scattered[i * 3 + 1] = (rand() * 2 - 1) * 3;
    scattered[i * 3 + 2] = (rand() * 2 - 1) * 3;
    phases[i] = rand() * Math.PI * 2;
  }

  const positions = new Float32Array(scattered);
  const geometry = new THREE.BufferGeometry();
  const attr = new THREE.BufferAttribute(positions, 3);
  attr.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", attr);

  const material = new THREE.PointsMaterial({
    size: 0.016,
    color: palette.accent,
    transparent: true,
    opacity: palette.isDark ? 0.65 : 0.5,
    sizeAttenuation: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  const pointer3 = new THREE.Vector3();

  const handle: SceneHandle = {
    scene,
    camera,
    update(elapsed, _delta, pointer) {
      // Convergence oscillates slowly; pointer proximity locally scatters.
      const m = 0.5 + 0.5 * Math.sin(elapsed * 0.15);
      pointer3.set(pointer.x * 3.2, pointer.y * 1.8, 0);
      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3;
        const jitter = 0.05 * Math.sin(elapsed * 0.7 + phases[i]!);
        let x = scattered[ix]! + (targets[ix]! - scattered[ix]!) * m + jitter;
        let y =
          scattered[ix + 1]! +
          (targets[ix + 1]! - scattered[ix + 1]!) * m +
          jitter * 0.7;
        const z =
          scattered[ix + 2]! + (targets[ix + 2]! - scattered[ix + 2]!) * m;
        const dx = x - pointer3.x;
        const dy = y - pointer3.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 1.0) {
          const push = (1.0 - d2) * 0.4;
          x += dx * push;
          y += dy * push;
        }
        positions[ix] = x;
        positions[ix + 1] = y;
        positions[ix + 2] = z;
      }
      attr.needsUpdate = true;
      points.rotation.y = elapsed * 0.03;
    },
    setPalette(p) {
      material.color.copy(p.accent);
      material.opacity = p.isDark ? 0.65 : 0.5;
    },
    resize(width, height) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
  return handle;
};
