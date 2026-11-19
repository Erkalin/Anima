import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getBlogIndex, siteUrl } from "@/lib/blog";
import type { Post } from "@/lib/types";
import { toFa } from "@/lib/utils";
import { Score } from "@/app/components/Art";
import { CtaBand } from "@/app/components/CtaBand";
import { FeaturedPost, PostCard } from "@/app/components/blog/PostCard";
import { BlogFilters, type BlogQuery } from "./BlogFilters";

type Raw = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getBlogIndex();
  return {
    title: settings.blogTitle,
    description: settings.blogDescription,
    alternates: {
      canonical: `${siteUrl()}/blog`,
      types: { "application/rss+xml": `${siteUrl()}/blog/feed.xml` },
    },
    openGraph: {
      title: settings.blogTitle,
      description: settings.blogDescription,
      url: `${siteUrl()}/blog`,
      type: "website",
    },
  };
}

function readQuery(params: Raw): BlogQuery {
  const page = Number(one(params.page));
  return {
    q: one(params.q).slice(0, 80),
    category: one(params.category),
    tag: one(params.tag),
    sort: ["new", "old", "read", "short"].includes(one(params.sort))
      ? one(params.sort)
      : "new",
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
  };
}

function pageHref(query: BlogQuery, page: number): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.tag) params.set("tag", query.tag);
  if (query.sort !== "new") params.set("sort", query.sort);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

