import { toString } from "mdast-util-to-string";
import getReadingTime from "reading-time";

/** Injects `minutesRead` (e.g. "4 min read") into remark frontmatter data. */
export function remarkReadingTime() {
  return (tree, { data }) => {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    data.astro.frontmatter.minutesRead = readingTime.text;
  };
}
