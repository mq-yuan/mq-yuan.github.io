// Shared fullscreen-quad scene builder for fragment-shader candidates
// (panorama, fbm). Wraps a single ShaderMaterial plane with the standard
// uniform set; per-candidate behavior lives entirely in the fragment shader.

import * as THREE from "three";
import type { SceneFactory, SceneHandle } from "../shell";

export const createFullscreenScene = (
  fragmentShader: string,
  alpha: { light: number; dark: number },
): SceneFactory => {
  return (viewport, palette) => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const material = new THREE.ShaderMaterial({
      vertexShader:
        "void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uResolution: {
          value: new THREE.Vector2(viewport.width, viewport.height),
        },
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uAccent: { value: palette.accent.clone() },
        uNeutral: { value: palette.neutral.clone() },
        uBg: { value: palette.bg.clone() },
        uAlpha: { value: palette.isDark ? alpha.dark : alpha.light },
      },
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    const handle: SceneHandle = {
      scene,
      camera,
      update(elapsed, _delta, pointer) {
        material.uniforms.uTime!.value = elapsed;
        material.uniforms.uPointer!.value.copy(pointer);
      },
      resize(width, height, dpr) {
        material.uniforms.uResolution!.value.set(width * dpr, height * dpr);
      },
      setPalette(p) {
        material.uniforms.uAccent!.value.copy(p.accent);
        material.uniforms.uNeutral!.value.copy(p.neutral);
        material.uniforms.uBg!.value.copy(p.bg);
        material.uniforms.uAlpha!.value = p.isDark ? alpha.dark : alpha.light;
      },
      dispose() {
        geometry.dispose();
        material.dispose();
      },
    };
    return handle;
  };
};
