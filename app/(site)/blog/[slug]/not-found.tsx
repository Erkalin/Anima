import Link from "next/link";
import { Staff } from "@/app/components/Art";

export default function BlogNotFound() {
  return (
    <div className="page">
      <section className="wrap blog-missing">
        <div className="blog-missing-art" aria-hidden="true">
          <Staff />
        </div>
        <p className="eyebrow">۴۰۴</p>
        <h1>این نوشته پیدا نشد</h1>
        <p className="lead">
          شاید نشانی عوض شده، یا نوشته هنوز منتشر نشده است.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-brass" href="/blog">
            رفتن به وبلاگ
          </Link>
          <Link className="btn btn-ghost" href="/">
            صفحهٔ اصلی
          </Link>
        </div>
      </section>
    </div>
  );
}