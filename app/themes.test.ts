import test from "node:test";
import assert from "node:assert/strict";
import { THEMES, DEFAULT_THEME, isThemeId } from "./themes";

function luminance(hex: string): number {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

test("THEMES includes 10 unique Persian themes including 5 new light themes", () => {
  assert.equal(THEMES.length, 10);
  assert.equal(new Set(THEMES.map((t) => t.id)).size, 10);
  assert.equal(new Set(THEMES.map((t) => t.name)).size, 10);
  assert.equal(isThemeId(DEFAULT_THEME), true);
  for (const id of ["nilufar", "golab", "bahar", "zaferan", "banafsheh"]) {
    assert.equal(isThemeId(id), true);
  }
  assert.equal(isThemeId("unknown-theme"), false);
});

test("all themes meet WCAG AA contrast between ink/accent and paper", () => {
  for (const t of THEMES) {
    assert.ok(
      contrast(t.ink, t.paper) >= 4.5,
      `${t.id} ink-on-paper contrast too low`,
    );
    assert.ok(
      contrast(t.accent, t.paper) >= 4.5,
      `${t.id} accent-on-paper contrast too low`,
    );
  }
});
