# 01 — Requirements and Scope

> Defines what the site must do (functional), how well it must do it (non-functional),
> and what is explicitly out of scope. Architecture lives in docs 03/06; budgets are
> quantified in doc 08.

## 1. Functional requirements

### FR-1 Pages

| ID     | Requirement                                                                                                                                                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-1.1 | Homepage `/` with Hero (signature visual), Research Interests, Selected Work, Recent Writing, short About/contact block                                                                                                       |
| FR-1.2 | `/research` — research narrative (interests, current directions, projects) followed by the full publication list, grouped by year, each entry with links + BibTeX (merged page per D-07, doc 11; split planned at ≈5+ papers) |
| FR-1.3 | `/writing` — post listing (title, date, description, tags)                                                                                                                                                                    |
| FR-1.4 | `/writing/[slug]` — article page: typography-first layout, TOC where useful                                                                                                                                                   |
| FR-1.5 | `/about` — bio, affiliation, advisor, contact, academic links, CV link when available                                                                                                                                         |
| FR-1.6 | 404 page                                                                                                                                                                                                                      |

### FR-2 Content system

- FR-2.1 Publications, blog posts, and research interests are data-driven via Astro
  Content Collections; homepage sections render from queries (`selected: true`,
  N most recent posts). Adding content never edits components.
- FR-2.2 Blog posts are Markdown/MDX with: math rendering, syntax-highlighted code
  blocks (light + dark), local images via `astro:assets`, footnotes, reading time.
- FR-2.3 Publication entries carry teaser image, author list (author highlighted),
  venue + year, paper/code/project links, BibTeX shown verbatim in an expandable
  block (manual copy; a copy button is a Phase 3 decision per doc 04 §6), and a
  `selected` flag.
- FR-2.4 Draft posts (`draft: true`) are excluded from builds/listings.

### FR-3 Site infrastructure

- FR-3.1 Global navigation + footer shared across pages; current page indicated.
- FR-3.2 SEO: per-page title/description, canonical URLs, Open Graph + Twitter meta,
  sitemap. (OG images: prepared in Phase 8.)
- FR-3.3 RSS feed for the blog.
- FR-3.4 Responsive across mobile / tablet / desktop.
- FR-3.5 External academic links: Email, GitHub; Scholar and CV slots exist but stay
  hidden until real values are provided (see doc 07).

### FR-4 Homepage interaction

- FR-4.1 One signature WebGL/shader visual in the Hero, as an isolated island.
- FR-4.2 At most 2–4 restrained secondary micro-interactions site-wide (doc 05).
- FR-4.3 Every interactive element has a static fallback (no JS / no WebGL /
  reduced-motion) that keeps the page complete and attractive.

## 2. Non-functional requirements

| ID                         | Requirement                                                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-1 Performance          | Content pages ship ~0 JS beyond Astro's minimal runtime; hero JS lazily hydrated; budgets quantified in doc 08                          |
| NFR-2 Accessibility        | Semantic HTML, keyboard navigable, visible focus states, WCAG AA contrast, decorative canvas is `aria-hidden`, reduced-motion respected |
| NFR-3 Maintainability      | Content = data; docs stay in sync with reality; no dependency without a recorded reason (doc 11)                                        |
| NFR-4 Static hosting       | Pure static output (`astro build` → `dist/`), deployable to any static host (GitHub Pages later); no server runtime                     |
| NFR-5 Graceful degradation | Site fully usable with JS disabled; WebGL failure never breaks layout                                                                   |
| NFR-6 Robustness           | Works in current evergreen browsers; no console errors; WebGL resources disposed on navigation                                          |
| NFR-7 Reproducible dev     | `.node-version` (fnm) + pinned pnpm via `packageManager`; single lockfile: `pnpm-lock.yaml` only                                        |

## 3. Explicitly out of scope

- CMS (headless or otherwise), backend services, databases, authentication, user
  accounts, comments.
- **Obsidian integration of any kind**: no vault sync, no auto-publish, no plugins, no
  git watching. Publishing = manually rewriting a note into `src/content/blog/`.
- Analytics (may be reconsidered later as an explicit decision).
- i18n / Chinese version of the site (site is English; revisit only if requested).
- Deployment: GitHub remote/repo, gh-pages, GitHub Actions, custom domain — all
  blocked until the author explicitly starts Phase 9.
- Fabricated personal content: no invented bio, awards, papers, or positions;
  placeholder content must be clearly marked as placeholder.

## 4. Constraints

- Node.js managed by **fnm** only, pinned via `.node-version` (version chosen in
  doc 10 based on Astro requirements).
- **pnpm** is the only package manager; `package-lock.json` / `yarn.lock` / `bun.lock`
  must never be committed.
- Local-only Git repository for now; commits follow doc 10 conventions.
- English-only repository content (code, comments, docs, commit messages).
