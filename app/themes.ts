export const THEME_STORAGE_KEY = "anima:theme";

export const THEMES = [
  {
    id: "abnus",
    name: "آبنوس",
    paper: "#17120e",
    accent: "#c08a3e",
    ink: "#f1e7d7",
  },
  {
    id: "lajvard",
    name: "لاجورد",
    paper: "#101425",
    accent: "#d4a94e",
    ink: "#eceaf2",
  },
  {
    id: "arghavan",
    name: "ارغوان",
    paper: "#1b101b",
    accent: "#d678a0",
    ink: "#f2e9ee",
  },
  {
    id: "firuzeh",
    name: "فیروزه",
    paper: "#0c1b1b",
    accent: "#52c0b0",
    ink: "#e8f0ec",
  },
  {
    id: "sahargah",
    name: "سحرگاه",
    paper: "#f5ede0",
    accent: "#965222",
    ink: "#2a1e14",
  },
  {
    id: "nilufar",
    name: "نیلوفر",
    paper: "#f1f5fb",
    accent: "#1d4ed8",
    ink: "#111c33",
  },
  {
    id: "golab",
    name: "گلاب",
    paper: "#fbf1f3",
    accent: "#b82952",
    ink: "#2d121c",
  },
  {
    id: "bahar",
    name: "بهار",
    paper: "#eef6f0",
    accent: "#0f766e",
    ink: "#11281d",
  },
  {
    id: "zaferan",
    name: "زعفران",
    paper: "#fcf6e8",
    accent: "#b84a0b",
    ink: "#2c1d09",
  },
  {
    id: "banafsheh",
    name: "بنفشه",
    paper: "#f5f1fb",
    accent: "#6d28d9",
    ink: "#211536",
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