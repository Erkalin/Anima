"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { brand } from "../data";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { NoteMark, SendIcon } from "./studio/icons";
import { SoundToggle } from "./studio/Sound";

const links = [
  { href: "/", label: "خانه" },
  { href: "/teachers", label: "استادها" },
  { href: "/instruments", label: "سازها" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/contact", label: "تماس" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    let frame = 0;
    const paint = () => {
      frame = 0;
      const doc = document.documentElement;
      const span = doc.scrollHeight - window.innerHeight;
      const read = span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0;
      bar.current?.style.setProperty("--read", read.toFixed(4));
      setStuck(window.scrollY > 12);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="site-header" data-stuck={stuck || undefined}>
      <div className="wrap header-inner">
        <Link className="wordmark" href="/">
          <span className="wordmark-mark" aria-hidden="true">
            <NoteMark />
          </span>
          <span className="wordmark-text">
            <span className="wordmark-name">{brand}</span>
            <span className="wordmark-sub">آموزش پیانو و ویولن</span>
          </span>
        </Link>

        <nav className="nav" aria-label="فهرست">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={active(link.href) ? "is-active" : undefined}
              aria-current={active(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-tools">
          <ThemeSwitcher />
          <SoundToggle />
          <Link className="header-cta" href="/contact">
            <SendIcon />
            <span className="header-cta-text">هماهنگی کلاس</span>
          </Link>
        </div>
      </div>
      <div className="header-progress" ref={bar} aria-hidden="true" />
    </header>
  );
}