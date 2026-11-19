"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deletePostsAction,
  duplicatePostAction,
  restorePostsAction,
  setFeaturedAction,
  setStatusAction,
} from "@/lib/actions/posts";
import {
  STATUS_LABEL,
  type Author,
  type Category,
  type Post,
  type PostStatus,
} from "@/lib/types";
import { countWords, faDate, faRelative, toFa } from "@/lib/utils";
import { Icon } from "@/app/components/admin/Icons";
import { Empty, Modal, useToast } from "@/app/components/admin/ui";

export type SortKey = "published" | "updated" | "title" | "views";

const SORT_LABEL: Record<SortKey, string> = {
  published: "تاریخ انتشار",
  updated: "آخرین تغییر",
  title: "عنوان",
  views: "بازدید",
};

const FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "published", label: STATUS_LABEL.published },
  { id: "draft", label: STATUS_LABEL.draft },
  { id: "scheduled", label: STATUS_LABEL.scheduled },
  { id: "archived", label: STATUS_LABEL.archived },
];

export function PostsTable({
  posts,
  categories,
  authors,
  initial,
}: {
  posts: Post[];
  categories: Category[];
  authors: Author[];
  initial: { status: string; sort: SortKey; q: string; category: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState(posts);
  const [status, setStatus] = useState(initial.status);
  const [sort, setSort] = useState<SortKey>(initial.sort);
  const [q, setQ] = useState(initial.q);
  const [category, setCategory] = useState(initial.category);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Post[] | null>(null);
  const first = useRef(true);

  useEffect(() => setRows(posts), [posts]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (sort !== "published") params.set("sort", sort);
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/admin/posts?${qs}` : "/admin/posts");
  }, [status, sort, q, category]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: rows.length };
    for (const p of rows) map[p.status] = (map[p.status] ?? 0) + 1;
    return map;
  }, [rows]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = rows.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (category && p.categoryId !== category) return false;
      if (!needle) return true;
      return (
        p.title.toLowerCase().includes(needle) ||
        p.slug.toLowerCase().includes(needle) ||
        p.excerpt.toLowerCase().includes(needle) ||
        p.tags.some((t) => t.toLowerCase().includes(needle))
      );
    });
    return list.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "fa");
      if (sort === "views") return b.views - a.views;
      if (sort === "updated") return b.updatedAt.localeCompare(a.updatedAt);
      return (b.publishedAt ?? b.createdAt).localeCompare(
        a.publishedAt ?? a.createdAt,
      );
    });
  }, [rows, status, category, q, sort]);

  const allOn = shown.length > 0 && shown.every((p) => picked.includes(p.id));
  const chosen = rows.filter((p) => picked.includes(p.id));

  function toggle(id: string) {
    setPicked((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
  }

  async function changeStatus(ids: string[], next: PostStatus) {
    setBusy(true);
    const before = rows;
    const now = new Date().toISOString();
    setRows((list) =>
      list.map((p) =>
        ids.includes(p.id)
          ? {
              ...p,
              status: next,
              publishedAt:
                next === "published"
                  ? p.publishedAt && p.publishedAt <= now
                    ? p.publishedAt
                    : now
                  : next === "draft" || next === "archived"
                    ? p.publishedAt
                    : p.publishedAt ?? now,
              updatedAt: now,
            }
          : p,
      ),
    );
    const res = await setStatusAction(ids, next);
    setBusy(false);
    if (!res.ok) {
      setRows(before);
      toast.err(res.error);
      return;
    }
    setPicked([]);
    toast.ok(
      `${toFa(ids.length)} نوشته ${STATUS_LABEL[next]} شد.`,
      next === "published" && ids.length === 1
        ? {
            label: "دیدن",
            run: () =>
              window.open(`/blog/${res.data.slugs[0]}`, "_blank", "noopener"),
          }
        : undefined,
    );
    router.refresh();
  }

  async function remove(targets: Post[]) {
    setConfirm(null);
    setBusy(true);
    const ids = targets.map((p) => p.id);
    setRows((list) => list.filter((p) => !ids.includes(p.id)));
    setPicked((list) => list.filter((id) => !ids.includes(id)));
    const res = await deletePostsAction(ids);
    setBusy(false);
    if (!res.ok) {
      setRows((list) => [...targets, ...list]);
      toast.err(res.error);
      return;
    }
    const gone = res.data;
    toast.info(`${toFa(gone.length)} نوشته حذف شد.`, {
      label: "بازگرداندن",
      run: async () => {
        const back = await restorePostsAction(gone);
        if (back.ok) {
          setRows((list) => [...gone, ...list]);
          toast.ok("نوشته‌ها برگشتند.");
          router.refresh();
        } else {
          toast.err(back.error);
        }
      },
    });
    router.refresh();
  }

  async function duplicate(id: string) {
    setBusy(true);
    const res = await duplicatePostAction(id);
    setBusy(false);
    if (!res.ok) return toast.err(res.error);
    setRows((list) => [res.data, ...list]);
    toast.ok("رونوشت ساخته شد.", {
      label: "باز کردن",
      run: () => router.push(`/admin/posts/${res.data.id}`),
    });
    router.refresh();
  }

  async function feature(p: Post) {
    const next = !p.featured;
    setRows((list) =>
      list.map((x) => (x.id === p.id ? { ...x, featured: next } : x)),
    );
    const res = await setFeaturedAction(p.id, next);
    if (!res.ok) {
      setRows((list) =>
        list.map((x) => (x.id === p.id ? { ...x, featured: !next } : x)),
      );
      toast.err(res.error);
      return;
    }
    toast.ok(next ? "به سرِ وبلاگ سنجاق شد." : "از سرِ وبلاگ برداشته شد.");
    router.refresh();
  }

  const authorName = (id: string | null) =>
    authors.find((a) => a.id === id)?.name ?? "—";
  const catName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "بی‌دسته";

  return (
    <div className="admin-body">
      <section className="panel">
        <div className="panel-head">
          <div className="filters" style={{ flex: 1 }}>
            <label className="search">
              <Icon name="search" />
              <input
                className="input"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="جست‌وجو در عنوان، نشانی، خلاصه و برچسب…"
                aria-label="جست‌وجوی نوشته‌ها"
              />
            </label>
            <select
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="دسته"
              style={{ width: "auto", minWidth: "9rem" }}
            >
              <option value="">همهٔ دسته‌ها</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="ترتیب"
              style={{ width: "auto", minWidth: "9rem" }}
            >
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  ترتیب: {SORT_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <Link className="btn btn-brass btn-sm" href="/admin/posts/new">
            <Icon name="plus" /> نوشتهٔ تازه
          </Link>
        </div>

        <div className="panel-head" style={{ borderBottom: "1px solid var(--oak)" }}>
          <div className="seg" role="tablist" aria-label="وضعیت">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={status === f.id}
                className={status === f.id ? "is-on" : undefined}
                onClick={() => setStatus(f.id)}
              >
                {f.label}
                <span style={{ opacity: 0.7 }}>{toFa(counts[f.id] ?? 0)}</span>
              </button>
            ))}
          </div>
          <div className="admin-top-spacer" />
          <p className="panel-note">
            {toFa(shown.length)} نوشته نمایش داده می‌شود
          </p>
        </div>

        {picked.length ? (
          <div className="bulkbar">
            <strong>{toFa(picked.length)} نوشته انتخاب شده</strong>
            <div className="admin-top-spacer" />
            <button
              className="btn btn-verdigris btn-sm"
              type="button"
              disabled={busy}
              onClick={() => changeStatus(picked, "published")}
            >
              <Icon name="publish" /> انتشار
            </button>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              disabled={busy}
              onClick={() => changeStatus(picked, "draft")}
            >
              <Icon name="edit" /> پیش‌نویس
            </button>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              disabled={busy}
              onClick={() => changeStatus(picked, "archived")}
            >
              <Icon name="folder" /> بایگانی
            </button>
            <button
              className="btn btn-danger btn-sm"
              type="button"
              disabled={busy}
              onClick={() => setConfirm(chosen)}
            >
              <Icon name="trash" /> حذف
            </button>
            <button
              className="btn btn-quiet btn-sm"
              type="button"
              onClick={() => setPicked([])}
            >
              <Icon name="x" /> لغوِ انتخاب
            </button>
          </div>
        ) : null}

        <div className="panel-body tight">
          {shown.length ? (
            <div className="tbl-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: "2.5rem" }}>
                      <input
                        className="check"
                        type="checkbox"
                        checked={allOn}
                        onChange={() =>
                          setPicked(allOn ? [] : shown.map((p) => p.id))
                        }
                        aria-label="انتخاب همه"
                      />
                    </th>
                    <th>نوشته</th>
                    <th>وضعیت</th>
                    <th>دسته</th>
                    <th>نویسنده</th>
                    <th>
                      <button type="button" onClick={() => setSort("published")}>
                        تاریخ <Icon name="sort" />
                      </button>
                    </th>
                    <th>
                      <button type="button" onClick={() => setSort("views")}>
                        بازدید <Icon name="sort" />
                      </button>
                    </th>
                    <th style={{ textAlign: "end" }}>کارها</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((p) => (
                    <tr
                      key={p.id}
                      className={picked.includes(p.id) ? "is-selected" : undefined}
                    >
                      <td>
                        <input
                          className="check"
                          type="checkbox"
                          checked={picked.includes(p.id)}
                          onChange={() => toggle(p.id)}
                          aria-label={`انتخاب ${p.title || "بی‌عنوان"}`}
                        />
                      </td>
                      <td>
                        <span className="tbl-title">
                          {p.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              className="tbl-thumb"
                              src={p.coverUrl}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <span className="tbl-thumb tbl-thumb-empty">
                              <Icon name="note" />
                            </span>
                          )}
                          <span style={{ minWidth: 0 }}>
                            <Link
                              className="tbl-name"
                              href={`/admin/posts/${p.id}`}
                            >
                              {p.featured ? (
                                <Icon
                                  name="star"
                                  filled
                                  className="tbl-star"
                                />
                              ) : null}
                              {p.title || "بی‌عنوان"}
                            </Link>
                            <span className="tbl-slug">/blog/{p.slug}</span>
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className="pill" data-tone={p.status}>
                          <span className="pill-dot" />
                          {STATUS_LABEL[p.status]}
                        </span>
                      </td>
                      <td className="muted">{catName(p.categoryId)}</td>
                      <td className="muted">{authorName(p.authorId)}</td>
                      <td className="muted">
                        {p.publishedAt ? faDate(p.publishedAt) : "—"}
                        <span
                          className="muted"
                          style={{ display: "block", fontSize: "0.7rem" }}
                        >
                          {toFa(countWords(p.content))} واژه ·{" "}
                          {faRelative(p.updatedAt)}
                        </span>
                      </td>
                      <td className="muted">{toFa(p.views)}</td>
                      <td>
                        <span className="tbl-actions">
                          <button
                            className="icon-btn"
                            type="button"
                            onClick={() => feature(p)}
                            aria-label={
                              p.featured ? "برداشتن از سرِ وبلاگ" : "سنجاق کردن"
                            }
                            title={
                              p.featured ? "برداشتن از سرِ وبلاگ" : "سنجاق کردن"
                            }
                            data-on={p.featured || undefined}
                          >
                            <Icon name="star" filled={p.featured} />
                          </button>
                          <button
                            className="icon-btn"
                            type="button"
                            disabled={busy}
                            onClick={() => duplicate(p.id)}
                            aria-label="رونوشت"
                            title="رونوشت"
                          >
                            <Icon name="copy" />
                          </button>
                          {p.status === "published" ? (
                            <Link
                              className="icon-btn"
                              href={`/blog/${p.slug}`}
                              target="_blank"
                              aria-label="دیدن در سایت"
                              title="دیدن در سایت"
                            >
                              <Icon name="external" />
                            </Link>
                          ) : (
                            <button
                              className="icon-btn"
                              type="button"
                              disabled={busy || !p.title.trim()}
                              onClick={() => changeStatus([p.id], "published")}
                              aria-label="انتشار"
                              title="انتشار"
                            >
                              <Icon name="publish" />
                            </button>
                          )}
                          <Link
                            className="icon-btn"
                            href={`/admin/posts/${p.id}`}
                            aria-label="ویرایش"
                            title="ویرایش"
                          >
                            <Icon name="edit" />
                          </Link>
                          <button
                            className="icon-btn"
                            type="button"
                            disabled={busy}
                            onClick={() => setConfirm([p])}
                            aria-label="حذف"
                            title="حذف"
                          >
                            <Icon name="trash" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              icon="search"
              title={
                rows.length
                  ? "چیزی با این فیلترها پیدا نشد"
                  : "هنوز نوشته‌ای ندارید"
              }
              note={
                rows.length
                  ? "فیلترها را بردارید یا عبارت دیگری جست‌وجو کنید."
                  : "اولین نوشته را بنویسید؛ با یک دکمه منتشر می‌شود."
              }
              action={
                rows.length ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => {
                      setQ("");
                      setStatus("all");
                      setCategory("");
                    }}
                  >
                    <Icon name="refresh" /> برداشتنِ فیلترها
                  </button>
                ) : (
                  <Link className="btn btn-brass btn-sm" href="/admin/posts/new">
                    <Icon name="plus" /> نوشتهٔ تازه
                  </Link>
                )
              }
            />
          )}
        </div>
      </section>

      {confirm ? (
        <Modal
          title={confirm.length === 1 ? "حذفِ نوشته" : "حذفِ نوشته‌ها"}
          sub="بعد از حذف، تا چند ثانیه فرصتِ بازگرداندن دارید."
          onClose={() => setConfirm(null)}
          size="narrow"
          foot={
            <>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setConfirm(null)}
              >
                نگه دار
              </button>
              <button
                className="btn btn-danger"
                type="button"
                onClick={() => remove(confirm)}
              >
                <Icon name="trash" /> حذف کن
              </button>
            </>
          }
        >
          <ul className="list-plain">
            {confirm.map((p) => (
              <li key={p.id}>
                <span className="rank">
                  <Icon name="posts" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="tbl-name">{p.title || "بی‌عنوان"}</span>
                  <span className="tbl-slug">/blog/{p.slug}</span>
                </span>
              </li>
            ))}
          </ul>
        </Modal>
      ) : null}
    </div>
  );
}