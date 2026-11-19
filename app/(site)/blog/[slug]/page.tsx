import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import { getBlogIndex, getBlogPost, getPostSlugs, siteUrl, telegramLink } from "@/lib/blog";
import { countWords, faDate, toFa } from "@/lib/utils";
import { extractToc } from "@/lib/markdown/toc";
import { Markdown } from "@/lib/markdown/Markdown";
import { TelegramIcon } from "@/app/components/Art";
import { CategoryChip, PostCard, PostCover, accentHex } from "@/app/components/blog/PostCard";
import { ReadingProgress } from "./ReadingProgress";
import { ArticleToc } from "./ArticleToc";
import { ShareBar } from "./ShareBar";
import { ViewPing } from "./ViewPing";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBlogPost(slug);
  if (!data) return { title: "نوشته پیدا نشد" };

  const { post, settings, author } = data;
  const title = post.seo.title || post.title;
  const description = post.seo.description || post.excerpt;
  const image = post.seo.ogImage || post.coverUrl;
  const url = `${siteUrl()}/blog/${post.slug}`;

  return {
    title,
    description,
    authors: author ? [{ name: author.name }] : undefined,
    keywords: post.tags,
    alternates: { canonical: url },
    robots: post.seo.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: author ? [author.name] : undefined,
      tags: post.tags,
      siteName: settings.brand,
      images: image ? [{ url: image, alt: post.coverAlt }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

async function Article({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getBlogPost(slug);
  if (!data) notFound();

  const { post, author, category, related, settings, newer, older } = data;
  const index = await getBlogIndex();
  const toc = post.toc ? extractToc(post.content) : [];
  const words = countWords(post.content);
  const minutes = post.readingMinutes ?? 1;
  const tone = accentHex(category?.accent ?? post.typography.accent);
  const bodyId = `post-${post.id}`;
  const path = `/blog/${post.slug}`;
  const tg = telegramLink(settings);

  const proseStyle = {
    "--md-scale": post.typography.scale,
    "--md-leading": post.typography.leading,
    "--md-measure": `${post.typography.measure}rem`,
    "--tone": tone,
  } as CSSProperties;

  const customCss = post.customCss.trim();
  const scopedCss = customCss
    ? `#${bodyId}{${customCss.replace(/<\/style/gi, "")}}`
    : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: "fa-IR",
    wordCount: words,
    keywords: post.tags.join(", "),
    mainEntityOfPage: `${siteUrl()}${path}`,
    ...(post.coverUrl ? { image: `${siteUrl()}${post.coverUrl}` } : {}),
    ...(author
      ? { author: { "@type": "Person", name: author.name, description: author.role } }
      : {}),
    publisher: { "@type": "Organization", name: settings.brand },
  };

  const cover =
    post.coverUrl && post.coverLayout !== "none" ? (
      <figure className="article-cover" data-layout={post.coverLayout}>
        <PostCover post={post} />
        {post.coverAlt ? <figcaption>{post.coverAlt}</figcaption> : null}
      </figure>
    ) : null;

  return (
    <div className="page article-page" id="top" style={{ "--tone": tone } as CSSProperties}>
      <ViewPing slug={post.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ReadingProgress targetId={bodyId}>

      <header className="article-head" data-layout={post.coverLayout}>
        <div className="wrap article-head-inner">
          <div className="article-head-copy">
            <nav className="crumbs" aria-label="مسیر">
              <Link href="/">خانه</Link>
              <span aria-hidden="true">/</span>
              <Link href="/blog">وبلاگ</Link>
              {category ? (
                <>
                  <span aria-hidden="true">/</span>
                  <Link href={`/blog?category=${category.slug}`}>{category.name}</Link>
                </>
              ) : null}
            </nav>

            {category ? <CategoryChip category={category} /> : null}
            <h1 className="article-title">{post.title}</h1>
            {post.excerpt ? <p className="article-lead">{post.excerpt}</p> : null}

            <div className="article-meta">
              {author && post.showAuthor ? (
                <span className="byline">
                  <span className="byline-avatar" aria-hidden="true">
                    {author.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={author.avatarUrl} alt="" />
                    ) : (
                      author.name.trim().slice(0, 1)
                    )}
                  </span>
                  <span className="byline-text">
                    <b>{author.name}</b>
                    <small>{author.role}</small>
                  </span>
                </span>
              ) : null}
              <span className="article-meta-item">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" strokeWidth="1.6" />
                  <path d="M3.5 10h17M8 3v4M16 3v4" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                </svg>
                {faDate(post.publishedAt)}
              </span>
              <span className="article-meta-item">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" fill="none" strokeWidth="1.6" />
                  <path d="M12 7.5V12l3 2" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                </svg>
                {toFa(minutes)} دقیقه
              </span>
              <span className="article-meta-item">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" fill="none" strokeWidth="1.6" />
                  <circle cx="12" cy="12" r="2.6" fill="none" strokeWidth="1.6" />
                </svg>
                {toFa(post.views)} بازدید
              </span>
            </div>

            {post.showShare ? <ShareBar title={post.title} path={path} /> : null}
          </div>

          {post.coverLayout === "split" ? cover : null}
        </div>
      </header>

      {post.coverLayout !== "split" ? cover : null}

      <div className="wrap article-shell">
        <aside className="article-rail">
          <div className="article-rail-sticky">
            <ArticleToc items={toc} minutes={minutes} words={words} />
            {post.showShare ? (
              <div className="rail-share">
                <ShareBar title={post.title} path={path} compact />
              </div>
            ) : null}
            <a className="rail-top" href="#top">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 19V5m0 0l-6 6m6-6l6 6" fill="none" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              بازگشت به بالا
            </a>
          </div>
        </aside>

        <div className="article-main">
          <div id={bodyId} className="article-body" style={proseStyle}>
            {scopedCss ? (
              <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
            ) : null}
            <Markdown telegramHref={tg} accent={post.typography.accent}>
              {post.content}
            </Markdown>
          </div>

          {post.tags.length ? (
            <div className="article-tags">
              <span className="article-tags-label">برچسب‌ها</span>
              {post.tags.map((t) => {
                const found = index.tags.find((x) => x.name === t);
                return found ? (
                  <Link key={t} className="tag-link" href={`/blog?tag=${found.slug}`}>
                    #{t}
                  </Link>
                ) : (
                  <span key={t} className="tag-link is-static">
                    #{t}
                  </span>
                );
              })}
            </div>
          ) : null}

          {post.showShare ? (
            <div className="article-share-foot">
              <p>این نوشته به دردِ کسی می‌خورد؟</p>
              <ShareBar title={post.title} path={path} />
            </div>
          ) : null}

          {author && post.showAuthor ? (
            <section className="author-card">
              <span className="author-avatar" aria-hidden="true">
                {author.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={author.avatarUrl} alt="" />
                ) : (
                  author.name.trim().slice(0, 1)
                )}
              </span>
              <div className="author-copy">
                <p className="author-eyebrow">نویسنده</p>
                <h2>{author.name}</h2>
                <p className="author-role">{author.role}</p>
                {author.bio ? <p className="author-bio">{author.bio}</p> : null}
              </div>
            </section>
          ) : null}

          {newer || older ? (
            <nav className="post-neighbours" aria-label="نوشته‌های کنارِ این">
              {newer ? (
                <Link className="neighbour" href={`/blog/${newer.slug}`} data-dir="newer">
                  <span className="neighbour-label">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 6l6 6-6 6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    تازه‌تر
                  </span>
                  <span className="neighbour-title">{newer.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {older ? (
                <Link className="neighbour" href={`/blog/${older.slug}`} data-dir="older">
                  <span className="neighbour-label">
                    قدیمی‌تر
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M15 6l-6 6 6 6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="neighbour-title">{older.title}</span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </div>
      </div>

      {post.showRelated && related.length ? (
        <section className="wrap section related">
          <header className="section-head">
            <h2>از همین جنس</h2>
            <p className="section-note">
              نوشته‌هایی که به این یکی نزدیک‌اند.
            </p>
          </header>
          <div className="post-grid">
            {related.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                category={index.categories.find((c) => c.id === p.categoryId) ?? null}
                author={index.authors.find((a) => a.id === p.authorId) ?? null}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="dark article-cta">
        <div className="wrap">
          <div className="contact">
            <h2>سازت را بردار</h2>
            <p className="contact-text">
              خواندن خوب است؛ نشستن پشت ساز بهتر. برای جلسه‌ی اول پیام بده.
            </p>
            <a className="btn btn-brass btn-lg" href={tg} target="_blank" rel="noreferrer">
              <TelegramIcon />
              پیام در تلگرام
            </a>
            {!settings.telegramUsername ? (
              <p className="pending pending-dark">
                نام کاربری تلگرام به‌زودی اضافه می‌شود.
              </p>
            ) : null}
            <Link className="text-link" href="/blog">
              همهٔ نوشته‌های وبلاگ
            </Link>
          </div>
        </div>
      </section>
      </ReadingProgress>
    </div>
  );
}

export default function PostPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <div className="page">
          <div className="wrap article-loading" aria-busy="true">
            <span className="blog-loading-bar" />
            <span className="blog-loading-bar" />
            <span className="blog-loading-bar" />
            <span className="blog-loading-bar" />
          </div>
        </div>
      }
    >
      <Article params={params} />
    </Suspense>
  );
}