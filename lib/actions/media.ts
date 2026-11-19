"use server";

import { updateTag } from "next/cache";
import { requireVerifiedAdmin } from "@/lib/auth/dal";
import * as db from "@/lib/db";
import type { Media } from "@/lib/types";
import type { ActionResult } from "./posts";

const MAX_BYTES = 40 * 1024 * 1024;
const MAX_FILES = 12;

export async function uploadMediaAction(
  formData: FormData,
): Promise<ActionResult<Media[]>> {
  await requireVerifiedAdmin();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return { ok: false, error: "فایلی انتخاب نشده است." };
  if (files.length > MAX_FILES)
    return { ok: false, error: `هر بار حداکثر ${MAX_FILES} فایل.` };

  const tooBig = files.find((f) => f.size > MAX_BYTES);
  if (tooBig)
    return {
      ok: false,
      error: `«${tooBig.name}» بزرگ‌تر از ۴۰ مگابایت است.`,
    };

  const out: Media[] = [];
  for (const file of files) {
    out.push(await db.uploadMedia(file));
  }
  updateTag("media");
  return { ok: true, data: out };
}

export async function updateMediaAction(
  media: Media,
): Promise<ActionResult<Media>> {
  await requireVerifiedAdmin();
  const clean: Media = {
    ...media,
    name: media.name.trim().slice(0, 160) || media.name,
    alt: media.alt.trim().slice(0, 300),
    caption: media.caption.trim().slice(0, 300),
  };
  await db.updateMedia(clean);
  updateTag("media");
  return { ok: true, data: clean };
}

export async function deleteMediaAction(
  id: string,
): Promise<ActionResult<string>> {
  await requireVerifiedAdmin();
  await db.deleteMedia(id);
  updateTag("media");
  return { ok: true, data: id };
}