import type { LineKind } from "./text";

export type DialogId =
  | "image"
  | "video"
  | "audio"
  | "file"
  | "table"
  | "link"
  | "linkcard"
  | "embed"
  | "callout"
  | "code"
  | "math"
  | "gallery"
  | "metronome";

export type BlockAction =
  | { kind: "line"; line: LineKind }
  | { kind: "inline"; before: string; after: string; placeholder: string }
  | { kind: "block"; text: string; select?: [number, number] }
  | { kind: "dialog"; dialog: DialogId };

export type BlockGroup = "basic" | "media" | "advanced";

export type BlockDef = {
  id: string;
  label: string;
  hint: string;
  icon: string;
  group: BlockGroup;
  keys: string[];
  action: BlockAction;
};

export const GROUP_LABEL: Record<BlockGroup, string> = {
  basic: "بلوک‌ها",
  media: "رسانه و پیوست",
  advanced: "پیشرفته",
};

/** `mark` is the substring the caret should land on after insertion. */
const block = (text: string, mark?: string): BlockAction => {
  if (!mark) return { kind: "block", text };
  const at = text.indexOf(mark);
  return {
    kind: "block",
    text,
    select: at === -1 ? undefined : [at, at + mark.length],
  };
};

export const BLOCKS: BlockDef[] = [
  {
    id: "h1",
    label: "عنوان ۱",
    hint: "بزرگ‌ترین عنوان بخش",
    icon: "h1",
    group: "basic",
    keys: ["heading", "h1", "#", "عنوان", "تیتر"],
    action: { kind: "line", line: "h1" },
  },
  {
    id: "h2",
    label: "عنوان ۲",
    hint: "عنوان اصلی هر بخش",
    icon: "h2",
    group: "basic",
    keys: ["heading", "h2", "##", "عنوان", "تیتر"],
    action: { kind: "line", line: "h2" },
  },
  {
    id: "h3",
    label: "عنوان ۳",
    hint: "زیربخش",
    icon: "h3",
    group: "basic",
    keys: ["heading", "h3", "###", "عنوان", "زیربخش"],
    action: { kind: "line", line: "h3" },
  },
  {
    id: "h4",
    label: "عنوان ۴",
    hint: "عنوان کوچک",
    icon: "h4",
    group: "basic",
    keys: ["heading", "h4", "####", "عنوان"],
    action: { kind: "line", line: "h4" },
  },
  {
    id: "ul",
    label: "فهرست نقطه‌ای",
    hint: "موارد بدون ترتیب",
    icon: "ul",
    group: "basic",
    keys: ["bullet", "list", "ul", "فهرست", "لیست", "نقطه"],
    action: { kind: "line", line: "ul" },
  },
  {
    id: "ol",
    label: "فهرست شماره‌دار",
    hint: "مراحل پشت سر هم",
    icon: "ol",
    group: "basic",
    keys: ["number", "ordered", "ol", "شماره", "ترتیب", "مرحله"],
    action: { kind: "line", line: "ol" },
  },
  {
    id: "toggle",
    label: "فهرست بازشو",
    hint: "عنوانی که با کلیک باز می‌شود",
    icon: "toggle",
    group: "basic",
    keys: ["toggle", "details", "collapse", "accordion", "بازشو", "کشویی"],
    action: block(
      ':::toggle{summary="عنوانِ بازشو"}\nمتنی که تا کلیک نشده دیده نمی‌شود. می‌توانید هر بلوکی را اینجا بگذارید.\n:::',
      "عنوانِ بازشو",
    ),
  },
  {
    id: "callout",
    label: "کادر تأکید",
    hint: "متنی که از بقیه جدا می‌ایستد",
    icon: "callout",
    group: "basic",
    keys: ["callout", "alert", "note", "tip", "warning", "کادر", "تاکید", "هشدار"],
    action: { kind: "dialog", dialog: "callout" },
  },
  {
    id: "quote",
    label: "نقل‌قول",
    hint: "خطِ کنار متن و گیومه",
    icon: "quote",
    group: "basic",
    keys: ["quote", "blockquote", "نقل", "قول", "گیومه"],
    action: block(
      ':::quote{by="گوینده"}\nمتنِ نقل‌قول اینجا نوشته می‌شود.\n:::',
      "متنِ نقل‌قول اینجا نوشته می‌شود.",
    ),
  },
  {
    id: "table",
    label: "جدول",
    hint: "سطر و ستونِ قابل تنظیم",
    icon: "table",
    group: "basic",
    keys: ["table", "grid", "rows", "جدول", "سطر", "ستون"],
    action: { kind: "dialog", dialog: "table" },
  },
  {
    id: "divider",
    label: "جداکننده",
    hint: "خطِ افقی میان دو بخش",
    icon: "divider",
    group: "basic",
    keys: ["divider", "hr", "rule", "line", "جدا", "خط"],
    action: block("---"),
  },
  {
    id: "image",
    label: "تصویر",
    hint: "از کتابخانه، رایانه یا نشانی",
    icon: "image",
    group: "media",
    keys: ["image", "photo", "picture", "img", "تصویر", "عکس", "نگاره"],
    action: { kind: "dialog", dialog: "image" },
  },
  {
    id: "video",
    label: "ویدیو",
    hint: "پخش‌کننده با کنترل کامل",
    icon: "video",
    group: "media",
    keys: ["video", "movie", "clip", "ویدیو", "فیلم", "نماهنگ"],
    action: { kind: "dialog", dialog: "video" },
  },
  {
    id: "audio",
    label: "صدا",
    hint: "پخش‌کننده با موج و زمان",
    icon: "audio",
    group: "media",
    keys: ["audio", "sound", "music", "mp3", "صدا", "صوت", "آهنگ"],
    action: { kind: "dialog", dialog: "audio" },
  },
  {
    id: "file",
    label: "فایل",
    hint: "کارتِ دانلود برای هر پیوست",
    icon: "file",
    group: "media",
    keys: ["file", "attachment", "download", "pdf", "فایل", "پیوست", "دانلود"],
    action: { kind: "dialog", dialog: "file" },
  },

  {
    id: "task",
    label: "فهرست کارها",
    hint: "موارد تیک‌زدنی",
    icon: "task",
    group: "advanced",
    keys: ["task", "todo", "check", "کار", "تیک"],
    action: { kind: "line", line: "task" },
  },
  {
    id: "link",
    label: "پیوند",
    hint: "لینک روی متنِ انتخاب‌شده",
    icon: "link",
    group: "advanced",
    keys: ["link", "url", "href", "پیوند", "لینک"],
    action: { kind: "dialog", dialog: "link" },
  },
  {
    id: "linkcard",
    label: "کارتِ پیوند",
    hint: "پیش‌نمایشِ بزرگ یک نشانی",
    icon: "linkcard",
    group: "advanced",
    keys: ["bookmark", "card", "کارت", "نشانی"],
    action: { kind: "dialog", dialog: "linkcard" },
  },
  {
    id: "embed",
    label: "ویدیوی آپارات / یوتیوب",
    hint: "جاسازی بدون آپلود",
    icon: "embed",
    group: "advanced",
    keys: ["youtube", "aparat", "embed", "iframe", "آپارات", "یوتیوب"],
    action: { kind: "dialog", dialog: "embed" },
  },
  {
    id: "gallery",
    label: "گالری",
    hint: "چند تصویر کنار هم",
    icon: "gallery",
    group: "advanced",
    keys: ["gallery", "grid", "images", "گالری", "چیدمان"],
    action: { kind: "dialog", dialog: "gallery" },
  },
  {
    id: "code",
    label: "قطعه کد",
    hint: "با رنگ‌آمیزی و دکمهٔ کپی",
    icon: "code",
    group: "advanced",
    keys: ["code", "snippet", "pre", "کد"],
    action: { kind: "dialog", dialog: "code" },
  },
  {
    id: "math",
    label: "فرمول ریاضی",
    hint: "نوشتنِ فرمول با KaTeX",
    icon: "math",
    group: "advanced",
    keys: ["math", "latex", "katex", "formula", "ریاضی", "فرمول"],
    action: { kind: "dialog", dialog: "math" },
  },
  {
    id: "toc",
    label: "فهرست مطالب",
    hint: "خودکار از عنوان‌ها ساخته می‌شود",
    icon: "toc",
    group: "advanced",
    keys: ["toc", "contents", "فهرست", "مطالب"],
    action: block("::toc"),
  },
  {
    id: "score",
    label: "جداکنندهٔ حامل",
    hint: "پنج خطِ حامل با نُتِ برنجی",
    icon: "score",
    group: "advanced",
    keys: ["score", "staff", "music", "حامل", "نت"],
    action: block("::score"),
  },
  {
    id: "metronome",
    label: "مترونوم",
    hint: "قابل نواختن داخل نوشته",
    icon: "metronome",
    group: "advanced",
    keys: ["metronome", "bpm", "tempo", "مترونوم", "ضرب"],
    action: { kind: "dialog", dialog: "metronome" },
  },
  {
    id: "columns",
    label: "دو ستون",
    hint: "متنِ کنار هم",
    icon: "columns",
    group: "advanced",
    keys: ["columns", "two", "ستون"],
    action: block(
      ":::columns\n:::card{title=\"ستون یکم\"}\nمتنِ ستون یکم.\n:::\n\n:::card{title=\"ستون دوم\"}\nمتنِ ستون دوم.\n:::\n:::",
    ),
  },
  {
    id: "steps",
    label: "گام‌های شماره‌دار",
    hint: "راهنمای مرحله‌به‌مرحله",
    icon: "steps",
    group: "advanced",
    keys: ["steps", "guide", "گام", "مرحله"],
    action: block(
      ':::steps\n1. **گام یکم.** توضیح کوتاه.\n2. **گام دوم.** توضیح کوتاه.\n3. **گام سوم.** توضیح کوتاه.\n:::',
    ),
  },
  {
    id: "telegram",
    label: "دعوت به تلگرام",
    hint: "دکمهٔ پیام در پایان نوشته",
    icon: "telegram",
    group: "advanced",
    keys: ["telegram", "cta", "تلگرام", "دعوت"],
    action: block('::telegram[برای شروع، پیام بدهید.]'),
  },
  {
    id: "ltr",
    label: "بلوک چپ‌به‌راست",
    hint: "برای متنِ لاتین",
    icon: "ltr",
    group: "advanced",
    keys: ["ltr", "english", "latin", "لاتین", "چپ"],
    action: block(":::ltr\nLeft-to-right text goes here.\n:::", "Left-to-right text goes here."),
  },
];

