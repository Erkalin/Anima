import { getBlogIndex, siteUrl } from "@/lib/blog";

const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET() {
  const { posts, settings, authors, categories } = await getBlogIndex();
  const base = siteUrl();
  const latest = posts[0]?.publishedAt ?? new Date().toISOString();

  const items = posts
    .slice(0, 40)
    .map((p) => {
      const author = authors.find((a) => a.id === p.authorId);
      const category = categories.find((c) => c.id === p.categoryId);
      const url = `${base}/blog/${p.slug}`;
      const image = p.coverUrl
        ? `\n      <enclosure url="${esc(base + p.coverUrl)}" length="0" type="image/*" />`
        : "";
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <description>${esc(p.excerpt)}</description>
      <pubDate>${new Date(p.publishedAt ?? p.createdAt).toUTCString()}</pubDate>
      ${author ? `<dc:creator>${esc(author.name)}</dc:creator>` : ""}
      ${category ? `<category>${esc(category.name)}</category>` : ""}
      ${p.tags.map((t) => `<category>${esc(t)}</category>`).join("\n      ")}${image}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(settings.blogTitle)}</title>
    <link>${esc(base)}/blog</link>
    <atom:link href="${esc(base)}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <description>${esc(settings.blogDescription)}</description>
    <language>fa-IR</language>
    <lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>
    <generator>${esc(settings.brand)}</generator>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}