# 00 — Project Charter

> Part of `docs/plan/Init/` — the initial planning suite and source of truth for this
> project. Read this file first; it defines what we are building and why.

## What we are building

A personal research website for Mengqi Yuan, a master's student at the School of
Intelligence Science and Technology,
Nanjing University, working on 3D vision / neural rendering (first publication: ComGS,
ICLR 2026).

The site is:

1. **A professional academic website** — a credible, fast, clearly organized research
   card: who I am, what I work on, selected work, publications, writing, and contact /
   academic links.
2. **A creative personal homepage** — the homepage (`/`) carries one carefully designed
   signature interactive visual (WebGL/shader) plus a small number of restrained
   micro-interactions, forming the site's own visual language.

The site is in **English**. Content lives in this Git repository as Markdown/MDX. There
is no backend, no database, no CMS, no authentication.

## Why

- Establish a clear **research identity** early, before a long publication list exists.
  The site must not read as an empty faculty page; identity is carried by Research
  Interests, Selected Work, and Writing together.
- The blog is a first-class part of the site: curated, rewritten public versions of
  ideas that start life as private Obsidian notes. (Obsidian itself is out of scope —
  no sync, no vault integration; publishing is a deliberate manual act.)
- Long-term home for CV, publications, and writing as the research career grows.

## Who it serves

- **Researchers and reviewers** checking who the author is and what they have done.
- **Potential advisors / collaborators / employers** scanning research direction,
  selected work, and CV.
- **Readers of the blog** arriving from search or links, staying for technical writing.
- **The author** — the site must be cheap to maintain: adding a paper or a post is a
  content edit, never a component edit.

## Goals

- G1. A complete, beautiful, static-first researcher website: Home, Research
  (including publications), Writing, About.
- G2. A distinctive signature homepage interaction that loosely evokes the research
  themes (fields, rays, splats, panoramas, geometry) as an abstract visual — never a
  paper-pipeline diagram.
- G3. Content system where new publications/posts are pure data/Markdown additions.
- G4. Excellent typography, spacing, and hierarchy that stand on their own with all
  JavaScript disabled.
- G5. Strong performance and accessibility budgets from day one (see doc 08).
- G6. Fully reproducible local development via fnm + `.node-version` + pnpm.

## Non-goals

- Not a frontend-effects showcase or React Bits demo page.
- Not a publication-list-centric faculty template.
- Not a research visualization dashboard.
- No CMS, backend, database, auth, comments, or account system.
- No Obsidian synchronization or vault integration of any kind.
- No deployment work in the current stage (no GitHub remote, no Pages, no Actions).

## Long-term vision

- Eventually published as `mq-yuan.github.io` (GitHub Pages) — Phase 9, explicitly
  blocked until the author asks.
- The planning docs in `docs/plan/` stay in sync with reality; when implementation
  contradicts the plan, the docs are updated in the same change.
- The site should age well: content grows for years without redesign; the interactive
  layer can be swapped or removed without touching the content system.

## Success criteria

- `fnm use && pnpm install && pnpm dev / pnpm build` work on a fresh checkout.
- With JavaScript disabled, every page is complete, readable, and well designed.
- Adding publication #2 or blog post #N touches only `src/content/` (data/Markdown).
- Homepage signature visual runs smoothly on a mid-range laptop, degrades gracefully on
  mobile, and has static fallbacks for no-WebGL and `prefers-reduced-motion`.
- Lighthouse (local): performance / accessibility / best-practices / SEO all ≥ 95 on
  content pages; homepage JS budget per doc 08.
- The removal test passes: strip all animation, and the site still looks excellent.

## Personal information policy

Only verified facts provided by the author may appear on the site (see doc 07 for the
current inventory: affiliation, advisor link, email, ComGS BibTeX). Bio text, Scholar
profile, and CV are **pending from the author** — use clearly marked placeholders and
never fabricate papers, awards, positions, or biography.

## Document map

| Doc | Responsibility |
| --- | --- |
| 00 Project Charter | What/why/goals/non-goals (this file) |
| 01 Requirements & Scope | Functional + non-functional requirements, out of scope |
| 02 Reference Research | Analyzed references → Adopt / Adapt / Avoid |
| 03 Information Architecture | Pages, sections, navigation, URL structure |
| 04 Visual Design Direction | Executable visual system: type, space, color, layout |
| 05 Interaction Design | Signature + secondary interactions, fallbacks, avoided effects |
| 06 Technical Architecture | Framework boundaries, structure, hydration, shaders |
| 07 Content Model | Publication / blog / research schemas and authoring rules |
| 08 Performance & Accessibility | Budgets, fallbacks, a11y requirements |
| 09 Implementation Plan | Phases 0–9 with acceptance criteria |
| 10 Development Workflow | fnm/Node/pnpm, commands, git conventions |
| 11 Decisions, Risks, Open Questions | Decision log with evidence; open questions for the author |
