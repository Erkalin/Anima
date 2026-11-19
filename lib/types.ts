export type AccentKey =
  | "brass"
  | "verdigris"
  | "copper"
  | "steel"
  | "velvet"
  | "amber";

export const ACCENTS: { key: AccentKey; label: string; hex: string }[] = [
  { key: "brass", label: "برنج", hex: "var(--brass)" },
  { key: "verdigris", label: "زنگار", hex: "var(--verdigris)" },
  { key: "copper", label: "مس", hex: "var(--copper)" },
  { key: "steel", label: "سیم", hex: "var(--steel)" },
  { key: "velvet", label: "مخمل", hex: "var(--velvet)" },
  { key: "amber", label: "کهربا", hex: "var(--amber)" },
];

export type PostStatus = "draft" | "published" | "scheduled" | "archived";

export const STATUS_LABEL: Record<PostStatus, string> = {
  draft: "پیش‌نویس",
  published: "منتشرشده",
  scheduled: "زمان‌بندی‌شده",
  archived: "بایگانی",
};

export type CoverLayout = "bleed" | "contained" | "split" | "none";

export type PostTypography = {
  /** Body size multiplier, 0.9 – 1.35 */
  scale: number;
  /** Line height, 1.6 – 2.4 */
  leading: number;
  /** Reading column width in rem, 34 – 56 */
  measure: number;
  accent: AccentKey;
};

export type PostSeo = {
  title: string;
  description: string;
  ogImage: string | null;
  noindex: boolean;
};

export type Post = {
  id: string;
  title: string;
  /** The folder name that appears after /blog/ */
  slug: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  coverUrl: string | null;
  coverAlt: string;
  coverLayout: CoverLayout;
  categoryId: string | null;
  tags: string[];
  authorId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  featured: boolean;
  toc: boolean;
  readingMinutes: number | null;
  typography: PostTypography;
  seo: PostSeo;
  customCss: string;
  showAuthor: boolean;
  showShare: boolean;
  showRelated: boolean;
  views: number;
};

export type MediaKind = "image" | "video" | "audio" | "file";

export const MEDIA_LABEL: Record<MediaKind, string> = {
  image: "تصویر",
  video: "ویدیو",
  audio: "صدا",
  file: "فایل",
};

export type Media = {
  id: string;
  name: string;
  url: string;
  kind: MediaKind;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
  caption: string;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  accent: AccentKey;
  description: string;
};

export type Tag = { id: string; name: string; slug: string };

export type Author = {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl: string | null;
};

export type AdminRole = "owner" | "editor";

export type Admin = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  /** scrypt hash, local mode only. Supabase mode keeps the password in Auth. */
  passwordHash?: string;
};

export type Settings = {
  brand: string;
  telegramUsername: string;
  blogTitle: string;
  blogDescription: string;
  postsPerPage: number;
  defaultAuthorId: string | null;
  defaultToc: boolean;
  defaultAccent: AccentKey;
};

export type Db = {
  posts: Post[];
  media: Media[];
  categories: Category[];
  tags: Tag[];
  authors: Author[];
  admins: Admin[];
  settings: Settings;
};

export type SessionAdmin = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

export const DEFAULT_TYPOGRAPHY: PostTypography = {
  scale: 1,
  leading: 1.95,
  measure: 42,
  accent: "brass",
};

export function emptyPost(id: string, now = new Date().toISOString()): Post {
  return {
    id,
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    status: "draft",
    coverUrl: null,
    coverAlt: "",
    coverLayout: "contained",
    categoryId: null,
    tags: [],
    authorId: null,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    featured: false,
    toc: true,
    readingMinutes: null,
    typography: { ...DEFAULT_TYPOGRAPHY },
    seo: { title: "", description: "", ogImage: null, noindex: false },
    customCss: "",
    showAuthor: true,
    showShare: true,
    showRelated: true,
    views: 0,
  };
}