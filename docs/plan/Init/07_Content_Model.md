# 07 — Content Model

> Schemas and authoring rules for all content. Implemented as Astro content
> collections in `src/content.config.ts` (zod via `astro/zod`). Governing rule:
> **adding a publication or post never edits a component** — pages are pure
> functions of this data.

## 1. Collections overview

| Collection   | Loader                                               | Purpose                                                                          |
| ------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `works`      | `glob()` over `src/content/works/*.md`               | Publications AND projects (one type field), body = optional extended description |
| `writing`    | `glob()` over `src/content/writing/*/index.{md,mdx}` | Blog posts (folder-per-post, co-located images)                                  |
| `profile`    | `file()` over `src/content/data/profile.yaml`        | Site-wide personal facts (single source for header/footer/SEO/about)             |
| `interests`  | `file()` over `src/content/data/interests.yaml`      | Named research directions for Home + `/research`                                 |
| `education`  | `file()` over `src/content/data/education.yaml`      | Degree rows with logos for `/about` (§6)                                         |
| `experience` | `file()` over `src/content/data/experience.yaml`     | Research-position rows with logos for `/about` (§6)                              |
| `news`       | `file()` over `src/content/data/news.yaml`           | Dated updates for the homepage News list (§7)                                    |

## 2. `works` schema

```ts
const works = defineCollection({
  loader: glob({ base: "./src/content/works", pattern: "*.md" }),
  schema: ({ image }) =>
    z.object({
      type: z.enum(["publication", "project"]),
      title: z.string(),
      authors: z
        .array(
          z.object({
            name: z.string(),
            url: z.string().url().optional(),
            me: z.boolean().default(false), // renders bold
            equal: z.boolean().default(false), // equal-contribution mark
          }),
        )
        .optional(), // projects may omit
      venue: z.string().optional(), // e.g. "ICLR"
      year: z.number().int(),
      highlight: z.string().optional(), // "Oral", "Spotlight", …
      status: z
        .enum(["published", "accepted", "preprint", "wip"])
        .default("published"),
      teaser: image().optional(), // 4:3 preferred (doc 04)
      teaserAlt: z.string().optional(), // required when teaser present (checked in page code)
      description: z.string().optional(), // 1–2 sentences on the entry
      links: z
        .object({
          paper: z.string().url().optional(),
          project: z.string().url().optional(),
          code: z.string().url().optional(),
          video: z.string().url().optional(),
        })
        .default({}),
      bibtex: z.string().optional(), // verbatim block, copyable
      selected: z.boolean().default(false), // homepage Selected Work
      order: z.number().default(0), // tie-break within a year
    }),
});
```

- Sorting: `year` desc, then `order`, then title. Research page groups by year;
  `selected: true` (max ~5 enforced editorially) feeds homepage cards.
- Abstract: intentionally omitted — `description` covers on-site text; abstracts
  live in the paper/project page. Revisit only if per-work detail pages are added.

### First real entry (verified data — the only publication to date)

ComGS: Efficient 3D Object-Scene Composition via Surface Octahedral Probes.
Jian Gao, **Mengqi Yuan**, Yifei Zeng, Chang Zeng, Zhihao Li, Zhenyu Chen,
Weichao Qiu, Xiao-Xiao Long, Hao Zhu, Xun Cao, Yao Yao. ICLR 2026.
BibTeX (verbatim from author):

```bibtex
@inproceedings{gao2026comgs,
  title={Com{GS}: Efficient 3D Object-Scene Composition via Surface Octahedral Probes},
  author={Jian Gao and Mengqi Yuan and Yifei Zeng and Chang Zeng and Zhihao Li and Zhenyu Chen and Weichao Qiu and Xiao-Xiao Long and Hao Zhu and Xun Cao and Yao Yao},
  booktitle={ICLR},
  year={2026}
}
```

All fields completed 2026-08-25 from the ComGS project page and repo: teaser
(frame from the bull composition-result video), arXiv/project/code links,
co-author homepage URLs, and equal-contribution marks (Jian Gao* and Mengqi
Yuan* are joint first authors).

