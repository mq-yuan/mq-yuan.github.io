# 09 — Implementation Plan

> Phased delivery plan. Each phase ends with: validation against its acceptance
> criteria → doc updates if reality diverged → `git diff` review → commit(s).
> No phase starts before its predecessor's acceptance criteria pass.
>
> **Status (2026-08-25): Phases 0–8 complete.** Phase 4 comparison:
> `reports/phase4-experiments.md`; Phase 7 audit: `reports/phase7-audit.md`.
> Remaining before deployment: author inputs (OQ table, doc 11) and the
> author-assisted hardware measurements listed in the Phase 7 report.
> Phase 9 (deployment) stays **blocked** until explicitly requested.

## Phase 0 — Research & Planning ✅ (this phase)

- **Objective**: establish direction and source-of-truth docs before code.
- **Scope**: environment inspection; live technical research (Astro 7 / Node /
  pnpm / three.js / CSS); design research (researcher sites, creative web);
  the `docs/plan/Init/` suite; cross-document consistency check.
- **Outputs**: docs 00–11; verified environment facts; decision log.
- **Acceptance**: docs complete, non-overlapping, mutually consistent; decisions
  and open questions explicit. ✅ when this suite is committed.

## Phase 1 — Local Project Foundation

- **Objective**: reproducible local Astro 7 project skeleton.
- **Scope**: `.node-version` (24); `package.json` with `packageManager:
pnpm@11.23.0` and scripts (`dev/build/preview/check/lint/format`); Astro 7
  minimal scaffold; TypeScript strict; ESLint flat + Prettier (+astro plugins);
  `astro.config.mjs` with `unified()` markdown processor, MDX, sitemap stubs;
  directory skeleton per doc 06 §2; empty-but-valid content collections;
  `.gitignore`.
- **Explicitly not in scope**: React integration (D-04), Tailwind (D-05), any
  visual design, any WebGL.
- **Outputs**: building skeleton; updated doc 10 command table if it changed.
- **Acceptance**: `fnm use && pnpm install && pnpm dev` serves; `pnpm build` and
  `pnpm preview` succeed; `pnpm check/lint/format` clean; only `pnpm-lock.yaml`
  present.
