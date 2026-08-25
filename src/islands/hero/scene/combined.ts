// The production hero composition: the flowing splat band (background,
// orthographic pixel camera) layered with the "3DV" point-cloud
// reconstruction (foreground, perspective camera), rendered as two passes
// into the same canvas via the shell's custom-render hook.

import type * as THREE from "three";
import type { SceneFactory, SceneHandle } from "../shell";
import { makeSplatScene } from "./splat";
import { makePointcloudScene } from "./pointcloud";

export interface CombinedOptions {
  splatCount: number;
  pointCount: number;
  text?: string;
  /** World-space x offset of the text cloud (perspective units); positive
   * moves it right, away from the hero copy. */
  textOffsetX?: number;
}

export const makeCombinedScene = ({
  splatCount,
  pointCount,
  text = "3DV",
  textOffsetX = 1.6,
}: CombinedOptions): SceneFactory => {
  const splatFactory = makeSplatScene(splatCount);
  const pointFactory = makePointcloudScene(text, pointCount, textOffsetX);

  return (viewport, palette) => {
    const splat = splatFactory(viewport, palette);
    const cloud = pointFactory(viewport, palette);

    const handle: SceneHandle = {
      // Exposed scene/camera are the splat's (the shell keeps its ortho
      // camera sized); the cloud's perspective camera resizes below.
      scene: splat.scene,
      camera: splat.camera,
      update(elapsed, delta, pointer) {
        splat.update(elapsed, delta, pointer);
        cloud.update(elapsed, delta, pointer);
      },
      render(renderer: THREE.WebGLRenderer) {
        renderer.autoClear = false;
        renderer.clear();
        renderer.render(splat.scene, splat.camera);
        renderer.render(cloud.scene, cloud.camera);
      },
      resize(width, height, dpr) {
        splat.resize?.(width, height, dpr);
        cloud.resize?.(width, height, dpr);
      },
      setPalette(p) {
        splat.setPalette(p);
        cloud.setPalette(p);
      },
      dispose() {
        splat.dispose();
        cloud.dispose();
      },
    };
    return handle;
  };
};