## 3. `writing` schema

```ts
const writing = defineCollection({
  loader: glob({ base: "./src/content/writing", pattern: "*/index.{md,mdx}" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      description: z.string().max(200), // list + meta description + RSS
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false), // excluded from builds/lists/RSS
      toc: z.boolean().default(true), // long-form TOC on article page
      math: z.boolean().default(false), // gates KaTeX CSS loading (doc 08 §2)
      hero: image().optional(), // optional header image
      heroAlt: z.string().optional(),
    }),
});
```

- Slug = folder name (stable permalink; never renamed after publish).
- Reading time: computed at build via remark plugin (`minutesRead` in
  `remarkPluginFrontmatter`) — not authored.
- Math (`$…$/$$…$$`), Shiki code fences, footnotes, and co-located images
  (`![…](./fig1.png)` optimized by `astro:assets`) available in every post.
- Authoring flow (fixed): Obsidian note → manual rewrite → new folder in
  `src/content/writing/` → review → `draft: false`. No automation, ever.

## 4. `profile` data (single source of site-wide facts)

```yaml
# src/content/data/profile.yaml — verified values only
name: "Mengqi Yuan"
tagline: "" # PENDING: one-line research tagline (author)
affiliation: "School of Intelligence Science and Technology, Nanjing University"
degree: "M.Sc. student"
advisor: { name: "Yao Yao", url: "https://yoyo000.github.io/" } # name from ComGS author list; confirm display preference
email: "mqyuan@smail.nju.edu.cn"
bioShort: "" # PENDING: 2–3 sentence homepage bio fragment (OQ-1)
bio: "" # PENDING: fuller /about bio, markdown allowed (OQ-1)
github: "" # PENDING: confirm GitHub profile URL (repo owner mq-yuan assumed — verify)
scholar: "" # PENDING: add when profile exists (link hidden until set)
cv: "" # PENDING: add when CV exists (link hidden until set)
```

Schema mirrors this shape; empty-string/absent optional fields ⇒ the corresponding
UI (link, button) is not rendered. **No fabricated values, ever** — placeholders are
empty, not invented.

## 5. `interests` data (research directions)

```yaml
# src/content/data/interests.yaml
- id: "3d-composition"
  title: "" # PENDING with author: named direction, Gkioxari-style
  summary: "" # 2–3 sentences: the question being asked
  worksIds: ["comgs"] # links direction → works entries
```

Structure is data-driven so directions can grow/reorder without component edits;
the actual naming/wording is author voice → Open Question OQ-2 (doc 11). Until
provided, `/research` and the homepage section use clearly-marked placeholder copy
(e.g. "Research direction statement — pending").

## 6. `education` / `experience` data (About page rows)

Two `file()` collections with one shared row shape (`affiliationSchema` in
`src/content.config.ts`), rendered by `AffiliationEntry.astro` under
"Education" and "Experience" on `/about`. Added 2026-09-11 at the author's
request so the CV-like facts stop living only inside bio prose.

```yaml
# src/content/data/education.yaml (experience.yaml has the same shape)
nju:
  name: "Nanjing University" # institution or organisation
  url: "https://www.nju.edu.cn/" # optional
  logo: "../../assets/logos/nju.svg" # optional, image() relative to the YAML
  title: "M.Sc. student" # degree or role
  detail: "School of Intelligence Science and Technology" # optional
  period: "2024 – present" # display string, authored
  advisor: { name: "Yao Yao", url: "https://yoyo000.github.io/" } # optional
  group: # optional research-group badge (wide logo in a light tile)
    name: "Physical Intelligence Lab (NJU-PIL)"
    url: "https://nju-3dv.github.io/"
    logo: "../../assets/logos/nju-pil-wordmark.png"
    logoDark: "../../assets/logos/nju-pil-wordmark-dark.png" # optional dark-theme variant
  order: 0 # newest first
```