- **Risks**: Astro 7 processor config friction (mitigate: it's isolated in config).

## Phase 2 — Static Website

- **Objective**: the complete site as pure static design — the removal test target.
- **Scope**: design tokens + global CSS (doc 04); Base/Article layouts; Nav,
  Footer, SEO component, theme toggle; all pages (`/`, `/research`, `/writing`,
  `/writing/[slug]`, `/about`, `404`) with real structure and placeholder-marked
  copy where personal data is pending; hero section as **static composition**
  (placeholder layer that will later sit under the canvas); responsive pass;
  fonts self-hosted.
- **Constraint**: no JS beyond the theme script; visual quality must come from
  typography/spacing/hierarchy alone.
- **Outputs**: complete static site; doc 04 updated with final token values.
- **Acceptance**: with JS disabled, every page is complete and looks deliberate at
  375/768/1280/1680px in both themes; keyboard + focus pass; `pnpm build` clean;
  Lighthouse a11y/SEO ≥ 95.

## Phase 3 — Content System

- **Objective**: full content pipeline proven end-to-end.
- **Scope**: `works`/`writing`/`profile`/`interests` collections per doc 07; ComGS
  entry (verified fields only); math (remark-math + rehype-katex, conditional
  KaTeX CSS), Shiki dual themes, reading time, footnotes, co-located images;
  draft handling; RSS endpoint; sitemap; SEO/meta + JSON-LD; sample posts
  exercising math/code/figures (marked as samples, drafted out afterwards).
- **Acceptance**: adding a work or post = adding files only (verified by doing
  it); math/code/images render correctly light+dark; RSS validates; drafts absent
  from build; budgets of doc 08 §1–2 hold on content pages.

## Phase 4 — Homepage Interaction Exploration

- **Objective**: choose the signature visual direction on evidence, not guesswork.
- **Scope**: `experiments/` pages (build-excluded, doc 06 §7); shared island
  lifecycle shell; quick prototypes: A splat-cloud and C panorama-unwrap (cheap,
  full prototypes), B image↔point-cloud (reduced proof), D fbm (floor, doubles as
  fallback texture study). Record per candidate: visual result (screens/captures),
  runtime cost (FPS laptop+phone, chunk size), complexity, uniqueness, mobile
  viability, identity connection.
- **Explicitly not**: touching the production hero.
- **Outputs**: comparison notes appended to doc 05 (or a Phase 4 report);
  recommendation; **author picks final direction (OQ-3)** — if the author is
  unavailable, best-recommendation proceeds with the runner-up kept buildable.
- **Acceptance**: ≥ 3 candidates runnable locally with recorded measurements;
  production build still contains no experiment routes.

## Phase 5 — Signature Interaction Prototype

- **Objective**: production-quality build of the chosen direction, still isolated.
- **Scope**: chosen scene to polish level — pointer smoothing, idle motion tuning,
  theme-aware palette uniforms; full lifecycle (resize, DPR strategy, off-screen
  pause, dispose, context-lost); gate script (WebGL2/reduced-motion/heuristics);
  degradation ladder + thresholds (doc 08 §3 values filled in); static fallback
  frame generated for the placeholder.
- **Acceptance**: doc 08 §3 budgets measured and met on laptop + real phone;
  fallback matrix (doc 08 §4) manually verified condition by condition.

## Phase 6 — Homepage Integration

- **Objective**: hero into production homepage; secondary interactions finalized.
- **Scope**: mount island on `/` behind the gate; verify placeholder↔canvas
  fade-in with zero CLS; implement S1–S4 (doc 05 §2) as CSS; per-interaction
  identity check ("does removing it lose identity?") — cut anything that fails.
- **Acceptance**: homepage passes doc 08 budgets (JS, LCP, CLS); interaction
  inventory ≤ 1 signature + 4 secondary; removal test still passes.

## Phase 7 — Performance & Accessibility Audit

- **Objective**: systematic verification of everything doc 08 promises.
- **Scope**: full checklist of doc 08 §6 (Lighthouse both form factors, axe,
  contrast measurements, WebGL leak test, FPS captures, breakpoints, themes,
  high-DPR, throttled first load, no-JS, reduced-motion, resize storm, keyboard).
- **Outputs**: audit report (`docs/plan/Init/reports/phase7-audit.md`); fixes;
  doc 08 amended with measured values.
- **Acceptance**: all hard budgets met; every fallback path demonstrated.

## Phase 8 — Local Production Readiness

- **Objective**: "this directory is a deployable website."
- **Scope**: 404 polish; favicon set; OG default image + per-article OG data
  (generation strategy decided here); metadata/canonical audit (site URL
  configured but unused until deploy); content proofread; placeholder-copy sweep
  (nothing fake ships — pending items either filled by author or visibly marked);
  final visual polish pass; `pnpm build && pnpm preview` sign-off.
- **Acceptance**: clean build; no TODO/placeholder leaks except author-pending
  items listed in doc 11; a fresh-clone `fnm use && pnpm install && pnpm build`
  works.

## Phase 9 — Deployment · **BLOCKED**

Executed only on the author's explicit request. Future scope: GitHub repo
`mq-yuan/mq-yuan.github.io`, Pages via Actions, `site` config finalization,
trailing-slash decision, custom domain if any. Until then: **no remote, no push,
no Actions, no gh-pages.**

## Cross-phase rules

- Docs-first: plan changes are edited into docs 00–11 in the same commit as the
  code that motivated them (`docs != reality` is a defect).
- Commit style per doc 10 §5; one phase = several focused commits.
- Personal-information policy (doc 00) applies in every phase.
