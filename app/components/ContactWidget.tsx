"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  baleHref,
  balePending,
  baleUsername,
  telegramHref,
  telegramPending,
  telegramUsername,
} from "../data";
import { BaleIcon, TelegramIcon } from "./Art";
import { ArrowIcon, NoteMark, SendIcon } from "./studio/icons";

type ChatMsg = {
  id: number;
  role: "user" | "model";
  text: string;
  at: number;
  note?: boolean;
};

const WELCOME: ChatMsg = {
  id: 0,
  role: "model",
  text: "سلام! من دستیار آنیما هستم. درباره‌ی کلاس‌های پیانو و ویولن بپرس تا راهنمایی‌ات کنم.",
  at: 0,
};

const QUICK = ["کلاس‌های پیانو", "کلاس‌های ویولن", "ثبت‌نام و هماهنگی"];
const STORE_KEY = "anima-assistant-chat-v1";

function loadChat(): ChatMsg[] {
  if (typeof window === "undefined") return [WELCOME];
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return [WELCOME];
    const parsed = JSON.parse(raw) as ChatMsg[];
    if (!Array.isArray(parsed) || !parsed.length) return [WELCOME];
    return parsed.slice(-40);
  } catch {
    return [WELCOME];
  }
}

const time = (t: number) =>
  t
    ? new Date(t).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    : "";

function TrashGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13h8l1-13M10 11v6M14 11v6"
      />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        d="M6 6l12 12M18 6L6 18"
      />
    </svg>
  );
}

function ChatGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 3C6.9 3 2.8 6.4 2.8 10.6c0 2.4 1.3 4.5 3.4 5.9-.1.9-.5 2-1.4 3 0 0 2.3-.4 4-1.5.9.3 1.9.4 3 .4h.4c-.1-.5-.2-1-.2-1.5 0-3.9 3.6-7 8-7h.6C20.9 6 16.9 3 12 3z"
      />
      <path
        fill="currentColor"
        d="M21.2 15.3c0-2.9-2.8-5.2-6.2-5.2s-6.2 2.3-6.2 5.2 2.8 5.2 6.2 5.2c.7 0 1.4-.1 2-.3 1.1.7 2.6 1 2.6 1-.6-.7-.9-1.4-1-2 1.6-1 2.6-2.4 2.6-3.9z"
        opacity=".72"
      />
    </svg>
  );
}

