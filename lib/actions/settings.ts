"use server";

import { updateTag } from "next/cache";
import { requireVerifiedAdmin } from "@/lib/auth/dal";
import * as db from "@/lib/db";
import type { Settings } from "@/lib/types";
import type { ActionResult } from "./posts";

export async function saveSettingsAction(
  input: Settings,
): Promise<ActionResult<Settings>> {
  await requireVerifiedAdmin();
  const clean: Settings = {
    brand: input.brand.trim().slice(0, 80) || "آنیما",
    telegramUsername: input.telegramUsername
      .trim()
      .replace(/^@/, "")
      .replace(/^https?:\/\/t\.me\//i, "")
      .replace(/[^A-Za-z0-9_]/g, "")
      .slice(0, 32),
    blogTitle: input.blogTitle.trim().slice(0, 80) || "وبلاگ",
    blogDescription: input.blogDescription.trim().slice(0, 240),
    postsPerPage: Math.min(24, Math.max(3, Math.round(input.postsPerPage) || 9)),
    defaultAuthorId: input.defaultAuthorId,
    defaultToc: Boolean(input.defaultToc),
    defaultAccent: input.defaultAccent,
  };
  await db.saveSettings(clean);
  updateTag("posts");
  updateTag("blog");
  updateTag("settings");
  return { ok: true, data: clean };
}