- Logos live in `src/assets/logos/`. Emblems render in a fixed light tile
  (`--logo-tile`) so coloured marks read in both themes. A group wordmark
  with a `logoDark` variant renders bare, switched per theme through the
  `--show-on-light` / `--show-on-dark` tokens; without a dark variant it
  falls back to the tile (revised 2026-09-11 after the author's review).
  Sources: NJU and TJU emblems via Wikipedia (nominative use for the author's
  own affiliations; swap for official VI files if preferred), Insta360 mark
  from the company's press page (public domain), cropped to the icon.
- `period` is a plain string on purpose: no date parsing, no "present" logic.
- Same verified-values rule as §4. Experience lists positions outside the
  degree institution only (author, 2026-09-11); the lab appears as a `group`
  badge on the degree row instead.

## 7. `news` data (homepage News list)

`file()` collection over `src/content/data/news.yaml`; rendered newest first on
the homepage (doc 03 §3). Added 2026-09-11.

```yaml
iclr-2026-accept:
  date: "2026-01" # YYYY-MM, rendered "Jan 2026"; sorts as text
  text: "ComGS is accepted at ICLR 2026."
  url: "https://nju-3dv.github.io/projects/ComGS/" # optional
```

- Month precision only; no day, no "present" logic. Ties keep file order.
- Verified-values rule applies; all current months were confirmed by the
  author on 2026-09-11 (OQ-11, doc 11).

## 8. Demo/placeholder content policy

- Phase 3 validates the pipeline with demo posts (math + code + figures) clearly
  titled as samples (e.g. "Sample: typography and math test") and `draft: true`
  once validation is done, so they never ship in a real build.
- Real personal facts only from §2/§4 verified data. Never fabricate papers,
  bios, awards, affiliations, or URLs.

## 9. RSS / SEO derivation

- RSS: non-draft `writing` entries, newest first: title, date, description, link
  from slug. Full-content feed deferred (decision D-09, doc 11).
- Per-page SEO: title/description from page or entry frontmatter; canonical from
  `Astro.site + Astro.url`; OG type `article` for posts with date/tags metadata;
  JSON-LD (`Person` on home/about, `ScholarlyArticle` on research entries,
  `BlogPosting` on articles) — Phase 3/8.

## 10. CV (Typst, `cv/`)

Added 2026-09-11 (OQ-8). Two Typst documents live in the repository so they
share the data above instead of restating it: an English academic CV
(`cv/cv.typ`) and a Chinese, project-focused job resume (`cv/resume-zh.typ`).

- `cv/cv.typ` reads `profile.yaml`, `education.yaml`, `experience.yaml`,
  `interests.yaml`, and the front matter of the `works/*.md` files listed in
  `cv/data/cv.yaml` (Typst cannot enumerate a directory). Facts edited once
  update the site and the PDF together.
- `cv/data/cv.yaml` (committed) holds only public CV-only data: website,
  publication order, skills. Verified-values rule as §4.
- `cv/data/private/` (git-ignored) holds everything that describes unreleased
  or partner-confidential work: `cv.yaml` (research projects, optional phone
  and location) and `resume-zh.yaml` (all Chinese strings of the resume,
  section labels included, so the `.typ` files stay English-only).
- `cv/template.typ` mirrors the site tokens (doc 04): Libertinus Serif, light
  accent `#2F5DA8`, muted meta labels. The Chinese resume follows the common
  Chinese resume-template conventions instead: Songti SC body (Libertinus for
  Latin), PingFang SC for name, section and entry titles, justified text, and
  entries whose first line carries title, role and date. The photo is the
  site's `src/assets/portrait.jpg`.
- `pnpm cv` runs `cv/build.sh`, which compiles four PDFs into `cv/out/`
  (git-ignored): `cv-1p`, `cv-2p`, `resume-zh-1p`, `resume-zh-2p`. The
  `--input pages=1|2` switch selects the short or expanded bullet lists in
  the data, and the script scans the vertical-rhythm `scale` input so each
  document ends near the bottom of its last page (no trailing hole). Nothing
  is copied to `public/`, and `profile.cv` stays empty: the CVs contain
  unreleased work and are kept off the site by the author's decision
  (2026-09-11). No undergraduate content outside Education (same date).
