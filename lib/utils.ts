const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFa(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export function toEnDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** Keeps Persian letters so the folder after /blog/ stays readable to the owner. */
export function slugify(input: string): string {
  return toEnDigits(input)
    .trim()
    .toLowerCase()
    .replace(/[‌‏‎]/g, "-")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

const TRANSLIT: Record<string, string> = {
  ا: "a", آ: "a", ب: "b", پ: "p", ت: "t", ث: "s", ج: "j", چ: "ch",
  ح: "h", خ: "kh", د: "d", ذ: "z", ر: "r", ز: "z", ژ: "zh", س: "s",
  ش: "sh", ص: "s", ض: "z", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f",
  ق: "gh", ک: "k", ك: "k", گ: "g", ل: "l", م: "m", ن: "n", و: "v",
  ه: "h", ی: "y", ي: "y", ئ: "y", ء: "", ة: "h",
};

export function transliterate(input: string): string {
  const mapped = [...toEnDigits(input)]
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("");
  return slugify(mapped);
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function countWords(markdown: string): number {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/::+[a-z-]*(\[[^\]]*\])?(\{[^}]*\})?/gi, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_>`|~:-]/g, " ");
  return plain.split(/\s+/).filter((w) => w.length > 0).length;
}

export function readingMinutes(markdown: string): number {
  return Math.max(1, Math.round(countWords(markdown) / 200));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${toFa(bytes)} بایت`;
  const units = ["کیلوبایت", "مگابایت", "گیگابایت"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${toFa(value.toFixed(value < 10 ? 1 : 0))} ${units[i]}`;
}

const dateFmt = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const shortFmt = new Intl.DateTimeFormat("fa-IR", {
  month: "short",
  day: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function faDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return dateFmt.format(d);
}

export function faShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return shortFmt.format(d);
}

export function faDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${dateFmt.format(d)} · ${timeFmt.format(d)}`;
}

export function faRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return "همین حالا";
  if (min < 60) return `${toFa(min)} دقیقه پیش`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${toFa(hours)} ساعت پیش`;
  const days = Math.round(hours / 24);
  if (days < 31) return `${toFa(days)} روز پیش`;
  return faDate(iso);
}

/** Value for <input type="datetime-local"> in the browser's own timezone. */
export function toLocalInput(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function mediaKindFromMime(mime: string, name: string) {
  if (mime.startsWith("image/")) return "image" as const;
  if (mime.startsWith("video/")) return "video" as const;
  if (mime.startsWith("audio/")) return "audio" as const;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "avif", "svg"].includes(ext))
    return "image" as const;
  if (["mp4", "webm", "mov", "mkv"].includes(ext)) return "video" as const;
  if (["mp3", "wav", "ogg", "m4a", "flac", "aac"].includes(ext))
    return "audio" as const;
  return "file" as const;
}

export function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  const base = dot > 0 ? name.slice(0, dot) : name;
  const clean =
    base
      .replace(/[^\p{L}\p{N}._-]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
  const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 8);
  return safeExt ? `${clean}.${safeExt}` : clean;
}

export function excerptFrom(markdown: string, max = 180): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$\n]*\$/g, " ")
    .replace(/:::+[\s\S]*?:::+/g, " ")
    .replace(/::+[a-z-]*(\[[^\]]*\])?(\{[^}]*\})?/gi, " ")
    .replace(/:([a-z-]+)\[([^\]]*)\](\{[^}]*\})?/gi, "$2")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, "")
    .replace(/^[#>\-*+\s|]+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max).trimEnd()}…` : plain;
}