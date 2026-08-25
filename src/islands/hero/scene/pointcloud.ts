// "Reconstruction" scene: a point cloud oscillating between a scattered
// state and a structured target sampled from rendered TEXT (default "3DV") —
// points slowly converge into the glyphs, dissolve, and re-form. Gentle
// pointer repulsion locally scatters the cloud. CPU-updated positions.

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

/** Rasterizes `text` to an offscreen canvas and rejection-samples `count`
 * points from the glyph coverage, mapped to world units around the origin. */
function sampleTextTargets(
  text: string,
  count: number,
  rand: () => number,
  gauss: () => number,
): Float32Array {
  const cw = 720;
  const ch = 320;
  const cnv = document.createElement("canvas");
  cnv.width = cw;
  cnv.height = ch;
  const g = cnv.getContext("2d")!;
  g.fillStyle = "#fff";
  g.font = `600 220px "Libertinus Serif", Georgia, serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, cw / 2, ch / 2);
  const alpha = g.getImageData(0, 0, cw, ch).data;

  const worldW = 5.4;
  const worldH = (worldW * ch) / cw;
  const pts = new Float32Array(count * 3);
  let i = 0;
  let guard = 0;
  while (i < count && guard < count * 400) {
    guard += 1;
    const x = Math.floor(rand() * cw);
    const y = Math.floor(rand() * ch);
    if (alpha[(y * cw + x) * 4 + 3]! > 128) {
      pts[i * 3] = (x / cw - 0.5) * worldW + gauss() * 0.015;
      pts[i * 3 + 1] = (0.5 - y / ch) * worldH + gauss() * 0.015;
      pts[i * 3 + 2] = gauss() * 0.14;
      i += 1;
    }
  }
  return pts;
}

export const makePointcloudScene =
  (text = "3DV"): SceneFactory =>
  (_viewport, palette) => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 50);
    camera.position.set(0, 0.15, 5.6);

    const rand = lcg(42);
    const gauss = () => (rand() + rand() + rand() + rand() - 2) / 2;

    const targets = sampleTextTargets(text, COUNT, rand, gauss);
    const scattered = new Float32Array(COUNT * 3);
    const phases = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
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
        // Convergence dwells near the formed text (eased sine), then
        // dissolves; pointer proximity locally scatters.
        const s = Math.sin(elapsed * 0.12);
        const m = THREE.MathUtils.smoothstep(s, -0.7, 0.7);
        pointer3.set(pointer.x * 3.2, pointer.y * 1.8, 0);
        for (let i = 0; i < COUNT; i++) {
          const ix = i * 3;
          const jitter = 0.04 * Math.sin(elapsed * 0.7 + phases[i]!);
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
        // Slight oscillating yaw keeps depth alive without making the
        // converged text unreadable.
        points.rotation.y = Math.sin(elapsed * 0.18) * 0.22 * (1 - m * 0.7);
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
