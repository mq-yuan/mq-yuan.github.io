# 02 — Reference Research

> Analyzed references (researcher websites, creative-web sources, technical docs)
> condensed into actionable conclusions: Adopt / Adapt / Avoid. Research performed
> 2026-08-25 via live fetches of the cited sources. IA consequences live in doc 03,
> visual consequences in doc 04, interaction consequences in doc 05, technical
> consequences in doc 06.

## 1. Researcher websites

### Surveyed (all fetched successfully)

| Site | Who | Key takeaway |
| --- | --- | --- |
| keunhong.com | Keunhong Park (Nerfies) | 3-page IA (Home+Highlights / CV / Blog) done extremely lightly — **best structural template** for a blog-carrying researcher site |
| jonbarron.info | Jon Barron | The de-facto publication-entry anatomy standard; but the single-page paper wall **requires many papers** — empty with one |
| bmild.github.io | Ben Mildenhall | Barron lineage; "Course Projects" and "Music" sections show non-paper content as legitimate identity filler |
| matthewtancik.com | Matthew Tancik | Art/Projects section peer to Publications → "builder" identity |
| people.eecs.berkeley.edu/~kanazawa | Angjoo Kanazawa | Dedicated open-source/tools section (nerfstudio ecosystem): tools = research identity |
| georgiagkioxari.com | Georgia Gkioxari | **Named research-mission statement** + theme-grouped papers — the best way to turn a short list into a research program |
| cs.cmu.edu/~kmcrane | Keenan Crane | Custom, uniform-style vector teasers per paper = curated feel even at low counts; teaching/notes carry depth |
| yannickhold.com | Y. Hold-Geoffroy | Anti-pattern for us: tidy bio+list with no narrative/writing → low identity |
| dellaert.github.io | Frank Dellaert | Anti-pattern: generic academic theme + near-empty blog archive reads as abandoned |
| lilianweng.github.io | Lilian Weng | "Learning notes" framing: blog-as-website; long-form survey posts as proof of research ability |
| gwern.net | Gwern | Serif editorial density, article status/confidence metadata, topic-first organization; full interaction suite too heavy to copy wholesale |
| karpathy.ai | Andrej Karpathy | One-line concrete research tagline; conversational pet-projects |
| distill.pub | — | The type spec for technical long-form: ~65–70ch serif column, captioned numbered figures, sidenotes |
| paco.me / rauno.me / leerob.com / joshwcomeau.com / brianlovin.com | design-engineer sites | "Writing" naming; restraint as signature; Notes-vs-Blog dual track (leerob) noted as future option |

### Synthesis → decisions

- **Adopt**: small multi-page IA (keunhong); named research direction narrative
  (Gkioxari); Barron publication-entry anatomy (teaser / bold self / venue badges /
  paper-project-code-bibtex row); learning-notes framing for Writing (Lilian Weng);
  serif editorial article typography (Distill/Gwern); one-line concrete tagline
  (Karpathy); uniform custom teaser treatment (Crane, long-term aspiration).
- **Adapt**: projects/tools as first-class entries (Tancik/Kanazawa) — merged into a
  single `works` collection rather than separate pages for now; Gwern-style article
  metadata reduced to date/updated/reading-time (status labels optional later).
- **Avoid**: Barron-template cloning; generic academic themes (AcademicPages/al-folio
  look); "Publications" heading over one entry; nav items pointing at empty sections;
  CV copied as a webpage; giant-avatar hero with empty slogan; full-page reverse-
  chronological stream as homepage.

## 2. Creative web references

### React Bits (reactbits.dev) — license: MIT + Commons Clause

Used as an idea catalog only; nothing imported, everything reimplemented.

- **Worth referencing**: split/blur text reveal (slow, small displacement, once);
  scramble→settle on a single element (resonates with "reconstruction from noise" —
  use at most once, fast); variable-proximity font-weight (quiet, technical);
  low-contrast dot/particle field backgrounds (point-cloud identity).
- **Explicitly rejected** (AI-portfolio clichés): splash/fluid/ghost cursors, glitch
  text, gradient/aurora/plasma/hyperspeed backgrounds, liquid chrome, meta balls,
  star borders, magnetic buttons.

### Codrops (tympanus.net/codrops) — demos are MIT

Most relevant techniques (idea-level reuse, own implementation):

- GPGPU particle systems with pointer force fields (Dreamy Particles, 2024-12) — the
  standard architecture for a particle hero.
- Image→particle "living particle system" (UntilLabs, 2025-12) — maps directly onto
  "reconstructing 3D structure from images"; the strongest narrative match found.
- Shader-driven image hover (ripple/reveal/blur via animated uniforms, 2025-10) and
  VFX-JS (2025-01) — proves "DOM typography + local WebGL on images" works without a
  full-page canvas.
- Wave-propagation instanced grid (2026-07) — pointer-triggered field response that
  decays on its own: a good model of restrained interactivity.
- Native View Transitions (Velvette 2024-01; vanilla transitions 2026-02) — 300ms
  crossfade + slight offset is the right scale for page transitions.

