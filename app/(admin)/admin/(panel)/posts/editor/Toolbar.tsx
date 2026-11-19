"use client";

import { Icon } from "@/app/components/admin/Icons";
import { BLOCKS, INLINE_TOOLS, type BlockDef, type InlineTool } from "@/lib/editor/blocks";

const BY_ID = new Map(BLOCKS.map((b) => [b.id, b]));

const STRUCTURE = ["h1", "h2", "h3", "h4"];
const LISTS = ["ul", "ol", "task", "quote"];
const BOXES = ["callout", "toggle", "table", "divider"];
const MEDIA = ["image", "video", "audio", "file", "link"];

function Tool({
  icon,
  label,
  onClick,
  on,
  disabled,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  on?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`icon-btn${on ? " is-on" : ""}`}
      title={label}
      aria-label={label}
      aria-pressed={on}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
}

const Sep = () => <span className="editor-bar-sep" aria-hidden="true" />;

export function Toolbar({
  onBlock,
  onInline,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onFind,
  onPalette,
  findOn,
  locked,
}: {
  onBlock: (def: BlockDef) => void;
  onInline: (tool: InlineTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onFind: () => void;
  onPalette: () => void;
  findOn: boolean;
  locked: boolean;
}) {
  const group = (ids: string[]) =>
    ids.map((id) => {
      const def = BY_ID.get(id);
      if (!def) return null;
      return (
        <Tool
          key={id}
          icon={def.icon}
          label={def.label}
          disabled={locked}
          onClick={() => onBlock(def)}
        />
      );
    });

  return (
    <>
      <div className="editor-bar" role="toolbar" aria-label="بلوک‌ها">
        <Tool icon="undo" label="واگرد (Ctrl+Z)" onClick={onUndo} disabled={!canUndo || locked} />
        <Tool icon="redo" label="ازنو (Ctrl+Shift+Z)" onClick={onRedo} disabled={!canRedo || locked} />
        <Sep />
        {group(STRUCTURE)}
        <Sep />
        {group(LISTS)}
        <Sep />
        {group(BOXES)}
        <Sep />
        <Tool icon="grid" label="همهٔ بلوک‌ها" onClick={onPalette} disabled={locked} />
        <Tool icon="replace" label="جست‌وجو و جایگزینی (Ctrl+F)" onClick={onFind} on={findOn} />
      </div>

      <div className="editor-bar" role="toolbar" aria-label="قالب‌بندی متن و رسانه">
        {INLINE_TOOLS.map((t) => (
          <Tool
            key={t.id}
            icon={t.icon}
            label={t.key ? `${t.label} (Ctrl+${t.key.toUpperCase()})` : t.label}
            disabled={locked}
            onClick={() => onInline(t)}
          />
        ))}
        <Sep />
        {group(MEDIA)}
      </div>
    </>
  );
}