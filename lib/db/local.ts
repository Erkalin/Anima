import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
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
import { mediaKindFromMime, safeFileName } from "../utils";
import { SEED_ASSETS, SEED_FILES } from "./assets";
import { createSeed } from "./seed";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export const LOCAL_ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@studio.local";
export const LOCAL_ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "studio1234";
export const LOCAL_CREDENTIALS_ARE_DEFAULT =
  !process.env.ADMIN_EMAIL && !process.env.ADMIN_PASSWORD;

export function hashPassword(password: string): string {
  const salt = randomUUID().replace(/-/g, "");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}

let ready: Promise<void> | null = null;

async function ensureStore(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await mkdir(UPLOAD_DIR, { recursive: true });
      await Promise.all(
        SEED_ASSETS.map(async (asset) => {
          const target = path.join(UPLOAD_DIR, asset.name);
          try {
            await readFile(target);
          } catch {
            await writeFile(target, asset.svg, "utf8");
          }
        }),
      );
      await Promise.all(
        SEED_FILES.map(async (file) => {
          const target = path.join(UPLOAD_DIR, file.name);
          try {
            await readFile(target);
          } catch {
            await writeFile(target, file.data);
          }
        }),
      );
      try {
        await readFile(DB_FILE);
      } catch {
        const seed = createSeed();
        seed.admins = seed.admins.map((a) => ({
          ...a,
          email: LOCAL_ADMIN_EMAIL,
          passwordHash: hashPassword(LOCAL_ADMIN_PASSWORD),
        }));
        await writeFile(DB_FILE, JSON.stringify(seed, null, 2), "utf8");
      }
    })();
  }
  return ready;
}

export async function readLocalDb(): Promise<Db> {
  await ensureStore();
  const raw = await readFile(DB_FILE, "utf8");
  const db = JSON.parse(raw) as Db;
  // An owner who sets ADMIN_EMAIL later still needs to be able to sign in.
  const owner = db.admins.find((a) => a.role === "owner");
  if (owner && owner.email !== LOCAL_ADMIN_EMAIL) {
    owner.email = LOCAL_ADMIN_EMAIL;
  }
  if (owner && !owner.passwordHash) {
    owner.passwordHash = hashPassword(LOCAL_ADMIN_PASSWORD);
  }
  return db;
}

let chain: Promise<unknown> = Promise.resolve();

/** Serialised read-modify-write so concurrent actions cannot clobber the file. */
export function mutateLocalDb<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const db = await readLocalDb();
    const result = await fn(db);
    const tmp = `${DB_FILE}.${randomUUID()}.tmp`;
    await writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await rename(tmp, DB_FILE);
    return result;
  });
  chain = run.catch(() => undefined);
  return run;
}

export async function saveLocalUpload(file: File): Promise<Media> {
  await ensureStore();
  const name = safeFileName(file.name || "file");
  const stored = `${randomUUID().slice(0, 8)}-${name}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, stored), buffer);
  const kind = mediaKindFromMime(file.type, name);
  return {
    id: randomUUID(),
    name,
    url: `/media/${stored}`,
    kind,
    mime: file.type || "application/octet-stream",
    size: buffer.byteLength,
    width: null,
    height: null,
    alt: "",
    caption: "",
    createdAt: new Date().toISOString(),
  };
}

export async function deleteLocalUpload(url: string): Promise<void> {
  const file = url.replace(/^\/media\//, "");
  if (!file || file.includes("/") || file.includes("..")) return;
  await unlink(path.join(UPLOAD_DIR, file)).catch(() => undefined);
}

const MIME: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  flac: "audio/flac",
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  zip: "application/zip",
  json: "application/json",
};

export async function readLocalUpload(
  file: string,
): Promise<{ body: Buffer; mime: string } | null> {
  if (!file || file.includes("/") || file.includes("\\") || file.includes(".."))
    return null;
  await ensureStore();
  try {
    const body = await readFile(path.join(UPLOAD_DIR, file));
    const ext = file.split(".").pop()?.toLowerCase() ?? "";
    return { body, mime: MIME[ext] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

function upsert<T extends { id: string }>(list: T[], item: T): void {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) list.push(item);
  else list[i] = item;
}

export async function saveLocalPost(post: Post): Promise<Post> {
  return mutateLocalDb((db) => {
    upsert(db.posts, post);
    return post;
  });
}

export async function deleteLocalPost(id: string): Promise<void> {
  await mutateLocalDb((db) => {
    db.posts = db.posts.filter((p) => p.id !== id);
  });
}

export async function setLocalStatus(
  ids: string[],
  status: PostStatus,
  publishedAt: string | null,
): Promise<void> {
  await mutateLocalDb((db) => {
    for (const p of db.posts) {
      if (!ids.includes(p.id)) continue;
      p.status = status;
      if (publishedAt !== null) p.publishedAt = publishedAt;
      p.updatedAt = new Date().toISOString();
    }
  });
}

export async function addLocalMedia(media: Media): Promise<void> {
  await mutateLocalDb((db) => {
    db.media.unshift(media);
  });
}

export async function updateLocalMedia(media: Media): Promise<void> {
  await mutateLocalDb((db) => {
    upsert(db.media, media);
  });
}

export async function deleteLocalMedia(id: string): Promise<void> {
  const url = await mutateLocalDb((db) => {
    const found = db.media.find((m) => m.id === id);
    db.media = db.media.filter((m) => m.id !== id);
    return found?.url ?? "";
  });
  if (url.startsWith("/media/")) await deleteLocalUpload(url);
}

export async function saveLocalCategory(c: Category): Promise<void> {
  await mutateLocalDb((db) => {
    upsert(db.categories, c);
  });
}

export async function deleteLocalCategory(id: string): Promise<void> {
  await mutateLocalDb((db) => {
    db.categories = db.categories.filter((c) => c.id !== id);
    for (const p of db.posts) if (p.categoryId === id) p.categoryId = null;
  });
}

export async function saveLocalTag(t: Tag): Promise<void> {
  await mutateLocalDb((db) => {
    upsert(db.tags, t);
  });
}

export async function deleteLocalTag(id: string): Promise<void> {
  await mutateLocalDb((db) => {
    const tag = db.tags.find((t) => t.id === id);
    db.tags = db.tags.filter((t) => t.id !== id);
    if (tag) {
      for (const p of db.posts) p.tags = p.tags.filter((n) => n !== tag.name);
    }
  });
}

export async function saveLocalAuthor(a: Author): Promise<void> {
  await mutateLocalDb((db) => {
    upsert(db.authors, a);
  });
}

export async function deleteLocalAuthor(id: string): Promise<void> {
  await mutateLocalDb((db) => {
    db.authors = db.authors.filter((a) => a.id !== id);
    for (const p of db.posts) if (p.authorId === id) p.authorId = null;
  });
}

export async function saveLocalSettings(s: Settings): Promise<void> {
  await mutateLocalDb((db) => {
    db.settings = s;
  });
}

export async function findLocalAdminByEmail(
  email: string,
): Promise<Admin | null> {
  const db = await readLocalDb();
  return db.admins.find((a) => a.email === email.toLowerCase()) ?? null;
}

export async function incrementLocalViews(slug: string): Promise<void> {
  await mutateLocalDb((db) => {
    const p = db.posts.find((x) => x.slug === slug && x.status === "published");
    if (p) p.views += 1;
  });
}

export async function saveLocalUploadRecord(file: File): Promise<Media> {
  const media = await saveLocalUpload(file);
  await addLocalMedia(media);
  return media;
}