export const INLINE_TOOLS: {
  id: string;
  label: string;
  icon: string;
  before: string;
  after: string;
  placeholder: string;
  key?: string;
}[] = [
  { id: "bold", label: "درشت", icon: "bold", before: "**", after: "**", placeholder: "متنِ درشت", key: "b" },
  { id: "italic", label: "مورب", icon: "italic", before: "*", after: "*", placeholder: "متنِ مورب", key: "i" },
  { id: "strike", label: "خط‌خورده", icon: "strike", before: "~~", after: "~~", placeholder: "خط‌خورده" },
  { id: "code", label: "کدِ درون‌خطی", icon: "inlinecode", before: "`", after: "`", placeholder: "code", key: "e" },
  { id: "mark", label: "هایلایت", icon: "mark", before: ":mark[", after: "]", placeholder: "متنِ مهم", key: "h" },
  { id: "brass", label: "رنگِ برنجی", icon: "brass", before: ":brass[", after: "]", placeholder: "متنِ رنگی" },
  { id: "hand", label: "دست‌خط", icon: "hand", before: ":hand[", after: "]", placeholder: "دست‌خط" },
  { id: "kbd", label: "کلید", icon: "kbd", before: ":kbd[", after: "]", placeholder: "Ctrl" },
  { id: "badge", label: "نشان", icon: "badge", before: ":badge[", after: "]{tone=verdigris}", placeholder: "تازه" },
  { id: "sup", label: "بالانویس", icon: "sup", before: ":sup[", after: "]", placeholder: "۲" },
  { id: "sub", label: "زیرنویس", icon: "sub", before: ":sub[", after: "]", placeholder: "n" },
  { id: "ltr", label: "لاتینِ درون‌خطی", icon: "ltr", before: ":ltr[", after: "]", placeholder: "piano" },
  { id: "num", label: "رقمِ فارسی", icon: "num", before: ":num[", after: "]", placeholder: "12" },
];

