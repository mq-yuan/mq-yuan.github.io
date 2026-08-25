# 06 — Technical Architecture

> Framework choices, boundaries, project structure, and implementation principles.
> Version facts verified 2026-08-25 (doc 02 §3); decisions logged in doc 11.

## 1. Stack

```text
Astro 7 (static output)               — owns the website
├── TypeScript (strict)
├── Content Layer (content collections)   — publications/projects, writing, site data
├── Markdown/MDX via unified() processor  — remark-math + rehype-katex, reading time,
│                                            Shiki dual-theme highlighting
├── Vanilla CSS design system              — tokens as custom properties,
│                                            Astro scoped styles per component
├── @astrojs/mdx, @astrojs/rss, @astrojs/sitemap
│
└── Interactive islands (homepage only)
     └── Hero: vanilla TypeScript + three.js (r18x) + GLSL (?raw imports)
          — NO React in the baseline architecture (see §3)
```

### Key decisions (full rationale in doc 11)

- **D-01 Astro 7** over Next.js/others: static-first, islands, content collections;
  Astro 7 stable since 2026-06 with two minors.
- **D-02 Node 24 / pnpm 11** pinned via `.node-version` + `packageManager` (doc 10).
- **D-03 Markdown processor = `unified()`** from `@astrojs/markdown-remark`,
  configured explicitly — Astro 7's default Sätteri (Rust) processor cannot run
  remark/rehype plugins, which math + reading-time require.
- **D-04 No React (for now).** The site has exactly one client-interactive surface
  (the hero canvas). React+R3F would add ≈100–110KB gz (react, react-dom, fiber) on
  top of three.js ≈182KB purely to manage one canvas. Plain three.js in a vanilla TS
  island does the same job; fullscreen-quad candidates (doc 05 C/D) can even go raw
  WebGL at 3–8KB. `@astrojs/react` is added later **only if** the chosen hero
  direction genuinely needs R3F/drei ecosystem (re-evaluated at Phase 4 exit).
- **D-05 Vanilla CSS, no Tailwind.** Prose-centric site, few components, custom
  editorial typography: design tokens as CSS custom properties in a global
  stylesheet + Astro scoped `<style>` per component. Tailwind v4 (via
  `@tailwindcss/vite`) was evaluated and is a fine tool, but adds a dependency and
  utility-markup style for little gain at this component count.
