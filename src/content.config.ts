import { defineCollection } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";

// Schemas follow docs/plan/Init/07_Content_Model.md. Adding content must never
// require editing components — pages are pure functions of these collections.

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
            me: z.boolean().default(false),
            equal: z.boolean().default(false),
          }),
        )
        .optional(),
      venue: z.string().optional(),
      year: z.number().int(),
      highlight: z.string().optional(),
      status: z
        .enum(["published", "accepted", "preprint", "wip"])
        .default("published"),
      teaser: image().optional(),
      teaserAlt: z.string().optional(),
      description: z.string().optional(),
      links: z
        .object({
          paper: z.string().url().optional(),
          project: z.string().url().optional(),
          code: z.string().url().optional(),
          video: z.string().url().optional(),
        })
        .default({}),
      bibtex: z.string().optional(),
      selected: z.boolean().default(false),
      order: z.number().default(0),
    }),
});

const writing = defineCollection({
  loader: glob({ base: "./src/content/writing", pattern: "*/index.{md,mdx}" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      description: z.string().max(200),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      toc: z.boolean().default(true),
      math: z.boolean().default(false),
      hero: image().optional(),
      heroAlt: z.string().optional(),
    }),
});

const profile = defineCollection({
  loader: file("./src/content/data/profile.yaml"),
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    affiliation: z.string(),
    degree: z.string(),
    advisor: z.object({ name: z.string(), url: z.string().url() }),
    email: z.string().email(),
    bioShort: z.string(),
    bio: z.string(),
    github: z.string(),
    scholar: z.string(),
    cv: z.string(),
    undergrad: z
      .object({
        school: z.string(),
        advisor: z.object({ name: z.string(), url: z.string().url() }),
      })
      .optional(),
  }),
});

const interests = defineCollection({
  loader: file("./src/content/data/interests.yaml"),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    worksIds: z.array(z.string()).default([]),
    order: z.number().default(0),
  }),
});

export const collections = { works, writing, profile, interests };
