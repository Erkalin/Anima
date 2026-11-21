"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import type { SessionAdmin } from "@/lib/types";
import { toFa } from "@/lib/utils";
import { Icon } from "@/app/components/admin/Icons";
import { ThemeSwitcher } from "@/app/components/ThemeSwitcher";

type Counts = { posts: number; drafts: number; media: number; inbox: number };

const NavCtx = createContext<{ toggle: () => void }>({ toggle: () => {} });

const NAV = [
  { href: "/admin", label: "نمای کلی", icon: "dashboard" },
  { href: "/admin/posts", label: "نوشته‌ها", icon: "posts" },
  { href: "/admin/inbox", label: "گفتگوها", icon: "inbox" },
  { href: "/admin/media", label: "رسانه‌ها", icon: "media" },
  { href: "/admin/taxonomy", label: "دسته و برچسب", icon: "taxonomy" },
  { href: "/admin/settings", label: "تنظیمات", icon: "settings" },
];

export function AdminTop({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  const { toggle } = useContext(NavCtx);
  return (
    <div className="admin-top">
      <button
        className="icon-btn admin-burger"
        type="button"
        onClick={toggle}
        aria-label="باز کردن فهرست"
      >
        <Icon name="menu" />
      </button>
      <div className="admin-top-title">
        <h1>{title}</h1>
        {sub ? <p className="admin-top-sub">{sub}</p> : null}
      </div>
      <div className="admin-top-spacer" />
      {children ? <div className="admin-top-actions">{children}</div> : null}
      <div className="admin-top-theme">
        <ThemeSwitcher />
      </div>
    </div>
  );
}

export function AdminShell({
  admin,
  counts,
  mode,
  brand,
  children,
}: {
  admin: SessionAdmin;
  counts: Counts;
  mode: "local" | "supabase";
  brand: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const badge = (href: string) =>
    href === "/admin/posts"
      ? counts.posts
      : href === "/admin/media"
        ? counts.media
        : href === "/admin/inbox"
          ? counts.inbox > 0
            ? counts.inbox
            : null
          : null;

  return (
    <NavCtx value={{ toggle: () => setOpen((v) => !v) }}>
      <div className="admin" data-nav={open ? "open" : "closed"}>
        {open ? (
          <div
            className="admin-veil"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        ) : null}

        <aside
          className="admin-side"
          onClickCapture={(e) => {
            // Close the drawer on any navigation click (event handler, not
            // a pathname effect — avoids a cascading render).
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <div className="admin-brand-row">
            <Link className="admin-brand" href="/admin">
              <span className="admin-brand-mark">
                <Icon name="note" />
              </span>
              <span className="admin-brand-text">
                <span className="admin-brand-name">{brand}</span>
                <span className="admin-brand-sub">اتاق مدیریت</span>
              </span>
            </Link>
            <button
              type="button"
              className="icon-btn admin-side-close"
              onClick={() => setOpen(false)}
              aria-label="بستن فهرست"
            >
              <Icon name="x" />
            </button>
          </div>

          <nav className="admin-nav" aria-label="فهرست مدیریت">
            <Link
              className="btn btn-brass btn-sm admin-nav-cta"
              href="/admin/posts/new"
            >
              <Icon name="plus" /> نوشتهٔ تازه
            </Link>

            <p className="admin-nav-label">میز کار</p>
            {NAV.map((item) => {
              const n = badge(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(item.href) ? "is-active" : undefined}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  <Icon name={item.icon} />
                  {item.label}
                  {n !== null ? (
                    <span className="admin-nav-count">{toFa(n)}</span>
                  ) : null}
                </Link>
              );
            })}

            <p className="admin-nav-label">سایت</p>
            <Link href="/blog" target="_blank">
              <Icon name="globe" /> دیدن وبلاگ
            </Link>
            <Link href="/" target="_blank">
              <Icon name="external" /> صفحهٔ اصلی
            </Link>
          </nav>

          <div className="admin-side-foot">
            <div className="admin-who">
              <span className="admin-avatar">
                {admin.name.trim().slice(0, 1) || "م"}
              </span>
              <span className="admin-who-text">
                <span className="admin-who-name">{admin.name}</span>
                <span className="admin-who-mail">{admin.email}</span>
              </span>
            </div>
            <p className="admin-mode" data-mode={mode}>
              <span className="admin-mode-dot" />
              {mode === "supabase"
                ? "متصل به Supabase"
                : "ذخیرهٔ محلی · کلیدها هنوز تنظیم نشده"}
            </p>
            <form action={logoutAction}>
              <button
                className="btn btn-ghost btn-sm"
                type="submit"
                style={{ width: "100%" }}
              >
                <Icon name="logout" /> خروج
              </button>
            </form>
          </div>
        </aside>

        <div className="admin-main">{children}</div>
      </div>
    </NavCtx>
  );
}