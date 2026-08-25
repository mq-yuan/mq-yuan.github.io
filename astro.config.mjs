// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { remarkReadingTime } from "./src/lib/remark-reading-time.mjs";

// https://astro.build/config
export default defineConfig({
  // Future public URL (Phase 9). Required now by @astrojs/sitemap and used for
  // canonical URLs; no deployment is implied.
  site: "https://mq-yuan.github.io",

  integrations: [mdx(), sitemap()],

  markdown: {
    // Astro 7's default Rust processor (Sätteri) cannot run remark/rehype
    // plugins; math and reading time require the unified pipeline (doc 11, D-03).
    processor: unified({
      remarkPlugins: [remarkMath, remarkReadingTime],
      rehypePlugins: [rehypeKatex],
    }),
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    },
  },
});
