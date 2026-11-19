"use server";

import * as db from "@/lib/db";

/**
 * Views are deliberately not cache-invalidated: the counter is allowed to lag
 * behind the cached article until its next revalidation.
 */
export async function pingViewAction(slug: string): Promise<void> {
  if (!slug || slug.length > 120) return;
  await db.incrementViews(slug);
}