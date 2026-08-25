// Scene registry. The production hero (index.astro gate) imports the splat
// scene directly; experiments mount either scene by name. Candidates C
// (panorama) and D (fbm) were removed 2026-08-25 at the author's decision
// (doc 11, OQ-3) — see git history if they are ever wanted again.

import type { SceneFactory } from "../shell";
import { makeSplatScene } from "./splat";
import { makePointcloudScene } from "./pointcloud";

export const scenes: Record<string, { label: string; factory: SceneFactory }> =
  {
    splat: { label: "Splat cloud (signature)", factory: makeSplatScene(3200) },
    pointcloud: {
      label: "Point-cloud reconstruction — converges to text",
      factory: makePointcloudScene("3DV"),
    },
  };
