import { type CSSProperties, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkMath from "remark-math";
import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { remarkBlocks } from "./directives";
import { extractToc, type TocItem } from "./toc";
import { AudioPlayer } from "@/app/components/md/AudioPlayer";
import { Metronome } from "@/app/components/md/Metronome";
import { Figure } from "@/app/components/md/Figure";
import { CodeBlock } from "@/app/components/md/CodeBlock";
import { toFa } from "@/lib/utils";

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

/** Per-render values ride on the tree as properties: React context is not
 *  available to server components, and rebuilding `components` each render
 *  would remount the players inside the editor's live preview. */
function rehypeMeta(options: { headings: TocItem[]; telegramHref: string }) {
  const items = JSON.stringify(options.headings);
  return (tree: HastNode) => {
    const walk = (node: HastNode, inTable: boolean) => {
      if (node.type === "element") {
        const props = (node.properties ??= {});
        if (node.tagName === "x-toc") props.items = items;
        if (node.tagName === "x-telegram") props.href = options.telegramHref;
        if (inTable && node.tagName === "table") props.bare = true;
      }
      const next = inTable || node.tagName === "x-table";
      for (const child of node.children ?? []) walk(child, next);
    };
    walk(tree, false);
  };
}

type P = Record<string, unknown> & { children?: ReactNode };

const s = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

const CALLOUT_ICON: Record<string, ReactNode> = {
  note: <path d="M12 8h.01M11 12h1v4h1" strokeWidth="1.9" strokeLinecap="round" fill="none" />,
  info: <path d="M12 8h.01M11 12h1v4h1" strokeWidth="1.9" strokeLinecap="round" fill="none" />,
  tip: <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9V16h7v-2.1A6 6 0 0012 3z" strokeWidth="1.7" strokeLinecap="round" fill="none" />,
  success: <path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
  warning: <path d="M12 4l9 16H3l9-16zM12 10v4M12 17h.01" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
  danger: <path d="M12 4l9 16H3l9-16zM12 10v4M12 17h.01" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
};

const CALLOUT_TITLE: Record<string, string> = {
  note: "یادداشت",
  info: "اطلاعات",
  tip: "نکته",
  success: "درست",
  warning: "هشدار",
  danger: "خطر",
};

function Callout({ type = "note", title, children }: P) {
  const kind = s(type, "note");
  return (
    <aside className="md-callout" data-tone={kind}>
      <span className="md-callout-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">{CALLOUT_ICON[kind] ?? CALLOUT_ICON.note}</svg>
      </span>
      <div className="md-callout-body">
        <p className="md-callout-title">{s(title) || CALLOUT_TITLE[kind] || "یادداشت"}</p>
        <div className="md-callout-text">{children}</div>
      </div>
    </aside>
  );
}

function Toggle({ summary, open, children }: P) {
  return (
    <details className="md-toggle" open={s(open) === "true"}>
      <summary>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="md-toggle-chevron">
          <path d="M9 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span>{s(summary) || "بیشتر بخوانید"}</span>
      </summary>
      <div className="md-toggle-body">{children}</div>
    </details>
  );
}

function Quote({ by, children }: P) {
  return (
    <blockquote className="md-quote">
      <span className="md-quote-mark" aria-hidden="true">
        «
      </span>
      <div className="md-quote-body">{children}</div>
      {s(by) ? <cite className="md-quote-by">{s(by)}</cite> : null}
    </blockquote>
  );
}

function TableWrap({ caption, striped, accent, dense, children }: P) {
  return (
    <div
      className="md-table-wrap"
      data-striped={s(striped, "true")}
      data-dense={s(dense, "false")}
      data-accent={s(accent, "brass")}
    >
      {s(caption) ? <p className="md-table-caption">{s(caption)}</p> : null}
      <div className="md-table-scroll">{children}</div>
    </div>
  );
}

function Gallery({ cols = "3", children }: P) {
  const n = Math.min(4, Math.max(1, Number(s(cols, "3")) || 3));
  return (
    <div className="md-gallery" style={{ "--cols": n } as CSSProperties}>
      {children}
    </div>
  );
}

function Steps({ children }: P) {
  return <div className="md-steps">{children}</div>;
}

function Card({ title, children }: P) {
  return (
    <section className="md-card">
      {s(title) ? <h4 className="md-card-title">{s(title)}</h4> : null}
      {children}
    </section>
  );
}

function Columns({ children }: P) {
  return <div className="md-columns">{children}</div>;
}

function LtrBlock({ children }: P) {
  return (
    <div className="md-ltr-block" dir="ltr">
      {children}
    </div>
  );
}

function VideoBlock({ label, poster, caption }: P) {
  const src = s(label);
  return (
    <figure className="md-video">
      <video src={src} poster={s(poster) || undefined} controls preload="metadata" playsInline />
      {s(caption) ? <figcaption>{s(caption)}</figcaption> : null}
    </figure>
  );
}

const FILE_ICON: Record<string, ReactNode> = {
  pdf: <path d="M7 3h7l5 5v13H7zM14 3v5h5" strokeWidth="1.6" fill="none" strokeLinejoin="round" />,
  audio: <path d="M9 18V6l10-2v12M9 18a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 16a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" strokeWidth="1.6" fill="none" strokeLinejoin="round" />,
  image: <path d="M4 5h16v14H4zM4 15l5-5 4 4 3-2 4 4" strokeWidth="1.6" fill="none" strokeLinejoin="round" />,
  file: <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4" strokeWidth="1.6" fill="none" strokeLinejoin="round" />,
};

function FileBlock({ label, name, caption, size }: P) {
  const src = s(label);
  const ext = src.split(".").pop()?.toLowerCase() ?? "";
  const kind = ["mp3", "wav", "ogg", "m4a", "flac"].includes(ext)
    ? "audio"
    : ["png", "jpg", "jpeg", "svg", "webp", "gif"].includes(ext)
      ? "image"
      : ext === "pdf"
        ? "pdf"
        : "file";
  return (
    <a className="md-file" href={src} download target="_blank" rel="noreferrer">
      <span className="md-file-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">{FILE_ICON[kind]}</svg>
      </span>
      <span className="md-file-body">
        <span className="md-file-name">{s(name) || src.split("/").pop()}</span>
        <span className="md-file-meta">
          {ext ? <span dir="ltr">{ext.toUpperCase()}</span> : null}
          {s(size) ? <span>{s(size)}</span> : null}
          {s(caption) ? <span>{s(caption)}</span> : null}
        </span>
      </span>
      <span className="md-file-dl" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}

function Embed({ label, kind }: P & { kind: "youtube" | "aparat" }) {
  const id = s(label).trim();
  const src =
    kind === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
      : `https://www.aparat.com/video/video/embed/videohash/${encodeURIComponent(id)}/vt/frame`;
  return (
    <figure className="md-embed">
      <div className="md-embed-frame">
        <iframe
          src={src}
          title={kind === "youtube" ? "ویدیوی یوتیوب" : "ویدیوی آپارات"}
          allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </figure>
  );
}

function LinkCard({ label, title, desc }: P) {
  const href = s(label);
  let host = href;
  try {
    host = new URL(href).hostname.replace(/^www\./, "");
  } catch {
    /* relative link: keep the raw path as the host line */
  }
  return (
    <a className="md-linkcard" href={href} target="_blank" rel="noreferrer">
      <span className="md-linkcard-body">
        <span className="md-linkcard-title">{s(title) || href}</span>
        {s(desc) ? <span className="md-linkcard-desc">{s(desc)}</span> : null}
        <span className="md-linkcard-host" dir="ltr">
          {host}
        </span>
      </span>
      <span className="md-linkcard-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M7 17L17 7M9 7h8v8" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}

function Toc({ items }: P) {
  let headings: TocItem[] = [];
  try {
    const parsed = JSON.parse(s(items, "[]"));
    if (Array.isArray(parsed)) headings = parsed;
  } catch {
    /* a malformed items payload simply renders no list */
  }
  if (!headings.length) return null;
  return (
    <nav className="md-toc" aria-label="فهرست مطالب">
      <p className="md-toc-title">فهرست مطالب</p>
      <ol>
        {headings.map((h) => (
          <li key={h.id} data-depth={h.depth}>
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Score() {
  return (
    <div className="md-score" role="separator" aria-hidden="true">
      <svg viewBox="0 0 400 40" preserveAspectRatio="none">
        {[8, 14, 20, 26, 32].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} />
        ))}
      </svg>
      <span className="md-score-note">
        <svg viewBox="0 0 24 32">
          <ellipse cx="9" cy="24" rx="7" ry="5" transform="rotate(-18 9 24)" />
          <line x1="15.5" y1="22" x2="15.5" y2="3" strokeWidth="2.4" />
        </svg>
      </span>
    </div>
  );
}

function TelegramCta({ label, href }: P) {
  return (
    <div className="md-cta">
      <p>{s(label) || "برای شروع، پیام بدهید."}</p>
      <a className="btn btn-brass" href={s(href, "https://t.me/")} target="_blank" rel="noreferrer">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21.5 4.3L2.9 11.4c-.9.3-.9 1.5 0 1.8l4.6 1.5 1.7 5.2c.3.8 1.3 1 1.9.4l2.5-2.4 4.6 3.4c.7.5 1.7.1 1.9-.7l3-14.4c.2-.9-.7-1.6-1.6-1.3z" />
        </svg>
        پیام در تلگرام
      </a>
    </div>
  );
}

function Anchor({ id }: { id?: string }) {
  if (!id) return null;
  return (
    <a className="md-anchor" href={`#${id}`} aria-label="پیوند به این بخش">
      #
    </a>
  );
}

function heading(Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
  return function Heading({ id, children }: P) {
    const value = s(id);
    return (
      <Tag id={value || undefined} className="md-heading">
        {children}
        <Anchor id={value} />
      </Tag>
    );
  };
}

const components = {
  h1: heading("h1"),
  h2: heading("h2"),
  h3: heading("h3"),
  h4: heading("h4"),
  h5: heading("h5"),
  h6: heading("h6"),

  a({ href, children }: P) {
    const url = s(href);
    const external = /^https?:\/\//i.test(url);
    return (
      <a
        href={url}
        className="md-link"
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {children}
        {external ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="md-link-out">
            <path d="M7 17L17 7M9 7h8v8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </a>
    );
  },

  img({ src, alt }: P) {
    return <Figure src={s(src)} alt={s(alt)} align="contained" />;
  },

  blockquote({ children }: P) {
    return <Quote>{children}</Quote>;
  },

  hr() {
    return (
      <hr className="md-hr" />
    );
  },

  table({ node, children }: P & { node?: HastNode }) {
    if (node?.properties?.bare) return <table>{children}</table>;
    return (
      <div className="md-table-wrap" data-striped="true" data-accent="brass">
        <div className="md-table-scroll">
          <table>{children}</table>
        </div>
      </div>
    );
  },

  pre({ node, children }: P & { node?: { children?: { properties?: { className?: unknown } }[] } }) {
    const first = node?.children?.[0];
    const classes = Array.isArray(first?.properties?.className)
      ? (first.properties.className as string[])
      : [];
    const lang = classes
      .find((c) => typeof c === "string" && c.startsWith("language-"))
      ?.slice(9);
    return <CodeBlock lang={lang}>{children}</CodeBlock>;
  },

  code({ children, className }: P) {
    // Block code is handled by `pre`; anything left here is inline.
    return (
      <code className={s(className) || undefined} dir="ltr">
        {children}
      </code>
    );
  },

  input({ checked, type }: P) {
    if (s(type) !== "checkbox") return null;
    return (
      <span className="md-check" data-on={Boolean(checked) || undefined} aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  },

  li({ children, className }: P) {
    const task = s(className).includes("task-list-item");
    return <li className={task ? "md-task" : undefined}>{children}</li>;
  },

  del({ children }: P) {
    return <del>{children}</del>;
  },

  "x-callout": Callout,
  "x-toggle": Toggle,
  "x-quote": Quote,
  "x-table": TableWrap,
  "x-gallery": Gallery,
  "x-columns": Columns,
  "x-card": Card,
  "x-steps": Steps,
  "x-ltr-block": LtrBlock,

  "x-image": ({ label, alt, caption, align, width, height }: P) => (
    <Figure
      src={s(label)}
      alt={s(alt)}
      caption={s(caption)}
      align={s(align, "contained")}
      width={width ? Number(width) : null}
      height={height ? Number(height) : null}
    />
  ),
  "x-video": VideoBlock,
  "x-audio": ({ label, title, artist, caption }: P) => (
    <AudioPlayer src={s(label)} title={s(title)} artist={s(artist)} caption={s(caption)} />
  ),
  "x-file": FileBlock,
  "x-youtube": (props: P) => <Embed {...props} kind="youtube" />,
  "x-aparat": (props: P) => <Embed {...props} kind="aparat" />,
  "x-link": LinkCard,
  "x-toc": Toc,
  "x-score": Score,
  "x-metronome": ({ bpm, label }: P) => (
    <Metronome bpm={Number(s(bpm, "80")) || 80} label={s(label)} />
  ),
  "x-telegram": TelegramCta,

  "x-mark": ({ children }: P) => <mark className="md-mark">{children}</mark>,
  "x-kbd": ({ children }: P) => <kbd className="md-kbd" dir="ltr">{children}</kbd>,
  "x-badge": ({ tone, children }: P) => (
    <span className="md-badge" data-tone={s(tone, "brass")}>{children}</span>
  ),
  "x-hand": ({ children }: P) => <span className="md-hand">{children}</span>,
  "x-brass": ({ children }: P) => <span className="md-brass">{children}</span>,
  "x-ltr": ({ children }: P) => <span className="md-ltr" dir="ltr">{children}</span>,
  "x-fa": ({ children }: P) => <span className="md-fa" dir="rtl">{children}</span>,
  "x-num": ({ children }: P) => <span className="md-num">{toFa(String(children ?? ""))}</span>,
  "x-abbr": ({ title, children }: P) => (
    <abbr className="md-abbr" title={s(title)}>{children}</abbr>
  ),
  "x-sup": ({ children }: P) => <sup>{children}</sup>,
  "x-sub": ({ children }: P) => <sub>{children}</sub>,
} as unknown as Components;

export function Markdown({
  children,
  telegramHref = "https://t.me/",
  className,
  accent,
  style,
}: {
  children: string;
  telegramHref?: string;
  className?: string;
  accent?: string;
  style?: CSSProperties;
}) {
  const headings = extractToc(children);
  return (
    <div
      className={className ? `md ${className}` : "md"}
      data-accent={accent}
      style={style}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDirective, remarkMath, remarkBlocks]}
        rehypePlugins={[
          rehypeSlug,
          rehypeKatex,
          [rehypeHighlight, { detect: false }],
          [rehypeMeta, { headings, telegramHref }],
        ]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}