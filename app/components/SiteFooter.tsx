import Link from "next/link";
import { brand, telegramHref, telegramPending } from "../data";
import { NoteMark } from "./studio/icons";
import { SoundToggle } from "./studio/Sound";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <div className="footer-brandline">
            <span className="wordmark-mark" aria-hidden="true">
              <NoteMark />
            </span>
            <p className="footer-brand">{brand}</p>
          </div>
          <p className="footer-note">
            آموزش پیانو و ویولن، و فرستادن نوازنده به مراسم و دورهمی. هر چه هست
            از یک پیام تلگرام شروع می‌شود.
          </p>
        </div>

        <div>
          <p className="footer-col-title">صفحه‌ها</p>
          <nav className="footer-nav" aria-label="فهرست پایین صفحه">
            <Link href="/teachers">استادها</Link>
            <Link href="/instruments">سازها</Link>
            <Link href="/blog">وبلاگ</Link>
            <Link href="/contact">تماس</Link>
          </nav>
        </div>

        <div>
          <p className="footer-col-title">شروع</p>
          <nav className="footer-nav" aria-label="راه‌های شروع">
            <Link href="/contact#composer">ساختن پیام</Link>
            <Link href="/instruments#chooser">کدام ساز؟</Link>
            <Link href="/instruments#desk">میز تمرین</Link>
            <a href={telegramHref} target="_blank" rel="noopener noreferrer">
              تلگرام
            </a>
          </nav>
          {telegramPending && (
            <p className="footer-note">نام کاربری تلگرام به‌زودی اضافه می‌شود.</p>
          )}
        </div>
      </div>

      <div className="wrap footer-bottom">
        <span>
          {brand} · ۱۴۰۴
        </span>
        <span>
          <SoundToggle compact />
        </span>
      </div>
    </footer>
  );
}