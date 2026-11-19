import { visit } from "unist-util-visit";

type Node = {
  type: string;
  name?: string;
  attributes?: Record<string, string | null | undefined>;
  children?: Node[];
  value?: string;
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
};

export const CALLOUT_TYPES = [
  "note",
  "tip",
  "warning",
  "danger",
  "success",
  "info",
] as const;

const CONTAINERS = new Set([
  "callout",
  "toggle",
  "details",
  "quote",
  "gallery",
  "columns",
  "card",
  "steps",
  "cta",
  "table",
  "ltr",
]);

const LEAVES = new Set([
  "image",
  "video",
  "audio",
  "file",
  "youtube",
  "aparat",
  "link",
  "toc",
  "score",
  "metronome",
  "telegram",
]);

const INLINES = new Set([
  "mark",
  "kbd",
  "badge",
  "hand",
  "brass",
  "ltr",
  "fa",
  "num",
  "abbr",
  "sup",
  "sub",
]);

function labelOf(node: Node): string {
  const out: string[] = [];
  const walk = (n: Node) => {
    if (typeof n.value === "string") out.push(n.value);
    n.children?.forEach(walk);
  };
  node.children?.forEach(walk);
  return out.join("");
}

/**
 * Turns remark-directive nodes into custom elements the renderer maps to
 * components. Container children stay markdown; leaf labels become the `label`
 * prop so a source path is never also printed as text.
 */
export function remarkBlocks() {
  return (tree: Node) => {
    visit(tree as never, (node: Node) => {
      const { type, name } = node;
      if (!name) return;

      const isContainer = type === "containerDirective";
      const isLeaf = type === "leafDirective";
      const isInline = type === "textDirective";

      let tag = name;
      const attrs: Record<string, unknown> = { ...(node.attributes ?? {}) };

      if (isContainer && (CALLOUT_TYPES as readonly string[]).includes(name)) {
        tag = "callout";
        attrs.type = name;
      } else if (isContainer && name === "details") {
        tag = "toggle";
      } else if (isContainer && name === "ltr") {
        tag = "ltr-block";
      }

      const known = isContainer
        ? CONTAINERS.has(name) ||
          (CALLOUT_TYPES as readonly string[]).includes(name)
        : isLeaf
          ? LEAVES.has(name)
          : isInline
            ? INLINES.has(name)
            : false;

      if (!known) return;

      if (isLeaf) {
        attrs.label = labelOf(node);
        node.children = [];
      }

      node.data = node.data ?? {};
      node.data.hName = `x-${tag}`;
      node.data.hProperties = attrs;
    });
  };
}