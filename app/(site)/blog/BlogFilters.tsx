"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Category, Tag } from "@/lib/types";
import { toFa } from "@/lib/utils";
import { accentHex } from "@/app/components/blog/PostCard";

export type BlogQuery = {
  q: string;
  category: string;
  tag: string;
  sort: string;
  page: number;
};

const SORTS = [
  { value: "new", label: "تازه‌ترین" },
  { value: "old", label: "قدیمی‌ترین" },
  { value: "read", label: "پربازدیدترین" },
  { value: "short", label: "کوتاه‌ترین" },
];

export function BlogFilters({
  categories,
  tags,
  counts,
  total,
  shown,
  query,
}: {
  categories: Category[];
  tags: Tag[];
  counts: Record<string, number>;
  total: number;
  shown: number;
  query: BlogQuery;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [term, setTerm] = useState(query.q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skip = useRef(true);

  useEffect(() => setTerm(query.q), [query.q]);

  function push(next: Partial<BlogQuery>) {
    const merged = { ...query, ...next };
    const params = new URLSearchParams();
    if (merged.q.trim()) params.set("q", merged.q.trim());
    if (merged.category) params.set("category", merged.category);
    if (merged.tag) params.set("tag", merged.tag);
    if (merged.sort !== "new") params.set("sort", merged.sort);
    if (merged.page > 1) params.set("page", String(merged.page));
    const qs = params.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (term !== query.q) push({ q: term, page: 1 });
    }, 320);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const filtered = Boolean(query.q || query.category || query.tag);
  const activeTag = tags.find((t) => t.slug === query.tag);

  return (
    <div className="blog-filters" data-pending={pending || undefined}>
      <div className="blog-filters-top">
        <label className="blog-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" fill="none" strokeWidth="1.8" />
            <path d="M16 16l4.5 4.5" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="جست‌وجو در نوشته‌ها…"
            aria-label="جست‌وجو در نوشته‌ها"
          />
          {term ? (
            <button
              type="button"
              className="blog-search-clear"
              onClick={() => setTerm("")}
              aria-label="پاک کردن جست‌وجو"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </label>

        <div className="blog-selects">
          <label className="blog-select">
            <span>برچسب</span>
            <select
              value={query.tag}
              onChange={(e) => push({ tag: e.target.value, page: 1 })}
            >
              <option value="">همه</option>
              {tags.map((t) => (
                <option key={t.id} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="blog-select">
            <span>ترتیب</span>
            <select
              value={query.sort}
              onChange={(e) => push({ sort: e.target.value, page: 1 })}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="blog-cats" role="group" aria-label="دسته‌بندی">
        <button
          type="button"
          className="blog-cat"
          data-on={!query.category || undefined}
          onClick={() => push({ category: "", page: 1 })}
        >
          همه
          <span className="blog-cat-n">{toFa(total)}</span>
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className="blog-cat"
            data-on={query.category === c.slug || undefined}
            style={{ "--tone": accentHex(c.accent) } as React.CSSProperties}
            onClick={() =>
              push({ category: query.category === c.slug ? "" : c.slug, page: 1 })
            }
          >
            <span className="cat-dot" aria-hidden="true" />
            {c.name}
            <span className="blog-cat-n">{toFa(counts[c.slug] ?? 0)}</span>
          </button>
        ))}
      </div>

      <div className="blog-filters-foot">
        <p className="blog-count" aria-live="polite">
          {toFa(shown)} نوشته
          {query.q ? (
            <>
              {" "}برای <b>«{query.q}»</b>
            </>
          ) : null}
          {activeTag ? (
            <>
              {" "}با برچسبِ <b>{activeTag.name}</b>
            </>
          ) : null}
        </p>
        {filtered ? (
          <button
            type="button"
            className="blog-reset"
            onClick={() => {
              setTerm("");
              start(() => router.replace(pathname, { scroll: false }));
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeWidth="2" strokeLinecap="round" />
            </svg>
            پاک کردنِ فیلترها
          </button>
        ) : null}
      </div>
    </div>
  );
}