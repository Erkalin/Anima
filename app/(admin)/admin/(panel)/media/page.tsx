import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { AdminTop } from "../AdminShell";
import { MediaLibrary } from "./MediaLibrary";

export const metadata: Metadata = { title: "رسانه‌ها" };
export const instant = false;

export default async function MediaPage() {
  const data = await getDb();
  return (
    <>
      <AdminTop
        title="رسانه‌ها"
        sub="تصویر، ویدیو، صدا و فایل — هر چه به نوشته پیوست می‌شود"
      />
      <MediaLibrary media={data.media} posts={data.posts} />
    </>
  );
}