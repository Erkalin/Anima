"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { requireVerifiedAdmin } from "@/lib/auth/dal";
import * as db from "@/lib/db";
import { emptyPost, type Post, type PostStatus } from "@/lib/types";
import { excerptFrom, readingMinutes, slugify, transliterate } from "@/lib/utils";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const MAX_CONTENT = 400_000;

function uniqueSlug(want: string, posts: Post[], selfId: string): string {
  const base = want || "nosh-te";
  let candidate = base;
  let n = 2;
  const taken = new Set(
    posts.filter((p) => p.id !== selfId).map((p) => p.slug),
  );
  while (taken.has(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

function normalize(input: Post, posts: Post[]): Post {
  const now = new Date().toISOString();
  const title = input.title.trim().slice(0, 200);
  const content = input.content.slice(0, MAX_CONTENT);
  const asked = slugify(input.slug) || slugify(title) || transliterate(title);
  return {
    ...input,
    title,
    content,
    slug: uniqueSlug(asked, posts, input.id),
    excerpt: input.excerpt.trim().slice(0, 400) || excerptFrom(content),
    readingMinutes: readingMinutes(content),
    updatedAt: now,
    createdAt: input.createdAt || now,
    tags: [...new Set(input.tags.map((t) => t.trim()).filter(Boolean))].slice(0, 12),
    typography: {
      scale: clamp(input.typography.scale, 0.9, 1.35),
      leading: clamp(input.typography.leading, 1.6, 2.4),
      measure: clamp(input.typography.measure, 34, 56),
      accent: input.typography.accent,
    },
    customCss: input.customCss.slice(0, 8000),
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;
}

function invalidate(...slugs: (string | null | undefined)[]) {
  updateTag("posts");
  updateTag("blog");
  for (const s of slugs) if (s) updateTag(`post-${s}`);
}

export async function savePostAction(
  input: Post,
): Promise<ActionResult<Post>> {
  await requireVerifiedAdmin();
  if (input.content.length > MAX_CONTENT)
    return { ok: false, error: "متنِ نوشته بیش از حد بلند است." };

  const all = await db.getDb();
  const before = all.posts.find((p) => p.id === input.id);
  const post = normalize(input, all.posts);

  if (post.status === "published" && !post.title)
    return { ok: false, error: "برای انتشار، عنوان لازم است." };
  if (post.status === "published" && !post.publishedAt)
    post.publishedAt = new Date().toISOString();

  const saved = await db.savePost(post);
  invalidate(before?.slug, saved.slug);
  return { ok: true, data: saved };
}

export async function createDraftAction(): Promise<ActionResult<Post>> {
  await requireVerifiedAdmin();
  const all = await db.getDb();
  const post = emptyPost(randomUUID());
  post.authorId = all.settings.defaultAuthorId;
  post.toc = all.settings.defaultToc;
  post.typography.accent = all.settings.defaultAccent;
  const saved = await db.savePost(post);
  invalidate(saved.slug);
  return { ok: true, data: saved };
}

export async function setStatusAction(
  ids: string[],
  status: PostStatus,
  when?: string | null,
): Promise<ActionResult<{ slugs: string[] }>> {
  await requireVerifiedAdmin();
  const all = await db.getDb();
  const targets = all.posts.filter((p) => ids.includes(p.id));
  if (!targets.length) return { ok: false, error: "نوشته‌ای پیدا نشد." };

  if (status === "published") {
    const missing = targets.filter((p) => !p.title.trim());
    if (missing.length)
      return { ok: false, error: "نوشتهٔ بی‌عنوان منتشر نمی‌شود." };
  }

  const now = new Date().toISOString();
  const slugs: string[] = [];
  for (const p of targets) {
    let publishedAt = p.publishedAt;
    if (status === "published") {
      publishedAt =
        when ??
        (publishedAt && publishedAt <= now ? publishedAt : now);
    } else if (status === "scheduled") {
      publishedAt = when ?? publishedAt ?? now;
    }
    await db.savePost({
      ...p,
      status,
      publishedAt,
      updatedAt: now,
    });
    slugs.push(p.slug);
  }
  invalidate(...slugs);
  return { ok: true, data: { slugs } };
}

export async function deletePostsAction(
  ids: string[],
): Promise<ActionResult<Post[]>> {
  await requireVerifiedAdmin();
  const all = await db.getDb();
  const removed = all.posts.filter((p) => ids.includes(p.id));
  for (const p of removed) await db.deletePost(p.id);
  invalidate(...removed.map((p) => p.slug));
  return { ok: true, data: removed };
}

/** Undo: puts the exact rows back, bytes and all. */
export async function restorePostsAction(
  posts: Post[],
): Promise<ActionResult<number>> {
  await requireVerifiedAdmin();
  const all = await db.getDb();
  for (const p of posts) {
    await db.savePost(normalize(p, all.posts));
  }
  invalidate(...posts.map((p) => p.slug));
  return { ok: true, data: posts.length };
}

export async function duplicatePostAction(
  id: string,
): Promise<ActionResult<Post>> {
  await requireVerifiedAdmin();
  const all = await db.getDb();
  const source = all.posts.find((p) => p.id === id);
  if (!source) return { ok: false, error: "نوشته پیدا نشد." };
  const copy: Post = {
    ...source,
    id: randomUUID(),
    title: `${source.title} (رونوشت)`.trim(),
    slug: uniqueSlug(`${source.slug}-copy`, all.posts, ""),
    status: "draft",
    publishedAt: null,
    featured: false,
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const saved = await db.savePost(copy);
  invalidate(saved.slug);
  return { ok: true, data: saved };
}

export async function setFeaturedAction(
  id: string,
  featured: boolean,
): Promise<ActionResult<boolean>> {
  await requireVerifiedAdmin();
  const all = await db.getDb();
  const post = all.posts.find((p) => p.id === id);
  if (!post) return { ok: false, error: "نوشته پیدا نشد." };
  await db.savePost({
    ...post,
    featured,
    updatedAt: new Date().toISOString(),
  });
  invalidate(post.slug);
  return { ok: true, data: featured };
}