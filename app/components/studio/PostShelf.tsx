import Link from "next/link";
import type { CSSProperties } from "react";
import { getBlogIndex } from "@/lib/blog";
import { excerptFrom, faShortDate, toFa } from "@/lib/utils";
import { ArrowIcon } from "./icons";
import { GLOW } from "./tone";

export async function PostShelf() {
  const { posts, categories } = await getBlogIndex();
  const latest = posts.slice(0, 3);

  return (
    <section className="band" id="notes">
      <div className="wrap band-head">
        <div className="band-head-copy">
          <p className="band-kicker">دفتر تمرین</p>
          <h2 className="band-title">یادداشت‌هایی که برای هنرجو می‌نویسیم</h2>
        </div>
        <p className="band-note">
          کوتاه، بی‌ادا و به‌دردبخور؛ همان چیزهایی که سر جلسه توضیح می‌دهیم.
        </p>
      </div>

      <div className="wrap">
        {latest.length === 0 ? (
          <div className="pick-shell">
            <p className="pick-q">دفتر هنوز خالی است.</p>
            <p className="pick-why">
              اولین یادداشت‌ها در راه‌اند. تا آن موقع، سر جلسه هر چه لازم بود می‌پرسی.
            </p>
            <div className="pick-actions">
              <Link className="chip-btn" href="/contact#composer">
                سؤال بپرس
                <ArrowIcon />
              </Link>
            </div>
          </div>
        ) : (
          <div className="shelf">
            {latest.map((post) => {
              const category = categories.find((c) => c.id === post.categoryId) ?? null;
              const tone = GLOW[category?.accent ?? post.typography.accent];
              return (
                <Link
                  key={post.id}
                  className="shelf-card"
                  href={`/blog/${post.slug}`}
                  data-rise
                  style={{ "--tone": tone } as CSSProperties}
                >
                  <div className="shelf-meta">
                    {category && (
                      <span className="shelf-cat">
                        <i aria-hidden="true" />
                        {category.name}
                      </span>
                    )}
                    {post.publishedAt && <time dateTime={post.publishedAt}>{faShortDate(post.publishedAt)}</time>}
                  </div>
                  <h3 className="shelf-title">{post.title}</h3>
                  <p className="shelf-excerpt">
                    {post.excerpt || excerptFrom(post.content, 150)}
                  </p>
                  <div className="shelf-foot">
                    <span>{toFa(post.readingMinutes ?? 1)} دقیقه خواندن</span>
                    <span className="shelf-go">
                      بخوان
                      <ArrowIcon />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {posts.length > 3 && (
          <p style={{ marginTop: "1.6rem" }}>
            <Link className="text-link" href="/blog">
              همه‌ی یادداشت‌ها ({toFa(posts.length)})
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

export function ShelfFallback() {
  return (
    <section className="band">
      <div className="wrap band-head">
        <div className="band-head-copy">
          <p className="band-kicker">دفتر تمرین</p>
          <h2 className="band-title">یادداشت‌هایی که برای هنرجو می‌نویسیم</h2>
        </div>
      </div>
      <div className="wrap">
        <div className="shelf">
          {[0, 1, 2].map((i) => (
            <div className="shelf-card" key={i} style={{ minHeight: "13rem" }}>
              <p className="shelf-meta" role={i === 0 ? "status" : undefined}>
                {i === 0 ? "دفتر باز می‌شود…" : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}