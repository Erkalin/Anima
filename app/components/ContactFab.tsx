"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  baleHref,
  balePending,
  baleUsername,
  telegramHref,
  telegramPending,
  telegramUsername,
} from "../data";
import { BaleIcon, TelegramIcon } from "./Art";
import { ArrowIcon } from "./studio/icons";

type Channel = {
  id: "bale" | "telegram";
  label: string;
  handle: string;
  href: string;
  pending: boolean;
  icon: ReactNode;
};

const channels: Channel[] = [
  {
    id: "bale",
    label: "بله",
    handle: balePending ? "به‌زودی" : `@${baleUsername}`,
    href: balePending ? "/contact#composer" : baleHref,
    pending: balePending,
    icon: <BaleIcon />,
  },
  {
    id: "telegram",
    label: "تلگرام",
    handle: telegramPending ? "به‌زودی" : `@${telegramUsername}`,
    href: telegramPending ? "/contact#composer" : telegramHref,
    pending: telegramPending,
    icon: <TelegramIcon />,
  },
];

function ChatGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 3C6.9 3 2.8 6.4 2.8 10.6c0 2.4 1.3 4.5 3.4 5.9-.1.9-.5 2-1.4 3 0 0 2.3-.4 4-1.5.9.3 1.9.4 3 .4h.4c-.1-.5-.2-1-.2-1.5 0-3.9 3.6-7 8-7h.6C20.9 6 16.9 3 12 3z"
      />
      <path
        fill="currentColor"
        d="M21.2 15.3c0-2.9-2.8-5.2-6.2-5.2s-6.2 2.3-6.2 5.2 2.8 5.2 6.2 5.2c.7 0 1.4-.1 2-.3 1.1.7 2.6 1 2.6 1-.6-.7-.9-1.4-1-2 1.6-1 2.6-2.4 2.6-3.9z"
        opacity=".72"
      />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        d="M6 6l12 12M18 6L6 18"
      />
    </svg>
  );
}

export function ContactFab() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div className="contact-fab" ref={rootRef} data-open={open || undefined}>
      {open && (
        <div
          className="contact-panel"
          ref={panelRef}
          id="contact-fab-panel"
          role="dialog"
          aria-label="راه‌های پیام به آنیما"
        >
          <div className="contact-panel-head">
            <div>
              <p className="contact-panel-title">پیام به آنیما</p>
              <p className="contact-panel-sub">هر جا راحت‌تری، پیام بده</p>
            </div>
            <button
              type="button"
              className="contact-close"
              onClick={() => {
                setOpen(false);
                fabRef.current?.focus();
              }}
              aria-label="بستن"
            >
              <CloseGlyph />
            </button>
          </div>

          <div className="contact-channels">
            {channels.map((c, i) => (
              <a
                key={c.id}
                className="contact-channel"
                data-channel={c.id}
                href={c.href}
                target={c.pending ? undefined : "_blank"}
                rel={c.pending ? undefined : "noopener noreferrer"}
                style={{ "--i": i } as CSSProperties}
              >
                <span className="contact-channel-icon" aria-hidden="true">
                  {c.icon}
                </span>
                <span className="contact-channel-text">
                  <span className="contact-channel-name">{c.label}</span>
                  <span className="contact-channel-handle" dir="ltr">
                    {c.handle}
                  </span>
                </span>
                <ArrowIcon className="contact-channel-arrow" />
              </a>
            ))}
          </div>

          <p className="contact-panel-note">
            برای هماهنگی کلاس‌ها و پرسش‌ها در خدمتیم.
          </p>
        </div>
      )}

      <button
        type="button"
        ref={fabRef}
        className="contact-fab-btn"
        aria-expanded={open}
        aria-controls="contact-fab-panel"
        aria-label={open ? "بستن راه‌های ارتباطی" : "راه‌های ارتباطی: پیام در بله یا تلگرام"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="contact-fab-ring" aria-hidden="true" />
        <span className="contact-fab-glyph" data-open={open || undefined}>
          {open ? <CloseGlyph /> : <ChatGlyph />}
        </span>
        <span className="contact-fab-tip" aria-hidden="true">
          گفتگو با ما
        </span>
      </button>
    </div>
  );
}