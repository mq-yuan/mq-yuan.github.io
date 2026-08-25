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

| ID   | Question                                                                                                                         | Blocking                     | Interim behavior                          |
| ---- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------- |
| OQ-1 | **Bio + one-line research tagline** (hero + about); also portrait photo yes/no                                                   | Phase 2 polish, Phase 8 exit | Clearly-marked placeholder copy           |
| OQ-2 | **Named research direction(s)** and their 2–3 sentence summaries (Gkioxari-style; doc 07 §5)                                     | Phase 2/3 polish             | Placeholder marked "pending"              |
| OQ-3 | **Signature visual final pick** among Phase 4 prototypes (A splat cloud is the working favorite; aesthetic call is the author's) | Phase 5 start                | Prototypes kept side by side until chosen |
| OQ-4 | **Accent color** preference (working value: ink blue `#2F5DA8`)                                                                  | none (tune anytime)          | Working value used                        |
| OQ-5 | Nav label "Writing" vs "Blog" (D-07 chose Writing; rename trivial)                                                               | none                         | "Writing"                                 |
| OQ-6 | ComGS assets: teaser image, paper/project/code URLs, co-author URLs, equal-contribution marks                                    | Phase 3 completeness         | Entry ships with available fields only    |
| OQ-7 | GitHub profile URL (assumed `github.com/mq-yuan` from git user — must confirm before display)                                    | Phase 2 footer               | Link hidden until confirmed               |
| OQ-8 | Scholar profile and CV — add when they exist                                                                                     | none                         | Links hidden                              |
| OQ-9 | Advisor display: name+link on About ("Advised by Yao Yao") — confirm preferred phrasing                                          | Phase 2 About polish         | Neutral phrasing, easily edited           |
