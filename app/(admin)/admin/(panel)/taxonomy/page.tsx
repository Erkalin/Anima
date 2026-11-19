import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { AdminTop } from "../AdminShell";
import { TaxonomyManager } from "./TaxonomyManager";

export const metadata: Metadata = { title: "دسته و برچسب" };
export const instant = false;

export default async function TaxonomyPage() {
  const data = await getDb();
  return (
    <>
      <AdminTop
        title="دسته، برچسب و نویسنده"
        sub="ساختارِ وبلاگ و کسانی که پای نوشته‌ها می‌ایستند"
      />
      <TaxonomyManager
        categories={data.categories}
        tags={data.tags}
        authors={data.authors}
        posts={data.posts}
        media={data.media}
        defaultAuthorId={data.settings.defaultAuthorId}
      />
    </>
  );
}