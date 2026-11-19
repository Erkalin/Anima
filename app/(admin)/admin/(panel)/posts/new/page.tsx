import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { emptyPost } from "@/lib/types";
import { PostEditor } from "../editor/PostEditor";

export const metadata: Metadata = {
  title: "نوشتهٔ تازه",
};

export const instant = false;

export default async function NewPostPage() {
  const data = await getDb();
  const post = emptyPost(randomUUID());
  post.authorId = data.settings.defaultAuthorId;
  post.toc = data.settings.defaultToc;
  post.typography.accent = data.settings.defaultAccent;

  return (
    <PostEditor
      initial={post}
      isNew
      media={data.media}
      categories={data.categories}
      tags={data.tags}
      authors={data.authors}
      settings={data.settings}
    />
  );
}