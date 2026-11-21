"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type ChangeEvent as ReactChangeEvent,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/app/components/admin/Icons";
import { Modal, useToast } from "@/app/components/admin/ui";
import { uploadMediaAction } from "@/lib/actions/media";
import { savePostAction } from "@/lib/actions/posts";
import {
  BLOCKS,
  GROUP_LABEL,
  INLINE_TOOLS,
  searchBlocks,
  type BlockDef,
  type BlockGroup,
  type DialogId,
  type InlineTool,
} from "@/lib/editor/blocks";
import { caretXY, clampToViewport } from "@/lib/editor/caret";
import { leaf } from "@/lib/editor/serialize";
import {
  applyLineKind,
  continueList,
  findAll,
  indentSelection,
  insertBlock,
  moveLines,
  replaceRange,
  wrapInline,
  type Snapshot,
} from "@/lib/editor/text";
import { Markdown } from "@/lib/markdown/Markdown";
import {
  STATUS_LABEL,
  type Author,
  type Category,
  type Media,
  type Post,
  type PostStatus,
  type Settings,
  type Tag,
} from "@/lib/types";
import {
  countWords,
  faDateTime,
  formatBytes,
  readingMinutes,
  slugify,
  toFa,
  transliterate,
} from "@/lib/utils";
import { AdminTop } from "../../AdminShell";
import { BlockDialog } from "./BlockDialog";
import { SettingsRail } from "./SettingsRail";
import { SlashMenu } from "./SlashMenu";
import { Toolbar } from "./Toolbar";

type Mode = "write" | "preview";

const MODES: { id: Mode; label: string; icon: string }[] = [
  { id: "write", label: "نوشتن", icon: "edit" },
  { id: "preview", label: "پیش‌نمایش", icon: "eye" },
];

const SAVE_LABEL = {
  saved: "ذخیره شد",
  saving: "در حالِ ذخیره…",
  dirty: "ذخیره نشده",
  error: "ذخیره نشد",
} as const;

type SaveState = keyof typeof SAVE_LABEL;
type SlashState = { from: number; query: string; x: number; y: number; index: number };
type FindState = { q: string; r: string; cs: boolean; i: number };

const GROUPS: BlockGroup[] = ["basic", "media", "advanced"];
const MENU_W = 336;
const MENU_H = 360;

function scrollToCaret(ta: HTMLTextAreaElement, pos: number) {
  const lh = parseFloat(getComputedStyle(ta).lineHeight) || 24;
  const line = ta.value.slice(0, pos).split("\n").length - 1;
  const y = line * lh;
  if (y < ta.scrollTop || y > ta.scrollTop + ta.clientHeight - lh * 2) {
    ta.scrollTop = Math.max(0, y - ta.clientHeight / 2);
  }
}