- **D-06 No `<ClientRouter />`.** Full-page navigation + native CSS cross-document
  view transitions (progressive enhancement). This sidesteps the entire class of
  WebGL lifecycle bugs on soft navigation (context leaks, Safari
  `transition:persist` canvas loss — astro#15727) because every navigation
  naturally destroys the GL context.

## 2. Project structure (target)

```text
/
├── .node-version                 # 24
├── package.json                  # packageManager: pnpm@11.x, scripts
├── astro.config.mjs              # site, markdown.processor=unified(), integrations
├── tsconfig.json                 # extends astro/tsconfigs/strict
├── eslint.config.js / .prettierrc
├── docs/
│   └── plan/Init/                # this planning suite (source of truth)
├── public/                       # favicon, static passthrough
└── src/
    ├── content.config.ts         # collections: works, writing, site data
    ├── content/
    │   ├── works/                # one .md per entry (glob loader, doc 07 §2)
    │   ├── writing/              # one folder per post: index.mdx + images
    │   └── data/                 # profile.yaml, interests.yaml (file() loader)
    ├── layouts/
    │   ├── Base.astro            # html shell, head/SEO, fonts, theme script
    │   └── Article.astro         # prose layout for writing
    ├── pages/
    │   ├── experiments/          # Phase 4 hero prototypes only; excluded from
    │   │                         #   production builds via env guard (§7)
    │   ├── index.astro
    │   ├── research.astro
    │   ├── writing/index.astro
    │   ├── writing/[slug].astro
    │   ├── about.astro
    │   ├── 404.astro
    │   └── rss.xml.ts
    ├── components/               # .astro only (static)
    │   ├── Nav.astro  Footer.astro  SEO.astro  ThemeToggle.astro
    │   ├── WorkEntry.astro  WritingItem.astro  Prose.astro …
    ├── islands/
    │   └── hero/                 # the ONLY client-side app code
    │       ├── HeroCanvas.ts     # lifecycle: init/resize/RAF/dispose
    │       ├── scene/*.ts        # candidate-specific scene code
    │       └── shaders/*.{vert,frag}   # imported with ?raw
    ├── styles/
    │   ├── tokens.css            # custom properties (doc 04 values), themes
    │   ├── global.css            # reset, base typography, prose styles
    │   └── katex-overrides.css
    └── lib/                      # pure TS helpers (dates, bibtex format, seo)
```

## 3. The Astro / client-JS boundary

**Rule: nothing is client JavaScript unless it cannot exist otherwise.**

Client JS inventory (complete, additions require a doc-11 decision):

1. **Hero island** — `src/islands/hero/`, loaded from `index.astro` via a small
   inline `<script>` that dynamic-`import()`s the module after checking
   (a) WebGL2 availability, (b) small-viewport/Save-Data heuristics per doc 08 §4.
   `prefers-reduced-motion` does not necessarily block the import: whether the
   reduced-motion path is "skip entirely" or "import and render one still frame"
   is decided in Phase 5 by visual quality (doc 05 §1, doc 08 §4).
   This replaces framework hydration directives entirely —
   no framework runtime is shipped. The static placeholder renders in plain HTML/CSS
   regardless.
2. **Theme toggle** — inline head script (read `localStorage`, set `data-theme`
   before paint) + a few lines on the toggle button.
3. _(that's all)_

Things that must NEVER become client-side components: navigation, lists,
publication entries, BibTeX toggles (`<details>`), TOC, footnotes, tags, date
formatting, syntax highlighting, math (KaTeX renders at build time via rehype).

## 4. Content/data separation

- All content in `src/content/` validated by zod schemas (`astro/zod`) — doc 07.
- Pages query collections (`getCollection`) and render; homepage sections are pure
  functions of content (`selected`, recency). Adding content never touches
  `src/components` or `src/pages`.
- Site-wide facts (name, affiliation, links, tagline) live in
  `src/content/data/profile.yaml` — single source for header/footer/SEO/about.

## 5. Hero island architecture (vanilla TS + three.js)

- `HeroCanvas.ts` owns lifecycle: `init(container) → { dispose }`;
  `ResizeObserver` on container; DPR = `min(devicePixelRatio, 2)` desktop, `1–1.5`
  mobile; RAF loop paused when `IntersectionObserver` reports off-screen;
  `THREE.Clock`-delta time uniform (visibility-safe); full `dispose()` of
  renderer/geometry/material/textures on `pagehide` (defensive — full-page nav
  normally handles it).
- Scene code per candidate lives in `scene/`, one module each, sharing the
  lifecycle shell — Phase 4 experiments swap scenes, not plumbing.
- Shaders in separate `.vert`/`.frag` files, imported with Vite `?raw` (typed via
  `src/env.d.ts` declarations). If `#include`/lygia becomes necessary, switch to
  `vite-plugin-glsl` (one-line Vite plugin) — recorded as an allowed upgrade.
- Failure strategy: any throw during init → log once, remove canvas, placeholder
  stays. Listen for `webglcontextlost` → dispose and fall back (no restore
  attempts).

## 6. CSS architecture

- `tokens.css`: every design token from doc 04 as `:root` custom properties;
  dark theme via `[data-theme="dark"]` block + `prefers-color-scheme` default.
- `global.css`: modern reset, base element typography, `.prose` class for article
  bodies, focus-visible styles, view-transition CSS.
- Components use Astro scoped `<style>` referencing tokens only — no hard-coded
  values. No CSS-in-JS, no preprocessor.

## 7. Experiments environment (Phase 4)

- Prototype pages under `src/pages/experiments/<name>.astro`, each mounting one
  scene module with an FPS/params overlay. Guarded so production builds exclude
  them (e.g. `if (import.meta.env.PROD) return Astro.redirect('/404')` or filtered
  via config) — exact mechanism finalized in Phase 4; requirement: `pnpm build`
  output contains no experiment routes.
- Experiments may bend quality gates (inline styles etc.) but never ship.

## 8. TypeScript, linting, formatting

- `astro/tsconfigs/strict`; no `any` in `src/lib`/`islands` (hero math code fully
  typed).
- ESLint flat config + `eslint-plugin-astro`; Prettier + `prettier-plugin-astro`.
- Quality gates per doc 10 §4.

## 9. Error/fallback behavior

The canonical fallback matrix lives in **doc 08 §4** — this file does not duplicate
it. Implementation notes specific to this architecture: any hero init throw removes
the canvas and leaves the placeholder (no CLS, single console warn); browsers
without cross-document view transitions get instant navigation (no polyfill).
