import type { Metadata } from "next";
import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { AdminTop } from "../AdminShell";
import { PostsTable, type SortKey } from "./PostsTable";

export const metadata: Metadata = { title: "نوشته‌ها" };
export const instant = false;

const SORTS: SortKey[] = ["published", "updated", "title", "views"];

type Query = {
  status?: string;
  sort?: string;
  q?: string;
  category?: string;
};

async function Desk({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const data = await getDb();
  const sort = params.sort as SortKey;
  return (
    <PostsTable
      posts={data.posts}
      categories={data.categories}
      authors={data.authors}
      initial={{
        status: params.status ?? "all",
        sort: SORTS.includes(sort) ? sort : "published",
        q: params.q ?? "",
        category: params.category ?? "",
      }}
    />
  );
}

export default function PostsPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  return (
    <>
      <AdminTop title="نوشته‌ها" sub="همهٔ نوشته‌ها، پیش‌نویس‌ها و زمان‌بندی‌ها" />
      <Suspense fallback={<div className="admin-body" />}>
        <Desk searchParams={searchParams} />
      </Suspense>
    </>
  );
}