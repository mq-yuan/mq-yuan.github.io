# Phase 7 Report — Performance & Accessibility Audit

Date: 2026-08-25. Environment: local `pnpm preview`, Playwright Chromium
(headless shell, **SwiftShader software WebGL** — see caveat), Lighthouse 13.4,
axe-core via @axe-core/playwright.

## Results vs doc 08 budgets

| Check                                    | Budget           | Measured                                | Status |
| ---------------------------------------- | ---------------- | --------------------------------------- | ------ |
| axe violations, 5 pages × 2 themes       | 0                | **0**                                   | ✓      |
| Content-page external JS                 | ≤ 5KB            | **0KB** (inline theme script only)      | ✓      |
| Homepage gate script                     | ≤ 5KB            | **1.1KB gz**                            | ✓      |
| Hero chunk (three.js + scene)            | ≤ 220KB          | **130KB gz**, idle-loaded               | ✓      |
| Content page transfer (research)         | ≤ 300KB          | **134KB** (fonts 113KB, CSS 17KB, JS 0) | ✓      |
| Homepage transfer                        | ≤ 600KB          | **267KB**                               | ✓      |
| Webfonts                                 | ≤ 300KB          | **113KB** (6 latin woff2)               | ✓      |
| LCP (mobile emulation)                   | ≤ 2.0s           | home **1.7s**, research **1.8s**        | ✓      |
| CLS                                      | < 0.02           | **0** (both)                            | ✓      |
| Lighthouse a11y / BP / SEO               | ≥ 95             | **100 / 100 / 100** (both pages)        | ✓      |
| Lighthouse perf, content page            | ≥ 95             | research **98**                         | ✓      |
| Lighthouse perf, homepage                | ≥ 90             | **73** — see caveat below               | ⚠      |
| No-JS completeness (5 pages)             | complete         | complete; hero placeholder present      | ✓      |
| Reduced motion → canvas skipped          | required         | verified (no canvas mounted)            | ✓      |
| Mobile width → reduced tier mounts       | required         | verified                                | ✓      |
| Resize storm (12 rapid resizes)          | 0 console errors | **0**                                   | ✓      |
| First Tab hits skip link                 | required         | verified                                | ✓      |
| Draft/sample content excluded from build | required         | verified                                | ✓      |
| Experiment routes in production build    | none             | none (stray unreferenced chunk only)    | ✓      |

## Homepage perf caveat (the one ⚠)

TBT measured 1,470ms, dragging perf to 73. Root cause: the audit browser has
no GPU — SwiftShader rasterizes the WebGL scene on the CPU inside Lighthouse's
4× CPU throttle. The splat scene does no per-frame CPU work (all animation in
shaders), so on any hardware GPU the main thread is idle during rendering.
**Action: re-run Lighthouse in the author's desktop Chrome (hardware GL) to
confirm; degradation ladder (doc 08 §3) covers genuinely GPU-less visitors by
dropping DPR then giving up to the static placeholder.** Every other homepage
metric (LCP 1.7s, CLS 0, 100/100/100) passes.

## Author-assisted measurements still pending

- Hardware FPS on the author's laptop + phone (`/experiments/splat` shows a
  live counter; doc 08 §3 thresholds are implemented but tuned on defaults).
- Real-device Safari/iOS behavior (mask-image, view transitions fall back to
  instant navigation as designed).
- Homepage Lighthouse on hardware GL (expected ≥ 90).

## Notes

- Font subsets: fontsource ships unicode-range subsets; browsers fetched only
  6 latin files (113KB). No further subsetting needed at current budget.
- KaTeX CSS/fonts load only on `math: true` pages (verified in Phase 3).
- The unreferenced experiment script chunk (~3KB) in `dist/_astro/` is never
  loaded by any page; cosmetic only. Revisit if it bothers the Phase 8 sweep.
