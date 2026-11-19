"use client";

import { useState, type CSSProperties } from "react";
import { Icon } from "@/app/components/admin/Icons";
import { MediaPicker } from "@/app/components/admin/MediaPicker";
import { Accordion, Range, Switch } from "@/app/components/admin/ui";
import {
  ACCENTS,
  STATUS_LABEL,
  type Author,
  type Category,
  type CoverLayout,
  type Media,
  type Post,
  type PostStatus,
  type Tag,
} from "@/lib/types";
import {
  faDateTime,
  fromLocalInput,
  slugify,
  toFa,
  toLocalInput,
  transliterate,
} from "@/lib/utils";

const LAYOUTS: { value: CoverLayout; label: string }[] = [
  { value: "bleed", label: "تمام‌عرض، بالای صفحه" },
  { value: "contained", label: "هم‌عرضِ متن" },
  { value: "split", label: "کنارِ عنوان" },
  { value: "none", label: "بدون تصویر" },
];

const STATUSES: PostStatus[] = ["draft", "scheduled", "published", "archived"];

export function SettingsRail({
  post,
  patch,
  liveSlug,
  categories,
  tags,
  authors,
  media,
  onUploaded,
}: {
  post: Post;
  patch: (p: Partial<Post>) => void;
  liveSlug: string;
  categories: Category[];
  tags: Tag[];
  authors: Author[];
  media: Media[];
  onUploaded: (rows: Media[]) => void;
}) {
  const [coverPick, setCoverPick] = useState(false);
  const [ogPick, setOgPick] = useState(false);
  const [tagDraft, setTagDraft] = useState("");

  const derived =
    slugify(post.slug) || slugify(post.title) || transliterate(post.title) || liveSlug;

  function addTag(raw: string) {
    const name = raw.trim().replace(/^#/, "");
    if (!name) return;
    if (post.tags.includes(name)) {
      setTagDraft("");
      return;
    }
    if (post.tags.length >= 12) return;
    patch({ tags: [...post.tags, name] });
    setTagDraft("");
  }

  function setStatus(status: PostStatus) {
    const now = new Date().toISOString();
    if (status === "published") {
      patch({
        status,
        publishedAt:
          post.publishedAt && post.publishedAt <= now ? post.publishedAt : now,
      });
    } else if (status === "scheduled") {
      patch({
        status,
        publishedAt:
          post.publishedAt && post.publishedAt > now
            ? post.publishedAt
            : new Date(Date.now() + 86_400_000).toISOString(),
      });
    } else {
      patch({ status });
    }
  }

  function tomorrowMorning() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    patch({ publishedAt: d.toISOString(), status: "scheduled" });
  }

  const suggestions = tags.filter((t) => !post.tags.includes(t.name));

  return (
    <aside className="editor-side" aria-label="تنظیمات نوشته">
      <Accordion title="انتشار" icon="publish">
        <div className="field">
          <label className="label" htmlFor="p-status">
            وضعیت
          </label>
          <select
            id="p-status"
            className="select"
            value={post.status}
            onChange={(e) => setStatus(e.target.value as PostStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label" htmlFor="p-date">
            تاریخ انتشار
          </label>
          <input
            id="p-date"
            className="input mono"
            type="datetime-local"
            dir="ltr"
            value={toLocalInput(post.publishedAt)}
            onChange={(e) => patch({ publishedAt: fromLocalInput(e.target.value) })}
          />
          <p className="label-hint">
            {post.publishedAt ? faDateTime(post.publishedAt) : "هنوز تعیین نشده"}
          </p>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button
              className="btn btn-quiet btn-sm"
              type="button"
              onClick={() => patch({ publishedAt: new Date().toISOString() })}
            >
              <Icon name="clock" /> همین حالا
            </button>
            <button className="btn btn-quiet btn-sm" type="button" onClick={tomorrowMorning}>
              <Icon name="calendar" /> فردا ۹ صبح
            </button>
          </div>
        </div>

        <Switch
          checked={post.featured}
          onChange={(v) => patch({ featured: v })}
          label="نوشتهٔ برگزیده"
          hint="در بالای وبلاگ بزرگ دیده می‌شود."
        />
      </Accordion>

      <Accordion title="نشانی و فهرست مطالب" icon="globe">
        <div className="field">
          <label className="label" htmlFor="p-slug">
            نامِ پوشه پس از <span className="mono">/blog/</span>
          </label>
          <input
            id="p-slug"
            className="input mono"
            dir="ltr"
            value={post.slug}
            placeholder="خالی = ساخته‌شده از عنوان"
            onChange={(e) => patch({ slug: e.target.value })}
          />
          <div className="slug-preview">
            <span>domain/blog/</span>
            <b>{derived || "…"}</b>
          </div>
          <button
            className="btn btn-quiet btn-sm"
            type="button"
            onClick={() =>
              patch({ slug: slugify(post.title) || transliterate(post.title) })
            }
          >
            <Icon name="refresh" /> ساختن از عنوان
          </button>
          <p className="label-hint">
            حرف‌های فارسی مجازند؛ فاصله و نیم‌فاصله به خطِ تیره تبدیل می‌شود.
          </p>
        </div>

        <div className="divider-line" />

        <Switch
          checked={post.toc}
          onChange={(v) => patch({ toc: v })}
          label="فهرست مطالب"
          hint="از عنوان‌های نوشته ساخته می‌شود و کنارِ متن می‌چسبد."
        />
        <p className="label-hint">
          برای گذاشتنِ فهرست داخلِ خودِ متن، بلوکِ «فهرست مطالب» را از منوی{" "}
          <span className="kbd-hint">/</span> درج کنید.
        </p>
      </Accordion>

      <Accordion title="تصویر شاخص" icon="image">
        <button className="cover-slot" type="button" onClick={() => setCoverPick(true)}>
          {post.coverUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverUrl} alt={post.coverAlt || "تصویر شاخص"} />
              <span className="cover-slot-tag">
                <Icon name="edit" /> تغییر
              </span>
            </>
          ) : (
            <>
              <Icon name="image" />
              <span>انتخابِ تصویر شاخص</span>
            </>
          )}
        </button>
        {post.coverUrl ? (
          <button
            className="btn btn-quiet btn-sm"
            type="button"
            onClick={() => patch({ coverUrl: null, coverAlt: "" })}
          >
            <Icon name="trash" /> برداشتنِ تصویر
          </button>
        ) : null}
        <div className="field">
          <label className="label" htmlFor="p-cover-alt">
            متنِ جایگزین
          </label>
          <input
            id="p-cover-alt"
            className="input"
            value={post.coverAlt}
            onChange={(e) => patch({ coverAlt: e.target.value })}
            placeholder="توصیفِ کوتاهِ تصویر"
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="p-cover-layout">
            چیدمان
          </label>
          <select
            id="p-cover-layout"
            className="select"
            value={post.coverLayout}
            onChange={(e) => patch({ coverLayout: e.target.value as CoverLayout })}
          >
            {LAYOUTS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </Accordion>

      <Accordion title="دسته، برچسب و نویسنده" icon="taxonomy" defaultOpen={false}>
        <div className="field">
          <label className="label" htmlFor="p-cat">
            دسته
          </label>
          <select
            id="p-cat"
            className="select"
            value={post.categoryId ?? ""}
            onChange={(e) => patch({ categoryId: e.target.value || null })}
          >
            <option value="">بدون دسته</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label" htmlFor="p-tags">
            برچسب‌ها <span className="label-hint">({toFa(post.tags.length)} از ۱۲)</span>
          </label>
          {post.tags.length ? (
            <div className="chip-row">
              {post.tags.map((t) => (
                <span className="chip" key={t}>
                  {t}
                  <button
                    type="button"
                    aria-label={`برداشتنِ ${t}`}
                    onClick={() => patch({ tags: post.tags.filter((x) => x !== t) })}
                  >
                    <Icon name="x" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <input
            id="p-tags"
            className="input"
            list="tag-options"
            value={tagDraft}
            placeholder="بنویسید و Enter بزنید"
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "," || e.key === "،") {
                e.preventDefault();
                addTag(tagDraft);
              } else if (e.key === "Backspace" && !tagDraft && post.tags.length) {
                patch({ tags: post.tags.slice(0, -1) });
              }
            }}
            onBlur={() => addTag(tagDraft)}
          />
          <datalist id="tag-options">
            {suggestions.map((t) => (
              <option key={t.id} value={t.name} />
            ))}
          </datalist>
        </div>

        <div className="field">
          <label className="label" htmlFor="p-author">
            نویسنده
          </label>
          <select
            id="p-author"
            className="select"
            value={post.authorId ?? ""}
            onChange={(e) => patch({ authorId: e.target.value || null })}
          >
            <option value="">بدون نام</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </Accordion>

      <Accordion title="خلاصه" icon="words" defaultOpen={false}>
        <div className="field">
          <label className="label" htmlFor="p-excerpt">
            چکیده <span className="label-hint">({toFa(post.excerpt.length)} از ۴۰۰)</span>
          </label>
          <textarea
            id="p-excerpt"
            className="textarea"
            rows={4}
            maxLength={400}
            value={post.excerpt}
            placeholder="خالی بگذارید تا از آغازِ نوشته ساخته شود."
            onChange={(e) => patch({ excerpt: e.target.value })}
          />
        </div>
      </Accordion>

      <Accordion title="ظاهرِ نوشته" icon="sparkles" defaultOpen={false}>
        <div className="field">
          <span className="label">اندازهٔ متن</span>
          <Range
            value={post.typography.scale}
            min={0.9}
            max={1.35}
            step={0.05}
            onChange={(v) => patch({ typography: { ...post.typography, scale: v } })}
            format={(v) => `${toFa(v.toFixed(2))}×`}
          />
        </div>
        <div className="field">
          <span className="label">فاصلهٔ سطرها</span>
          <Range
            value={post.typography.leading}
            min={1.6}
            max={2.4}
            step={0.05}
            onChange={(v) => patch({ typography: { ...post.typography, leading: v } })}
            format={(v) => toFa(v.toFixed(2))}
          />
        </div>
        <div className="field">
          <span className="label">پهنای ستونِ خواندن</span>
          <Range
            value={post.typography.measure}
            min={34}
            max={56}
            step={1}
            onChange={(v) => patch({ typography: { ...post.typography, measure: v } })}
            format={(v) => `${toFa(v)} rem`}
          />
        </div>
        <div className="field">
          <span className="label">رنگِ لهجه</span>
          <div className="accent-row">
            {ACCENTS.map((a) => (
              <button
                key={a.key}
                type="button"
                className={`accent-dot${post.typography.accent === a.key ? " is-on" : ""}`}
                style={{ "--swatch": a.hex } as CSSProperties}
                title={a.label}
                aria-label={a.label}
                aria-pressed={post.typography.accent === a.key}
                onClick={() => patch({ typography: { ...post.typography, accent: a.key } })}
              />
            ))}
          </div>
        </div>
        <p className="label-hint">
          پیش‌نمایشِ کنارِ ویرایشگر همین تنظیمات را نشان می‌دهد.
        </p>
      </Accordion>

      <Accordion title="بخش‌های پایانِ نوشته" icon="list" defaultOpen={false}>
        <Switch
          checked={post.showAuthor}
          onChange={(v) => patch({ showAuthor: v })}
          label="کارتِ نویسنده"
        />
        <Switch
          checked={post.showShare}
          onChange={(v) => patch({ showShare: v })}
          label="دکمه‌های هم‌رسانی"
        />
        <Switch
          checked={post.showRelated}
          onChange={(v) => patch({ showRelated: v })}
          label="نوشته‌های مرتبط"
        />
      </Accordion>

      <Accordion title="سئو و هم‌رسانی" icon="chart" defaultOpen={false}>
        <div className="field">
          <label className="label" htmlFor="p-seo-title">
            عنوانِ سئو{" "}
            <span className="label-hint">({toFa(post.seo.title.length)} از ۶۰)</span>
          </label>
          <input
            id="p-seo-title"
            className="input"
            maxLength={60}
            value={post.seo.title}
            placeholder={post.title || "عنوانِ نوشته"}
            onChange={(e) => patch({ seo: { ...post.seo, title: e.target.value } })}
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="p-seo-desc">
            توضیحِ سئو{" "}
            <span className="label-hint">({toFa(post.seo.description.length)} از ۱۶۰)</span>
          </label>
          <textarea
            id="p-seo-desc"
            className="textarea"
            rows={3}
            maxLength={160}
            value={post.seo.description}
            placeholder={post.excerpt || "توضیحِ کوتاه برای موتورهای جست‌وجو"}
            onChange={(e) => patch({ seo: { ...post.seo, description: e.target.value } })}
          />
        </div>
        <div className="field">
          <span className="label">تصویرِ هم‌رسانی</span>
          <button className="cover-slot" type="button" onClick={() => setOgPick(true)}>
            {post.seo.ogImage ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.seo.ogImage} alt="" />
                <span className="cover-slot-tag">
                  <Icon name="edit" /> تغییر
                </span>
              </>
            ) : (
              <>
                <Icon name="globe" />
                <span>خالی = تصویرِ شاخص</span>
              </>
            )}
          </button>
        </div>
        <Switch
          checked={post.seo.noindex}
          onChange={(v) => patch({ seo: { ...post.seo, noindex: v } })}
          label="در جست‌وجو نمایان نشود"
          hint="noindex برای نوشته‌های خصوصی."
        />
      </Accordion>

      <Accordion title="CSSِ سفارشی" icon="code" defaultOpen={false}>
        <div className="field">
          <label className="label" htmlFor="p-css">
            فقط روی همین نوشته اعمال می‌شود
          </label>
          <textarea
            id="p-css"
            className="textarea mono"
            dir="ltr"
            rows={7}
            spellCheck={false}
            style={{ textAlign: "left", fontSize: "0.78rem" }}
            value={post.customCss}
            placeholder={".md h2 { letter-spacing: -0.01em; }"}
            onChange={(e) => patch({ customCss: e.target.value })}
          />
          <p className="label-hint">
            انتخابگرها را با <span className="mono">.md</span> شروع کنید تا به بقیهٔ
            سایت نشت نکند.
          </p>
        </div>
      </Accordion>

      {coverPick ? (
        <MediaPicker
          kind="image"
          media={media}
          title="تصویر شاخص"
          onClose={() => setCoverPick(false)}
          onUploaded={onUploaded}
          onSubmit={(items) => {
            patch({ coverUrl: items[0].url, coverAlt: items[0].alt || post.coverAlt });
            setCoverPick(false);
          }}
        />
      ) : null}

      {ogPick ? (
        <MediaPicker
          kind="image"
          media={media}
          title="تصویرِ هم‌رسانی"
          onClose={() => setOgPick(false)}
          onUploaded={onUploaded}
          onSubmit={(items) => {
            patch({ seo: { ...post.seo, ogImage: items[0].url } });
            setOgPick(false);
          }}
        />
      ) : null}
    </aside>
  );
}