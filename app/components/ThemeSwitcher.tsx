"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  THEMES,
  applyTheme,
  readStoredTheme,
  type ThemeId,
} from "../themes";
import { CheckIcon, ThemeIcon } from "./studio/icons";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>(() => readStoredTheme());
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // The inline script in the root layout sets data-theme before first paint;
  // re-apply here because React's dev remount clears attributes it manages.
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", readStoredTheme());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    const selected = popRef.current?.querySelector<HTMLButtonElement>(
      '[aria-pressed="true"]',
    );
    (selected ?? popRef.current?.querySelector<HTMLButtonElement>("button"))?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (id: ThemeId) => {
    applyTheme(id);
    setTheme(id);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onPopKeyDown = (e: React.KeyboardEvent) => {
    const options = Array.from(
      popRef.current?.querySelectorAll<HTMLButtonElement>(".theme-opt") ?? [],
    );
    const index = options.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;
    let next = -1;
    if (e.key === "ArrowDown") next = (index + 1) % options.length;
    if (e.key === "ArrowUp") next = (index - 1 + options.length) % options.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = options.length - 1;
    if (next !== -1) {
      e.preventDefault();
      options[next].focus();
    }
  };

  return (
    <div className="theme-picker" ref={rootRef}>
      <button
        type="button"
        className="theme-toggle"
        ref={triggerRef}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="تغییر پوسته‌ی سایت"
        title="تغییر پوسته‌ی سایت"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <ThemeIcon />
      </button>

      {open && (
        <div
          className="theme-pop"
          ref={popRef}
          role="group"
          aria-label="پوسته‌های سایت"
          onKeyDown={onPopKeyDown}
        >
          <p className="theme-pop-title">پوسته‌ی سایت</p>
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className="theme-opt"
              aria-pressed={t.id === theme}
              onClick={() => choose(t.id)}
            >
              <span
                className="theme-swatch"
                aria-hidden="true"
                style={{
                  background: `linear-gradient(135deg, ${t.paper} 0% 50%, ${t.accent} 50% 100%)`,
                }}
              />
              <span className="theme-opt-copy">
                <span className="theme-opt-name">{t.name}</span>
                <span className="theme-opt-note">{t.note}</span>
              </span>
              <CheckIcon className="theme-opt-check" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}