import "server-only";
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
import * as local from "./local";
import * as remote from "./supabase";

export type StorageMode = "supabase" | "local";

export function storageMode(): StorageMode {
  return remote.supabaseConfigured() ? "supabase" : "local";
}

const useRemote = () => storageMode() === "supabase";

export async function getDb(): Promise<Db> {
  return useRemote() ? remote.readSupabaseDb() : local.readLocalDb();
}

export async function savePost(post: Post): Promise<Post> {
  return useRemote()
    ? remote.saveSupabasePost(post)
    : local.saveLocalPost(post);
}

export async function deletePost(id: string): Promise<void> {
  return useRemote()
    ? remote.deleteSupabasePost(id)
    : local.deleteLocalPost(id);
}

export async function setPostStatus(
  ids: string[],
  status: PostStatus,
  publishedAt: string | null,
): Promise<void> {
  return useRemote()
    ? remote.setSupabaseStatus(ids, status, publishedAt)
    : local.setLocalStatus(ids, status, publishedAt);
}

export async function updateMedia(media: Media): Promise<void> {
  return useRemote()
    ? remote.updateSupabaseMedia(media)
    : local.updateLocalMedia(media);
}

export async function deleteMedia(id: string): Promise<void> {
  return useRemote()
    ? remote.deleteSupabaseMedia(id)
    : local.deleteLocalMedia(id);
}

export async function saveCategory(c: Category): Promise<void> {
  return useRemote()
    ? remote.saveSupabaseCategory(c)
    : local.saveLocalCategory(c);
}

export async function deleteCategory(id: string): Promise<void> {
  return useRemote()
    ? remote.deleteSupabaseCategory(id)
    : local.deleteLocalCategory(id);
}

export async function saveTag(t: Tag): Promise<void> {
  return useRemote() ? remote.saveSupabaseTag(t) : local.saveLocalTag(t);
}

export async function deleteTag(id: string): Promise<void> {
  return useRemote() ? remote.deleteSupabaseTag(id) : local.deleteLocalTag(id);
}

export async function saveAuthor(a: Author): Promise<void> {
  return useRemote() ? remote.saveSupabaseAuthor(a) : local.saveLocalAuthor(a);
}

export async function deleteAuthor(id: string): Promise<void> {
  return useRemote()
    ? remote.deleteSupabaseAuthor(id)
    : local.deleteLocalAuthor(id);
}

export async function saveSettings(s: Settings): Promise<void> {
  return useRemote()
    ? remote.saveSupabaseSettings(s)
    : local.saveLocalSettings(s);
}

export async function findAdminByEmail(email: string): Promise<Admin | null> {
  return useRemote()
    ? remote.findSupabaseAdminByEmail(email)
    : local.findLocalAdminByEmail(email);
}

export async function incrementViews(slug: string): Promise<void> {
  return useRemote()
    ? remote.incrementSupabaseViews(slug)
    : local.incrementLocalViews(slug);
}

/** Stores the bytes and records the row in one step. */
export async function uploadMedia(file: File): Promise<Media> {
  return useRemote()
    ? remote.saveSupabaseUpload(file)
    : local.saveLocalUploadRecord(file);
}

export { readLocalUpload } from "./local";
export { anonClient, supabaseConfigured } from "./supabase";