### Motion showcases

`motionsites.ai` turned out to be an AI-prompt library — dropped as a reference.
Effective references: minimal.gallery, Awwwards winners, and individual sites:

- rauno.me ("Invisible Details of Interaction Design" — our micro-interaction
  rulebook), emilkowal.ski (4–8px movement, 200–300ms, ease-out, only animate state
  changes), **maximeheckel.com** (closest identity match: WebGL/shader researcher-
  blogger whose homepage stays quietly editorial; experiments live in a playground).
- Shared grammar observed: entrance reveals play once; at most one continuous
  low-amplitude animation (the hero); hover feedback < 200ms ease-out; page
  transitions 300–500ms; body text, nav, and lists **never** move. "What stays
  still" is the design.

### ShaderToy — default license CC BY-NC-SA 3.0 (share-alike is viral)

**Rule: never copy ShaderToy code. Study the algorithm, reimplement from scratch.**
Ideas surveyed (with cost / mobile viability):

| Idea | Cost | Mobile | Note |
| --- | --- | --- | --- |
| Curl-noise particle advection | medium | good (reduce count) | pairs with image→point-cloud |
| fbm domain warping (iq's warp article) | low | good | safe fallback visual |
| Instanced Gaussian billboards (elliptical exp falloff, additive) | medium | good | **directly evokes Gaussian Splatting; near-unique on personal sites** |
| Equirectangular reprojection (panorama unwrap) | low | very good | panorama research identity |
| Raymarched SDF fullscreen | high | **poor** | rejected for hero |

Algorithm write-ups on iquilezles.org are free to reimplement (per-page license for
code snippets, mostly MIT — check when used).

## 3. Technical references (details in docs 06/10)

Verified against official docs on 2026-08-25:

- **Astro 7.2.6 current** (7.0 released 2026-06-22). Node ≥ 22.12; Node 24 LTS
  supported → pin Node 24. New Rust markdown processor "Sätteri" is the default and
  **cannot run remark/rehype plugins** — math and reading-time require explicitly
  configuring the `unified()` processor from `@astrojs/markdown-remark`.
- Content Layer API: `src/content.config.ts`, `glob()`/`file()` loaders, `z` from
  `astro/zod` (Zod 4), `render(entry)`, `image()` schema helper.
- Shiki built-in highlighting with dual light/dark themes; `@astrojs/mdx` v7;
  `@astrojs/rss`; `@astrojs/sitemap`; `astro:assets` for images; Astro 6+ Fonts API.
- Tailwind v4 = `@tailwindcss/vite` plugin, CSS-first `@theme` (old `@astrojs/tailwind`
  deprecated). Evaluated and **not adopted** — see decision D-05 in doc 11.
- React integration `@astrojs/react` v6 / React 19.2 works, but a single-canvas hero
  does not need React: three.js ≈ 182KB gz alone vs ≈ 290KB with React+R3F, vs
  3–8KB for a raw-WebGL fullscreen quad. R3F v9 requires React ≥19 <19.3; v10 is
  alpha. → React deferred, see D-04.
- three.js r185 current; GLSL via Vite `?raw` imports (zero-dep) or `vite-plugin-glsl`
  1.6.x when `#include`/lygia is wanted; GSAP is fully free since 2025 (Webflow) but
  overkill here; Motion (motion.dev) mini `animate()` ≈ 2.3KB works without React.
- Native cross-document view transitions (pure CSS) now work in supporting browsers;
  Astro's `<ClientRouter />` is positioned as transitional and creates WebGL disposal
  pitfalls (context leaks on swap; Safari `transition:persist` canvas bug
  withastro/astro#15727) → prefer full-page navigation + CSS view transitions.

## 4. Consolidated Adopt / Adapt / Avoid

### Adopt

- keunhong-style compact multi-page IA; Gkioxari research narrative; Barron entry
  anatomy; Distill article typography; "Writing" naming; learning-notes stance.
- Astro 7 static-first; unified() markdown pipeline; Shiki dual themes; vanilla CSS
  design tokens; native CSS view transitions; `?raw` GLSL imports.
- Hero built as an isolated vanilla-TS + three.js island; static placeholder layer
  under the canvas (solves no-JS, no-WebGL, reduced-motion, and CLS at once).
- Micro-interaction grammar: once-only reveals, <200ms ease-out hovers, static body.

### Adapt

- Codrops GPGPU/image-particle architectures → reimplemented, simplified, our
  palette; image hover shader → optional later experiment, CSS-first initially.
- Gwern article metadata → reduced form; Kanazawa tools section → entries in `works`.
- React Bits text-reveal ideas → hand-rolled CSS/WAAPI versions.

### Avoid

- Cursor followers of any kind, glitch/aurora/plasma/gradient-text, magnetic buttons,
  3D-tilt cards, gooey nav, scroll hijacking / heavy smooth-scroll, looping text
  animations, raymarched fullscreen hero, ShaderToy code reuse, Barron-clone or
  generic-academic-theme look, empty-section nav items, React-for-animation.
