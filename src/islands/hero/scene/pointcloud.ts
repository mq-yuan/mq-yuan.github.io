// "Reconstruction" scene: a point cloud looping between a scattered state
// and a structured target sampled from rendered TEXT (default "3DV").
// The morph, jitter, and pointer repulsion all run in the vertex shader —
// the CPU updates only a few uniforms per frame (keeps TBT at ~zero).

import * as THREE from "three";
import type { SceneFactory, SceneHandle } from "../shell";
import vert from "../shaders/pointcloud.vert?raw";
import frag from "../shaders/pointcloud.frag?raw";

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
  (text = "3DV", COUNT = 15000, offsetX = 0): SceneFactory =>
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

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(scattered, 3));
    geometry.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMorph: { value: 0 },
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(1e6, 1e6) },
        uScale: { value: 400 },
        uSize: { value: 0.022 },
        uColor: { value: palette.accent.clone() },
        uOpacity: { value: palette.isDark ? 0.9 : 0.7 },
      },
    });

    const points = new THREE.Points(geometry, material);
    points.position.x = offsetX;
    scene.add(points);

    const handle: SceneHandle = {
      scene,
      camera,
      update(elapsed, _delta, pointer) {
        // Explicit loop timeline: converge -> brief hold -> dissolve ->
        // brief scattered rest, then repeat. Tune the segment lengths here.
        const CONVERGE = 6;
        const HOLD = 5.5;
        const DISSOLVE = 6;
        const REST = 3;
        const CYCLE = CONVERGE + HOLD + DISSOLVE + REST;
        const tc = elapsed % CYCLE;
        const ease = (x: number) => x * x * (3 - 2 * x);
        let m: number;
        if (tc < CONVERGE) m = ease(tc / CONVERGE);
        else if (tc < CONVERGE + HOLD) m = 1;
        else if (tc < CONVERGE + HOLD + DISSOLVE)
          m = 1 - ease((tc - CONVERGE - HOLD) / DISSOLVE);
        else m = 0;

        material.uniforms.uMorph!.value = m;
        material.uniforms.uTime!.value = elapsed;
        // Pointer in the cloud's local space (offset removed).
        material.uniforms.uPointer!.value.set(
          pointer.x * 3.2 - points.position.x,
          pointer.y * 1.8 - points.position.y,
        );
        // Slight oscillating yaw keeps depth alive without making the
        // converged text unreadable.
        points.rotation.y = Math.sin(elapsed * 0.18) * 0.22 * (1 - m * 0.7);
      },
      setPalette(p) {
        material.uniforms.uColor!.value.copy(p.accent);
        material.uniforms.uOpacity!.value = p.isDark ? 0.9 : 0.7;
      },
      resize(width, height, dpr) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        material.uniforms.uScale!.value = height * dpr * 0.5;
        // Dolly the camera back on narrow viewports so the full text,
        // including its x offset, always fits the horizontal FOV.
        const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
        const neededHalfWidth = Math.abs(offsetX) + 2.9; // glyph half + margin
        const z = Math.max(
          5.6,
          neededHalfWidth / (Math.tan(halfFov) * camera.aspect),
        );
        camera.position.z = z;
        // Keep the apparent point size roughly constant across dolly
        // distances, and drop the text below the hero copy on portrait.
        material.uniforms.uSize!.value = 0.022 * Math.max(1, (z / 5.6) * 0.85);
        points.position.set(offsetX, camera.aspect < 1 ? -1.1 : 0, 0);
      },
      dispose() {
        geometry.dispose();
        material.dispose();
      },
    };
    return handle;
  };
