import Link from "next/link";
import type { ReactNode } from "react";
import { ACCENTS, type AccentKey, type Author, type Category, type Post } from "@/lib/types";
import { faDate, toFa } from "@/lib/utils";
import { Metronome, PianoKeys, Staff, ViolinArt } from "@/app/components/Art";

export function accentHex(key: AccentKey | undefined): string {
  return ACCENTS.find((a) => a.key === key)?.hex ?? ACCENTS[0].hex;
}

/** Picks line art that matches what the post is about, for covers still empty. */
function coverArt(post: Post): ReactNode {
  const hay = `${post.title} ${post.tags.join(" ")}`;
  if (hay.includes("مترونوم")) return <Metronome />;
  if (hay.includes("ویولن") || hay.includes("کوک") || hay.includes("آرشه"))
    return <ViolinArt />;
  if (hay.includes("پیانو") || hay.includes("کلاویه")) return <PianoKeys />;
  return <Staff />;
}

export function PostCover({
  post,
  className,
  sizes,
}: {
  post: Post;
  className?: string;
  sizes?: string;
}) {
  return (
    <span className={className ? `post-cover ${className}` : "post-cover"}>
      {post.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverUrl}
          alt={post.coverAlt}
          loading="lazy"
          decoding="async"
          sizes={sizes}
        />
      ) : (
        <span className="post-cover-art" aria-hidden="true">
          {coverArt(post)}
        </span>
      )}
    </span>
  );
}

export function CategoryChip({ category }: { category: Category }) {
  return (
    <span
      className="cat-chip"
      style={{ "--tone": accentHex(category.accent) } as React.CSSProperties}
    >
      <span className="cat-dot" aria-hidden="true" />
      {category.name}
    </span>
  );
}

function ReadMeta({ post }: { post: Post }) {
  return (
    <>
      <span>{faDate(post.publishedAt)}</span>
      <span className="dot-sep" aria-hidden="true" />
      <span>{toFa(post.readingMinutes ?? 1)} دقیقه خواندن</span>
    </>
  );
}

export function PostCard({
  post,
  category,
  author,
}: {
  post: Post;
  category: Category | null;
  author: Author | null;
}) {
  return (
    <article
      className="post-card"
      data-reveal
      style={{ "--tone": accentHex(category?.accent ?? post.typography.accent) } as React.CSSProperties}
    >
      <Link
        className="post-card-cover"
        href={`/blog/${post.slug}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        <PostCover post={post} />
        {category ? <CategoryChip category={category} /> : null}
      </Link>
      <div className="post-card-body">
        <p className="post-card-meta">
          <ReadMeta post={post} />
        </p>
        <h3 className="post-card-title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="post-card-excerpt">{post.excerpt}</p>
        <div className="post-card-foot">
          {author ? (
            <span className="byline">
              <span className="byline-avatar" aria-hidden="true">
                {author.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={author.avatarUrl} alt="" loading="lazy" />
                ) : (
                  author.name.trim().slice(0, 1)
                )}
              </span>
              {author.name}
            </span>
          ) : (
            <span />
          )}
          <span className="post-card-views" title="بازدید">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" fill="none" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="2.6" fill="none" strokeWidth="1.6" />
            </svg>
            {toFa(post.views)}
          </span>
        </div>
      </div>
    </article>
  );
}

export function FeaturedPost({
  post,
  category,
  author,
}: {
  post: Post;
  category: Category | null;
  author: Author | null;
}) {
  return (
    <article
      className="featured"
      style={{ "--tone": accentHex(category?.accent ?? post.typography.accent) } as React.CSSProperties}
    >
      <Link className="featured-cover" href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden="true">
        <PostCover post={post} />
        <span className="featured-pin">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z" />
          </svg>
          سرِ وبلاگ
        </span>
      </Link>
      <div className="featured-copy">
        {category ? <CategoryChip category={category} /> : null}
        <h2 className="featured-title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        <p className="featured-excerpt">{post.excerpt}</p>
        <p className="post-card-meta">
          {author ? (
            <>
              <span>{author.name}</span>
              <span className="dot-sep" aria-hidden="true" />
            </>
          ) : null}
          <ReadMeta post={post} />
        </p>
        <Link className="btn btn-brass" href={`/blog/${post.slug}`}>
          خواندنِ نوشته
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5m0 0l6-6m-6 6l6 6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </article>
  );
}