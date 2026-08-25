# Phase 4 Report — Hero Candidate Experiments

Date: 2026-08-25. Prototypes live under `/experiments/[name]` (dev-only routes;
production builds contain none — verified). Shared lifecycle shell:
`src/islands/hero/shell.ts` (DPR cap, resize, pointer smoothing, off-screen
pause, theme-reactive palette, context-lost cleanup). Scenes:
`src/islands/hero/scene/`. Screenshots in `./assets/` (1280px JPEG,
SwiftShader software rendering — FPS numbers below are a _software floor_;
any real GPU is far faster. Hardware FPS must be re-measured in Phase 5 on
the author's machines).

## Results

|                                  | A splat                                                                               | B pointcloud (reduced)                                        | C panorama                                                      | D fbm                                               |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| Visual (dark)                    | Nebula-like band of anisotropic Gaussian footprints — striking, unmistakably "splats" | Quiet converging starfield — subtle, generic at this fidelity | Unwrapped starry sphere with graticule — dramatic, mathematical | Soft gray mist — elegant, anonymous                 |
| Visual (light)                   | Ink-wash band — works; slight square-edge artifacts to fix                            | Barely visible — needs density/size retune                    | Dense dot matrix — overpowering, needs strong masking           | Watercolor clouds — the best light-mode of the four |
| Software FPS (1280×800, DPR 1.5) | 23                                                                                    | 60 (CPU update, cheap draw)                                   | 55                                                              | 34                                                  |
| Cost drivers                     | 3.2k instanced quads, overdraw in band core                                           | 15k CPU-updated points (GPGPU would lift ceiling)             | fullscreen frag, trig-heavy                                     | fullscreen frag, 12 fbm evals/px                    |
| Mobile strategy                  | halve instances + DPR 1                                                               | halve points                                                  | DPR 1                                                           | fewer octaves + DPR 1                               |
| Identity link                    | **Direct: the primitive of 3DGS**                                                     | Strong concept ("reconstruction"), weak at reduced fidelity   | Panorama direction, strong math flavor                          | Weak ("some neural field")                          |
| Uniqueness on personal sites     | Very high                                                                             | Low-medium                                                    | High                                                            | Low                                                 |
| Implementation state             | Full prototype                                                                        | Reduced proof (morph + pointer repulsion only)                | Full prototype                                                  | Full prototype                                      |
| JS footprint                     | three.js chunk (~180KB gz, measured at integration)                                   | same                                                          | same; **portable to raw WebGL at 3–8KB**                        | same; portable to raw WebGL                         |

## Reading

- **A (splat cloud)** is the only candidate whose still frame already carries
  the research identity (matches the Phase 2 static SVG hero, enabling a
  seamless placeholder→canvas fade). Dark theme is exceptional; light theme
  needs falloff-window tuning (visible quad edges) and density balancing.
- **C (panorama)** is the strongest runner-up: distinctive and cheap, but it
  wants to own the whole hero surface, which fights the text column; usable
  with an aggressive mask, or as a future alternate.
- **B** validates the interaction mechanics (morph, pointer repulsion) but
  needs GPGPU + a real target shape to be competitive; parked.
- **D** confirmed as the floor/fallback texture direction, not a signature.

## Recommendation

Proceed to Phase 5 with **A — splat cloud** (working favorite per doc 05),
keeping C buildable in the registry. **OQ-3 stays open**: the author can
overrule by visiting `/experiments/splat|panorama|pointcloud|fbm` in `pnpm
dev` and saying the word — swapping the production scene is a one-line change
by design.

## Phase 5 tuning list for A

1. Replace hard `discard` edge with a smooth falloff window (light-mode quad
   edges).
2. Rebalance light-theme alpha/density (band reads slightly heavy against
   text at 1280px).
3. Mask/fade toward the text column (reuse the placeholder's mask geometry).
4. Hardware FPS measurement (laptop + phone) and degradation thresholds
   (doc 08 §3).
5. Static fallback frame regeneration from the final tuned parameters so
   placeholder and canvas match.
