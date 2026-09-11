# 03 — Information Architecture

> Site map, page composition, navigation, and URL structure. Grounded in the reference
> research (doc 02); visual execution in doc 04; content schemas in doc 07.

## 1. Design stance

Reference research (doc 02) shows two dominant patterns among CV/graphics researchers:

- **Single-page publication wall** (Jon Barron lineage) — works only with many papers;
  with one paper it reads as an empty template. **Rejected.**
- **Small multi-page site** (keunhong.com: Home + Highlights / CV / Blog) — the only
  pattern used by researchers who treat writing as first-class. **Adopted**, extended
  with a named research-narrative section (Georgia Gkioxari pattern).

Key principle: identity is carried by _narrative + selected work + writing_, not by
publication count. "Publications" never appears as a large heading over a single entry.

## 2. Site map

```text
/                     Home
/research             Research narrative + full publication list
/writing              Writing index (the blog)
/writing/[slug]       Article
/about                Bio, contact, links, CV
/404                  Not found
rss.xml               Writing feed
```

### Decisions behind the map

- **Research and Publications are ONE page (`/research`).** With one publication, a
  standalone `/publications` page is an anti-pattern (doc 02 §1 and §4). `/research` leads
  with the research narrative (named directions, questions being asked) and ends with
  the full publication list under a modest "Publications" heading. When the list grows
  (≈ 5+ entries), splitting out `/publications` is a cheap, planned evolution — the
  content model (doc 07) already separates the data.
- **The blog is named "Writing"** (nav label and `/writing` URL). Rationale:
  "Blog" undersells curated technical writing; "Writing" matches the
  editorial-minimal-technical direction (Paco Coursey pattern) and Lilian Weng's
  "learning notes" stance lowers the publishing bar without a "Notes vs Blog" split
  we don't yet need. (Recorded as Decision D-07 in doc 11; a one-line rename later is
  trivial since content lives in a `writing` collection.)
- **No standalone Projects page yet.** Open-source tools, reproductions, and demos
  enter as `type: "project"` entries in the same works collection (doc 07) and render
  inside Selected Work / the research page. A dedicated page is future evolution.
- **Selected Work** = works flagged `selected: true` (publications _and_ projects),
  1–5 entries, shown on the homepage as cards with teasers.

## 3. Page composition

### Home `/`

Ordered sections, one viewport-height hero, then flowing document. Revised
2026-09-11 after the author's review of the first build: the first screen read
as too thin (name, school, one line — no degree level), the research
directions came first but describe _what_ rather than _results_, and the
Writing block pointed at an empty section.

1. **Hero** — eyebrow `degree · institution` (so the level is visible at a
   glance), name, one-line research tagline (Karpathy pattern), a muted line
   with the school and advisor, compact link row (Email · GitHub · Scholar ·
   CV*). The signature WebGL visual lives here (doc 05). (*hidden until real.)
2. **About at a glance** — short bio beside the portrait, then two compact
   columns with institution logos: Education and Experience (doc 07 §6,
   `compact` rows without the advisor line). Link → `/about`.
3. **News** — dated list, newest first (doc 07 §7): acceptances, preprints,
   positions. This is where results and freshness show up first.
4. **Selected Work** — 1–5 teaser cards from `selected: true` works. Link →
   `/research`.
5. **Research interests** — the named directions as a two-column grid of
   question statements (no paper or position names; those live above). Link →
   `/research`.
6. **Writing** (hidden) — behind `siteConfig.showWriting` in
   `src/site.config.ts` until the launch rule below is met; footer with contact
   links (RSS also behind the switch).

Homepage density target: complete in ~4 viewport heights on desktop. Every
section renders from content queries — adding paper #2, a news item, or post #N
never edits a component.

### Research `/research`

1. Research statement: named direction(s), each with a short paragraph — what
   question, why it matters, how the pieces connect (ComGS fits inside a direction,
   not as the page's sole content).
2. Publications: full list, grouped by year, Barron-anatomy entries — teaser left;
   title → project page; author list with **Mengqi Yuan** bold, co-author links,
   equal-contribution marks; venue + year; link row `paper / project / code / bibtex`
   with BibTeX as a toggle.
3. Projects/tools (when they exist): same entry anatomy, lighter teaser treatment.

### Writing `/writing`

- Chronological list: title, date, description, tags, reading time. No pagination
  until ≈ 20 posts. Tag filtering is future evolution (not in v1 nav).
- Launch rule from doc 02: never ship a nav item pointing at an empty section —
  at launch, `/writing` must contain at least 2–3 real (or clearly-real-quality)
  posts, else the nav item waits.

### Article `/writing/[slug]`

- Typography-first single column (~68ch), serif body (doc 04). Title, date,
  updated-date when present, reading time, tags.
- TOC for long posts (frontmatter-controlled, doc 07); math, dual-theme code blocks,
  figures with captions, footnotes.
- Prev/next or back-to-index footer; no sidebars, no comments, no share widgets.

### About `/about`

- Portrait (optional), fuller bio, affiliation + advisor (link to
  https://yoyo000.github.io/), then two data-driven lists with institution logos —
  **Education** and **Experience** (doc 07 §6, added 2026-09-11) — then contact,
  academic links, CV download when available, and room for a personal note
  (interests outside research) to give the page warmth.

### 404

- Small, on-brand, links home. (Phase 8 polish.)

## 4. Navigation

- Header: wordmark/name (→ `/`) + `Home · Research · Writing · About` (explicit
  Home added 2026-09-11 at the author's request). No dropdowns. Current page indicated (doc 04). Mobile: same row (3 short labels fit;
  no hamburger). `Writing` is filtered out while `siteConfig.showWriting` is
  false (launch rule, §3); the routes still build.
- Footer (all pages): email, GitHub, Scholar, RSS (behind the same switch),
  © year. CV appears when real.

## 5. URL and slug rules

- Lowercase, hyphenated slugs; writing slugs are stable once published (they become
  permalinks). Trailing-slash policy: Astro default (`ignore`) — revisit at deploy
  time (Phase 9 note).
- `site` will be `https://mq-yuan.github.io` when configured; all canonical/OG/RSS
  URLs derive from it.

## 6. Future IA evolution (planned, not built)

- Split `/publications` out of `/research` at ≈ 5+ papers.
- `/projects` page if project entries outgrow the research page.
- Tag pages `/writing/tags/[tag]` when the archive warrants filtering.
- News/updates stream on Home or About (small dated list) once there is a steady
  flow of items.
