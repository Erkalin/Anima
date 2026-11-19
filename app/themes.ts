export const THEME_STORAGE_KEY = "anima:theme";

export const THEMES = [
  {
    id: "abnus",
    name: "آبنوس",
    note: "چوبِ تیره و برنج",
    paper: "#17120e",
    accent: "#c08a3e",
    ink: "#f1e7d7",
  },
  {
    id: "lajvard",
    name: "لاجورد",
    note: "شبِ لاجوردی و طلا",
    paper: "#101425",
    accent: "#d4a94e",
    ink: "#eceaf2",
  },
  {
    id: "arghavan",
    name: "ارغوان",
    note: "شکوفه‌ی ارغوان",
    paper: "#1b101b",
    accent: "#d678a0",
    ink: "#f2e9ee",
  },
  {
    id: "firuzeh",
    name: "فیروزه",
    note: "کاشیِ فیروزه‌ای",
    paper: "#0c1b1b",
    accent: "#52c0b0",
    ink: "#e8f0ec",
  },
  {
    id: "sahargah",
    name: "سحرگاه",
    note: "کاغذِ صبحگاهی",
    paper: "#f5ede0",
    accent: "#965222",
    ink: "#2a1e14",
  },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "abnus";

export function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

export function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    /* private mode: the choice still holds for this visit */
  }
}