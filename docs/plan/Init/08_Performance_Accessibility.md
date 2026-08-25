# 08 — Performance & Accessibility

> Budgets and requirements set BEFORE implementation; enforced at every phase's
> acceptance check (doc 09) and audited systematically in Phase 7. Numbers are
> hard budgets unless marked "target."

## 1. JavaScript budgets

| Surface | Budget (min+gzip) |
| --- | --- |
| Content pages (`/research`, `/writing*`, `/about`) | **≤ 5KB** total JS (theme script + nothing else; effectively ~1KB) |
| Homepage before hero loads | ≤ 5KB (same as content pages; hero is dynamic-imported) |
| Hero island chunk (three.js candidates A/B) | ≤ 220KB, loaded lazily, never blocking first paint |
| Hero island chunk (raw-WebGL candidates C/D) | ≤ 15KB |
| Framework runtime | **0** — no React/other runtime unless D-04 is formally revisited |

Hero loading protocol (doc 06 §3): static placeholder paints with the page; a tiny
inline gate script checks WebGL2 + reduced-motion + device heuristics, then
`import()`s the chunk on idle (`requestIdleCallback`, post-LCP). The hero must
never be the LCP element blocker — the placeholder is the LCP candidate.

## 2. Performance budgets

- **Lighthouse (local, `pnpm preview`, desktop + mobile emulation)**: Performance /
  Accessibility / Best Practices / SEO ≥ 95 on content pages; homepage Performance
  ≥ 90 (mobile) with hero enabled.
- LCP ≤ 2.0s (mobile emulation, local preview); CLS < 0.02 (placeholder reserves
  hero space exactly); INP: no handler > 50ms.
- Page weight, content pages: ≤ 300KB transfer including fonts (first visit);
  articles excluding images ≤ 400KB. Homepage including hero chunk ≤ 600KB.
- Fonts: ≤ 4 critical woff2 files, subsetted, total ≤ 300KB (doc 04 §1);
  `font-display: swap`; preload the two critical files only.
- Images: all content images through `astro:assets` (AVIF/WebP, responsive sizes,
  explicit dimensions). Teasers ≤ 80KB each at rendered size.
- KaTeX CSS + fonts loaded **only** on pages containing math, gated by the `math`
  frontmatter flag (doc 07 §3).

## 3. WebGL / hero runtime budgets

- FPS: ≥ 55 sustained on a mid-range laptop (M-series air / mainstream iGPU);
  ≥ 30 sustained on a mid-range phone, else auto-degrade (halve instances → DPR 1
  → static frame). Degradation thresholds tuned in Phase 5, values recorded here.
- DPR cap: 2 desktop; 1–1.5 mobile (doc 06 §5).
- GPU memory: single scene, no render targets above viewport size; textures ≤ 2048².
- CPU when idle-visible: main-thread work ≤ 4ms/frame; **zero RAF when off-screen**
  (IntersectionObserver) — verify with performance panel.
- Battery/low-power: honor `navigator.getBattery` is unreliable — instead respect
  Save-Data hint and the FPS auto-degrade path; RAF naturally throttles on hidden
  tabs; `THREE.Clock` delta prevents time jumps.
- Cleanup: `dispose()` verified leak-free (Chrome GPU process memory stable across
  10 reloads); `webglcontextlost` → permanent graceful fallback, no restore loop.

## 4. Motion & fallback matrix (canonical; referenced by docs 05/06)

| Condition | Hero | Site motion |
| --- | --- | --- |
| Full capability | Live canvas | S1–S4 active |
| `prefers-reduced-motion: reduce` | Single still frame or placeholder | All durations → 0 via `--motion-duration` token; view transitions disabled |
| No JS | Designed placeholder (HTML/CSS) | CSS hovers only |
| No WebGL2 / init failure / context lost | Placeholder, no CLS, one console warn | Unaffected |
| Save-Data / small viewport / low-end heuristic (thresholds set in Phase 5) | Reduced instances + DPR 1, or placeholder | Unaffected |
| Tab hidden / hero off-screen | RAF stopped | — |

`prefers-reduced-motion` is read at init AND listened for changes (mid-session
toggle stops the loop).

## 5. Accessibility requirements (WCAG 2.2 AA)

### Structure & semantics

- One `<h1>` per page; heading levels never skip; landmarks: `<header> <nav> <main>
  <footer>`; skip-to-content link as first focusable element.
- Nav indicates current page with `aria-current="page"` (plus visual underline).
- Publication entries: real list markup; BibTeX in native `<details>/<summary>`
  (keyboard-accessible for free). Copy-BibTeX button (if added) is a `<button>`
  with status feedback via `aria-live="polite"`.
- Article TOC: `<nav aria-label="Table of contents">`; footnote back-links labeled.

### Canvas

- Hero canvas: `aria-hidden="true"`, `tabindex` unset (never focusable), pointer
  interaction is enhancement-only — no information or control exists solely in the
  canvas. Hero text is HTML above the canvas with guaranteed contrast (overlay
  scrim token if measurements require it).

### Keyboard & focus

- Full keyboard pass on every page; visible focus: 2px accent outline + 2px offset
  (`:focus-visible`); no focus traps; theme toggle operable via keyboard with
  `aria-pressed` state.

### Color & text

- Contrast: body ≥ 7:1 target (AA 4.5:1 hard floor), meta/muted ≥ 4.5:1, accent on
  bg ≥ 4.5:1, both themes measured (tokens adjusted, not exempted).
- Text resizable to 200% without loss; no text in images (teasers get real alt
  text; decorative images `alt=""`).
- Theme toggle never flashes wrong theme (inline head script before paint).

### Media

- Any autoplaying teaser video (future): muted, `playsinline`, pausable, no audio,
  respects reduced-motion (static poster instead).

## 6. Verification tooling & cadence

- Per-phase: `pnpm build` + manual keyboard/reduced-motion/no-JS spot checks.
- Phase 7 full audit: Lighthouse (desktop+mobile), WebAIM contrast checks on all
  token pairs, axe DevTools pass, WebGL leak test (10× reload), FPS capture on
  laptop + real phone, 375/768/1280/1680px layouts, dark+light, high-DPR screen,
  network throttled "Fast 3G" first-load, JS-disabled pass, resize storm test.
- Results recorded in `docs/plan/Init/08_…` amendments or a Phase 7 report file;
  budget violations block phase exit (doc 09).
