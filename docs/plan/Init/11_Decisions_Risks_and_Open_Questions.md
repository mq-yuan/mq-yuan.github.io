# 11 — Decisions, Risks, and Open Questions

> The decision log (with evidence and tradeoffs), known risks, and questions that
> only the author can answer. New significant decisions are appended here in the
> same commit that implements them.

## 1. Decisions

### D-01 · Astro 7, static output (over Next.js, SvelteKit, plain Vite, Eleventy)

- **Evidence**: doc 02 §3 — Astro 7.2.6 stable (7.0 out 2026-06-22, two minors
  since); content collections, islands, zero-JS-by-default match requirements
  exactly; no server runtime needed (NFR-4).
- **Reason**: the site is 95% static content; Astro makes static the default and
  client JS the exception, which is the stated philosophy ("Astro owns the
  website").
- **Tradeoff**: smaller ecosystem than Next.js; Astro 7's new compiler is stricter
  (build fails on invalid HTML — acceptable, even desirable). Sätteri markdown
  default requires explicit opt-out (D-03).

### D-02 · Node 24 via fnm `.node-version`; pnpm 11 via `packageManager`

- **Evidence**: Astro requires Node ≥ 22.12, odd majors unsupported; Node 24 is
  Active LTS until ~April 2028 and already installed; corepack is removed from
  Node 25+ and no longer the recommended pinning path; pnpm ≥ 10 self-manages
  versions via the `packageManager` field; pnpm 12 is still RC.
- **Reason**: longest-runway supported LTS; corepack-free pinning that works with
  any installed pnpm.
- **Tradeoff**: none material. Revisit Node 26 after it reaches LTS (2026-10) and
  Astro declares support.

### D-03 · Markdown processor = explicit `unified()` (not Sätteri default)

- **Evidence**: Astro 7's default Rust processor cannot run remark/rehype plugins;
  math (remark-math + rehype-katex) and reading time need them (doc 02 §3).
- **Reason**: academic site — math is non-negotiable; unified remains officially
  supported via `@astrojs/markdown-remark`.
- **Tradeoff**: slower builds than Sätteri and a config knob to maintain; site
  size makes build time irrelevant. Revisit if Sätteri gains math rendering.

### D-04 · No React in the baseline; hero = vanilla TS + three.js island

- **Evidence**: doc 02 §3 bundle math — three.js ≈ 182KB gz alone; React 19 +
  react-dom + R3F ≈ +100–110KB on top, to manage exactly one canvas; R3F v9 pins
  React >=19 <19.3 (v10 alpha); fullscreen-quad candidates need only 3–8KB raw
  WebGL. No other component on the site needs a client runtime.
- **Reason**: "React only serves parts that truly need a client runtime" — with a
  single canvas island, nothing does. Less runtime, fewer version couplings,
  simpler lifecycle control.
- **Tradeoff**: we give up drei/postprocessing conveniences and declarative scene
  graphs; hero lifecycle is hand-written (~100–150 lines, doc 06 §5). **Re-entry
  condition**: if Phase 4's chosen direction genuinely needs a multi-object scene
  with drei-level tooling, add `@astrojs/react` + R3F then, updating this entry.

### D-05 · Vanilla CSS design tokens + Astro scoped styles (no Tailwind)

- **Evidence**: doc 02 §3 — Tailwind v4 is healthy (`@tailwindcss/vite`,
  CSS-first `@theme`), so this is not a viability rejection. Site profile:
  prose-centric, ~10–15 components, one author, heavy custom editorial
  typography.
- **Reason**: tokens-as-custom-properties + scoped `<style>` give the same design
  discipline without a dependency or utility markup; long-form prose styling is
  more natural in plain CSS than through `@tailwindcss/typography` overrides.
- **Tradeoff**: no utility shorthand; discipline must come from the token sheet
  (doc 04). Revisit only if component count grows sharply.

### D-06 · No `<ClientRouter />`; native CSS cross-document view transitions

- **Evidence**: Astro positions ClientRouter as transitional; native
  cross-document transitions ship in supporting browsers with pure CSS; soft
  navigation is the main source of WebGL lifecycle bugs (context leaks on swap;
  Safari `transition:persist` canvas loss, astro#15727).
- **Reason**: full-page navigation destroys the GL context for free; transitions
  become a ≤10-line progressive enhancement with zero JS.
- **Tradeoff**: no persisted state across navigations (nothing needs it) ; no
  transitions in non-supporting browsers (acceptable: instant nav).

### D-07 · IA: `/research` merges publications; blog is `/writing`; no Projects page

- **Evidence**: doc 02 §1 — single-entry "Publications" pages read as empty
  templates; keunhong/Gkioxari patterns; "Writing" naming from design-engineer
  editorial sites; Lilian Weng's learning-notes stance.
- **Reason & tradeoff**: see doc 03 §2 (planned split at ≈5+ papers; rename is
  trivial if the author prefers "Blog" — flagged in OQ-5).

### D-08 · GLSL via `?raw` imports (upgrade path: vite-plugin-glsl)

- **Evidence**: doc 02 §3 — zero-dependency, Vite-native; `vite-plugin-glsl`
  1.6.x is the maintained option when `#include`/lygia is wanted.
- **Tradeoff**: no shader includes/minification until upgraded; fine at 1–2
  shader files.

### D-09 · RSS ships description-only items (not full content) at first

- **Reason**: full-content feeds require markdown→HTML rendering + sanitization in
  the endpoint; start simple, upgrade if readers ask.
- **Tradeoff**: RSS readers see summaries; acceptable v1.

### D-10 · Fonts: Libertinus Serif (body) + mono for meta, self-hosted woff2

- **Evidence**: doc 02/04 — serif differentiates against sans-default academic
  web; matches the author's figure typography (continuity with papers); OFL 1.1.
- **Tradeoff**: ~300KB font budget vs system fonts; mitigated by subsetting.
  Final mono family chosen in Phase 2 (minor call, not an OQ).

### D-11 · Homepage order: About-at-a-glance → News → Selected Work → Interests

- **Evidence**: author review 2026-09-11 — the first screen showed name, school
  and a tagline but not the degree level; the research directions led the page
  yet describe questions, not results; the Writing block advertised an empty
  section.
- **Reason**: a grad-student homepage earns trust with facts first (level,
  institution, advisor, positions with logos), then results (news,
  publications), then narrative (interests). Doc 03 §3 records the new order.
- **Tradeoff**: Education/Experience rows appear on both Home (compact) and
  About (full, with advisors) — deliberate duplication; About stays the
  canonical CV-like page. Writing hides behind `siteConfig.showWriting` rather
  than being deleted, so relaunch is a one-line flip.

### Note · Hero after Back navigation (fixed 2026-09-11)

The shell disposes the WebGL canvas on `pagehide` (NFR-6). When the browser
restored the homepage from the back-forward cache, the canvas was gone and the
`is-live` class still hid the placeholder, so the hero was blank until reload.
Fix: the hero drops `is-live` on `pagehide` and the gate script remounts on
`pageshow` with `persisted === true`.

## 2. Risks

| #   | Risk                                                                         | Likelihood | Mitigation                                                                                                               |
| --- | ---------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| R-1 | Hero candidate A/B reads as generic "particle wallpaper" after tuning effort | medium     | Phase 4 kills cheaply; C/D floors exist; static design already complete (Phase 2), so the site never depends on the hero |
| R-2 | Astro 7 processor/API churn (young major)                                    | low-med    | Pinned versions; config isolated; upgrade deliberately                                                                   |
| R-3 | Scope creep of micro-interactions                                            | medium     | Hard budget (1+4) in doc 05; identity test per addition                                                                  |
| R-4 | Author-pending content (bio, tagline, teaser, URLs) stalls Phases 2–3 polish | high       | Schemas make fields optional; placeholder policy (doc 07 §6); pending list tracked in OQ table                           |
| R-5 | three.js chunk pushes homepage over budget on slow networks                  | low        | Lazy post-LCP import; raw-WebGL candidates as fallback direction; budget gate in Phase 6                                 |
| R-6 | Writing section launches thin (doc 02 anti-pattern: empty blog)              | medium     | Launch rule in doc 03 §3: ≥2–3 real posts or the nav item waits                                                          |
| R-7 | Docs drift from implementation                                               | medium     | Cross-phase rule (doc 09): doc edits ride the motivating commit                                                          |

## 3. Open Questions (author input required)

| ID    | Question                                                                                                                                                                                                                                                                                                                                                                                                                                              | Blocking             | Interim behavior                |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------- |
| OQ-1  | ~~Bio + tagline~~ **Resolved 2026-09-11** from the author's account: tagline "I work on 3D reconstruction and neural rendering"; bio covers ComGS (first master's year) and a research internship at Insta360 on feed-forward reconstruction (Oct 2025 – Oct 2026, ongoing). `bioShort` now rendered on Home                                                                                                                                          | —                    | Author voice in `profile.yaml`  |
| OQ-2  | ~~Named research direction(s)~~ **Resolved 2026-09-11**: two directions in `interests.yaml` — "Composable, relightable 3D scenes" (ComGS) and "Feed-forward 3D reconstruction". Rewritten 2026-09-11 to state questions only, after the author noted the first read as a ComGS restatement and the second as an internship description; papers stay in Selected Work, positions in About › Experience                                                 | —                    | Two directions live             |
| OQ-3  | ~~Signature visual pick~~ **Resolved 2026-08-25 by the author**: splat cloud confirmed as signature (now with flowing stream motion); pointcloud kept (converges to "3DV" text); panorama and fbm deleted (git history keeps them)                                                                                                                                                                                                                    | —                    | Production hero = splat         |
| OQ-4  | ~~Accent color~~ **Resolved 2026-08-25**: light stays ink blue `#2F5DA8`; dark accent brightened to `#A8C8F8` (author + labmate feedback: previous `#7FA3E0` read too dark on the near-black background; orange variants tested and declined — see `reports/assets/variant-*.jpg`)                                                                                                                                                                    | —                    | Applied in tokens.css           |
| OQ-5  | Nav label "Writing" vs "Blog" — deferred; **section hidden 2026-09-11** behind `siteConfig.showWriting` until enough real posts exist (author's call when)                                                                                                                                                                                                                                                                                            | none                 | "Writing"                       |
| OQ-6  | ~~ComGS assets~~ **Resolved 2026-08-25** from the project page: teaser (composition-result frame), arXiv/project/code links, all co-author URLs, equal-contribution marks (Gao*, Yuan*). Possible upgrade: hover-play teaser video                                                                                                                                                                                                                    | —                    | Entry complete                  |
| OQ-7  | ~~GitHub profile URL~~ **Resolved 2026-08-25**: `https://github.com/mq-yuan`, verified as the author link on the ComGS project page                                                                                                                                                                                                                                                                                                                   | —                    | Shown in hero/footer/about      |
| OQ-8  | ~~Scholar~~ **added 2026-09-11** (`citations?user=YNHVVoUAAAAJ`); ~~CV~~ **built 2026-09-11** as Typst in `cv/` (doc 07 §10) but kept off the site by the author: it describes unreleased work, so `profile.cv` stays empty                                                                                                                                                                                                                           | none                 | Links hidden                    |
| OQ-9  | Advisor display: name+link on About ("Advised by Yao Yao") — confirm preferred phrasing                                                                                                                                                                                                                                                                                                                                                               | Phase 2 About polish | Neutral phrasing, easily edited |
| OQ-10 | ~~CV facts~~ **Resolved 2026-09-11.** Undergrad from the TJU CV (B.Eng. CS, School of Future Technology, 2020–2024; the research topic is deliberately not shown — author, 2026-09-11); lab confirmed by the author and the advisor's homepage as Physical Intelligence Lab (NJU-PIL, previously NJU-3DV), shown as a `group` badge on the NJU education row (logo from a labmate's site, link = the lab's project site); NJU removed from Experience | —                    | Applied                         |
| OQ-11 | ~~News months~~ **Confirmed by the author 2026-09-11**: ICLR 2026 acceptance Jan 2026, M.Sc. start Sep 2024                                                                                                                                                                                                                                                                                                                                           | —                    | Applied                         |
| OQ-12 | ~~Hero text~~ **Resolved 2026-09-11**: the author keeps "3DV" as the point-cloud target text despite the lab's rename to NJU-PIL                                                                                                                                                                                                                                                                                                                      | —                    | "3DV" stays                     |
