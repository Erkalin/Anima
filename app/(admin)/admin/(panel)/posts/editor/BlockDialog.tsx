"use client";

import { useMemo, useState } from "react";
import { MediaPicker, type Picked } from "@/app/components/admin/MediaPicker";
import { Icon } from "@/app/components/admin/Icons";
import { Modal, Range, Switch } from "@/app/components/admin/ui";
import { Markdown } from "@/lib/markdown/Markdown";
import { tableMarkdown, type DialogId } from "@/lib/editor/blocks";
import { container, leaf } from "@/lib/editor/serialize";
import { ACCENTS, type Media, type MediaKind } from "@/lib/types";
import { formatBytes, toFa } from "@/lib/utils";

const MEDIA_KIND: Partial<Record<DialogId, MediaKind>> = {
  image: "image",
  video: "video",
  audio: "audio",
  file: "file",
};

const CALLOUT_TONES = [
  { value: "note", label: "یادداشت" },
  { value: "tip", label: "نکته" },
  { value: "info", label: "اطلاعات" },
  { value: "success", label: "درست" },
  { value: "warning", label: "هشدار" },
  { value: "danger", label: "خطر" },
];

const LANGS = [
  "text", "js", "ts", "tsx", "python", "bash", "json", "yaml", "css", "html",
  "sql", "abc", "lilypond", "markdown",
];

function youtubeId(raw: string): string {
  const v = raw.trim();
  const patterns = [
    /[?&]v=([\w-]{6,})/,
    /youtu\.be\/([\w-]{6,})/,
    /\/embed\/([\w-]{6,})/,
    /\/shorts\/([\w-]{6,})/,
  ];
  for (const re of patterns) {
    const m = re.exec(v);
    if (m) return m[1];
  }
  return v;
}

function aparatId(raw: string): string {
  const m = /aparat\.com\/v\/([\w-]+)/i.exec(raw.trim());
  return m ? m[1] : raw.trim();
}

export function BlockDialog({
  id,
  media,
  selection,
  onClose,
  onInsert,
  onUploaded,
}: {
  id: DialogId;
  media: Media[];
  selection: string;
  onClose: () => void;
  onInsert: (text: string, select?: [number, number], inline?: boolean) => void;
  onUploaded: (rows: Media[]) => void;
}) {
  const kind = MEDIA_KIND[id];

  if (kind) {
    const fields =
      kind === "image"
        ? [
            {
              key: "align",
              label: "عرضِ تصویر",
              options: [
                { value: "contained", label: "هم‌عرضِ متن" },
                { value: "wide", label: "کمی پهن‌تر" },
                { value: "full", label: "تمام‌عرض" },
              ],
            },
          ]
        : kind === "audio"
          ? [
              { key: "title", label: "نامِ قطعه", placeholder: "مثلاً تمرینِ گام" },
              { key: "artist", label: "نوازنده", placeholder: "اختیاری" },
            ]
          : kind === "video"
            ? [{ key: "poster", label: "نشانیِ پوستر", placeholder: "https://…" }]
            : [];

    return (
      <MediaPicker
        kind={kind}
        media={media}
        fields={fields}
        onClose={onClose}
        onUploaded={onUploaded}
        onSubmit={(items: Picked[]) => {
          const p = items[0];
          if (kind === "image") {
            onInsert(
              leaf("image", p.url, {
                alt: p.alt,
                caption: p.caption,
                align: p.extra.align ?? "contained",
                width: p.width,
                height: p.height,
              }),
            );
          } else if (kind === "video") {
            onInsert(
              leaf("video", p.url, { poster: p.extra.poster, caption: p.caption }),
            );
          } else if (kind === "audio") {
            onInsert(
              leaf("audio", p.url, {
                title: p.extra.title || p.name,
                artist: p.extra.artist,
                caption: p.caption,
              }),
            );
          } else {
            onInsert(
              leaf("file", p.url, {
                name: p.name,
                caption: p.caption,
                size: p.size ? formatBytes(p.size) : "",
              }),
            );
          }
          onClose();
        }}
      />
    );
  }

  if (id === "gallery") {
    return (
      <GalleryDialog
        media={media}
        onClose={onClose}
        onInsert={onInsert}
        onUploaded={onUploaded}
      />
    );
  }

  return (
    <SimpleDialog
      id={id}
      selection={selection}
      onClose={onClose}
      onInsert={onInsert}
    />
  );
}