export function PostEditor({
  initial,
  isNew,
  media,
  categories,
  tags,
  authors,
  settings,
}: {
  initial: Post;
  isNew: boolean;
  media: Media[];
  categories: Category[];
  tags: Tag[];
  authors: Author[];
  settings: Settings;
}) {
  const toast = useToast();
  const router = useRouter();

  const [post, setPost] = useState<Post>(initial);
  const [mode, setMode] = useState<Mode>("write");
  const [saveState, setSaveState] = useState<SaveState>(isNew ? "dirty" : "saved");
  const [liveSlug, setLiveSlug] = useState(initial.slug);
  const [mediaList, setMediaList] = useState<Media[]>(media);
  const [railOpen, setRailOpen] = useState(true);
  const [slash, setSlash] = useState<SlashState | null>(null);
  const [dialog, setDialog] = useState<{ id: DialogId; selection: string } | null>(null);
  const [palette, setPalette] = useState(false);
  const [find, setFind] = useState<FindState | null>(null);
  const [dropping, setDropping] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [rev, setRev] = useState(0);

  const postRef = useRef(post);
  const revRef = useRef(0);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pendingSel = useRef<{ start: number; end: number } | null>(null);
  const insertRange = useRef<{ start: number; end: number } | null>(null);
  const history = useRef({
    past: [] as Snapshot[],
    future: [] as Snapshot[],
    at: 0,
    tag: "",
  });
  const slugLocked = useRef(initial.slug.trim().length > 0);
  const excerptLocked = useRef(initial.excerpt.trim().length > 0);
  const fresh = useRef(isNew);
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const dragDepth = useRef(0);
  const persistRef = useRef<() => void>(() => {});
  const publishRef = useRef<() => void>(() => {});

  const telegramHref = settings.telegramUsername
    ? `https://t.me/${settings.telegramUsername}`
    : "https://t.me/";

  /* ---------------- state plumbing ---------------- */

  function update(delta: Partial<Post>) {
    if ("slug" in delta) slugLocked.current = String(delta.slug ?? "").trim().length > 0;
    if ("excerpt" in delta)
      excerptLocked.current = String(delta.excerpt ?? "").trim().length > 0;
    const next = { ...postRef.current, ...delta };
    postRef.current = next;
    setPost(next);
    revRef.current += 1;
    setRev(revRef.current);
    setSaveState((s) => (s === "saving" ? s : "dirty"));
  }

  function pushHistory(tag: string) {
    const ta = areaRef.current;
    const h = history.current;
    const now = Date.now();
    if (tag === "type" && h.tag === "type" && now - h.at < 700 && h.past.length) {
      h.at = now;
      return;
    }
    h.past.push({
      value: postRef.current.content,
      start: ta?.selectionStart ?? 0,
      end: ta?.selectionEnd ?? 0,
    });
    if (h.past.length > 200) h.past.shift();
    h.future = [];
    h.at = now;
    h.tag = tag;
  }

  function commit(snap: Snapshot, tag = "block") {
    pushHistory(tag);
    pendingSel.current = { start: snap.start, end: snap.end };
    update({ content: snap.value });
  }

  function restore(snap: Snapshot) {
    history.current.tag = "";
    history.current.at = 0;
    pendingSel.current = { start: snap.start, end: snap.end };
    update({ content: snap.value });
  }

  function undo() {
    const h = history.current;
    const prev = h.past.pop();
    if (!prev) return;
    const ta = areaRef.current;
    h.future.push({
      value: postRef.current.content,
      start: ta?.selectionStart ?? 0,
      end: ta?.selectionEnd ?? 0,
    });
    restore(prev);
  }

  function redo() {
    const h = history.current;
    const next = h.future.pop();
    if (!next) return;
    const ta = areaRef.current;
    h.past.push({
      value: postRef.current.content,
      start: ta?.selectionStart ?? 0,
      end: ta?.selectionEnd ?? 0,
    });
    restore(next);
  }

  useLayoutEffect(() => {
    const sel = pendingSel.current;
    pendingSel.current = null;
    const ta = areaRef.current;
    if (!sel || !ta) return;
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(sel.start, sel.end);
    scrollToCaret(ta, sel.start);
  }, [post.content]);

  /* ---------------- saving ---------------- */

  async function doSave(): Promise<Post | null> {
    const sent = postRef.current;
    const revAt = revRef.current;
    setSaveState("saving");
    let res;
    try {
      res = await savePostAction(sent);
    } catch {
      setSaveState("error");
      return null;
    }
    if (!res.ok) {
      setSaveState("error");
      toast.err(res.error);
      return null;
    }
    const saved = res.data;
    const cur = postRef.current;
    const merged: Post = {
      ...cur,
      slug: slugLocked.current && cur.slug === sent.slug ? saved.slug : cur.slug,
      excerpt:
        excerptLocked.current && cur.excerpt === sent.excerpt ? saved.excerpt : cur.excerpt,
      status: cur.status === sent.status ? saved.status : cur.status,
      publishedAt:
        cur.publishedAt === sent.publishedAt ? saved.publishedAt : cur.publishedAt,
      readingMinutes: saved.readingMinutes,
      updatedAt: saved.updatedAt,
      createdAt: cur.createdAt || saved.createdAt,
    };
    postRef.current = merged;
    setPost(merged);
    setLiveSlug(saved.slug);
    setSaveState(revRef.current === revAt ? "saved" : "dirty");
    if (fresh.current) {
      fresh.current = false;
      window.history.replaceState(null, "", `/admin/posts/${saved.id}`);
    }
    return saved;
  }

  function persist(explicit?: Post): Promise<Post | null> {
    if (explicit) {
      postRef.current = explicit;
      setPost(explicit);
    }
    const run = chain.current.then(doSave, doSave);
    chain.current = run.catch(() => undefined);
    return run;
  }

  persistRef.current = () => void persist();
  publishRef.current = () => void publish();

  const saveStateRef = useRef<SaveState>(saveState);
  saveStateRef.current = saveState;

  useEffect(() => {
    if (rev === 0) return;
    const t = setTimeout(() => persistRef.current(), 1200);
    return () => clearTimeout(t);
  }, [rev]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (document.querySelector(".scrim")) return;
      const k = e.key.toLowerCase();
      if (k === "s") {
        e.preventDefault();
        persistRef.current();
      } else if (k === "f") {
        e.preventDefault();
        setFind((f) => f ?? { q: "", r: "", cs: false, i: 0 });
      } else if (k === "enter" && e.shiftKey) {
        e.preventDefault();
        publishRef.current();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (saveStateRef.current === "dirty" || saveStateRef.current === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, []);

  async function publish() {
    const cur = postRef.current;
    if (!cur.title.trim()) {
      toast.err("برای انتشار، عنوان لازم است.");
      titleRef.current?.focus();
      return;
    }
    if (!cur.content.trim()) {
      toast.err("نوشتهٔ خالی منتشر نمی‌شود.");
      areaRef.current?.focus();
      return;
    }
    setPublishing(true);
    const now = new Date().toISOString();
    const when = cur.publishedAt && cur.publishedAt > now ? cur.publishedAt : now;
    const status: PostStatus = when > now ? "scheduled" : "published";
    const saved = await persist({ ...cur, status, publishedAt: when });
    setPublishing(false);
    if (!saved) return;
    router.refresh();
    toast.ok(
      status === "scheduled"
        ? `برای ${faDateTime(when)} زمان‌بندی شد.`
        : "منتشر شد و همین حالا روی سایت است.",
      {
        label: "دیدن نوشته",
        run: () => window.open(`/blog/${saved.slug}`, "_blank", "noopener"),
      },
    );
  }

  /* ---------------- slash menu ---------------- */

  const slashItems = useMemo(() => searchBlocks(slash?.query ?? ""), [slash?.query]);

  function detectSlash(value: string, caret: number) {
    const before = value.slice(0, caret);
    const at = before.lastIndexOf("/");
    if (at === -1) return setSlash(null);
    const query = before.slice(at + 1);
    if (/[\s]/.test(query)) return setSlash(null);
    const prev = at > 0 ? before[at - 1] : "";
    if (prev && !/\s/.test(prev)) return setSlash(null);
    const ta = areaRef.current;
    if (!ta) return setSlash(null);

    const items = searchBlocks(query);
    const { x: cx, y: cy, line } = caretXY(ta, at);
    const menuW = Math.min(MENU_W, window.innerWidth - 16);
    const menuH = Math.min(MENU_H, Math.floor(window.innerHeight * 0.55));
    let y = cy + 4;
    if (y + menuH > window.innerHeight - 8) y = cy - line - menuH - 4;
    const pos = clampToViewport(cx, y, menuW, menuH);
    setSlash((old) => ({
      from: at,
      query,
      x: pos.x,
      y: pos.y,
      index:
        old && old.from === at ? Math.min(old.index, Math.max(0, items.length - 1)) : 0,
    }));
  }

  useEffect(() => {
    if (!slash) return;
    const away = (e: Event) => {
      const el = e.target;
      if (el instanceof HTMLElement && el.closest(".slash")) return;
      setSlash(null);
    };
    const onDown = (e: PointerEvent) => {
      const el = e.target;
      if (el instanceof HTMLElement && (el.closest(".slash") || el === areaRef.current))
        return;
      setSlash(null);
    };
    window.addEventListener("scroll", away, true);
    window.addEventListener("resize", away);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("scroll", away, true);
      window.removeEventListener("resize", away);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [slash]);

  /* ---------------- blocks ---------------- */

  function runBlock(def: BlockDef, fromSlash = false) {
    const ta = areaRef.current;
    const value = postRef.current.content;
    let start = ta?.selectionStart ?? value.length;
    let end = ta?.selectionEnd ?? start;
    if (fromSlash && slash) {
      start = slash.from;
      end = ta?.selectionStart ?? start;
    }
    setSlash(null);
    const action = def.action;

    if (action.kind === "dialog") {
      insertRange.current = { start, end };
      setDialog({
        id: action.dialog,
        selection: fromSlash ? "" : value.slice(start, end),
      });
      return;
    }

    const cleared = replaceRange(value, start, end, "");
    let snap: Snapshot;
    if (action.kind === "line") {
      const res = applyLineKind(cleared.value, cleared.start, cleared.end, action.line);
      snap = { value: res.value, start: res.end, end: res.end };
    } else if (action.kind === "inline") {
      snap = wrapInline(
        cleared.value,
        cleared.start,
        cleared.end,
        action.before,
        action.after,
        action.placeholder,
      );
    } else {
      snap = insertBlock(
        cleared.value,
        cleared.start,
        cleared.end,
        action.text,
        action.select,
      );
    }
    commit(snap, "block");
  }

  function applyInline(tool: InlineTool) {
    const ta = areaRef.current;
    if (!ta) return;
    commit(
      wrapInline(
        postRef.current.content,
        ta.selectionStart,
        ta.selectionEnd,
        tool.before,
        tool.after,
        tool.placeholder,
      ),
      "inline",
    );
  }

  function insertFromDialog(text: string, select?: [number, number], inline?: boolean) {
    const range = insertRange.current ?? {
      start: postRef.current.content.length,
      end: postRef.current.content.length,
    };
    insertRange.current = null;
    const value = postRef.current.content;
    commit(
      inline
        ? replaceRange(value, range.start, range.end, text, select)
        : insertBlock(value, range.start, range.end, text, select),
      "block",
    );
  }

  /* ---------------- attachments ---------------- */

  async function ingest(files: File[]) {
    const list = files.slice(0, 12);
    if (!list.length) return;
    const ta = areaRef.current;
    const at = ta?.selectionStart ?? postRef.current.content.length;
    setUploading(list.length);
    const form = new FormData();
    list.forEach((f) => form.append("files", f));
    let res;
    try {
      res = await uploadMediaAction(form);
    } catch {
      setUploading(0);
      toast.err("بارگذاری انجام نشد.");
      return;
    }
    setUploading(0);
    if (!res.ok) {
      toast.err(res.error);
      return;
    }
    setMediaList((prev) => [...res.data, ...prev]);
    const text = res.data
      .map((m) =>
        m.kind === "image"
          ? leaf("image", m.url, { alt: m.alt || m.name })
          : m.kind === "audio"
            ? leaf("audio", m.url, { title: m.name })
            : m.kind === "video"
              ? leaf("video", m.url)
              : leaf("file", m.url, { name: m.name, size: formatBytes(m.size) }),
      )
      .join("\n\n");
    commit(insertBlock(postRef.current.content, at, at, text), "upload");
    toast.ok(`${toFa(res.data.length)} پیوست در نوشته درج شد.`);
  }

  function onDragEnter(e: ReactDragEvent) {
    if (!e.dataTransfer.types.includes("Files")) return;
    dragDepth.current += 1;
    setDropping(true);
  }

  function onDragLeave() {
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDropping(false);
    }
  }

  function onDrop(e: ReactDragEvent) {
    if (!e.dataTransfer.files.length) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDropping(false);
    void ingest([...e.dataTransfer.files]);
  }

  function onPaste(e: ReactClipboardEvent<HTMLTextAreaElement>) {
    const files = [...e.clipboardData.files];
    if (files.length) {
      e.preventDefault();
      void ingest(files);
      return;
    }
    const text = e.clipboardData.getData("text/plain").trim();
    const ta = e.currentTarget;
    if (/^https?:\/\/\S+$/i.test(text) && ta.selectionStart !== ta.selectionEnd) {
      e.preventDefault();
      const value = postRef.current.content;
      const label = value.slice(ta.selectionStart, ta.selectionEnd);
      commit(
        replaceRange(
          value,
          ta.selectionStart,
          ta.selectionEnd,
          `[${label}](${text})`,
        ),
        "paste",
      );
    }
  }

  /* ---------------- find & replace ---------------- */

  const matches = useMemo(
    () => (find ? findAll(post.content, find.q, find.cs) : []),
    [find, post.content],
  );

  function gotoMatch(i: number) {
    if (!matches.length) return;
    const index = ((i % matches.length) + matches.length) % matches.length;
    setFind((f) => (f ? { ...f, i: index } : f));
    const m = matches[index];
    const ta = areaRef.current;
    if (!ta) return;
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(m.start, m.end);
    scrollToCaret(ta, m.start);
  }

  function replaceOne() {
    if (!find || !matches.length) return;
    const m = matches[Math.min(find.i, matches.length - 1)];
    commit(replaceRange(postRef.current.content, m.start, m.end, find.r), "replace");
  }

  function replaceAll() {
    if (!find || !matches.length) return;
    let value = postRef.current.content;
    for (let k = matches.length - 1; k >= 0; k -= 1) {
      const m = matches[k];
      value = value.slice(0, m.start) + find.r + value.slice(m.end);
    }
    const caret = Math.min(areaRef.current?.selectionStart ?? 0, value.length);
    commit({ value, start: caret, end: caret }, "replace");
    toast.ok(`${toFa(matches.length)} مورد جایگزین شد.`);
  }

  /* ---------------- keyboard ---------------- */

  function onKeyDown(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget;
    const mod = e.ctrlKey || e.metaKey;

    if (slash) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!slashItems.length) return;
        const step = e.key === "ArrowDown" ? 1 : -1;
        setSlash({
          ...slash,
          index: (slash.index + step + slashItems.length) % slashItems.length,
        });
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        const def = slashItems[slash.index];
        if (def) {
          e.preventDefault();
          runBlock(def, true);
        } else {
          setSlash(null);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlash(null);
        return;
      }
    }

    if (mod && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (k === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (k === "enter") {
        e.preventDefault();
        void publish();
        return;
      }
      if (k === "k") {
        e.preventDefault();
        runBlock(BLOCKS.find((b) => b.id === "link")!, false);
        return;
      }
      const tool = INLINE_TOOLS.find((t) => t.key === k);
      if (tool && !e.shiftKey) {
        e.preventDefault();
        applyInline(tool);
        return;
      }
    }

    if (e.key === "Tab" && !mod) {
      e.preventDefault();
      commit(
        indentSelection(
          postRef.current.content,
          ta.selectionStart,
          ta.selectionEnd,
          e.shiftKey,
        ),
        "indent",
      );
      return;
    }

    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      const snap = moveLines(
        postRef.current.content,
        ta.selectionStart,
        ta.selectionEnd,
        e.key === "ArrowUp" ? -1 : 1,
      );
      if (snap) commit(snap, "move");
      return;
    }

    if (e.key === "Enter" && !mod && !e.shiftKey && !e.altKey) {
      if (ta.selectionStart !== ta.selectionEnd) return;
      const snap = continueList(postRef.current.content, ta.selectionStart);
      if (snap) {
        e.preventDefault();
        commit(snap, "type");
      }
    }
  }

  function onChange(e: ReactChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    const caret = e.target.selectionStart;
    pushHistory("type");
    update({ content: value });
    detectSlash(value, caret);
  }

  /* ---------------- render ---------------- */

  const words = useMemo(() => countWords(post.content), [post.content]);
  const minutes = readingMinutes(post.content);
  const shownSlug =
    slugify(post.slug) || slugify(post.title) || transliterate(post.title) || liveSlug;
  const live = post.status === "published" && !!liveSlug;
  const locked = mode === "preview";

  const previewStyle = {
    "--md-scale": post.typography.scale,
    "--md-leading": post.typography.leading,
    "--md-measure": `${post.typography.measure}rem`,
    maxWidth: "var(--md-measure)",
  } as CSSProperties;

  const showArea = mode === "write";
  const showPreview = mode === "preview";

  return (
    <>
      <AdminTop
        title={isNew && !post.title ? "نوشتهٔ تازه" : post.title || "نوشتهٔ بی‌عنوان"}
        sub={`${STATUS_LABEL[post.status]} · ${toFa(words)} واژه · ${faDateTime(post.updatedAt)}`}
      >
        <span className="pill" data-tone={post.status}>
          <span className="pill-dot" />
          {STATUS_LABEL[post.status]}
        </span>
        {live ? (
          <Link
            className="btn btn-quiet btn-sm"
            href={`/blog/${liveSlug}`}
            target="_blank"
          >
            <Icon name="external" /> دیدن در سایت
          </Link>
        ) : null}
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={() => void persist()}
        >
          <Icon name="save" /> ذخیره
        </button>
        <button
          className="btn btn-brass btn-sm"
          type="button"
          onClick={() => void publish()}
          aria-disabled={publishing}
        >
          <Icon name="publish" />
          {post.status === "published" ? "به‌روزرسانی" : "انتشار"}
        </button>
        <button
          className={`icon-btn${railOpen ? " is-on" : ""}`}
          type="button"
          onClick={() => {
            const next = !railOpen;
            setRailOpen(next);
            if (next && window.innerWidth <= 1248) {
              requestAnimationFrame(() => {
                document
                  .getElementById("editor-settings")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            }
          }}
          title="تنظیمات نوشته"
          aria-label="تنظیمات نوشته"
          aria-pressed={railOpen}
        >
          <Icon name="sidebar" />
        </button>
      </AdminTop>

      <div className="admin-body">
        <div className="editor" data-settings={railOpen ? "open" : "closed"}>
          <div
            className="editor-main"
            onDragEnter={onDragEnter}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes("Files")) e.preventDefault();
            }}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <input
              ref={titleRef}
              className="editor-title"
              value={post.title}
              maxLength={200}
              placeholder="عنوانِ نوشته را اینجا بنویسید…"
              aria-label="عنوانِ نوشته"
              onChange={(e) => update({ title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  areaRef.current?.focus();
                }
              }}
            />

            <div className="editor-slugline">
              <Icon name="globe" />
              <span>نشانیِ نوشته:</span>
              <code>/blog/{shownSlug || "…"}</code>
              <span>·</span>
              <span>{toFa(minutes)} دقیقه خواندن</span>
            </div>

            <div className="editor-modes">
              <div className="seg" role="tablist" aria-label="حالتِ ویرایشگر">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={mode === m.id}
                    className={mode === m.id ? "is-on" : ""}
                    onClick={() => setMode(m.id)}
                  >
                    <Icon name={m.icon} /> {m.label}
                  </button>
                ))}
              </div>
              <span className="muted editor-mode-hints">
                <span className="kbd-hint">/</span> منوی بلوک ·{" "}
                <span className="kbd-hint">Ctrl+S</span> ذخیره ·{" "}
                <span className="kbd-hint">Ctrl+Enter</span> انتشار
              </span>
            </div>

            <Toolbar
              onBlock={(def) => runBlock(def, false)}
              onInline={applyInline}
              onUndo={undo}
              onRedo={redo}
              canUndo={history.current.past.length > 0}
              canRedo={history.current.future.length > 0}
              onFind={() => setFind((f) => (f ? null : { q: "", r: "", cs: false, i: 0 }))}
              findOn={!!find}
              onPalette={() => setPalette(true)}
              locked={locked}
            />

            {find ? (
              <div className="findbar">
                <Icon name="search" />
                <input
                  className="input"
                  autoFocus
                  placeholder="جست‌وجو…"
                  value={find.q}
                  onChange={(e) => setFind({ ...find, q: e.target.value, i: 0 })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      gotoMatch(find.i + (e.shiftKey ? -1 : 1));
                    }
                    if (e.key === "Escape") setFind(null);
                  }}
                />
                <input
                  className="input"
                  placeholder="جایگزین با…"
                  value={find.r}
                  onChange={(e) => setFind({ ...find, r: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setFind(null);
                  }}
                />
                <span className="findbar-count">
                  {matches.length
                    ? `${toFa(Math.min(find.i + 1, matches.length))} از ${toFa(matches.length)}`
                    : "بدون نتیجه"}
                </span>
                <button
                  className="icon-btn"
                  type="button"
                  title="مورد پیشین"
                  aria-label="مورد پیشین"
                  onClick={() => gotoMatch(find.i - 1)}
                >
                  <Icon name="arrowUp" />
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  title="مورد بعدی"
                  aria-label="مورد بعدی"
                  onClick={() => gotoMatch(find.i + 1)}
                >
                  <Icon name="arrowDown" />
                </button>
                <button
                  className="btn btn-quiet btn-sm"
                  type="button"
                  onClick={replaceOne}
                  disabled={!matches.length}
                >
                  جایگزینی
                </button>
                <button
                  className="btn btn-quiet btn-sm"
                  type="button"
                  onClick={replaceAll}
                  disabled={!matches.length}
                >
                  همه
                </button>
                <button
                  className={`icon-btn${find.cs ? " is-on" : ""}`}
                  type="button"
                  title="بزرگی و کوچکیِ حرف‌ها مهم باشد"
                  aria-label="حساس به بزرگی و کوچکی"
                  aria-pressed={find.cs}
                  onClick={() => setFind({ ...find, cs: !find.cs, i: 0 })}
                >
                  <Icon name="bold" />
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  title="بستن"
                  aria-label="بستنِ جست‌وجو"
                  onClick={() => setFind(null)}
                >
                  <Icon name="x" />
                </button>
              </div>
            ) : null}

            <div className="editor-surface" data-mode={mode}>
              {showArea ? (
                <div className="editor-pane">
                  <textarea
                    ref={areaRef}
                    className="editor-area"
                    data-mode="write"
                    dir="auto"
                    spellCheck={false}
                    value={post.content}
                    placeholder={
                      "بنویسید… هر جا «/» بزنید منوی بلوک باز می‌شود.\nفایل را هم می‌توانید همین‌جا رها کنید."
                    }
                    aria-label="متنِ نوشته"
                    aria-haspopup="listbox"
                    aria-expanded={slash ? true : undefined}
                    aria-controls={slash ? "slash-menu" : undefined}
                    aria-autocomplete={slash ? "list" : undefined}
                    aria-activedescendant={
                      slash && slashItems[slash.index]
                        ? `slash-opt-${slashItems[slash.index].id}`
                        : undefined
                    }
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    onBlur={(e) => {
                      const related = e.relatedTarget as HTMLElement | null;
                      if (related?.closest(".slash")) return;
                      window.setTimeout(() => {
                        if (document.activeElement?.closest(".slash")) return;
                        setSlash(null);
                      }, 140);
                    }}
                  />
                </div>
              ) : null}

              {showPreview ? (
                <div className="editor-pane">
                  <div className="editor-preview">
                    {post.content.trim() ? (
                      <Markdown
                        accent={post.typography.accent}
                        style={previewStyle}
                        telegramHref={telegramHref}
                      >
                        {post.content}
                      </Markdown>
                    ) : (
                      <div className="editor-preview-empty">
                        <Icon name="note" />
                        <p>پیش‌نمایش اینجا زنده می‌شود.</p>
                        <p className="muted">
                          هر چه بنویسید، با همان قلم و رنگی که روی سایت دیده می‌شود.
                        </p>
                      </div>
                    )}
                    {post.customCss.trim() ? <style>{post.customCss}</style> : null}
                  </div>
                </div>
              ) : null}

              {dropping ? (
                <div className="drop-veil">
                  <Icon name="upload" />
                  <span>رها کنید تا پیوست شود</span>
                </div>
              ) : null}
            </div>

            <div className="editor-foot">
              <span className="editor-foot-item">
                <Icon name="words" /> {toFa(words)} واژه
              </span>
              <span className="editor-foot-item">
                <Icon name="clock" /> {toFa(minutes)} دقیقه
              </span>
              <span className="editor-foot-item">
                <Icon name="note" /> {toFa(post.content.length)} نویسه
              </span>
              {uploading ? (
                <span className="editor-foot-item" style={{ color: "var(--brass-hi)" }}>
                  <Icon name="upload" /> {toFa(uploading)} فایل در حالِ بارگذاری…
                </span>
              ) : null}
              <span className="save-state" data-state={saveState}>
                <span className="save-dot" />
                {SAVE_LABEL[saveState]}
              </span>
            </div>
          </div>

          {railOpen ? (
            <SettingsRail
              post={post}
              patch={update}
              liveSlug={liveSlug}
              categories={categories}
              tags={tags}
              authors={authors}
              media={mediaList}
              onUploaded={(rows) => setMediaList((prev) => [...rows, ...prev])}
            />
          ) : null}
        </div>
      </div>

      {slash ? (
        <SlashMenu
          x={slash.x}
          y={slash.y}
          query={slash.query}
          items={slashItems}
          index={slash.index}
          onPick={(def) => runBlock(def, true)}
          onHover={(i) => setSlash((s) => (s ? { ...s, index: i } : s))}
        />
      ) : null}

      {dialog ? (
        <BlockDialog
          id={dialog.id}
          media={mediaList}
          selection={dialog.selection}
          onClose={() => {
            setDialog(null);
            insertRange.current = null;
            areaRef.current?.focus();
          }}
          onInsert={insertFromDialog}
          onUploaded={(rows) => setMediaList((prev) => [...rows, ...prev])}
        />
      ) : null}

      {palette ? (
        <Modal
          title="همهٔ بلوک‌ها"
          sub="هر کدام را بزنید، در جایِ نشانگر درج می‌شود."
          size="wide"
          onClose={() => setPalette(false)}
        >
          {GROUPS.map((g) => (
            <div className="palette-group" key={g}>
              <p className="slash-group">{GROUP_LABEL[g]}</p>
              <div className="palette-grid">
                {BLOCKS.filter((b) => b.group === g).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className="palette-item"
                    onClick={() => {
                      setPalette(false);
                      runBlock(b, false);
                    }}
                  >
                    <span className="slash-icon">
                      <Icon name={b.icon} />
                    </span>
                    <span className="slash-text">
                      <span className="slash-label">{b.label}</span>
                      <span className="slash-hint">{b.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Modal>
      ) : null}
    </>
  );
}