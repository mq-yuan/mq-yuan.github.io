import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { siteConfig } from "../site.config";

export async function GET(context: APIContext) {
  // While the Writing section is hidden the feed builds but carries no items.
  const posts = siteConfig.showWriting
    ? (await getCollection("writing", (p) => !p.data.draft)).sort(
        (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
      )
    : [];

  return rss({
    title: "Mengqi Yuan — Writing",
    description:
      "Notes and long-form writing on 3D vision, neural rendering, and related topics.",
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/writing/${post.id}/`,
    })),
  });
}
