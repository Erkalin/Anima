"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { uploadMediaAction } from "@/lib/actions/media";
import type { Media, MediaKind } from "@/lib/types";
import { MEDIA_LABEL } from "@/lib/types";
import { formatBytes, toFa } from "@/lib/utils";
import { Icon } from "./Icons";
import { Modal, useToast } from "./ui";

export type Picked = {
  url: string;
  name: string;
  alt: string;
  caption: string;
  size: number;
  width: number | null;
  height: number | null;
  extra: Record<string, string>;
};

export type ExtraField = {
  key: string;
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
};

const KIND_ICON: Record<MediaKind, string> = {
  image: "image",
  video: "video",
  audio: "audio",
  file: "file",
};

const ACCEPT: Record<MediaKind, string> = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  file: "*/*",
};

export function MediaPicker({
  kind,
  media,
  multiple = false,
  onClose,
  onSubmit,
  onUploaded,
  title,
  fields = [],
  tools,
}: {
  kind: MediaKind;
  media: Media[];
  multiple?: boolean;
  onClose: () => void;
  onSubmit: (items: Picked[]) => void;
  onUploaded: (rows: Media[]) => void;
  title?: string;
  fields?: ExtraField[];
  tools?: ReactNode;
}) {
  const toast = useToast();
  const [tab, setTab] = useState<"library" | "upload" | "url">("library");
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<Picked[]>([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);

  const pool = useMemo(() => {
    const q = query.trim().toLowerCase();
    return media
      .filter((m) => m.kind === kind)
      .filter((m) => !q || m.name.toLowerCase().includes(q) || m.alt.toLowerCase().includes(q));
  }, [media, kind, query]);

  const first = chosen[0];

  function patch(p: Partial<Picked>) {
    setChosen((list) => list.map((c, i) => (i === 0 ? { ...c, ...p } : c)));
  }

  function patchExtra(key: string, value: string) {
    setChosen((list) =>
      list.map((c, i) => (i === 0 ? { ...c, extra: { ...c.extra, [key]: value } } : c)),
    );
  }

  function toggle(m: Media) {
    const item: Picked = {
      url: m.url,
      name: m.name,
      alt: m.alt,
      caption: m.caption,
      size: m.size,
      width: m.width,
      height: m.height,
      extra: {},
    };
    setChosen((list) => {
      const at = list.findIndex((c) => c.url === m.url);
      if (at !== -1) return list.filter((_, i) => i !== at);
      return multiple ? [...list, item] : [item];
    });
    if (kind === "image" && !m.width) {
      const probe = new Image();
      probe.onload = () => {
        setChosen((list) =>
          list.map((c) =>
            c.url === m.url
              ? { ...c, width: probe.naturalWidth, height: probe.naturalHeight }
              : c,
          ),
        );
      };
      probe.src = m.url;
    }
  }

  async function send(files: FileList | File[]) {
    const list = [...files];
    if (!list.length) return;
    setBusy(true);
    setProgress(list.map((f) => f.name));
    const form = new FormData();
    list.forEach((f) => form.append("files", f));
    const res = await uploadMediaAction(form);
    setBusy(false);
    setProgress([]);
    if (!res.ok) {
      toast.err(res.error);
      return;
    }
    onUploaded(res.data);
    toast.ok(`${toFa(res.data.length)} فایل بارگذاری شد.`);
    const picked: Picked[] = res.data
      .filter((m) => m.kind === kind)
      .map((m) => ({
        url: m.url,
        name: m.name,
        alt: m.alt,
        caption: m.caption,
        size: m.size,
        width: m.width,
        height: m.height,
        extra: {},
      }));
    if (picked.length) {
      setChosen(multiple ? picked : [picked[0]]);
      setTab("library");
    }
  }

  function addUrl() {
    const value = url.trim();
    if (!value) return;
    const name = value.split("/").pop() || value;
    setChosen([
      {
        url: value,
        name,
        alt: "",
        caption: "",
        size: 0,
        width: null,
        height: null,
        extra: {},
      },
    ]);
    if (kind === "image") {
      const probe = new Image();
      probe.onload = () =>
        setChosen((list) =>
          list.map((c) =>
            c.url === value
              ? { ...c, width: probe.naturalWidth, height: probe.naturalHeight }
              : c,
          ),
        );
      probe.src = value;
    }
    setTab("library");
    toast.info("نشانی افزوده شد.");
  }

  const canSubmit = chosen.length > 0 && chosen.every((c) => c.url.trim());

  return (
    <Modal
      title={title ?? `درج ${MEDIA_LABEL[kind]}`}
      sub={
        multiple
          ? "چند مورد را انتخاب کنید؛ به ترتیبِ انتخاب چیده می‌شوند."
          : "از کتابخانه انتخاب کنید، فایل تازه بار بگذارید یا نشانی بدهید."
      }
      onClose={onClose}
      size="wide"
      foot={
        <>
          <span className="muted" style={{ marginInlineEnd: "auto" }}>
            {chosen.length
              ? `${toFa(chosen.length)} مورد انتخاب شده`
              : "چیزی انتخاب نشده"}
          </span>
          <button className="btn btn-ghost btn-sm" type="button" onClick={onClose}>
            انصراف
          </button>
          <button
            className="btn btn-brass btn-sm"
            type="button"
            aria-disabled={!canSubmit}
            onClick={() => canSubmit && onSubmit(chosen)}
          >
            <Icon name="plus" /> درج در نوشته
          </button>
        </>
      }
    >
      <div className="seg" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "library"}
          className={tab === "library" ? "is-on" : ""}
          onClick={() => setTab("library")}
        >
          کتابخانه
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "upload"}
          className={tab === "upload" ? "is-on" : ""}
          onClick={() => setTab("upload")}
        >
          بارگذاری
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "url"}
          className={tab === "url" ? "is-on" : ""}
          onClick={() => setTab("url")}
        >
          نشانی
        </button>
      </div>

      {tools}

      {tab === "library" ? (
        <>
          <div className="search">
            <Icon name="search" />
            <input
              className="input"
              placeholder={`جست‌وجو در ${MEDIA_LABEL[kind]}ها…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {pool.length ? (
            <div className="media-grid" style={{ maxHeight: "20rem", overflowY: "auto" }}>
              {pool.map((m) => {
                const on = chosen.some((c) => c.url === m.url);
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`media-tile${on ? " is-on" : ""}`}
                    onClick={() => toggle(m)}
                    aria-pressed={on}
                  >
                    <span className="media-thumb">
                      {m.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt={m.alt || m.name} loading="lazy" />
                      ) : (
                        <Icon name={KIND_ICON[m.kind]} />
                      )}
                      <span className="media-kind">{MEDIA_LABEL[m.kind]}</span>
                      {on ? (
                        <span className="media-pick">
                          <Icon name="check" />
                        </span>
                      ) : null}
                    </span>
                    <span className="media-name">{m.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="tbl-empty">
              <Icon name={KIND_ICON[kind]} />
              <p>هنوز {MEDIA_LABEL[kind]}ی در کتابخانه نیست.</p>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                style={{ marginTop: "0.8rem" }}
                onClick={() => setTab("upload")}
              >
                <Icon name="upload" /> بارگذاری کنید
              </button>
            </div>
          )}
        </>
      ) : null}

      {tab === "upload" ? (
        <>
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
            <span>فایل را اینجا رها کنید یا کلیک کنید</span>
            <small>
              {kind === "file"
                ? "هر نوع فایلی · حداکثر ۴۰ مگابایت"
                : `${MEDIA_LABEL[kind]} · حداکثر ۴۰ مگابایت`}
            </small>
          </div>
          <input
            ref={input}
            type="file"
            hidden
            multiple={multiple}
            accept={ACCEPT[kind]}
            onChange={(e) => {
              if (e.target.files) void send(e.target.files);
              e.target.value = "";
            }}
          />
          {busy ? (
            <div className="stack">
              {progress.map((name) => (
                <div className="upload-row" key={name}>
                  <Icon name="upload" />
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {name}
                  </span>
                  <span className="upload-bar">
                    <span style={{ width: "60%" }} />
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {tab === "url" ? (
        <div className="field">
          <label className="label" htmlFor="media-url">
            نشانیِ فایل
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              id="media-url"
              className="input mono"
              dir="ltr"
              placeholder="https://example.com/photo.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addUrl();
                }
              }}
            />
            <button className="btn btn-ghost btn-sm" type="button" onClick={addUrl}>
              افزودن
            </button>
          </div>
          <p className="muted">
            نشانیِ بیرونی ذخیره نمی‌شود؛ فقط داخل نوشته می‌آید.
          </p>
        </div>
      ) : null}

      {first ? (
        <div className="stack" style={{ borderTop: "1px solid var(--oak)", paddingTop: "0.9rem" }}>
          {!multiple ? (
            <div className="field-row">
              <div className="field">
                <label className="label" htmlFor="m-alt">
                  {kind === "image" ? "متنِ جایگزین (alt)" : "نامِ نمایشی"}
                </label>
                <input
                  id="m-alt"
                  className="input"
                  value={kind === "image" ? first.alt : first.name}
                  onChange={(e) =>
                    patch(kind === "image" ? { alt: e.target.value } : { name: e.target.value })
                  }
                  placeholder={kind === "image" ? "توصیفِ کوتاه برای دسترس‌پذیری" : first.name}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="m-caption">
                  زیرنویس
                </label>
                <input
                  id="m-caption"
                  className="input"
                  value={first.caption}
                  onChange={(e) => patch({ caption: e.target.value })}
                  placeholder="اختیاری"
                />
              </div>
            </div>
          ) : null}

          {fields.length ? (
            <div className="field-row">
              {fields.map((f) => (
                <div className="field" key={f.key}>
                  <label className="label" htmlFor={`m-x-${f.key}`}>
                    {f.label}
                  </label>
                  {f.options ? (
                    <select
                      id={`m-x-${f.key}`}
                      className="select"
                      value={first.extra[f.key] ?? f.options[0].value}
                      onChange={(e) => patchExtra(f.key, e.target.value)}
                    >
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`m-x-${f.key}`}
                      className="input"
                      value={first.extra[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => patchExtra(f.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : null}

          <p className="muted" dir="ltr" style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: "0.74rem" }}>
            {first.url}
            {first.size ? ` · ${formatBytes(first.size)}` : ""}
            {first.width && first.height ? ` · ${first.width}×${first.height}` : ""}
          </p>
        </div>
      ) : null}
    </Modal>
  );
}