async function BlogBody({ searchParams }: { searchParams: Promise<Raw> }) {
  const query = readQuery(await searchParams);
  const { posts, categories, tags, authors, settings } = await getBlogIndex();

  const catBySlug = new Map(categories.map((c) => [c.slug, c]));
  const tagBySlug = new Map(tags.map((t) => [t.slug, t]));
  const counts: Record<string, number> = {};
  for (const p of posts) {
    const slug = categories.find((c) => c.id === p.categoryId)?.slug;
    if (slug) counts[slug] = (counts[slug] ?? 0) + 1;
  }

  const activeCat = catBySlug.get(query.category) ?? null;
  const activeTag = tagBySlug.get(query.tag) ?? null;
  const needle = query.q.trim().toLowerCase();

  let list = posts.filter((p) => {
    if (activeCat && p.categoryId !== activeCat.id) return false;
    if (activeTag && !p.tags.includes(activeTag.name)) return false;
    if (!needle) return true;
    return (
      p.title.toLowerCase().includes(needle) ||
      p.excerpt.toLowerCase().includes(needle) ||
      p.tags.some((t) => t.toLowerCase().includes(needle)) ||
      p.content.toLowerCase().includes(needle)
    );
  });

  const sorters: Record<string, (a: Post, b: Post) => number> = {
    new: (a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
    old: (a, b) => (a.publishedAt ?? "").localeCompare(b.publishedAt ?? ""),
    read: (a, b) => b.views - a.views,
    short: (a, b) => (a.readingMinutes ?? 1) - (b.readingMinutes ?? 1),
  };
  list = [...list].sort(sorters[query.sort]);

  const unfiltered = !query.q && !query.category && !query.tag;
  // The pinned post leaves the paginated pool on every page, not just the one
  // that displays it, or page 2 repeats the last card of page 1.
  const pinned = unfiltered ? (list.find((p) => p.featured) ?? null) : null;
  const rest = pinned ? list.filter((p) => p.id !== pinned.id) : list;

  const per = Math.max(3, settings.postsPerPage);
  const pages = Math.max(1, Math.ceil(rest.length / per));
  const page = Math.min(query.page, pages);
  const hero = page === 1 ? pinned : null;
  const slice = rest.slice((page - 1) * per, page * per);

  const lookupCat = (p: Post) => categories.find((c) => c.id === p.categoryId) ?? null;
  const lookupAuthor = (p: Post) => authors.find((a) => a.id === p.authorId) ?? null;
  const minutes = posts.reduce((sum, p) => sum + (p.readingMinutes ?? 1), 0);

  return (
    <div className="page">
      <section className="blog-hero">
        <div className="blog-hero-art" aria-hidden="true">
          <Score />
        </div>
        <div className="wrap blog-hero-inner">
          <p className="eyebrow">وبلاگ</p>
          <h1>{settings.blogTitle}</h1>
          <p className="lead">{settings.blogDescription}</p>
          <div className="blog-hero-stats">
            <span>
              <b>{toFa(posts.length)}</b> نوشته
            </span>
            <span>
              <b>{toFa(categories.length)}</b> دسته
            </span>
            <span>
              <b>{toFa(minutes)}</b> دقیقه خواندن
            </span>
            <a className="blog-rss" href="/blog/feed.xml">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="6" cy="18" r="2" />
                <path d="M4 4a16 16 0 0116 16M4 10a10 10 0 0110 10" fill="none" strokeWidth="2" strokeLinecap="round" />
              </svg>
              خوراکِ RSS
            </a>
          </div>
        </div>
      </section>

      {hero ? (
        <section className="wrap blog-featured-wrap">
          <FeaturedPost
            post={hero}
            category={lookupCat(hero)}
            author={lookupAuthor(hero)}
          />
        </section>
      ) : null}

      <section className="wrap section blog-list-section">
        {activeCat?.description && !query.q && !query.tag ? (
          <p className="blog-cat-note">{activeCat.description}</p>
        ) : null}

        <BlogFilters
          categories={categories}
          tags={tags}
          counts={counts}
          total={posts.length}
          shown={list.length}
          query={{ ...query, page }}
        />

        {slice.length ? (
          <div className="post-grid">
            {slice.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                category={lookupCat(p)}
                author={lookupAuthor(p)}
              />
            ))}
          </div>
        ) : (
          <div className="blog-empty">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" fill="none" strokeWidth="1.6" />
              <path d="M16 16l4.5 4.5" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <p className="blog-empty-title">چیزی پیدا نشد</p>
            <p className="muted-note">
              {posts.length
                ? "با این فیلترها نوشته‌ای نیست. عبارت را کوتاه‌تر کنید یا دسته را بردارید."
                : "هنوز نوشته‌ای منتشر نشده. به‌زودی سر بزنید."}
            </p>
            {posts.length ? (
              <Link className="btn btn-ghost" href="/blog">
                دیدنِ همهٔ نوشته‌ها
              </Link>
            ) : null}
          </div>
        )}

        {pages > 1 ? (
          <nav className="pager" aria-label="صفحه‌های وبلاگ">
            {page > 1 ? (
              <Link className="pager-step" href={pageHref(query, page - 1)} rel="prev">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                قبلی
              </Link>
            ) : (
              <span className="pager-step is-off" aria-hidden="true">
                قبلی
              </span>
            )}
            <ol className="pager-pages">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <li key={n}>
                  {n === page ? (
                    <span className="pager-n is-on" aria-current="page">
                      {toFa(n)}
                    </span>
                  ) : (
                    <Link className="pager-n" href={pageHref(query, n)}>
                      {toFa(n)}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
            {page < pages ? (
              <Link className="pager-step" href={pageHref(query, page + 1)} rel="next">
                بعدی
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 6l-6 6 6 6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ) : (
              <span className="pager-step is-off" aria-hidden="true">
                بعدی
              </span>
            )}
          </nav>
        ) : null}
      </section>

      <CtaBand />
    </div>
  );
}

export default function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Raw>;
}) {
  return (
    <Suspense
      fallback={
        <div className="page">
          <div className="wrap blog-loading" aria-busy="true">
            <span className="blog-loading-bar" />
            <span className="blog-loading-bar" />
            <span className="blog-loading-bar" />
          </div>
        </div>
      }
    >
      <BlogBody searchParams={searchParams} />
    </Suspense>
  );
}