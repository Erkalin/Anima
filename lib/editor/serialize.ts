const clean = (v: string) => v.replace(/"/g, "'").replace(/\s+/g, " ").trim();

export function attrString(attrs: Record<string, string | number | boolean | null | undefined>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === "" || v === false) continue;
    if (v === true) parts.push(`${k}=true`);
    else if (typeof v === "number") parts.push(`${k}=${v}`);
    else parts.push(`${k}="${clean(v)}"`);
  }
  return parts.length ? `{${parts.join(" ")}}` : "";
}

export function leaf(
  name: string,
  url: string,
  attrs: Record<string, string | number | boolean | null | undefined> = {},
): string {
  const safe = url.replace(/\[/g, "%5B").replace(/\]/g, "%5D");
  return `::${name}[${safe}]${attrString(attrs)}`;
}

export function container(
  name: string,
  body: string,
  attrs: Record<string, string | number | boolean | null | undefined> = {},
): string {
  return `:::${name}${attrString(attrs)}\n${body}\n:::`;
}