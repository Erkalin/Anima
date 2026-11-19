"use client";

import { useEffect, useState } from "react";

export function Figure({
  src,
  alt,
  caption,
  align = "contained",
  width,
  height,
}: {
  src: string;
  alt?: string;
  caption?: string;
  align?: string;
  width?: number | null;
  height?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <figure className="md-figure" data-align={align}>
        {broken ? (
          <div className="md-figure-missing">
            <span>تصویر در دسترس نیست</span>
            <code dir="ltr">{src}</code>
          </div>
        ) : (
          <button
            type="button"
            className="md-figure-open"
            onClick={() => setOpen(true)}
            aria-label={alt ? `بزرگ‌نمایی: ${alt}` : "بزرگ‌نمایی تصویر"}
          >
            <img
              src={src}
              alt={alt ?? ""}
              loading="lazy"
              decoding="async"
              width={width ?? undefined}
              height={height ?? undefined}
              onError={() => setBroken(true)}
            />
            <span className="md-figure-zoom" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="6.5" fill="none" strokeWidth="1.8" />
                <path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
          </button>
        )}
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>

      {open ? (
        <div
          className="md-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={alt || "نمایش تصویر"}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="md-lightbox-close"
            onClick={() => setOpen(false)}
            aria-label="بستن"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <img
            src={src}
            alt={alt ?? ""}
            onClick={(e) => e.stopPropagation()}
          />
          {caption ? (
            <p onClick={(e) => e.stopPropagation()}>{caption}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}