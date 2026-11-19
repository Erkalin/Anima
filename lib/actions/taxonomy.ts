"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { requireVerifiedAdmin } from "@/lib/auth/dal";
import * as db from "@/lib/db";
import type { Author, Category, Tag } from "@/lib/types";
import { slugify } from "@/lib/utils";
import type { ActionResult } from "./posts";

function bump() {
  updateTag("posts");
  updateTag("blog");
  updateTag("taxonomy");
}

export async function saveCategoryAction(
  input: Category,
): Promise<ActionResult<Category>> {
  await requireVerifiedAdmin();
  const name = input.name.trim().slice(0, 60);
  if (!name) return { ok: false, error: "نام دسته لازم است." };
  const clean: Category = {
    ...input,
    id: input.id || randomUUID(),
    name,
    slug: slugify(input.slug) || slugify(name),
    description: input.description.trim().slice(0, 240),
  };
  await db.saveCategory(clean);
  bump();
  return { ok: true, data: clean };
}

export async function deleteCategoryAction(
  id: string,
): Promise<ActionResult<string>> {
  await requireVerifiedAdmin();
  await db.deleteCategory(id);
  bump();
  return { ok: true, data: id };
}

export async function saveTagAction(input: Tag): Promise<ActionResult<Tag>> {
  await requireVerifiedAdmin();
  const name = input.name.trim().slice(0, 40);
  if (!name) return { ok: false, error: "نام برچسب لازم است." };
  const clean: Tag = {
    id: input.id || randomUUID(),
    name,
    slug: slugify(input.slug) || slugify(name),
  };
  await db.saveTag(clean);
  bump();
  return { ok: true, data: clean };
}

export async function deleteTagAction(id: string): Promise<ActionResult<string>> {
  await requireVerifiedAdmin();
  await db.deleteTag(id);
  bump();
  return { ok: true, data: id };
}

export async function saveAuthorAction(
  input: Author,
): Promise<ActionResult<Author>> {
  await requireVerifiedAdmin();
  const name = input.name.trim().slice(0, 80);
  if (!name) return { ok: false, error: "نام نویسنده لازم است." };
  const clean: Author = {
    ...input,
    id: input.id || randomUUID(),
    name,
    role: input.role.trim().slice(0, 80),
    bio: input.bio.trim().slice(0, 400),
  };
  await db.saveAuthor(clean);
  bump();
  return { ok: true, data: clean };
}

export async function deleteAuthorAction(
  id: string,
): Promise<ActionResult<string>> {
  await requireVerifiedAdmin();
  await db.deleteAuthor(id);
  bump();
  return { ok: true, data: id };
}