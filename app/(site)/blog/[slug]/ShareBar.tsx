"use client";

import { useEffect, useState } from "react";

export function ShareBar({
  title,
  path,
  compact = false,
}: {
  title: string;
  path: string;
  compact?: boolean;
}) {
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setUrl(new URL(path, window.location.origin).href);
    setCanShare(typeof navigator.share === "function");
  }, [path]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("نشانیِ نوشته را رونوشت کنید:", url);
    }
  }

  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  return (
    <div className={compact ? "share share-compact" : "share"}>
      {!compact ? <span className="share-label">هم‌رسانی</span> : null}

      <a
        className="share-btn"
        href={`https://t.me/share/url?url=${encoded}&text=${text}`}
        target="_blank"
        rel="noreferrer"
        aria-label="هم‌رسانی در تلگرام"
        title="تلگرام"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21.5 4.3L2.9 11.4c-.9.3-.9 1.5 0 1.8l4.6 1.5 1.7 5.2c.3.8 1.3 1 1.9.4l2.5-2.4 4.6 3.4c.7.5 1.7.1 1.9-.7l3-14.4c.2-.9-.7-1.6-1.6-1.3z" />
        </svg>
      </a>

      <a
        className="share-btn"
        href={`https://wa.me/?text=${text}%20${encoded}`}
        target="_blank"
        rel="noreferrer"
        aria-label="هم‌رسانی در واتس‌اپ"
        title="واتس‌اپ"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 2a8 8 0 11-4.2 14.8l-.4-.2-2.6.7.7-2.5-.2-.4A8 8 0 0112 4zm-3 4c-.3 0-.6.1-.8.4-.3.3-.9.9-.9 2s.9 2.3 1 2.5c.1.2 1.7 2.8 4.3 3.8 2.1.8 2.5.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.6-.3-1.4-.7c-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 01-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3 0-.5l-.7-1.6c-.2-.4-.4-.4-.6-.4z" />
        </svg>
      </a>

      <a
        className="share-btn"
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${text}`}
        target="_blank"
        rel="noreferrer"
        aria-label="هم‌رسانی در ایکس"
        title="ایکس"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.5 3h3l-6.6 7.5L21.7 21h-6l-4.3-5.6L6.4 21h-3l7-8L2.6 3h6.2l3.9 5.2zm-1 16h1.6L7.6 4.7H5.8z" />
        </svg>
      </a>

      <button
        type="button"
        className="share-btn"
        data-on={copied || undefined}
        onClick={copy}
        aria-label="رونوشتِ نشانی"
        title="رونوشتِ نشانی"
      >
        {copied ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1.2 1.2M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1.2-1.2" fill="none" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {canShare ? (
        <button
          type="button"
          className="share-btn"
          onClick={() => navigator.share({ title, url }).catch(() => {})}
          aria-label="هم‌رسانی با دستگاه"
          title="هم‌رسانی"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 16V4m0 0L8 8m4-4l4 4M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}

      {copied ? <span className="share-note">نشانی رونوشت شد</span> : null}
    </div>
  );
}