"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/markdown/toc";
import { toFa } from "@/lib/utils";
import { useReading } from "./ReadingProgress";

export function ArticleToc({
  items,
  minutes,
  words,
}: {
  items: TocItem[];
  minutes: number;
  words: number;
}) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const [open, setOpen] = useState(true);
  const pct = useReading();

  useEffect(() => {
    setOpen(window.matchMedia("(min-width: 64rem)").matches);
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const nodes = items
      .map((i) => document.getElementById(i.id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!nodes.length) return;

    const seen = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.intersectionRatio);
        let best = "";
        let bestRatio = 0;
        for (const [id, ratio] of seen) {
          if (ratio > bestRatio) {
            best = id;
            bestRatio = ratio;
          }
        }
        if (best) setActive(best);
      },
      { rootMargin: "-96px 0px -55% 0px", threshold: [0, 0.25, 0.6, 1] },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav className="article-toc" aria-label="فهرست مطالب" data-open={open || undefined}>
      <button
        type="button"
        className="article-toc-head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" strokeWidth="1.9" strokeLinecap="round" fill="none" />
        </svg>
        فهرست مطالب
        <span className="article-toc-n">{toFa(items.length)}</span>
        <svg className="article-toc-chev" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>
      <ol className="article-toc-list">
        {items.map((h) => (
          <li key={h.id} data-depth={h.depth}>
            <a
              href={`#${h.id}`}
              className={active === h.id ? "is-on" : undefined}
              aria-current={active === h.id ? "location" : undefined}
              onClick={() => setOpen(false)}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
      <p className="article-toc-foot">
        <span className="article-toc-read">
          <span className="article-toc-ring" style={{ "--pct": pct } as React.CSSProperties} />
          {toFa(pct)}٪ خوانده‌شده
        </span>
        <span>
          {toFa(minutes)} دقیقه · {toFa(words)} واژه
        </span>
      </p>
    </nav>
  );
}