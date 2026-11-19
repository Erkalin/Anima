import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getDb, storageMode } from "@/lib/db";
import { STATUS_LABEL, type Post } from "@/lib/types";
import { countWords, faDate, faRelative, formatBytes, toFa } from "@/lib/utils";
import { Icon } from "@/app/components/admin/Icons";
import { Empty } from "@/app/components/admin/ui";
import { AdminTop } from "./AdminShell";

export const metadata: Metadata = { title: "نمای کلی" };
export const instant = false;

const MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const tone = (hex: string) => ({ "--tone": hex }) as CSSProperties;

function monthBuckets(posts: Post[], now: Date) {
  const fmt = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "numeric",
  });
  const keys: { key: string; label: string }[] = [];
  for (let back = 11; back >= 0; back -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const parts = fmt.formatToParts(d);
    const y = parts.find((p) => p.type === "year")?.value ?? "";
    const m = Number(parts.find((p) => p.type === "month")?.value ?? "1");
    keys.push({ key: `${y}-${m}`, label: MONTHS[m - 1] });
  }
  const counts = new Map(keys.map((k) => [k.key, 0]));
  for (const p of posts) {
    if (!p.publishedAt) continue;
    const parts = fmt.formatToParts(new Date(p.publishedAt));
    const y = parts.find((x) => x.type === "year")?.value ?? "";
    const m = Number(parts.find((x) => x.type === "month")?.value ?? "1");
    const key = `${y}-${m}`;
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return keys.map((k) => ({ ...k, n: counts.get(k.key) ?? 0 }));
}

