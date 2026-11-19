"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { saveSettingsAction } from "@/lib/actions/settings";
import {
  ACCENTS,
  type Author,
  type SessionAdmin,
  type Settings,
} from "@/lib/types";
import { toFa } from "@/lib/utils";
import { Icon } from "@/app/components/admin/Icons";
import { Range, Switch, useToast } from "@/app/components/admin/ui";

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SESSION_SECRET",
];

export function SettingsForm({
  settings,
  authors,
  mode,
  admin,
}: {
  settings: Settings;
  authors: Author[];
  mode: "local" | "supabase";
  admin: SessionAdmin;
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  function patch(delta: Partial<Settings>) {
    setForm((f) => ({ ...f, ...delta }));
    setDirty(true);
  }

  async function save() {
    setBusy(true);
    const res = await saveSettingsAction(form);
    setBusy(false);
    if (!res.ok) return toast.err(res.error);
    setForm(res.data);
    setDirty(false);
    toast.ok("تنظیمات ذخیره شد.");
    router.refresh();
  }

  return (
    <div className="admin-body">
      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">آموزشگاه</h2>
          <div className="admin-top-spacer" />
          <button
            className="btn btn-brass btn-sm"
            type="button"
            aria-disabled={busy || !dirty}
            onClick={save}
          >
            <Icon name="save" /> {dirty ? "ذخیرهٔ تغییرات" : "ذخیره شده"}
          </button>
        </div>
        <div className="panel-body">
          <div className="field-row">
            <div className="field">
              <label className="label" htmlFor="s-brand">
                <Icon name="note" /> نامِ آموزشگاه
              </label>
              <input
                id="s-brand"
                className="input"
                value={form.brand}
                maxLength={80}
                onChange={(e) => patch({ brand: e.target.value })}
                placeholder="آموزشگاه موسیقی…"
              />
              <p className="muted">
                در سرِ پنل و در عنوانِ صفحه‌ها می‌آید.
              </p>
            </div>
            <div className="field">
              <label className="label" htmlFor="s-tg">
                <Icon name="telegram" /> نشانیِ تلگرام
              </label>
              <input
                id="s-tg"
                className="input mono"
                dir="ltr"
                value={form.telegramUsername}
                onChange={(e) => patch({ telegramUsername: e.target.value })}
                placeholder="studio_music"
              />
              <p className="muted">
                فقط نامِ کاربری؛ دکمه‌های «پیام در تلگرام» به همین می‌روند.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">وبلاگ</h2>
          <p className="panel-note">سرِ صفحهٔ /blog و خوراکِ RSS</p>
        </div>
        <div className="panel-body">
          <div className="stack">
            <div className="field">
              <label className="label" htmlFor="s-bt">
                عنوانِ وبلاگ
              </label>
              <input
                id="s-bt"
                className="input"
                value={form.blogTitle}
                maxLength={80}
                onChange={(e) => patch({ blogTitle: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="s-bd">
                توضیحِ وبلاگ
                <span className="label-hint">
                  {toFa(form.blogDescription.length)} از ۲۴۰
                </span>
              </label>
              <textarea
                id="s-bd"
                className="textarea"
                rows={3}
                maxLength={240}
                value={form.blogDescription}
                onChange={(e) => patch({ blogDescription: e.target.value })}
              />
            </div>
            <div className="field">
              <span className="label">
                <Icon name="list" /> نوشته در هر صفحه
              </span>
              <Range
                value={form.postsPerPage}
                min={3}
                max={24}
                onChange={(v) => patch({ postsPerPage: v })}
                format={(v) => toFa(v)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">پیش‌فرضِ نوشتهٔ تازه</h2>
          <p className="panel-note">
            هر نوشته بعداً در ستونِ تنظیماتِ خودش قابلِ تغییر است.
          </p>
        </div>
        <div className="panel-body">
          <div className="field-row">
            <div className="field">
              <label className="label" htmlFor="s-author">
                <Icon name="user" /> نویسنده
              </label>
              <select
                id="s-author"
                className="select"
                value={form.defaultAuthorId ?? ""}
                onChange={(e) =>
                  patch({ defaultAuthorId: e.target.value || null })
                }
              >
                <option value="">بدون نویسنده</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <span className="label">
                <Icon name="brass" /> رنگِ متن
              </span>
              <div className="accent-row">
                {ACCENTS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    className={`accent-dot${form.defaultAccent === a.key ? " is-on" : ""}`}
                    style={{ "--swatch": a.hex } as CSSProperties}
                    onClick={() => patch({ defaultAccent: a.key })}
                    aria-label={a.label}
                    aria-pressed={form.defaultAccent === a.key}
                    title={a.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="divider-line" />
          <Switch
            checked={form.defaultToc}
            onChange={(v) => patch({ defaultToc: v })}
            label="فهرست مطالب روشن باشد"
            hint="کنارِ متن می‌چسبد و از عنوان‌ها ساخته می‌شود."
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">ذخیره‌سازی و حساب</h2>
          <div className="admin-top-spacer" />
          <span className="pill" data-tone={mode === "supabase" ? "published" : "scheduled"}>
            <span className="pill-dot" />
            {mode === "supabase" ? "Supabase" : "محلی"}
          </span>
        </div>
        <div className="panel-body">
          <div className="stack">
            <p className="muted">
              {mode === "supabase"
                ? "نوشته‌ها در Postgres و فایل‌ها در Storageِ Supabase ذخیره می‌شوند."
                : "کلیدهای Supabase هنوز تنظیم نشده‌اند. همه‌چیز روی همین دستگاه است و پنل کاملاً کار می‌کند."}
            </p>
            <div className="field">
              <span className="label">
                <Icon name="lock" /> کلیدهایی که در <code className="mono">.env</code> لازم است
              </span>
              <ul className="list-plain">
                {ENV_KEYS.map((k) => (
                  <li key={k}>
                    <span className="rank">
                      <Icon name="lock" />
                    </span>
                    <code className="mono" dir="ltr" style={{ flex: 1 }}>
                      {k}
                    </code>
                  </li>
                ))}
              </ul>
              <p className="muted">
                جدول‌ها و سیاست‌های دسترسی در{" "}
                <code className="mono">supabase/schema.sql</code> آماده است؛
                همان را در SQL Editor اجرا کنید.
              </p>
            </div>
            <div className="divider-line" />
            <div className="admin-who" style={{ padding: 0 }}>
              <span className="admin-avatar">
                {admin.name.trim().slice(0, 1) || "م"}
              </span>
              <span className="admin-who-text">
                <span className="admin-who-name">{admin.name}</span>
                <span className="admin-who-mail">{admin.email}</span>
              </span>
              <span className="pill" data-tone="published">
                {admin.role === "owner" ? "مالک" : "ویراستار"}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}