export function ContactWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"assistant" | "team">("assistant");
  const [msgs, setMsgs] = useState<ChatMsg[]>([WELCOME]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const loadedRef = useRef(false);

  // Read persisted chat on first open (event handler, not an effect): the
  // initial render always matches the server's welcome-only markup.
  const toggle = () => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      const stored = loadChat();
      nextId.current = Math.max(0, ...stored.map((m) => m.id)) + 1;
      setMsgs(stored);
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-40)));
    } catch {
      /* storage unavailable — chat still works for this visit */
    }
  }, [msgs]);

  // Header status: ask the server whether Gemini keys are configured.
  useEffect(() => {
    if (!open || configured !== null) return;
    fetch("/api/assistant")
      .then((r) => r.json())
      .then((d) => setConfigured(Boolean(d.configured)))
      .catch(() => setConfigured(null));
  }, [open, configured]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [msgs, busy, tab, open]);

  const close = useCallback(() => {
    setOpen(false);
    fabRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, close]);

  const push = (m: Omit<ChatMsg, "id" | "at">) =>
    setMsgs((prev) => [...prev.slice(-39), { ...m, id: nextId.current++, at: Date.now() }]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    setDraft("");
    // id 0 is the welcome note — Gemini history must start with a user turn.
    const history = [
      ...msgs.filter((m) => !m.note && m.id !== 0),
      { role: "user" as const, text: clean },
    ];
    push({ role: "user", text: clean });
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-12).map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.reply) {
        push({ role: "model", text: data.reply });
      } else if (data.error === "unconfigured") {
        push({
          role: "model",
          note: true,
          text: "دستیار هوشمند هنوز فعال نشده است. برای پیام به تیم، تب «تماس» را باز کن.",
        });
      } else if (data.error === "rate") {
        push({ role: "model", note: true, text: "کمی صبر کن و دوباره تلاش کن." });
      } else {
        push({
          role: "model",
          note: true,
          text: "پاسخی دریافت نشد؛ دوباره تلاش کن یا از تب «تماس» استفاده کن.",
        });
      }
    } catch {
      push({ role: "model", note: true, text: "اتصال برقرار نشد؛ دوباره تلاش کن." });
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(draft);
  };

  const clearChat = () => {
    setMsgs([{ ...WELCOME, at: Date.now() }]);
    try {
      window.localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
  };

  const teamChannels = [
    {
      id: "telegram",
      label: "تلگرام",
      handle: telegramPending ? "به‌زودی" : `@${telegramUsername}`,
      href: telegramPending ? "/contact#composer" : telegramHref,
      pending: telegramPending,
      icon: <TelegramIcon />,
      primary: true,
    },
    {
      id: "bale",
      label: "بله",
      handle: balePending ? "به‌زودی" : `@${baleUsername}`,
      href: balePending ? "/contact#composer" : baleHref,
      pending: balePending,
      icon: <BaleIcon />,
      primary: false,
    },
  ];

  return (
    <div className="contact-fab" ref={rootRef} data-open={open || undefined}>
      {open && (
        <div className="contact-widget" role="dialog" aria-label="گفتگو و تماس با آنیما">
          <div className="widget-head">
            <span className="widget-avatar" aria-hidden="true">
              <NoteMark />
            </span>
            <div className="widget-head-text">
              <p className="widget-title">آنیما</p>
              <p className="widget-status">
                <span
                  className="widget-dot"
                  data-off={tab === "assistant" && configured === false ? true : undefined}
                  aria-hidden="true"
                />
                {tab === "assistant"
                  ? configured === false
                    ? "فعال‌سازی به‌زودی"
                    : configured
                      ? "آنلاین · پاسخ فوری"
                      : "دستیار هوشمند آنیما"
                  : "تیم آنیما · پیام‌رسان‌ها"}
              </p>
            </div>
            {tab === "assistant" && (
              <button
                type="button"
                className="widget-icon-btn"
                onClick={clearChat}
                aria-label="پاک کردن گفتگو"
                title="پاک کردن گفتگو"
              >
                <TrashGlyph />
              </button>
            )}
            <button
              type="button"
              className="widget-icon-btn"
              onClick={close}
              aria-label="بستن"
            >
              <CloseGlyph />
            </button>
          </div>

          <div className="widget-tabs" role="tablist" aria-label="بخش‌های گفتگو">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "assistant"}
              className="widget-tab"
              data-active={tab === "assistant" || undefined}
              onClick={() => setTab("assistant")}
            >
              دستیار
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "team"}
              className="widget-tab"
              data-active={tab === "team" || undefined}
              onClick={() => setTab("team")}
            >
              تماس
            </button>
          </div>

          {tab === "assistant" ? (
            <div className="widget-body" role="tabpanel">
              <div className="chat-scroll" ref={scrollRef}>
                {msgs.map((m) => (
                  <div
                    key={m.id}
                    className="chat-msg"
                    data-role={m.role}
                    data-note={m.note || undefined}
                  >
                    <p className="chat-bubble">{m.text}</p>
                    {m.at > 0 && <span className="chat-time">{time(m.at)}</span>}
                  </div>
                ))}
                {busy && (
                  <div className="chat-msg" data-role="model">
                    <p className="chat-bubble chat-typing" aria-label="در حال پاسخ">
                      <i />
                      <i />
                      <i />
                    </p>
                  </div>
                )}
              </div>

              {msgs.length <= 1 && !busy && (
                <div className="chat-quick">
                  {QUICK.map((q) => (
                    <button key={q} type="button" className="chat-chip" onClick={() => void send(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <form className="chat-input" onSubmit={onSubmit}>
                <input
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="درباره‌ی کلاس‌ها بپرس…"
                  aria-label="پیام به دستیار"
                  maxLength={2000}
                  disabled={busy}
                />
                <button
                  type="submit"
                  className="chat-send"
                  disabled={busy || !draft.trim()}
                  aria-label="ارسال"
                >
                  <SendIcon />
                </button>
              </form>
            </div>
          ) : (
            <div className="widget-body widget-team" role="tabpanel">
              <div className="team-intro">
                <span className="team-avatar" aria-hidden="true">
                  <NoteMark />
                </span>
                <p className="team-title">گفتگو با تیم آنیما</p>
                <p className="team-sub">برای هماهنگی کلاس‌ها و پرسش‌ها پیام بدهید.</p>
              </div>

              <div className="team-channels">
                {teamChannels.map((c) => (
                  <a
                    key={c.id}
                    className="team-channel"
                    data-channel={c.id}
                    data-primary={c.primary || undefined}
                    href={c.href}
                    target={c.pending ? undefined : "_blank"}
                    rel={c.pending ? undefined : "noopener noreferrer"}
                  >
                    <span className="team-channel-icon" aria-hidden="true">
                      {c.icon}
                    </span>
                    <span className="team-channel-text">
                      <span className="team-channel-name">{c.label}</span>
                      <span className="team-channel-handle" dir="ltr">
                        {c.handle}
                      </span>
                    </span>
                    <ArrowIcon className="team-channel-arrow" />
                  </a>
                ))}
              </div>

              <a className="team-form-link" href="/contact#composer">
                فرم تماس را ترجیح می‌دهید؟ رفتن به فرم تماس
                <ArrowIcon />
              </a>
            </div>
          )}

          <p className="widget-foot">آنیما — آموزش پیانو و ویولن</p>
        </div>
      )}

      <button
        type="button"
        ref={fabRef}
        className="contact-fab-btn"
        aria-expanded={open}
        aria-label={open ? "بستن گفتگو" : "گفتگو با دستیار یا تماس با تیم"}
        onClick={toggle}
      >
        <span className="contact-fab-ring" aria-hidden="true" />
        <span className="contact-fab-glyph">{open ? <CloseGlyph /> : <ChatGlyph />}</span>
        <span className="contact-fab-tip" aria-hidden="true">
          گفتگو با ما
        </span>
      </button>
    </div>
  );
}