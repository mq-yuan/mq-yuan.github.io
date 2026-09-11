// Site-level switches (not personal facts — those live in profile.yaml).
export const siteConfig = {
  /** Writing section. While false: no nav item, homepage block, or footer
   * RSS link; /writing pages carry a robots noindex tag; the sitemap omits
   * them; rss.xml builds with no items. The routes still build, so the posts
   * are reachable by URL and nothing 404s (doc 03 §3 launch rule; author,
   * 2026-09-11). */
  showWriting: false,
};
