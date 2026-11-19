"use client";

import { useRef, useState, type ReactNode } from "react";

export function CodeBlock({
  lang,
  children,
}: {
  lang?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = ref.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="md-code" ref={ref}>
      <div className="md-code-bar">
        <span className="md-code-lang" dir="ltr">
          {lang || "متن"}
        </span>
        <button type="button" onClick={copy} className="md-code-copy">
          {copied ? "کپی شد" : "کپی"}
        </button>
      </div>
      <pre dir="ltr">{children}</pre>
    </div>
  );
}