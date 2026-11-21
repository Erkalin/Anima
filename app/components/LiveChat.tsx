"use client";

// Visitor side of the live chat: name gate, then a real-time thread with the
// admin team (2s delta polling + optimistic sends). Reuses the assistant
// chat's bubble/input classes; adds reactions, edit, delete and presence.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { ChatMessage } from "@/lib/chat/types";
import { MAX_BODY, MAX_NAME, REACTION_EMOJIS } from "@/lib/chat/types";
import { isMuted, midiToFreq, strike } from "@/lib/audio/engine";
import { cx, faDate, toFa } from "@/lib/utils";
import {
  BackIcon,
  SendIcon,
  SmileIcon,
} from "./studio/icons";

export const LIVE_STORE_KEY = "anima-livechat-v1";

type Identity = { token: string; name: string };

function readIdentity(): Identity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LIVE_STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Identity;
    return parsed?.token && parsed?.name ? parsed : null;
  } catch {
    return null;
  }
}

const byCreated = (a: ChatMessage, b: ChatMessage) =>
  a.createdAt.localeCompare(b.createdAt);

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "امروز";
  if (d.toDateString() === yesterday.toDateString()) return "دیروز";
  return faDate(iso);
}

function pop() {
  if (isMuted()) return;
  strike({ freq: midiToFreq(88), dur: 0.45, gain: 0.09, room: 0.25 });
}

