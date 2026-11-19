"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icons";

/* ---------------- toasts ---------------- */

export type Toast = {
  id: number;
  text: string;
  tone: "ok" | "err" | "info";
  action?: { label: string; run: () => void };
};

type ToastApi = {
  push: (t: Omit<Toast, "id">) => void;
  ok: (text: string, action?: Toast["action"]) => void;
  err: (text: string) => void;
  info: (text: string, action?: Toast["action"]) => void;
};

const ToastCtx = createContext<ToastApi>({
  push: () => {},
  ok: () => {},
  err: () => {},
  info: () => {},
});

export const useToast = () => useContext(ToastCtx);

export function ToastHost({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const drop = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      seq.current += 1;
      const id = seq.current;
      setItems((list) => [...list.slice(-3), { ...t, id }]);
      timers.current.set(
        id,
        setTimeout(() => drop(id), t.action ? 9000 : 4200),
      );
    },
    [drop],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      push,
      ok: (text, action) => push({ text, tone: "ok", action }),
      err: (text) => push({ text, tone: "err" }),
      info: (text, action) => push({ text, tone: "info", action }),
    }),
    [push],
  );

  return (
    <ToastCtx value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((t) => (
          <div className="toast" key={t.id} data-tone={t.tone}>
            <span className="toast-icon">
              <Icon
                name={t.tone === "ok" ? "check" : t.tone === "err" ? "alert" : "info"}
              />
            </span>
            <span className="toast-text">{t.text}</span>
            {t.action ? (
              <button
                className="toast-action"
                type="button"
                onClick={() => {
                  t.action?.run();
                  drop(t.id);
                }}
              >
                {t.action.label}
              </button>
            ) : null}
            <button
              className="icon-btn"
              type="button"
              onClick={() => drop(t.id)}
              aria-label="بستن"
              style={{ width: "1.6rem", height: "1.6rem" }}
            >
              <Icon name="x" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx>
  );
}

/* ---------------- modal ---------------- */

/** Modals nest (a picker opens over an edit form), so the scroll lock and the
 *  key handlers belong to the stack, not to any single instance. */
const modalStack: symbol[] = [];
let savedOverflow = "";

export function Modal({
  title,
  sub,
  onClose,
  children,
  foot,
  size = "default",
}: {
  title: string;
  sub?: string;
  onClose: () => void;
  children: ReactNode;
  foot?: ReactNode;
  size?: "default" | "wide" | "narrow";
}) {
  const [mounted, setMounted] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const self = useRef<symbol | null>(null);
  if (!self.current) self.current = Symbol("modal");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const token = self.current!;
    if (!modalStack.length) savedOverflow = document.body.style.overflow;
    modalStack.push(token);
    document.body.style.overflow = "hidden";
    return () => {
      const at = modalStack.indexOf(token);
      if (at !== -1) modalStack.splice(at, 1);
      if (!modalStack.length) document.body.style.overflow = savedOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== self.current) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && box.current) {
        const nodes = box.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const list = [...nodes].filter((n) => !n.hasAttribute("disabled"));
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    const t = setTimeout(() => {
      const target = box.current?.querySelector<HTMLElement>(
        "input:not([type=hidden]), textarea, select, button",
      );
      target?.focus();
    }, 40);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      clearTimeout(t);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal${size === "wide" ? " wide" : size === "narrow" ? " narrow" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={box}
      >
        <div className="modal-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id={titleId}>{title}</h2>
            {sub ? <p>{sub}</p> : null}
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="بستن">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {foot ? <div className="modal-foot">{foot}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

/* ---------------- small controls ---------------- */

export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track" />
      <span className="switch-text">
        {label}
        {hint ? (
          <span className="label-hint" style={{ display: "block" }}>
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function Range({
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="range-row">
      <input
        className="range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--fill": `${fill}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="range-value">{format ? format(value) : value}</span>
    </div>
  );
}

export function Accordion({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="acc" data-open={open}>
      <button
        className="acc-head"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Icon name={icon} />
        {title}
        <Icon name="chevron" className="acc-chev" />
      </button>
      {open ? <div className="acc-body">{children}</div> : null}
    </section>
  );
}

export function Empty({
  icon,
  title,
  note,
  action,
}: {
  icon: string;
  title: string;
  note?: string;
  action?: ReactNode;
}) {
  return (
    <div className="tbl-empty">
      <Icon name={icon} />
      <p style={{ fontWeight: 700, color: "var(--ink)" }}>{title}</p>
      {note ? <p className="muted">{note}</p> : null}
      {action ? <div style={{ marginTop: "0.9rem" }}>{action}</div> : null}
    </div>
  );
}