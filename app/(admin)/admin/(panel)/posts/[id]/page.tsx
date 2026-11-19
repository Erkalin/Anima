import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { PostEditor } from "../editor/PostEditor";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const data = await getDb();
  const post = data.posts.find((p) => p.id === id);
  return { title: post?.title ? `ویرایش: ${post.title}` : "ویرایش نوشته" };
}

export default async function EditPostPage({ params }: Params) {
  const { id } = await params;
  const data = await getDb();
  const post = data.posts.find((p) => p.id === id);
  if (!post) notFound();

  return (
    <PostEditor
      key={post.id}
      initial={post}
      isNew={false}
      media={data.media}
      categories={data.categories}
      tags={data.tags}
      authors={data.authors}
      settings={data.settings}
    />
  );
}