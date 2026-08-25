# 07 — Content Model

> Schemas and authoring rules for all content. Implemented as Astro content
> collections in `src/content.config.ts` (zod via `astro/zod`). Governing rule:
> **adding a publication or post never edits a component** — pages are pure
> functions of this data.

## 1. Collections overview

| Collection  | Loader                                               | Purpose                                                                          |
| ----------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `works`     | `glob()` over `src/content/works/*.md`               | Publications AND projects (one type field), body = optional extended description |
| `writing`   | `glob()` over `src/content/writing/*/index.{md,mdx}` | Blog posts (folder-per-post, co-located images)                                  |
| `profile`   | `file()` over `src/content/data/profile.yaml`        | Site-wide personal facts (single source for header/footer/SEO/about)             |
| `interests` | `file()` over `src/content/data/interests.yaml`      | Named research directions for Home + `/research`                                 |

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

## 6. Demo/placeholder content policy

- Phase 3 validates the pipeline with demo posts (math + code + figures) clearly
  titled as samples (e.g. "Sample: typography and math test") and `draft: true`
  once validation is done, so they never ship in a real build.
- Real personal facts only from §2/§4 verified data. Never fabricate papers,
  bios, awards, affiliations, or URLs.

## 7. RSS / SEO derivation

- RSS: non-draft `writing` entries, newest first: title, date, description, link
  from slug. Full-content feed deferred (decision D-09, doc 11).
- Per-page SEO: title/description from page or entry frontmatter; canonical from
  `Astro.site + Astro.url`; OG type `article` for posts with date/tags metadata;
  JSON-LD (`Person` on home/about, `ScholarlyArticle` on research entries,
  `BlogPosting` on articles) — Phase 3/8.
