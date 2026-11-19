"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/app/components/admin/Icons";
import { GROUP_LABEL, type BlockDef, type BlockGroup } from "@/lib/editor/blocks";

const ORDER: BlockGroup[] = ["basic", "media", "advanced"];

export function SlashMenu({
  x,
  y,
  query,
  items,
  index,
  onPick,
  onHover,
}: {
  x: number;
  y: number;
  query: string;
  items: BlockDef[];
  index: number;
  onPick: (def: BlockDef) => void;
  onHover: (i: number) => void;
}) {
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>('[data-on="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [index, items]);

  const grouped = query.trim().length === 0;
  let cursor = -1;

  const row = (def: BlockDef) => {
    cursor += 1;
    const i = cursor;
    return (
      <button
        key={def.id}
        type="button"
        id={`slash-opt-${def.id}`}
        className={`slash-item${i === index ? " is-on" : ""}`}
        data-on={i === index}
        role="option"
        aria-selected={i === index}
        onMouseEnter={() => onHover(i)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onPick(def)}
      >
        <span className="slash-icon">
          <Icon name={def.icon} />
        </span>
        <span className="slash-text">
          <span className="slash-label">{def.label}</span>
          <span className="slash-hint">{def.hint}</span>
        </span>
      </button>
    );
  };

  return createPortal(
    <div
      className="slash"
      id="slash-menu"
      style={{ left: x, top: y }}
      role="listbox"
      aria-label="افزودن بلوک"
    >
      <div className="slash-search">
        <Icon name="plus" />
        <span style={{ flex: 1 }}>
          {query ? `«${query}»` : "چه چیزی اضافه شود؟"}
        </span>
        <kbd>↑↓</kbd>
        <kbd>Enter</kbd>
        <kbd>Esc</kbd>
      </div>
      <div className="slash-list" ref={list}>
        {items.length === 0 ? (
          <p className="slash-empty">
            بلوکی با این نام نیست. <kbd className="kbd-hint">Esc</kbd> تا منو بسته
            شود.
          </p>
        ) : grouped ? (
          ORDER.map((g) => {
            const rows = items.filter((b) => b.group === g);
            if (!rows.length) return null;
            return (
              <div key={g}>
                <p className="slash-group">{GROUP_LABEL[g]}</p>
                {rows.map(row)}
              </div>
            );
          })
        ) : (
          items.map(row)
        )}
      </div>
    </div>,
    document.body,
  );
}