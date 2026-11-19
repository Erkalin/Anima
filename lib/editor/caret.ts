const COPIED = [
  "direction",
  "unicode-bidi",
  "font-style",
  "font-variant",
  "font-weight",
  "font-stretch",
  "font-size",
  "font-family",
  "line-height",
  "letter-spacing",
  "word-spacing",
  "text-align",
  "text-indent",
  "text-transform",
  "tab-size",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
];

/**
 * Pixel position of a caret inside a textarea, measured with a hidden mirror
 * that carries the same typography and box metrics.
 */
export function caretXY(
  ta: HTMLTextAreaElement,
  pos: number,
): { x: number; y: number; line: number } {
  const cs = getComputedStyle(ta);
  const mirror = document.createElement("div");
  mirror.setAttribute("aria-hidden", "true");
  for (const prop of COPIED) {
    mirror.style.setProperty(prop, cs.getPropertyValue(prop));
  }
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.boxSizing = "content-box";
  mirror.style.width = cs.width;
  mirror.style.height = "auto";
  mirror.style.overflow = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflowWrap = "break-word";

  const rect = ta.getBoundingClientRect();
  mirror.style.left = `${rect.left + window.scrollX}px`;
  mirror.style.top = `${rect.top + window.scrollY}px`;

  mirror.textContent = ta.value.slice(0, pos);
  const marker = document.createElement("span");
  marker.textContent = ta.value.slice(pos, pos + 1) || "​";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.8;
  const x = rect.left + marker.offsetLeft - ta.scrollLeft;
  const y = rect.top + marker.offsetTop - ta.scrollTop;
  mirror.remove();

  return { x, y: y + line, line };
}

export function clampToViewport(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const pad = 8;
  const maxX = window.innerWidth - width - pad;
  const maxY = window.innerHeight - height - pad;
  return {
    x: Math.max(pad, Math.min(x, Math.max(pad, maxX))),
    y: Math.max(pad, Math.min(y, Math.max(pad, maxY))),
  };
}