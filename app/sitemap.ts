import type { MetadataRoute } from "next";
import { getBlogIndex, siteUrl } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { posts } = await getBlogIndex();

  const statics: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/teachers`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/instruments`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.6 },
  ];

  return [
    ...statics,
    ...posts
      .filter((p) => !p.seo.noindex)
      .map((p) => ({
        url: `${base}/blog/${p.slug}`,
        lastModified: new Date(p.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
  ];
}