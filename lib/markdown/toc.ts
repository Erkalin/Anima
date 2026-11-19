import GithubSlugger from "github-slugger";

export type TocItem = { id: string; text: string; depth: number };

/** Matches what rehype-slug sees: the heading's rendered text content. */
function plainText(raw: string): string {
  return raw
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/::?[a-z-]+\[([^\]]*)\](\{[^}]*\})?/gi, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .replace(/__([^_]*)__/g, "$1")
    .replace(/_([^_]*)_/g, "$1")
    .replace(/~~([^~]*)~~/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractToc(markdown: string, maxDepth = 3): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  let inFence = false;

  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const depth = match[1].length;
    const text = plainText(match[2]);
    if (!text) continue;

    // Slug every heading so ids stay in step with rehype-slug, but only list
    // the ones the reader actually navigates by.
    const id = slugger.slug(text);
    if (depth <= maxDepth) items.push({ id, text, depth });
  }

  return items;
}