export default async function OverviewPage() {
  const data = await getDb();
  const mode = storageMode();
  const now = new Date();
  const nowIso = now.toISOString();

  const published = data.posts.filter(
    (p) => p.status === "published" && p.publishedAt && p.publishedAt <= nowIso,
  );
  const drafts = data.posts.filter((p) => p.status === "draft");
  const scheduled = data.posts
    .filter((p) => p.status === "scheduled")
    .sort((a, b) => (a.publishedAt ?? "").localeCompare(b.publishedAt ?? ""));
  const views = data.posts.reduce((sum, p) => sum + p.views, 0);
  const words = data.posts.reduce((sum, p) => sum + countWords(p.content), 0);
  const bytes = data.media.reduce((sum, m) => sum + m.size, 0);
  const buckets = monthBuckets(data.posts, now);
  const peak = Math.max(1, ...buckets.map((b) => b.n));

  const unfinished = [...drafts].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  const top = [...published].sort((a, b) => b.views - a.views).slice(0, 5);
  const recent = [...published]
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, 5);

  const stats = [
    {
      label: "منتشرشده",
      value: published.length,
      foot: `آخرین: ${faDate(recent[0]?.publishedAt)}`,
      icon: "globe",
      hex: "color-mix(in srgb, var(--verdigris) 24%, transparent)",
    },
    {
      label: "پیش‌نویس",
      value: drafts.length,
      foot: drafts.length ? "منتظرِ تمام‌شدن" : "همه چیز منتشر شده",
      icon: "edit",
      hex: "color-mix(in srgb, var(--amber) 24%, transparent)",
    },
    {
      label: "زمان‌بندی‌شده",
      value: scheduled.length,
      foot: scheduled[0]
        ? `نزدیک‌ترین: ${faDate(scheduled[0].publishedAt)}`
        : "چیزی در صف نیست",
      icon: "clock",
      hex: "color-mix(in srgb, var(--steel) 24%, transparent)",
    },
    {
      label: "بازدیدِ نوشته‌ها",
      value: views,
      foot: `میانگین ${toFa(
        published.length ? Math.round(views / published.length) : 0,
      )} برای هر نوشته`,
      icon: "chart",
      hex: "color-mix(in srgb, var(--velvet) 24%, transparent)",
    },
    {
      label: "رسانه‌ها",
      value: data.media.length,
      foot: `${formatBytes(bytes)} فضا گرفته`,
      icon: "media",
      hex: "color-mix(in srgb, var(--copper) 22%, transparent)",
    },
    {
      label: "واژه‌های نوشته‌شده",
      value: words,
      foot: `${toFa(data.categories.length)} دسته · ${toFa(data.tags.length)} برچسب`,
      icon: "words",
      hex: "color-mix(in srgb, var(--brass) 24%, transparent)",
    },
  ];

  return (
    <>
      <AdminTop
        title="نمای کلی"
        sub={`${data.settings.brand} · ${faDate(nowIso)}`}
      >
        <Link className="btn btn-ghost btn-sm" href="/blog" target="_blank">
          <Icon name="globe" /> دیدن وبلاگ
        </Link>
        <Link className="btn btn-brass btn-sm" href="/admin/posts/new">
          <Icon name="plus" /> نوشتهٔ تازه
        </Link>
      </AdminTop>

      <div className="admin-body">
        {mode === "local" ? (
          <div className="panel">
            <div className="panel-body row-between">
              <p className="muted" style={{ maxWidth: "44rem" }}>
                همه‌چیز روی همین دستگاه ذخیره می‌شود: نوشته‌ها در{" "}
                <code className="mono">.data/db.json</code> و فایل‌ها در{" "}
                <code className="mono">.data/uploads</code>. با گذاشتن کلیدهای
                Supabase در <code className="mono">.env</code>، همین پنل بدون
                تغییر به پایگاه‌دادهٔ ابری وصل می‌شود.
              </p>
              <Link className="btn btn-ghost btn-sm" href="/admin/settings">
                <Icon name="settings" /> تنظیمات
              </Link>
            </div>
          </div>
        ) : null}

        <div className="stat-grid">
          {stats.map((s) => (
            <div className="stat" key={s.label} style={tone(s.hex)}>
              <p className="stat-label">
                <Icon name={s.icon} /> {s.label}
              </p>
              <p className="stat-value">{toFa(s.value)}</p>
              <p className="stat-foot">{s.foot}</p>
            </div>
          ))}
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">آهنگِ انتشار</h2>
            <p className="panel-note">
              شمارِ نوشته‌های منتشرشده در دوازده ماهِ گذشته
            </p>
            <div className="admin-top-spacer" />
            <p className="panel-note">
              بلندترین ستون: {toFa(peak)} نوشته
            </p>
          </div>
          <div className="panel-body">
            <div className="spark">
              {buckets.map((b) => (
                <span
                  key={b.key}
                  style={{ height: `${Math.max(4, (b.n / peak) * 100)}%` }}
                  title={`${b.label}: ${toFa(b.n)} نوشته`}
                />
              ))}
            </div>
            <div className="row-between" style={{ marginTop: "0.5rem" }}>
              {buckets.map((b, i) => (
                <span
                  key={b.key}
                  className="muted"
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: "0.66rem",
                    opacity: i % 2 === 0 ? 1 : 0.35,
                  }}
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="overview-cols">
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">ادامهٔ نوشتن</h2>
              <div className="admin-top-spacer" />
              <Link className="btn btn-quiet btn-sm" href="/admin/posts?status=draft">
                همهٔ پیش‌نویس‌ها <Icon name="arrow" />
              </Link>
            </div>
            <div className="panel-body">
              {unfinished.length ? (
                <ul className="list-plain">
                  {unfinished.slice(0, 5).map((p) => (
                    <li key={p.id}>
                      <span className="rank">
                        <Icon name="edit" />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <Link className="tbl-name" href={`/admin/posts/${p.id}`}>
                          {p.title || "بی‌عنوان"}
                        </Link>
                        <span className="muted">
                          {toFa(countWords(p.content))} واژه · آخرین تغییر{" "}
                          {faRelative(p.updatedAt)}
                        </span>
                      </span>
                      <Link
                        className="icon-btn"
                        href={`/admin/posts/${p.id}`}
                        aria-label="ادامهٔ نوشتن"
                      >
                        <Icon name="arrow" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty
                  icon="check"
                  title="پیش‌نویسی باز نمانده"
                  note="هر چه نوشتید منتشر شده است."
                  action={
                    <Link className="btn btn-brass btn-sm" href="/admin/posts/new">
                      <Icon name="plus" /> شروعِ نوشتهٔ تازه
                    </Link>
                  }
                />
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">پربازدیدترین‌ها</h2>
              <div className="admin-top-spacer" />
              <Link className="btn btn-quiet btn-sm" href="/admin/posts?sort=views">
                همه <Icon name="arrow" />
              </Link>
            </div>
            <div className="panel-body">
              {top.length ? (
                <ul className="list-plain">
                  {top.map((p, i) => (
                    <li key={p.id}>
                      <span className="rank">{toFa(i + 1)}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <Link className="tbl-name" href={`/admin/posts/${p.id}`}>
                          {p.title}
                        </Link>
                        <span className="tbl-slug">/blog/{p.slug}</span>
                      </span>
                      <span className="pill" data-tone="published">
                        {toFa(p.views)} بازدید
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty icon="chart" title="هنوز بازدیدی ثبت نشده" />
              )}
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">تازه‌ترین نوشته‌های سایت</h2>
            <div className="admin-top-spacer" />
            <Link className="btn btn-quiet btn-sm" href="/admin/posts">
              میزِ نوشته‌ها <Icon name="arrow" />
            </Link>
          </div>
          <div className="panel-body tight">
            {recent.length ? (
              <div className="tbl-scroll">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>نوشته</th>
                      <th>وضعیت</th>
                      <th>تاریخ</th>
                      <th>بازدید</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <span className="tbl-title">
                            {p.coverUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                className="tbl-thumb"
                                src={p.coverUrl}
                                alt=""
                                loading="lazy"
                              />
                            ) : (
                              <span className="tbl-thumb tbl-thumb-empty">
                                <Icon name="note" />
                              </span>
                            )}
                            <span style={{ minWidth: 0 }}>
                              <Link
                                className="tbl-name"
                                href={`/admin/posts/${p.id}`}
                              >
                                {p.title}
                              </Link>
                              <span className="tbl-slug">/blog/{p.slug}</span>
                            </span>
                          </span>
                        </td>
                        <td>
                          <span className="pill" data-tone={p.status}>
                            <span className="pill-dot" />
                            {STATUS_LABEL[p.status]}
                          </span>
                        </td>
                        <td className="muted">{faDate(p.publishedAt)}</td>
                        <td className="muted">{toFa(p.views)}</td>
                        <td>
                          <span className="tbl-actions">
                            <Link
                              className="icon-btn"
                              href={`/blog/${p.slug}`}
                              target="_blank"
                              aria-label="دیدن در سایت"
                            >
                              <Icon name="external" />
                            </Link>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                icon="posts"
                title="هنوز چیزی منتشر نشده"
                note="اولین نوشته را بنویسید و دکمهٔ انتشار را بزنید."
                action={
                  <Link className="btn btn-brass btn-sm" href="/admin/posts/new">
                    <Icon name="plus" /> نوشتهٔ تازه
                  </Link>
                }
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
}