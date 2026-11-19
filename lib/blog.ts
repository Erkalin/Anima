import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import * as db from "./db";
import type { Author, Category, Post, Settings, Tag } from "./types";
import { readingMinutes } from "./utils";

export type BlogIndex = {
  posts: Post[];
  categories: Category[];
  tags: Tag[];
  authors: Author[];
  settings: Settings;
};

export type BlogPost = {
  post: Post;
  author: Author | null;
  category: Category | null;
  related: Post[];
  settings: Settings;
  newer: Post | null;
  older: Post | null;
};

const isLive = (p: Post, now: string) =>
  p.status === "published" && Boolean(p.publishedAt) && p.publishedAt! <= now;

const byDate = (a: Post, b: Post) =>
  (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");

/** Posts saved before the editor stored a reading time still need one. */
const timed = (p: Post): Post =>
  p.readingMinutes === null
    ? { ...p, readingMinutes: readingMinutes(p.content) }
    : p;

export async function getBlogIndex(): Promise<BlogIndex> {
  "use cache";
  cacheTag("posts", "blog", "settings", "taxonomy");
  cacheLife({ stale: 300, revalidate: 60, expire: 86_400 });

  const all = await db.getDb();
  const now = new Date().toISOString();
  return {
    posts: all.posts.filter((p) => isLive(p, now)).sort(byDate).map(timed),
    categories: all.categories,
    tags: all.tags,
    authors: all.authors,
    settings: all.settings,
  };
}

export async function getPostSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("posts");
  cacheLife({ stale: 300, revalidate: 60, expire: 86_400 });
  const all = await db.getDb();
  const now = new Date().toISOString();
  return all.posts.filter((p) => isLive(p, now)).map((p) => p.slug);
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  "use cache";
  cacheTag("posts", "blog", `post-${slug}`);
  cacheLife({ stale: 300, revalidate: 60, expire: 604_800 });

  const all = await db.getDb();
  const now = new Date().toISOString();
  const live = all.posts.filter((p) => isLive(p, now)).sort(byDate).map(timed);
  const at = live.findIndex((p) => p.slug === slug);
  if (at === -1) return null;

  const post = live[at];
  const related = live
    .filter((p) => p.id !== post.id)
    .map((p) => {
      let score = 0;
      if (post.categoryId && p.categoryId === post.categoryId) score += 3;
      score += p.tags.filter((t) => post.tags.includes(t)).length * 2;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score || byDate(a.p, b.p))
    .slice(0, 3)
    .map((x) => x.p);

  return {
    post,
    author: all.authors.find((a) => a.id === post.authorId) ?? null,
    category: all.categories.find((c) => c.id === post.categoryId) ?? null,
    related,
    settings: all.settings,
    newer: at > 0 ? live[at - 1] : null,
    older: at < live.length - 1 ? live[at + 1] : null,
  };
}

export function telegramLink(settings: Settings): string {
  return settings.telegramUsername
    ? `https://t.me/${settings.telegramUsername}`
    : "https://t.me/";
}

export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "http://localhost:3000";
  return raw.startsWith("http") ? raw.replace(/\/$/, "") : `https://${raw}`;
}