"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteMediaAction,
  updateMediaAction,
  uploadMediaAction,
} from "@/lib/actions/media";
import { MEDIA_LABEL, type Media, type MediaKind, type Post } from "@/lib/types";
import { faDate, formatBytes, toFa } from "@/lib/utils";
import { Icon } from "@/app/components/admin/Icons";
import { Empty, Modal, useToast } from "@/app/components/admin/ui";

const KIND_ICON: Record<MediaKind, string> = {
  image: "image",
  video: "video",
  audio: "audio",
  file: "file",
};

const KINDS: MediaKind[] = ["image", "video", "audio", "file"];

function snippet(m: Media): string {
  const alt = m.alt || m.name;
  const cap = m.caption ? ` caption="${m.caption}"` : "";
  if (m.kind === "image")
    return `::image[${m.url}]{alt="${alt}"${cap}${
      m.width && m.height ? ` width=${m.width} height=${m.height}` : ""
    }}`;
  if (m.kind === "video") return `::video[${m.url}]{${cap.trim() || `caption="${alt}"`}}`;
  if (m.kind === "audio") return `::audio[${m.url}]{title="${alt}"${cap}}`;
  return `::file[${m.url}]{name="${m.name}" size="${formatBytes(m.size)}"${cap}}`;
}

export function MediaLibrary({
  media,
  posts,
}: {
  media: Media[];
  posts: Post[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState(media);
  const [kind, setKind] = useState<"all" | MediaKind>("all");
  const [q, setQ] = useState("");
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  const [open, setOpen] = useState<Media | null>(null);
  const [confirm, setConfirm] = useState<Media | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => setRows(media), [media]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: rows.length };
    for (const m of rows) map[m.kind] = (map[m.kind] ?? 0) + 1;
    return map;
  }, [rows]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((m) => kind === "all" || m.kind === kind)
      .filter(
        (m) =>
          !needle ||
          m.name.toLowerCase().includes(needle) ||
          m.alt.toLowerCase().includes(needle) ||
          m.caption.toLowerCase().includes(needle),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [rows, kind, q]);

  const usedBy = useMemo(() => {
    if (!open) return [];
    return posts.filter((p) => p.content.includes(open.url) || p.coverUrl === open.url);
  }, [open, posts]);

  const bytes = rows.reduce((sum, m) => sum + m.size, 0);

  async function send(files: FileList | File[]) {
    const list = [...files];
    if (!list.length) return;
    setBusy(true);
    setPending(list.map((f) => f.name));
    const form = new FormData();
    list.forEach((f) => form.append("files", f));
    const res = await uploadMediaAction(form);
    setBusy(false);
    setPending([]);
    if (!res.ok) return toast.err(res.error);
    setRows((list0) => [...res.data, ...list0]);
    toast.ok(`${toFa(res.data.length)} فایل بارگذاری شد.`);
    router.refresh();
  }

  async function save(next: Media) {
    setRows((list) => list.map((m) => (m.id === next.id ? next : m)));
    setOpen(next);
    const res = await updateMediaAction(next);
    if (!res.ok) return toast.err(res.error);
    toast.ok("ذخیره شد.");
    router.refresh();
  }

  async function remove(m: Media) {
    setConfirm(null);
    setOpen(null);
    setRows((list) => list.filter((x) => x.id !== m.id));
    const res = await deleteMediaAction(m.id);
    if (!res.ok) {
      setRows((list) => [m, ...list]);
      toast.err(res.error);
      return;
    }
    toast.info(`«${m.name}» حذف شد.`);
    router.refresh();
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.ok(`${label} رونوشت شد.`);
    } catch {
      toast.err("رونوشت‌گیری ممکن نشد؛ دستی انتخاب کنید.");
    }
  }

  return (
    <div className="admin-body">
      <section className="panel">
        <div className="panel-body">
          <div
            className={`dropzone${over ? " is-over" : ""}`}
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              void send(e.dataTransfer.files);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") input.current?.click();
            }}
          >
            <Icon name="upload" />
            <span>فایل‌ها را اینجا رها کنید یا کلیک کنید</span>
            <small>
              تصویر، ویدیو، صدا و هر فایلِ دیگر · هر بار تا ۱۲ فایل · هر فایل تا ۴۰
              مگابایت
            </small>
          </div>
          <input
            ref={input}
            type="file"
            hidden
            multiple
            onChange={(e) => {
              if (e.target.files) void send(e.target.files);
              e.target.value = "";
            }}
          />
          {busy ? (
            <div className="stack" style={{ marginTop: "0.85rem" }}>
              {pending.map((name) => (
                <div className="upload-row" key={name}>
                  <Icon name="upload" />
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {name}
                  </span>
                  <span className="upload-bar">
                    <span style={{ width: "60%" }} />
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div className="seg" role="tablist" aria-label="نوع رسانه">
            <button
              type="button"
              role="tab"
              aria-selected={kind === "all"}
              className={kind === "all" ? "is-on" : undefined}
              onClick={() => setKind("all")}
            >
              همه <span style={{ opacity: 0.7 }}>{toFa(counts.all ?? 0)}</span>
            </button>
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={kind === k}
                className={kind === k ? "is-on" : undefined}
                onClick={() => setKind(k)}
              >
                <Icon name={KIND_ICON[k]} /> {MEDIA_LABEL[k]}
                <span style={{ opacity: 0.7 }}>{toFa(counts[k] ?? 0)}</span>
              </button>
            ))}
          </div>
          <div className="admin-top-spacer" />
          <label className="search" style={{ maxWidth: "20rem" }}>
            <Icon name="search" />
            <input
              className="input"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جست‌وجو در نام و توضیح…"
              aria-label="جست‌وجوی رسانه"
            />
          </label>
        </div>

        <div className="panel-body">
          {shown.length ? (
            <>
              <div className="media-grid">
                {shown.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="media-tile"
                    onClick={() => setOpen(m)}
                    aria-label={`جزئیات ${m.name}`}
                  >
                    <span className="media-thumb">
                      {m.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt={m.alt || m.name} loading="lazy" />
                      ) : (
                        <Icon name={KIND_ICON[m.kind]} />
                      )}
                      <span className="media-kind">{MEDIA_LABEL[m.kind]}</span>
                    </span>
                    <span className="media-name">{m.name}</span>
                  </button>
                ))}
              </div>
              <p className="muted" style={{ marginTop: "0.9rem" }}>
                {toFa(shown.length)} مورد · مجموعِ کل {formatBytes(bytes)}
              </p>
            </>
          ) : (
            <Empty
              icon="media"
              title={rows.length ? "چیزی پیدا نشد" : "کتابخانه خالی است"}
              note={
                rows.length
                  ? "نوعِ دیگری را انتخاب کنید یا عبارت را عوض کنید."
                  : "اولین فایل را بالا رها کنید."
              }
            />
          )}
        </div>
      </section>

      {open ? (
        <Modal
          title={open.name}
          sub={`${MEDIA_LABEL[open.kind]} · ${formatBytes(open.size)} · ${faDate(open.createdAt)}`}
          onClose={() => setOpen(null)}
          size="wide"
          foot={
            <>
              <button
                className="btn btn-danger btn-sm"
                type="button"
                onClick={() => setConfirm(open)}
              >
                <Icon name="trash" /> حذف
              </button>
              <div className="admin-top-spacer" />
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => copy(open.url, "نشانی")}
              >
                <Icon name="copy" /> رونوشتِ نشانی
              </button>
              <button
                className="btn btn-brass btn-sm"
                type="button"
                onClick={() => copy(snippet(open), "کدِ درج")}
              >
                <Icon name="code" /> رونوشتِ کدِ درج
              </button>
            </>
          }
        >
          <div className="media-detail">
            <div className="media-detail-preview">
              {open.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={open.url} alt={open.alt || open.name} />
              ) : open.kind === "video" ? (
                <video src={open.url} controls preload="metadata" playsInline />
              ) : open.kind === "audio" ? (
                <audio src={open.url} controls preload="metadata" />
              ) : (
                <span className="media-detail-file">
                  <Icon name="file" />
                  <span>{open.name}</span>
                </span>
              )}
            </div>

            <div className="stack">
              <div className="field">
                <label className="label" htmlFor="md-name">
                  <Icon name="file" /> نامِ فایل
                </label>
                <input
                  id="md-name"
                  className="input"
                  value={open.name}
                  onChange={(e) => setOpen({ ...open, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="md-alt">
                  <Icon name="words" /> متنِ جایگزین
                  <span className="label-hint">برای دسترس‌پذیری و سئو</span>
                </label>
                <input
                  id="md-alt"
                  className="input"
                  value={open.alt}
                  onChange={(e) => setOpen({ ...open, alt: e.target.value })}
                  placeholder="توصیفِ کوتاهِ آنچه دیده یا شنیده می‌شود"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="md-cap">
                  <Icon name="quote" /> زیرنویس
                </label>
                <input
                  id="md-cap"
                  className="input"
                  value={open.caption}
                  onChange={(e) => setOpen({ ...open, caption: e.target.value })}
                  placeholder="اختیاری"
                />
              </div>

              <button
                className="btn btn-verdigris btn-sm"
                type="button"
                onClick={() => save(open)}
              >
                <Icon name="save" /> ذخیرهٔ تغییرات
              </button>

              <div className="divider-line" />

              <div className="field">
                <span className="label">
                  <Icon name="code" /> کدِ درج در نوشته
                </span>
                <textarea
                  className="textarea mono"
                  dir="ltr"
                  readOnly
                  rows={3}
                  value={snippet(open)}
                  onFocus={(e) => e.currentTarget.select()}
                />
              </div>

              <p className="muted mono" dir="ltr" style={{ textAlign: "right" }}>
                {open.url}
                {open.width && open.height
                  ? ` · ${open.width}×${open.height}`
                  : ""}
              </p>

              {usedBy.length ? (
                <div className="field">
                  <span className="label">
                    <Icon name="posts" /> در این نوشته‌ها استفاده شده
                  </span>
                  <ul className="list-plain">
                    {usedBy.map((p) => (
                      <li key={p.id}>
                        <span className="rank">
                          <Icon name="posts" />
                        </span>
                        <Link
                          className="tbl-name"
                          href={`/admin/posts/${p.id}`}
                          style={{ flex: 1 }}
                        >
                          {p.title || "بی‌عنوان"}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="muted">
                  این فایل هنوز در هیچ نوشته‌ای به کار نرفته است.
                </p>
              )}

              <a
                className="btn btn-ghost btn-sm"
                href={open.url}
                target="_blank"
                rel="noreferrer"
                download
              >
                <Icon name="download" /> دریافتِ فایل
              </a>
            </div>
          </div>
        </Modal>
      ) : null}

      {confirm ? (
        <Modal
          title="حذفِ فایل"
          sub="فایل از کتابخانه و از دیسک پاک می‌شود. نوشته‌هایی که به آن اشاره دارند، جای خالی نشان می‌دهند."
          onClose={() => setConfirm(null)}
          size="narrow"
          foot={
            <>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setConfirm(null)}
              >
                نگه دار
              </button>
              <button
                className="btn btn-danger"
                type="button"
                onClick={() => remove(confirm)}
              >
                <Icon name="trash" /> حذف کن
              </button>
            </>
          }
        >
          <p>
            <strong>{confirm.name}</strong> حذف شود؟
          </p>
        </Modal>
      ) : null}
    </div>
  );
}