import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type {
  Admin,
  Author,
  Category,
  Db,
  Media,
  Post,
  PostStatus,
  Settings,
  Tag,
} from "../types";
import { DEFAULT_TYPOGRAPHY } from "../types";
import { mediaKindFromMime, safeFileName } from "../utils";
import { createSeed } from "./seed";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "blog-media";

export function supabaseConfigured(): boolean {
  return Boolean(URL && ANON && SERVICE);
}

let service: SupabaseClient | null = null;

/** Server-only. Bypasses RLS, so it must never reach a client bundle. */
export function serviceClient(): SupabaseClient {
  if (!service) {
    service = createClient(URL, SERVICE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return service;
}

let anon: SupabaseClient | null = null;

/** Used for password sign-in only; RLS applies to everything it reads. */
export function anonClient(): SupabaseClient {
  if (!anon) {
    anon = createClient(URL, ANON, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return anon;
}

type Row = Record<string, unknown>;

const str = (v: unknown, fallback = "") =>
  typeof v === "string" ? v : fallback;
const num = (v: unknown, fallback = 0) =>
  typeof v === "number" ? v : fallback;
const bool = (v: unknown, fallback = false) =>
  typeof v === "boolean" ? v : fallback;
const nullable = (v: unknown) => (typeof v === "string" ? v : null);

function toPost(r: Row): Post {
  const typo = (r.typography ?? {}) as Row;
  const seo = (r.seo ?? {}) as Row;
  return {
    id: str(r.id),
    title: str(r.title),
    slug: str(r.slug),
    excerpt: str(r.excerpt),
    content: str(r.content),
    status: str(r.status, "draft") as PostStatus,
    coverUrl: nullable(r.cover_url),
    coverAlt: str(r.cover_alt),
    coverLayout: str(r.cover_layout, "contained") as Post["coverLayout"],
    categoryId: nullable(r.category_id),
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    authorId: nullable(r.author_id),
    publishedAt: nullable(r.published_at),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
    featured: bool(r.featured),
    toc: bool(r.toc, true),
    readingMinutes: typeof r.reading_minutes === "number" ? r.reading_minutes : null,
    typography: {
      scale: num(typo.scale, DEFAULT_TYPOGRAPHY.scale),
      leading: num(typo.leading, DEFAULT_TYPOGRAPHY.leading),
      measure: num(typo.measure, DEFAULT_TYPOGRAPHY.measure),
      accent: str(typo.accent, "brass") as Post["typography"]["accent"],
    },
    seo: {
      title: str(seo.title),
      description: str(seo.description),
      ogImage: nullable(seo.ogImage),
      noindex: bool(seo.noindex),
    },
    customCss: str(r.custom_css),
    showAuthor: bool(r.show_author, true),
    showShare: bool(r.show_share, true),
    showRelated: bool(r.show_related, true),
    views: num(r.views),
  };
}

function fromPost(p: Post): Row {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: p.content,
    status: p.status,
    cover_url: p.coverUrl,
    cover_alt: p.coverAlt,
    cover_layout: p.coverLayout,
    category_id: p.categoryId,
    tags: p.tags,
    author_id: p.authorId,
    published_at: p.publishedAt,
    created_at: p.createdAt,
    featured: p.featured,
    toc: p.toc,
    reading_minutes: p.readingMinutes,
    typography: p.typography,
    seo: p.seo,
    custom_css: p.customCss,
    show_author: p.showAuthor,
    show_share: p.showShare,
    show_related: p.showRelated,
    views: p.views,
  };
}

function toMedia(r: Row): Media {
  return {
    id: str(r.id),
    name: str(r.name),
    url: str(r.url),
    kind: str(r.kind, "file") as Media["kind"],
    mime: str(r.mime),
    size: num(r.size),
    width: typeof r.width === "number" ? r.width : null,
    height: typeof r.height === "number" ? r.height : null,
    alt: str(r.alt),
    caption: str(r.caption),
    createdAt: str(r.created_at),
  };
}

function toCategory(r: Row): Category {
  return {
    id: str(r.id),
    name: str(r.name),
    slug: str(r.slug),
    accent: str(r.accent, "brass") as Category["accent"],
    description: str(r.description),
  };
}

function toAuthor(r: Row): Author {
  return {
    id: str(r.id),
    name: str(r.name),
    role: str(r.role),
    bio: str(r.bio),
    avatarUrl: nullable(r.avatar_url),
  };
}

function fail(context: string, error: { message: string } | null): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

export async function readSupabaseDb(): Promise<Db> {
  const db = serviceClient();
  const [posts, media, categories, tags, authors, admins, settings] =
    await Promise.all([
      db.from("posts").select("*").order("created_at", { ascending: false }),
      db.from("media").select("*").order("created_at", { ascending: false }),
      db.from("categories").select("*").order("name"),
      db.from("tags").select("*").order("name"),
      db.from("authors").select("*").order("name"),
      db.from("admins").select("*"),
      db.from("settings").select("data").eq("id", 1).maybeSingle(),
    ]);

  fail("posts", posts.error);
  fail("media", media.error);
  fail("categories", categories.error);

  const seed = createSeed();
  const storedSettings = (settings.data?.data ?? {}) as Partial<Settings>;

  return {
    posts: (posts.data ?? []).map(toPost),
    media: (media.data ?? []).map(toMedia),
    categories: (categories.data ?? []).map(toCategory),
    tags: (tags.data ?? []).map(
      (r): Tag => ({ id: str(r.id), name: str(r.name), slug: str(r.slug) }),
    ),
    authors: (authors.data ?? []).map(toAuthor),
    admins: (admins.data ?? []).map(
      (r): Admin => ({
        id: str(r.id),
        email: str(r.email),
        name: str(r.name),
        role: str(r.role, "editor") as Admin["role"],
      }),
    ),
    settings: { ...seed.settings, ...storedSettings },
  };
}

export async function saveSupabasePost(post: Post): Promise<Post> {
  const { data, error } = await serviceClient()
    .from("posts")
    .upsert(fromPost(post))
    .select()
    .single();
  fail("save post", error);
  return toPost(data as Row);
}

export async function deleteSupabasePost(id: string): Promise<void> {
  const { error } = await serviceClient().from("posts").delete().eq("id", id);
  fail("delete post", error);
}

export async function setSupabaseStatus(
  ids: string[],
  status: PostStatus,
  publishedAt: string | null,
): Promise<void> {
  const patch: Row = { status };
  if (publishedAt !== null) patch.published_at = publishedAt;
  const { error } = await serviceClient()
    .from("posts")
    .update(patch)
    .in("id", ids);
  fail("set status", error);
}

export async function addSupabaseMedia(media: Media): Promise<void> {
  const { error } = await serviceClient().from("media").insert({
    id: media.id,
    name: media.name,
    url: media.url,
    kind: media.kind,
    mime: media.mime,
    size: media.size,
    width: media.width,
    height: media.height,
    alt: media.alt,
    caption: media.caption,
    created_at: media.createdAt,
  });
  fail("add media", error);
}

export async function updateSupabaseMedia(media: Media): Promise<void> {
  const { error } = await serviceClient()
    .from("media")
    .update({
      name: media.name,
      alt: media.alt,
      caption: media.caption,
      width: media.width,
      height: media.height,
    })
    .eq("id", media.id);
  fail("update media", error);
}

export async function deleteSupabaseMedia(id: string): Promise<void> {
  const db = serviceClient();
  const { data } = await db.from("media").select("url").eq("id", id).maybeSingle();
  const url = str(data?.url);
  const marker = `/object/public/${BUCKET}/`;
  if (url.includes(marker)) {
    await db.storage.from(BUCKET).remove([url.split(marker)[1]]);
  }
  const { error } = await db.from("media").delete().eq("id", id);
  fail("delete media", error);
}

export async function saveSupabaseCategory(c: Category): Promise<void> {
  const { error } = await serviceClient().from("categories").upsert({
    id: c.id,
    name: c.name,
    slug: c.slug,
    accent: c.accent,
    description: c.description,
  });
  fail("save category", error);
}

export async function deleteSupabaseCategory(id: string): Promise<void> {
  const { error } = await serviceClient()
    .from("categories")
    .delete()
    .eq("id", id);
  fail("delete category", error);
}

export async function saveSupabaseTag(t: Tag): Promise<void> {
  const { error } = await serviceClient()
    .from("tags")
    .upsert({ id: t.id, name: t.name, slug: t.slug });
  fail("save tag", error);
}

export async function deleteSupabaseTag(id: string): Promise<void> {
  const { error } = await serviceClient().from("tags").delete().eq("id", id);
  fail("delete tag", error);
}

export async function saveSupabaseAuthor(a: Author): Promise<void> {
  const { error } = await serviceClient().from("authors").upsert({
    id: a.id,
    name: a.name,
    role: a.role,
    bio: a.bio,
    avatar_url: a.avatarUrl,
  });
  fail("save author", error);
}

export async function deleteSupabaseAuthor(id: string): Promise<void> {
  const { error } = await serviceClient().from("authors").delete().eq("id", id);
  fail("delete author", error);
}

export async function saveSupabaseSettings(s: Settings): Promise<void> {
  const { error } = await serviceClient()
    .from("settings")
    .upsert({ id: 1, data: s, updated_at: new Date().toISOString() });
  fail("save settings", error);
}

export async function findSupabaseAdminByEmail(
  email: string,
): Promise<Admin | null> {
  const { data } = await serviceClient()
    .from("admins")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (!data) return null;
  return {
    id: str(data.id),
    email: str(data.email),
    name: str(data.name),
    role: str(data.role, "editor") as Admin["role"],
  };
}

export async function incrementSupabaseViews(slug: string): Promise<void> {
  await serviceClient().rpc("increment_post_views", { post_slug: slug });
}

export async function saveSupabaseUpload(file: File): Promise<Media> {
  const name = safeFileName(file.name || "file");
  const key = `${new Date().getFullYear()}/${randomUUID().slice(0, 8)}-${name}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const db = serviceClient();
  const { error } = await db.storage
    .from(BUCKET)
    .upload(key, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  fail("upload", error);
  const { data } = db.storage.from(BUCKET).getPublicUrl(key);
  const media: Media = {
    id: randomUUID(),
    name,
    url: data.publicUrl,
    kind: mediaKindFromMime(file.type, name),
    mime: file.type || "application/octet-stream",
    size: buffer.byteLength,
    width: null,
    height: null,
    alt: "",
    caption: "",
    createdAt: new Date().toISOString(),
  };
  await addSupabaseMedia(media);
  return media;
}