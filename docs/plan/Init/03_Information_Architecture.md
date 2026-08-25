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

Key principle: identity is carried by *narrative + selected work + writing*, not by
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
- **Selected Work** = works flagged `selected: true` (publications *and* projects),
  1–5 entries, shown on the homepage as cards with teasers.

## 3. Page composition

### Home `/`

Ordered sections, one viewport-height hero, then flowing document:

1. **Hero** — name, one-line research tagline (Karpathy pattern: concrete, not
   "welcome to my website"), affiliation line, compact link row (Email · GitHub ·
   Scholar* · CV*). The signature WebGL visual lives here (doc 05). (*hidden until
   real values exist.)
2. **Research Interests** — a named research direction with 2–3 sentences on the
   questions being asked (Gkioxari pattern), rendered from data (doc 07). Link →
   `/research`.
3. **Selected Work** — 1–5 teaser cards from `selected: true` works. Link →
   `/research`.
4. **Recent Writing** — 3 most recent non-draft posts: title, date, description.
   Link → `/writing`.
5. **Short About + footer** — 2–3 sentence bio fragment, link → `/about`; footer with
   contact links and RSS.

Homepage density target: complete in ~3–4 viewport heights on desktop. Every section
renders from content queries — adding paper #2 or post #N never edits a component.

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
  https://yoyo000.github.io/), contact, academic links, CV download when available,
  and room for a personal note (interests outside research) to give the page warmth.

### 404

- Small, on-brand, links home. (Phase 8 polish.)

## 4. Navigation

- Header: wordmark/name (→ `/`) + `Research · Writing · About`. Three items, no
  dropdowns. Current page indicated (doc 04). Mobile: same row (3 short labels fit;
  no hamburger).
- Footer (all pages): email, GitHub, RSS, © year. Scholar/CV appear when real.

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