export function LiveChat({
  onBack,
  onUnread,
}: {
  onBack: () => void;
  onUnread: (n: number) => void;
}) {
  // Only ever mounted client-side (widget open + live mode), so reading
  // storage in the initializer cannot cause a hydration mismatch.
  const [identity, setIdentity] = useState<Identity | null>(readIdentity);
  const [nameDraft, setNameDraft] = useState("");
  const [gateNote, setGateNote] = useState("");
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [adminTyping, setAdminTyping] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [syncedName, setSyncedName] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const msgsRef = useRef<ChatMessage[]>([]);
  const sinceRef = useRef<string | null>(null);
  const pendingTokenRef = useRef<string | null>(null);
  const startingRef = useRef(false);
  const firstPoll = useRef(true);
  const nearBottom = useRef(true);
  const tmpCounter = useRef(0);
  const lastTyping = useRef(0);
  const typingTimer = useRef<number | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = useCallback((next: ChatMessage[]) => {
    msgsRef.current = next;
    setMsgs(next);
  }, []);

  const applyIncoming = useCallback(
    (incoming: ChatMessage[]) => {
      if (!incoming.length) return;
      const map = new Map(msgsRef.current.map((m) => [m.id, m]));
      for (const m of incoming) map.set(m.id, m);
      commit([...map.values()].sort(byCreated).slice(-200));
    },
    [commit],
  );

  const post = useCallback(
    async (payload: Record<string, unknown>, token: string) => {
      const res = await fetch("/api/livechat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-visitor-token": token },
        body: JSON.stringify(payload),
      });
      return { ok: res.ok, data: await res.json().catch(() => ({})) };
    },
    [],
  );

  // ---- polling ----------------------------------------------------------
  useEffect(() => {
    if (!identity) return;
    let stop = false;
    async function tick() {
      try {
        const since = sinceRef.current;
        const res = await fetch(
          `/api/livechat${since ? `?since=${encodeURIComponent(since)}` : ""}`,
          { headers: { "x-visitor-token": identity!.token } },
        );
        const d = await res.json();
        if (stop) return;
        if (!d.started) {
          // The team removed this conversation — offer a fresh start.
          try {
            window.localStorage.removeItem(LIVE_STORE_KEY);
          } catch {
            /* ignore */
          }
          setIdentity(null);
          setSyncedName(null);
          setGateNote("گفتگوی پیشین بسته شد؛ می‌توانی گفتگوی تازه‌ای شروع کنی.");
          commit([]);
          return;
        }
        sinceRef.current = d.serverNow;
        const serverName =
          typeof d.conversation?.name === "string" ? d.conversation.name : "";
        if (serverName) {
          setSyncedName(serverName);
          if (serverName !== identity!.name) {
            try {
              window.localStorage.setItem(
                LIVE_STORE_KEY,
                JSON.stringify({ ...identity!, name: serverName }),
              );
            } catch {
              /* ignore */
            }
          }
        }
        setAdminTyping(Boolean(d.conversation?.adminTyping));
        const freshAdmin = (d.messages as ChatMessage[]).filter(
          (m) =>
            m.sender === "admin" &&
            !msgsRef.current.some((p) => p.id === m.id),
        );
        applyIncoming(d.messages);
        if (freshAdmin.length && !firstPoll.current) pop();
        firstPoll.current = false;
        onUnread(0);
      } catch {
        /* offline tick — retry on the next interval */
      }
    }
    void tick();
    const t = window.setInterval(tick, 2000);
    return () => {
      stop = true;
      window.clearInterval(t);
    };
  }, [identity, applyIncoming, commit, onUnread]);

  // ---- autoscroll -------------------------------------------------------
  useEffect(() => {
    const el = scrollRef.current;
    if (el && nearBottom.current) el.scrollTo({ top: el.scrollHeight });
  }, [msgs, adminTyping]);

  // ---- typing pings -----------------------------------------------------
  const pingTyping = useCallback(() => {
    if (!identity) return;
    const now = Date.now();
    if (now - lastTyping.current > 1500) {
      lastTyping.current = now;
      void post({ action: "typing", on: true }, identity.token).catch(() => {});
    }
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      void post({ action: "typing", on: false }, identity.token).catch(() => {});
    }, 3000);
  }, [identity, post]);

  useEffect(() => {
    return () => {
      window.clearTimeout(typingTimer.current);
      const id = readIdentity();
      if (id) {
        void fetch("/api/livechat", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-visitor-token": id.token },
          body: JSON.stringify({ action: "typing", on: false }),
        }).catch(() => {});
      }
    };
  }, []);

  // ---- gate -------------------------------------------------------------
  async function startChat(e: FormEvent) {
    e.preventDefault();
    if (startingRef.current) return;
    const name = nameDraft.replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
    if (!name) return;
    const token =
      identity?.token ??
      pendingTokenRef.current ??
      (pendingTokenRef.current = crypto.randomUUID());
    startingRef.current = true;
    setStarting(true);
    try {
      const { ok } = await post({ action: "start", name }, token);
      if (!ok) {
        setGateNote("اتصال برقرار نشد؛ دوباره تلاش کن.");
        return;
      }
      const next = { token, name };
      try {
        window.localStorage.setItem(LIVE_STORE_KEY, JSON.stringify(next));
      } catch {
        /* private mode — chat works for this visit */
      }
      pendingTokenRef.current = null;
      sinceRef.current = null;
      firstPoll.current = true;
      setGateNote("");
      setSyncedName(name);
      setIdentity(next);
    } catch {
      setGateNote("اتصال برقرار نشد؛ دوباره تلاش کن.");
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }

  // ---- send / retry -----------------------------------------------------
  async function sendText(text: string, reuseId?: string) {
    const clean = text.trim().slice(0, MAX_BODY);
    if (!clean || !identity || busy) return;
    const tmpId = reuseId ?? `tmp-${++tmpCounter.current}`;
    if (!reuseId) {
      const optimistic: ChatMessage = {
        id: tmpId,
        conversationId: "",
        sender: "visitor",
        body: clean,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        editedAt: null,
        deletedAt: null,
        reactions: {},
      };
      commit([...msgsRef.current, optimistic]);
      setDraft("");
    }
    setFailed((prev) => {
      const next = new Set(prev);
      next.delete(tmpId);
      return next;
    });
    setBusy(true);
    window.clearTimeout(typingTimer.current);
    void post({ action: "typing", on: false }, identity.token).catch(() => {});
    try {
      const { ok, data } = await post({ action: "send", body: clean }, identity.token);
      if (ok && data.message) {
        commit(msgsRef.current.filter((m) => m.id !== tmpId));
        applyIncoming([data.message]);
      } else {
        setFailed((prev) => new Set(prev).add(tmpId));
      }
    } catch {
      setFailed((prev) => new Set(prev).add(tmpId));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  // ---- reactions --------------------------------------------------------
  async function react(id: string, emoji: string) {
    if (!identity) return;
    setPickerFor(null);
    try {
      const { ok, data } = await post({ action: "react", id, emoji }, identity.token);
      if (ok && data.message) applyIncoming([data.message]);
    } catch {
      /* next poll reconciles */
    }
  }

  // ---- render -----------------------------------------------------------
  if (!identity) {
    return (
      <div className="live-gate">
        <span className="live-gate-avatar" aria-hidden="true">
          {nameDraft.trim() ? nameDraft.trim().slice(0, 1) : "؟"}
        </span>
        <p className="live-gate-title">گفتگوی زنده با تیم آنیما</p>
        <p className="live-gate-sub">
          اسمت را بگو و همین‌جا با تیم صحبت کن؛ بدون نصب برنامه، بدون معطلی.
        </p>
        <form className="live-gate-form" onSubmit={startChat}>
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="اسم شما…"
            maxLength={MAX_NAME}
            aria-label="اسم شما"
            autoFocus
          />
          <button type="submit" className="live-gate-btn" disabled={starting || !nameDraft.trim()}>
            شروع گفتگو
          </button>
        </form>
        {gateNote ? <p className="live-gate-note">{gateNote}</p> : null}
        <p className="live-gate-privacy">نامت فقط برای تیم آنیما نمایش داده می‌شود.</p>
        <button type="button" className="live-gate-back" onClick={onBack}>
          <BackIcon /> بازگشت
        </button>
      </div>
    );
  }

  const shownName = syncedName ?? identity.name;

  return (
    <>
      <div className="live-head">
        <button type="button" className="widget-icon-btn" onClick={onBack} aria-label="بازگشت">
          <BackIcon />
        </button>
        <div className="widget-head-text">
          <p className="widget-title">گفتگوی زنده</p>
          <p className="widget-status">
            <span className="widget-dot" aria-hidden="true" />
            {adminTyping ? "تیم در حال نوشتن…" : "آنلاین"}
          </p>
        </div>
      </div>

      <div className="live-name-row">
        <span className="live-name-avatar" aria-hidden="true">
          {shownName.slice(0, 1)}
        </span>
        <span className="live-name">{shownName}</span>
      </div>

      <div className="widget-body">
        <div
          className="chat-scroll live-scroll"
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
        >
          {msgs.map((m, i) => {
            const day = new Date(m.createdAt).toDateString();
            const prevDay =
              i > 0 ? new Date(msgs[i - 1].createdAt).toDateString() : "";
            const sep = day !== prevDay ? dayLabel(m.createdAt) : null;
            const mine = m.sender === "visitor";
            const isTmp = m.id.startsWith("tmp-");
            const isFailed = failed.has(m.id);
            const reactions = Object.entries(m.reactions);
            return (
              <div key={m.id}>
                {sep ? <div className="chat-date">{sep}</div> : null}
                <div
                  className={cx("chat-msg", "live-msg")}
                  data-role={mine ? "user" : "model"}
                  data-pending={isTmp && !isFailed ? true : undefined}
                  data-failed={isFailed || undefined}
                >
                  <div className="live-bubble-wrap">
                    {m.deletedAt ? (
                      <p className="chat-bubble chat-deleted">این پیام حذف شد</p>
                    ) : (
                      <p className="chat-bubble">{m.body}</p>
                    )}

                    {!m.deletedAt && !isTmp ? (
                      <span className="live-actions">
                        <button
                          type="button"
                          className="live-act"
                          onClick={() => setPickerFor(pickerFor === m.id ? null : m.id)}
                          aria-label="واکنش"
                        >
                          <SmileIcon />
                        </button>
                      </span>
                    ) : null}

                    {pickerFor === m.id ? (
                      <span className="emoji-picker" role="menu">
                        {REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => void react(m.id, emoji)}
                            aria-label={`واکنش ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </span>
                    ) : null}
                  </div>

                  {reactions.length ? (
                    <span className="reaction-row">
                      {reactions.map(([emoji, list]) => (
                        <button
                          key={emoji}
                          type="button"
                          className="reaction-chip"
                          data-mine={list.includes("visitor") || undefined}
                          onClick={() => void react(m.id, emoji)}
                          aria-label={`${emoji} (${list.length})`}
                        >
                          {emoji}
                          {list.length > 1 ? <i>{toFa(list.length)}</i> : null}
                        </button>
                      ))}
                    </span>
                  ) : null}

                  {isFailed ? (
                    <button
                      type="button"
                      className="live-retry"
                      onClick={() => void sendText(m.body, m.id)}
                    >
                      ارسال نشد — تلاش دوباره
                    </button>
                  ) : (
                    <span className="chat-time">
                      {isTmp ? "در حال ارسال…" : time(m.createdAt)}
                      {m.editedAt && !m.deletedAt ? " · ویرایش‌شده" : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {adminTyping ? (
            <div className="chat-msg" data-role="model">
              <p className="chat-bubble chat-typing" aria-label="تیم در حال نوشتن">
                <i />
                <i />
                <i />
              </p>
            </div>
          ) : null}
        </div>

        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            void sendText(draft);
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              pingTyping();
            }}
            placeholder="پیامت را بنویس…"
            aria-label="پیام به تیم"
            maxLength={MAX_BODY}
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
      <p className="widget-foot">آنیما — گفتگوی زنده با تیم آموزشگاه</p>
    </>
  );
}