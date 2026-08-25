// Scene registry. The production hero (index.astro gate) imports the splat
// scene directly; experiments mount either scene by name. Candidates C
// (panorama) and D (fbm) were removed 2026-08-25 at the author's decision
// (doc 11, OQ-3) — see git history if they are ever wanted again.

import type { SceneFactory } from "../shell";
import { makeSplatScene } from "./splat";
import { makePointcloudScene } from "./pointcloud";
import { makeCombinedScene } from "./combined";

export const scenes: Record<string, { label: string; factory: SceneFactory }> =
  {
    combined: {
      label: "Combined (production hero): splat stream + 3DV cloud",
      factory: makeCombinedScene({ splatCount: 3200, pointCount: 15000 }),
    },
    splat: { label: "Splat cloud", factory: makeSplatScene(3200) },
    pointcloud: {
      label: "Point-cloud reconstruction — converges to text",
      factory: makePointcloudScene("3DV"),
    },
  };
