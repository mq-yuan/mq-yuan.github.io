// Scene registry for Phase 4 experiments. The production hero (Phase 6)
// imports exactly one scene; experiments mount any of them by name.

import type { SceneFactory } from "../shell";
import { makeSplatScene } from "./splat";
import { createPointcloudScene } from "./pointcloud";
import { createFullscreenScene } from "./fullscreen";
import panoramaFrag from "../shaders/panorama.frag?raw";
import fbmFrag from "../shaders/fbm.frag?raw";

export const scenes: Record<string, { label: string; factory: SceneFactory }> =
  {
    splat: { label: "A — Splat cloud", factory: makeSplatScene(3200) },
    pointcloud: {
      label: "B — Point-cloud reconstruction (reduced)",
      factory: createPointcloudScene,
    },
    panorama: {
      label: "C — Unwrapped panorama",
      factory: createFullscreenScene(panoramaFrag, { light: 0.5, dark: 0.6 }),
    },
    fbm: {
      label: "D — fbm domain-warp field",
      factory: createFullscreenScene(fbmFrag, { light: 0.22, dark: 0.28 }),
    },
  };
