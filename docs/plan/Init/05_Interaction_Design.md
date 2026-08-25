# 05 — Interaction Design

> The interaction budget for the whole site: one signature interaction, 2–4 secondary
> micro-interactions, optional experiments, and an explicit avoid list. Grounded in
> doc 02 research; technical execution details in doc 06; budgets/fallbacks in doc 08.
>
> Governing rule: **if removing an effect would not meaningfully remove identity, it
> is not added.** Target mix ≈ 70% static design / 20% micro-interaction / 10% wow.

## 1. Signature interaction — homepage hero visual

One WebGL visual in the hero, built and selected via Phase 4 experiments
(doc 09). It must succeed as an abstract visual first; the research connection
(fields, splats, rays, panoramas) stays allusive — never a pipeline diagram.

### Candidate A — Gaussian billboard field ("splat cloud") · differentiation pick

- **Visual**: a few thousand anisotropic elliptical Gaussian footprints (soft
  additive blobs), low-saturation single hue family on the page background, drifting
  slowly; near the pointer the field subtly sharpens/condenses, as if coming into
  focus.
- **Implementation**: three.js instanced quads; fragment = elliptical `exp` falloff;
  additive blending (no sorting needed); pointer as a smoothed uniform.
- **Perf**: low–medium; thousands of instances trivial on any GPU. **Mobile**: good
  (reduce instance count + DPR).
- **Identity link**: literally the primitive of Gaussian Splatting; near-unique on
  personal sites (doc 02).
- **Reduced-motion / static fallback**: render one converged frame (or pre-rendered
  image of it) — the still composition is designed to look intentional.
- **Risks**: additive blobs can read as "bokeh wallpaper" if hue/size are wrong;
  needs careful density tuning.

### Candidate B — Image ↔ point cloud reconstruction

- **Visual**: 20–50k points that at rest form a loose cloud; over time (or on
  scroll/pointer) they converge toward an image/structure and dissolve back —
  "reconstruction from observations."
- **Implementation**: three.js `Points`/instancing; curl-noise advection (CPU for
  ≤20k pts or GPGPU ping-pong); target positions sampled from an image or
  procedural shape.