function GalleryDialog({
  media,
  onClose,
  onInsert,
  onUploaded,
}: {
  media: Media[];
  onClose: () => void;
  onInsert: (text: string) => void;
  onUploaded: (rows: Media[]) => void;
}) {
  const [cols, setCols] = useState(3);
  return (
    <MediaPicker
      kind="image"
      media={media}
      multiple
      title="گالریِ تصویر"
      onClose={onClose}
      onUploaded={onUploaded}
      tools={
        <div className="row-between" style={{ gap: "0.6rem" }}>
          <span className="label" style={{ margin: 0 }}>
            شمارِ ستون‌ها
          </span>
          <div className="seg">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                className={cols === n ? "is-on" : ""}
                onClick={() => setCols(n)}
                aria-pressed={cols === n}
              >
                {toFa(n)}
              </button>
            ))}
          </div>
        </div>
      }
      onSubmit={(items) => {
        const body = items
          .map((p) => leaf("image", p.url, { alt: p.alt, caption: p.caption }))
          .join("\n\n");
        onInsert(container("gallery", body, { cols }));
        onClose();
      }}
    />
  );
}

function SimpleDialog({
  id,
  selection,
  onClose,
  onInsert,
}: {
  id: DialogId;
  selection: string;
  onClose: () => void;
  onInsert: (text: string, select?: [number, number], inline?: boolean) => void;
}) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [header, setHeader] = useState(true);
  const [striped, setStriped] = useState(true);
  const [dense, setDense] = useState(false);
  const [accent, setAccent] = useState("brass");
  const [caption, setCaption] = useState("");
  const [align, setAlign] = useState<("right" | "center" | "left")[]>([]);

  const [tone, setTone] = useState("note");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [text, setText] = useState(selection);
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");

  const [lang, setLang] = useState("text");
  const [code, setCode] = useState("");

  const [math, setMath] = useState("d_n = \\frac{1}{2^{\\,n}}");
  const [display, setDisplay] = useState(true);

  const [platform, setPlatform] = useState<"aparat" | "youtube">("aparat");
  const [embed, setEmbed] = useState("");

  const [bpm, setBpm] = useState(80);
  const [metroLabel, setMetroLabel] = useState("مترونومِ کلاس");

  const table = useMemo(
    () =>
      tableMarkdown({
        rows,
        cols,
        header,
        caption,
        striped,
        dense,
        accent,
        align: Array.from({ length: cols }, (_, i) => align[i] ?? "right"),
      }),
    [rows, cols, header, caption, striped, dense, accent, align],
  );

  const callout = useMemo(
    () => container(tone, body || "متنِ کادر اینجا نوشته می‌شود.", { title }),
    [tone, body, title],
  );

  const foot = (submit: () => void, label = "درج") => (
    <>
      <button className="btn btn-ghost btn-sm" type="button" onClick={onClose}>
        انصراف
      </button>
      <button className="btn btn-brass btn-sm" type="button" onClick={submit}>
        <Icon name="plus" /> {label}
      </button>
    </>
  );

  if (id === "table") {
    return (
      <Modal
        title="جدول"
        sub="سطر، ستون، تراز و رنگ را تنظیم کنید؛ پیش‌نمایش زنده است."
        onClose={onClose}
        size="wide"
        foot={foot(() => {
          onInsert(table);
          onClose();
        })}
      >
        <div className="field-row">
          <div className="field">
            <span className="label">سطرها</span>
            <Range value={rows} min={1} max={16} onChange={setRows} format={(v) => toFa(v)} />
          </div>
          <div className="field">
            <span className="label">ستون‌ها</span>
            <Range value={cols} min={1} max={8} onChange={setCols} format={(v) => toFa(v)} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label className="label" htmlFor="t-caption">عنوانِ جدول</label>
            <input
              id="t-caption"
              className="input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="اختیاری"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="t-accent">رنگ</label>
            <select
              id="t-accent"
              className="select"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
            >
              {ACCENTS.map((a) => (
                <option key={a.key} value={a.key}>{a.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
          <Switch checked={header} onChange={setHeader} label="ردیفِ عنوان" />
          <Switch checked={striped} onChange={setStriped} label="ردیف‌های راه‌راه" />
          <Switch checked={dense} onChange={setDense} label="فشرده" />
        </div>
        <div className="field">
          <span className="label">ترازِ ستون‌ها</span>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {Array.from({ length: cols }, (_, i) => (
              <div className="seg" key={i}>
                {(["right", "center", "left"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={(align[i] ?? "right") === a ? "is-on" : ""}
                    onClick={() =>
                      setAlign((prev) => {
                        const next = [...prev];
                        next[i] = a;
                        return next;
                      })
                    }
                    title={a === "right" ? "راست" : a === "center" ? "وسط" : "چپ"}
                  >
                    {a === "right" ? "راست" : a === "center" ? "وسط" : "چپ"}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="label">پیش‌نمایش</span>
          <div style={{ maxHeight: "16rem", overflow: "auto", border: "1px solid var(--oak)", borderRadius: "0.5rem", padding: "0.75rem" }}>
            <Markdown>{table}</Markdown>
          </div>
        </div>
      </Modal>
    );
  }

  if (id === "callout") {
    return (
      <Modal
        title="کادر تأکید"
        sub="متنی که از بدنهٔ نوشته جدا می‌ایستد."
        onClose={onClose}
        foot={foot(() => {
          onInsert(callout);
          onClose();
        })}
      >
        <div className="field">
          <span className="label">لحن</span>
          <div className="seg" style={{ flexWrap: "wrap" }}>
            {CALLOUT_TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={tone === t.value ? "is-on" : ""}
                onClick={() => setTone(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="c-title">عنوانِ کادر</label>
          <input
            id="c-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="خالی بگذارید تا عنوانِ پیش‌فرض بیاید"
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="c-body">متن</label>
          <textarea
            id="c-body"
            className="textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="هر چیزی که می‌خواهید برجسته شود…"
          />
        </div>
        <div className="field">
          <span className="label">پیش‌نمایش</span>
          <Markdown>{callout}</Markdown>
        </div>
      </Modal>
    );
  }

  if (id === "link") {
    const ok = url.trim().length > 0;
    return (
      <Modal
        title="پیوند"
        sub="روی متنِ انتخاب‌شده لینک بگذارید."
        onClose={onClose}
        size="narrow"
        foot={foot(() => {
          if (!ok) return;
          const label = text.trim() || url.trim();
          onInsert(`[${label}](${url.trim()})`, undefined, true);
          onClose();
        }, "درج پیوند")}
      >
        <div className="field">
          <label className="label" htmlFor="l-text">متنِ پیوند</label>
          <input
            id="l-text"
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="مثلاً تمرینِ روزانه"
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="l-url">نشانی</label>
          <input
            id="l-url"
            className="input mono"
            dir="ltr"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… یا /blog/…"
          />
        </div>
      </Modal>
    );
  }

  if (id === "linkcard") {
    const ok = url.trim().length > 0;
    return (
      <Modal
        title="کارتِ پیوند"
        sub="یک نشانی را به شکل کارتِ بزرگ نشان دهید."
        onClose={onClose}
        size="narrow"
        foot={foot(() => {
          if (!ok) return;
          onInsert(leaf("link", url.trim(), { title, desc }));
          onClose();
        })}
      >
        <div className="field">
          <label className="label" htmlFor="lc-url">نشانی</label>
          <input
            id="lc-url"
            className="input mono"
            dir="ltr"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="lc-title">عنوان</label>
          <input id="lc-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="lc-desc">توضیح</label>
          <input id="lc-desc" className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
      </Modal>
    );
  }

  if (id === "code") {
    return (
      <Modal
        title="قطعه کد"
        sub="با رنگ‌آمیزی و دکمهٔ کپی. برای نُت‌نویسی، زبانِ abc را انتخاب کنید."
        onClose={onClose}
        foot={foot(() => {
          onInsert(`\`\`\`${lang}\n${code || "// code"}\n\`\`\``);
          onClose();
        })}
      >
        <div className="field">
          <label className="label" htmlFor="k-lang">زبان</label>
          <select id="k-lang" className="select" value={lang} onChange={(e) => setLang(e.target.value)}>
            {LANGS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="k-code">کد</label>
          <textarea
            id="k-code"
            className="textarea mono"
            dir="ltr"
            style={{ minHeight: "9rem", textAlign: "left" }}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="X:1&#10;T:تمرین&#10;M:4/4&#10;K:C&#10;CDEF GABc|"
          />
        </div>
      </Modal>
    );
  }

  if (id === "math") {
    const snippet = display ? `$$\n${math}\n$$` : `$${math}$`;
    return (
      <Modal
        title="فرمول ریاضی"
        sub="با سینتکسِ LaTeX نوشته می‌شود."
        onClose={onClose}
        foot={foot(() => {
          onInsert(snippet, undefined, !display);
          onClose();
        })}
      >
        <Switch checked={display} onChange={setDisplay} label="نمایشِ جداگانه (بلوک)" />
        <div className="field">
          <label className="label" htmlFor="m-tex">LaTeX</label>
          <textarea
            id="m-tex"
            className="textarea mono"
            dir="ltr"
            style={{ textAlign: "left" }}
            value={math}
            onChange={(e) => setMath(e.target.value)}
          />
        </div>
        <div className="field">
          <span className="label">پیش‌نمایش</span>
          <div dir="ltr">
            <Markdown>{snippet}</Markdown>
          </div>
        </div>
      </Modal>
    );
  }

  if (id === "embed") {
    const value = platform === "youtube" ? youtubeId(embed) : aparatId(embed);
    const ok = value.length > 0;
    return (
      <Modal
        title="ویدیوی جاسازی‌شده"
        sub="نشانی یا شناسهٔ ویدیو را بدهید؛ بدون بارگذاری فایل."
        onClose={onClose}
        size="narrow"
        foot={foot(() => {
          if (!ok) return;
          onInsert(leaf(platform, value));
          onClose();
        })}
      >
        <div className="seg">
          <button type="button" className={platform === "aparat" ? "is-on" : ""} onClick={() => setPlatform("aparat")}>
            آپارات
          </button>
          <button type="button" className={platform === "youtube" ? "is-on" : ""} onClick={() => setPlatform("youtube")}>
            یوتیوب
          </button>
        </div>
        <div className="field">
          <label className="label" htmlFor="e-id">نشانی یا شناسه</label>
          <input
            id="e-id"
            className="input mono"
            dir="ltr"
            value={embed}
            onChange={(e) => setEmbed(e.target.value)}
            placeholder={platform === "aparat" ? "https://www.aparat.com/v/xxxxx" : "https://youtu.be/xxxxxxxxxxx"}
          />
        </div>
        {ok ? <p className="muted">شناسه: <span className="mono">{value}</span></p> : null}
      </Modal>
    );
  }

  if (id === "metronome") {
    return (
      <Modal
        title="مترونوم"
        sub="یک مترونومِ قابل نواختن داخل نوشته می‌گذارد."
        onClose={onClose}
        size="narrow"
        foot={foot(() => {
          onInsert(leaf("metronome", "", { bpm, label: metroLabel }));
          onClose();
        })}
      >
        <div className="field">
          <span className="label">ضرب در دقیقه</span>
          <Range value={bpm} min={30} max={240} onChange={setBpm} format={(v) => toFa(v)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="mt-label">برچسب</label>
          <input
            id="mt-label"
            className="input"
            value={metroLabel}
            onChange={(e) => setMetroLabel(e.target.value)}
          />
        </div>
        <div className="field">
          <span className="label">پیش‌نمایش</span>
          <Markdown>{leaf("metronome", "", { bpm, label: metroLabel })}</Markdown>
        </div>
      </Modal>
    );
  }

  return null;
}