export type InlineTool = (typeof INLINE_TOOLS)[number];

export function searchBlocks(query: string): BlockDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return BLOCKS;
  const scored = BLOCKS.map((b) => {
    const label = b.label.toLowerCase();
    let score = -1;
    if (label.startsWith(q)) score = 0;
    else if (label.includes(q)) score = 1;
    else if (b.keys.some((k) => k.toLowerCase().startsWith(q))) score = 2;
    else if (b.keys.some((k) => k.toLowerCase().includes(q))) score = 3;
    else if (b.hint.toLowerCase().includes(q)) score = 4;
    return { b, score };
  }).filter((x) => x.score >= 0);
  scored.sort((a, z) => a.score - z.score);
  return scored.map((x) => x.b);
}

export function tableMarkdown(opts: {
  rows: number;
  cols: number;
  header: boolean;
  caption: string;
  striped: boolean;
  dense: boolean;
  accent: string;
  align: ("right" | "center" | "left")[];
}): string {
  const { rows, cols, header, caption, striped, dense, accent, align } = opts;
  const cell = (r: number, c: number) =>
    header && r === 0 ? `ستون ${c + 1}` : `درایه ${r + 1}-${c + 1}`;
  const line = (r: number) =>
    `| ${Array.from({ length: cols }, (_, c) => cell(r, c)).join(" | ")} |`;
  const divider = `| ${Array.from({ length: cols }, (_, c) => {
    const a = align[c] ?? "right";
    return a === "center" ? ":---:" : a === "left" ? ":---" : "---:";
  }).join(" | ")} |`;

  const body: string[] = [];
  const total = header ? rows + 1 : rows;
  for (let r = 0; r < total; r += 1) {
    body.push(line(r));
    if (header && r === 0) body.push(divider);
  }
  if (!header) body.splice(1, 0, divider);

  const attrs = [
    caption ? `caption="${caption.replace(/"/g, "'")}"` : "",
    `striped=${striped}`,
    `dense=${dense}`,
    `accent=${accent}`,
  ]
    .filter(Boolean)
    .join(" ");

  return `:::table{${attrs}}\n${body.join("\n")}\n:::`;
}