- **Perf**: medium (GPGPU optional). **Mobile**: good with reduced count.
- **Identity link**: strongest narrative match ("from 2D observations to 3D
  structure"), per Codrops UntilLabs analysis.
- **Fallback**: static converged frame.
- **Risks**: highest implementation complexity of the candidates; needs a good
  source image/shape or it reads generic.

### Candidate C — Unwrapped panorama field

- **Visual**: an equirectangular projection of a procedural sphere (graticule lines,
  star-like points) laid across the hero, rotating imperceptibly; pointer nudges the
  view direction.
- **Implementation**: single fullscreen fragment shader (lat/long ↔ direction
  mapping); raw WebGL viable (3–8KB JS total).
- **Perf**: low. **Mobile**: excellent.
- **Identity link**: panorama research direction; strong mathematical flavor.
- **Fallback**: single rendered frame.
- **Risks**: subtler identity; risk of reading as "map graphic."

### Candidate D — fbm domain-warped field (floor option)

- **Visual**: low-contrast monochrome flowing noise field ("a slice of a neural
  field"), barely moving.
- **Implementation**: fullscreen fragment, 3–4 octave fbm with iq-style domain
  warping (reimplemented, never copied).
- **Perf**: lowest. **Mobile**: best. **Identity**: weakest/most generic — kept as
  floor/fallback direction, and as the possible static-fallback texture for A/B.

### Selection process

Phase 4 builds quick prototypes (A and C are cheap; B gets a reduced proof; D is
the floor). Runtime cost, uniqueness, and mobile behavior are recorded per doc 09.
**Final pick between surviving candidates is an author aesthetic call** → OQ-3 in
doc 11; A (splat cloud) is the working favorite on identity+cost grounds, possibly
merged with B (each point = small Gaussian footprint).

**Phase 4 outcome (2026-08-25)**: all four prototyped and compared — see
`reports/phase4-experiments.md`. **OQ-3 resolved by the author (2026-08-25)**:
A (splat cloud) confirmed as the signature and upgraded from drift to a true
flowing stream (curve evaluation in the vertex shader: instances advect along
the arc with depth-dependent speed/parallax and end-fades); B (point cloud)
kept as a second scene, its convergence target now sampled from rendered text
(default "3DV", parameterizable). Candidates C (panorama) and D (fbm) removed
at the author's decision — recoverable from git history.

**Composition update (2026-08-25, author request)**: the production hero now
runs a COMBINED scene — the flowing splat band (orthographic pass) layered
with the "3DV" point-cloud reconstruction (perspective pass, offset right of
the hero copy), rendered as two passes into one canvas via the shell's
custom-render hook. Reduced tier: 1400 splats + 6k points, text nearer
center. The degradation ladder covers the whole composition (verified: a
software-GL environment drops DPR then yields to the placeholder).

### Shared hero behaviors (whichever candidate wins)

- Pointer input: smoothed (lerped) uniform, response radius large and gentle — field
  response, not cursor decoration. Touch: drift continues; tap ripples optional.
- Idle: continuous but low-amplitude motion; time uniform via `THREE.Clock` delta
  (safe across tab visibility).
- Off-screen: RAF paused via IntersectionObserver; tab hidden: RAF naturally stops.
- Layering: static placeholder (designed image/CSS composition) always painted
  under the canvas; canvas fades in on successful init. Covers no-JS, no-WebGL,
  init failure, and CLS in one mechanism.
- `prefers-reduced-motion`: **decided in Phase 5 — skip the canvas entirely and
  keep the designed placeholder.** The placeholder already carries the identity,
  and skipping saves the ~180KB chunk for reduced-motion users.
- Canvas is `aria-hidden="true"`; hero text is plain HTML above it, always readable
  (contrast overlay if needed).

## 2. Secondary interactions (the full budget: 4)

| #   | Interaction          | Spec                                                                                                                                                                                                                                           | Cost |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| S1  | **Hero text reveal** | H1/tagline lines reveal once on load: mask-up or blur→sharp, 500–700ms total, 30–50ms stagger, ease-out. Plays once, never on scroll-back. Pure CSS animation (`@starting-style` / keyframes), no JS. Reduced-motion: static.                  | ~0   |
| S2  | **Nav/link hover**   | Underline slides in from left, ≤200ms ease-out; current page has persistent accent underline. CSS only.                                                                                                                                        | ~0   |
| S3  | **Teaser hover**     | Work-entry teaser: subtle grayscale→color or 1.01 scale + border-color shift, 200ms. CSS only. (Shader ripple version explicitly deferred to Experiments.)                                                                                     | ~0   |
| S4  | **Page transitions** | Native cross-document View Transitions (pure CSS `@view-transition`): 300ms crossfade + ≤8px vertical offset on main content. Progressive enhancement; browsers without support get instant navigation. No ClientRouter. Reduced-motion: none. | ~0   |

Everything else on the site is static. Adding a fifth micro-interaction requires
removing one of these or a written decision in doc 11.

## 3. Optional experiments (not scheduled; parked ideas)

- Shader-driven teaser hover (pointer ripple grayscale→color, Codrops 2025-10
  idea, reimplemented) — only if Phase 6 shows S3's CSS version feels flat, and
  only on desktop pointers.
- One-time scramble→settle on the hero name (S1 variant) — test against plain
  reveal; keep whichever is calmer.
- Variable-font weight-by-proximity on nav — only if a variable mono is adopted.
- Article link-hover preview (Gwern-style) — far future, archive must be large.

## 4. Explicitly avoided effects

Cursor followers/custom cursors of any kind · splash/fluid/ghost cursor trails ·
glitch/letter-glitch text · gradient text, aurora/plasma/hyperspeed backgrounds ·
liquid chrome/meta balls · magnetic buttons · 3D-tilt cards · gooey navigation ·
scroll hijacking and weighted smooth-scroll libraries · looping typewriter/scramble ·
per-section entrance animations on scroll · parallax on content · raymarched
fullscreen hero · autoplaying sound · React-rendered animation wrappers on static
content · any ShaderToy code reuse (CC BY-NC-SA — ideas only, reimplemented).

Rationale (doc 02): the credibility language of a researcher site is fast, quiet,
content-first; these effects signal "template portfolio" and directly undermine it.

## 5. Interaction acceptance tests

- Disable JS → site fully usable, hero placeholder looks intentional (removal test).
- Force `prefers-reduced-motion` → nothing moves except user-initiated navigation;
  hero shows still frame.
- Block WebGL (or simulate context-creation failure) → placeholder remains, no
  layout shift, no console spam.
- Keyboard-only pass: every interactive element reachable, visible focus (accent
  ring), no focus traps; canvas never receives focus.
- Mid-range phone: hero ≥ 30fps sustained or auto-degrades per doc 08 rules.
