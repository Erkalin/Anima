"use client";

// Advanced admin inbox: conversation list (search / unread / archive filters)
// plus a live thread pane with edit, delete (either side), reactions, typing
// presence and archive/remove controls. Polls the session-guarded inbox API.

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ChatConversation, ChatMessage } from "@/lib/chat/types";
import { MAX_BODY, MAX_NAME, REACTION_EMOJIS } from "@/lib/chat/types";
import { isMuted, midiToFreq, strike } from "@/lib/audio/engine";
import { faDate, faRelative, toFa } from "@/lib/utils";
import { Icon } from "./Icons";
import { Modal } from "./ui";

type Filter = "all" | "unread" | "archived";

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
  strike({ freq: midiToFreq(81), dur: 0.45, gain: 0.08, room: 0.25 });
}

async function api(payload: Record<string, unknown>) {
  const res = await fetch("/api/admin/inbox", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

export function Inbox() {
  const router = useRouter();
  const [convs, setConvs] = useState<ChatConversation[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [visitorOnline, setVisitorOnline] = useState(false);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [confirmMsgFor, setConfirmMsgFor] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");

  const msgsRef = useRef<ChatMessage[]>([]);
  const sinceRef = useRef<string | null>(null);
  const firstPoll = useRef(true);
  const nearBottom = useRef(true);
  const lastTyping = useRef(0);
  const typingTimer = useRef<number | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = convs.find((c) => c.id === selectedId) ?? null;

  const commit = useCallback((next: ChatMessage[]) => {
    msgsRef.current = next;
    setMsgs(next);
  }, []);

  const applyIncoming = useCallback(
    (incoming: ChatMessage[]) => {
      if (!incoming.length) return;
      const map = new Map(msgsRef.current.map((m) => [m.id, m]));
      for (const m of incoming) map.set(m.id, m);
      commit([...map.values()].sort(byCreated).slice(-300));
    },
    [commit],
  );

  // ---- conversation list polling ---------------------------------------
  useEffect(() => {
    let stop = false;
    async function tick() {
      try {
        const res = await fetch("/api/admin/inbox");
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const d = await res.json();
        if (stop) return;
        setConvs(d.conversations ?? []);
        setUnread(Number(d.unread) || 0);
        setLoaded(true);
      } catch {
        /* retry next tick */
      }
    }
    void tick();
    const t = window.setInterval(tick, 5000);
    return () => {
      stop = true;
      window.clearInterval(t);
    };
  }, [router]);

  // ---- thread polling ----------------------------------------------------
  // Reset happens in selectConversation (event handler); the effect only
  // subscribes to the poll loop.
  useEffect(() => {
    if (!selectedId) return;
    let stop = false;
    async function tick() {
      try {
        const since = sinceRef.current;
        const res = await fetch(
          `/api/admin/inbox?conversation=${selectedId}${since ? `&since=${encodeURIComponent(since)}` : ""}`,
        );
        const d = await res.json();
        if (stop || !res.ok) return;
        sinceRef.current = d.serverNow;
        setVisitorOnline(Boolean(d.visitorOnline));
        setVisitorTyping(Boolean(d.visitorTyping));
        const freshVisitor = (d.messages as ChatMessage[]).filter(
          (m) =>
            m.sender === "visitor" &&
            !msgsRef.current.some((p) => p.id === m.id),
        );
        applyIncoming(d.messages);
        if (freshVisitor.length && !firstPoll.current) pop();
        firstPoll.current = false;
      } catch {
        /* retry next tick */
      }
    }
    void tick();
    const t = window.setInterval(tick, 2000);
    return () => {
      stop = true;
      window.clearInterval(t);
    };
  }, [selectedId, applyIncoming, commit]);

  // ---- autoscroll --------------------------------------------------------
  useEffect(() => {
    const el = scrollRef.current;
    if (el && nearBottom.current) el.scrollTo({ top: el.scrollHeight });
  }, [msgs, visitorTyping]);

  // ---- typing pings ------------------------------------------------------
  const pingTyping = useCallback(() => {
    if (!selectedId) return;
    const now = Date.now();
    if (now - lastTyping.current > 1500) {
      lastTyping.current = now;
      void api({ action: "typing", conversation: selectedId, on: true }).catch(() => {});
    }
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      void api({ action: "typing", conversation: selectedId, on: false }).catch(() => {});
    }, 3000);
  }, [selectedId]);

  useEffect(() => () => window.clearTimeout(typingTimer.current), []);

  // ---- actions -----------------------------------------------------------
  function selectConversation(id: string) {
    setSelectedId(id);
    commit([]);
    sinceRef.current = null;
    firstPoll.current = true;
    setVisitorOnline(false);
    setVisitorTyping(false);
    setEditingId(null);
    setPickerFor(null);
    setConfirmMsgFor(null);
    setRenaming(false);
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim().slice(0, MAX_BODY);
    if (!text || !selectedId || busy) return;
    setDraft("");
    setBusy(true);
    window.clearTimeout(typingTimer.current);
    void api({ action: "typing", conversation: selectedId, on: false }).catch(() => {});
    try {
      const { ok, data } = await api({ action: "send", conversation: selectedId, body: text });
      if (ok && data.message) applyIncoming([data.message]);
    } catch {
      setDraft(text);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  async function saveEdit(id: string) {
    const text = editDraft.trim().slice(0, MAX_BODY);
    if (!text) return;
    const { ok, data } = await api({ action: "edit", id, body: text }).catch(() => ({ ok: false, data: {} as Record<string, never> }));
    if (ok && data.message) {
      applyIncoming([data.message]);
      setConvs((prev) =>
        prev.map((c) =>
          c.id === data.message.conversationId && c.lastMessageAt === data.message.createdAt
            ? { ...c, lastPreview: text.replace(/\s+/g, " ").trim().slice(0, 90) }
            : c,
        ),
      );
      setEditingId(null);
    }
  }

  async function removeMessage(id: string) {
    setConfirmMsgFor(null);
    const { ok, data } = await api({ action: "delete", id }).catch(() => ({ ok: false, data: {} as Record<string, never> }));
    if (ok && data.message) {
      applyIncoming([data.message]);
      setConvs((prev) =>
        prev.map((c) =>
          c.id === data.message.conversationId && c.lastMessageAt === data.message.createdAt
            ? { ...c, lastPreview: "این پیام حذف شد" }
            : c,
        ),
      );
    }
  }

  async function saveRename(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const name = renameDraft.replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
    if (!name) return;
    const { ok, data } = await api({ action: "rename", conversation: selected.id, name }).catch(() => ({ ok: false, data: {} as Record<string, never> }));
    if (ok && data.conversation) {
      setConvs((prev) =>
        prev.map((c) => (c.id === selected.id ? { ...c, visitorName: data.conversation.visitorName } : c)),
      );
      setRenaming(false);
    }
  }

  async function react(id: string, emoji: string) {
    setPickerFor(null);
    const { ok, data } = await api({ action: "react", id, emoji }).catch(() => ({ ok: false, data: {} as Record<string, never> }));
    if (ok && data.message) applyIncoming([data.message]);
  }

  async function toggleArchive() {
    if (!selected) return;
    await api({ action: "archive", conversation: selected.id, on: !selected.archived }).catch(() => {});
    setConvs((prev) =>
      prev.map((c) => (c.id === selected.id ? { ...c, archived: !c.archived } : c)),
    );
  }

  async function removeConversation() {
    if (!selected) return;
    setConfirmRemove(false);
    await api({ action: "remove", conversation: selected.id }).catch(() => {});
    setSelectedId(null);
    setConvs((prev) => prev.filter((c) => c.id !== selected.id));
  }

  // ---- derived list ------------------------------------------------------
  const q = search.trim().toLowerCase();
  const visible = convs.filter((c) => {
    if (filter === "unread" && (c.archived || c.unreadAdmin === 0)) return false;
    if (filter === "archived" && !c.archived) return false;
    if (filter === "all" && c.archived) return false;
    if (q && !`${c.visitorName} ${c.lastPreview}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="inbox" data-pane={selectedId ? "thread" : "list"}>
      <aside className="inbox-list">
        <div className="inbox-list-head">
          <label className="inbox-search">
            <Icon name="search" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی نام یا پیام…"
              aria-label="جستجو در گفتگوها"
            />
          </label>
          <div className="inbox-filters" role="tablist" aria-label="صافی گفتگوها">
            {(
              [
                ["all", "همه"],
                ["unread", "خوانده‌نشده"],
                ["archived", "بایگانی"],
              ] as [Filter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                className="inbox-filter"
                data-active={filter === key || undefined}
                onClick={() => setFilter(key)}
              >
                {label}
                {key === "unread" && unread > 0 ? <i>{toFa(unread)}</i> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="inbox-rows">
          {!loaded ? (
            <p className="inbox-note">در حال بارگذاری…</p>
          ) : visible.length === 0 ? (
            <div className="inbox-note inbox-note-big">
              <Icon name="inbox" />
              <p>
                {q
                  ? "چیزی مطابق جستجو نیست."
                  : filter === "unread"
                    ? "همهٔ پیام‌ها خوانده شده‌اند."
                    : filter === "archived"
                      ? "بایگانی خالی است."
                      : "هنوز گفتگویی شروع نشده است."}
              </p>
              {!q && filter === "all" ? (
                <span>دکمهٔ «گفتگوی زنده» در ویجت سایت، کاربران را به همین‌جا می‌آورد.</span>
              ) : null}
            </div>
          ) : (
            visible.map((c) => (
              <button
                key={c.id}
                type="button"
                className="inbox-row"
                data-active={c.id === selectedId || undefined}
                data-unread={c.unreadAdmin > 0 || undefined}
                onClick={() => selectConversation(c.id)}
              >
                <span className="inbox-avatar" aria-hidden="true">
                  {c.visitorName.trim().slice(0, 1) || "؟"}
                </span>
                <span className="inbox-row-text">
                  <span className="inbox-row-top">
                    <b>{c.visitorName}</b>
                    <time>{faRelative(c.lastMessageAt)}</time>
                  </span>
                  <span className="inbox-row-bottom">
                    <span className="inbox-preview">
                      {c.lastPreview || "بدون پیام"}
                    </span>
                    {c.unreadAdmin > 0 ? (
                      <i className="inbox-unread">{toFa(c.unreadAdmin)}</i>
                    ) : null}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="inbox-thread">
        {!selected ? (
          <div className="inbox-empty">
            <Icon name="inbox" />
            <p>یک گفتگو را انتخاب کن</p>
            <span>پیام‌های زندهٔ کاربران سایت اینجا می‌نشیند.</span>
          </div>
        ) : (
          <>
            <header className="inbox-thread-head">
              <button
                type="button"
                className="icon-btn inbox-back"
                onClick={() => setSelectedId(null)}
                aria-label="بازگشت به فهرست"
              >
                <Icon name="arrow" />
              </button>
              <span className="inbox-avatar" aria-hidden="true">
                {selected.visitorName.trim().slice(0, 1) || "؟"}
              </span>
              <div className="inbox-who">
                {renaming ? (
                  <form className="inbox-rename" onSubmit={saveRename}>
                    <input
                      type="text"
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      maxLength={MAX_NAME}
                      aria-label="نام تازهٔ کاربر"
                      autoFocus
                    />
                    <button type="submit" className="icon-btn" aria-label="ذخیرهٔ نام">
                      <Icon name="check" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setRenaming(false)}
                      aria-label="انصراف"
                    >
                      <Icon name="x" />
                    </button>
                  </form>
                ) : (
                  <div className="inbox-who-row">
                    <b>{selected.visitorName}</b>
                    <button
                      type="button"
                      className="icon-btn inbox-who-edit"
                      onClick={() => {
                        setRenameDraft(selected.visitorName);
                        setRenaming(true);
                      }}
                      title="ویرایش نام کاربر"
                      aria-label="ویرایش نام کاربر"
                    >
                      <Icon name="edit" />
                    </button>
                  </div>
                )}
                <span data-online={visitorOnline || undefined}>
                  {visitorTyping
                    ? "در حال نوشتن…"
                    : visitorOnline
                      ? "آنلاین"
                      : "آفلاین"}
                  {" · شروع "}
                  {faDate(selected.createdAt)}
                  {selected.archived ? " · بایگانی" : ""}
                </span>
              </div>
              <div className="inbox-thread-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => void toggleArchive()}
                  title={selected.archived ? "خروج از بایگانی" : "بایگانی گفتگو"}
                  aria-label={selected.archived ? "خروج از بایگانی" : "بایگانی گفتگو"}
                >
                  <Icon name="archive" />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setConfirmRemove(true)}
                  title="حذف گفتگو"
                  aria-label="حذف گفتگو"
                >
                  <Icon name="trash" />
                </button>
              </div>
            </header>

            <div
              className="inbox-messages"
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
                const mine = m.sender === "admin";
                const reactions = Object.entries(m.reactions);
                return (
                  <div key={m.id}>
                    {sep ? <div className="inbox-date">{sep}</div> : null}
                    <div className="inbox-msg" data-role={mine ? "admin" : "visitor"}>
                      <div className="inbox-bubble-wrap">
                        {m.deletedAt ? (
                          <p className="inbox-bubble inbox-deleted">این پیام حذف شد</p>
                        ) : editingId === m.id ? (
                          <form
                            className="inbox-edit"
                            onSubmit={(e) => {
                              e.preventDefault();
                              void saveEdit(m.id);
                            }}
                          >
                            <textarea
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              rows={2}
                              maxLength={MAX_BODY}
                              aria-label="ویرایش پیام"
                              autoFocus
                            />
                            <span>
                              <button type="submit" className="icon-btn" aria-label="ذخیره">
                                <Icon name="check" />
                              </button>
                              <button
                                type="button"
                                className="icon-btn"
                                onClick={() => setEditingId(null)}
                                aria-label="انصراف"
                              >
                                <Icon name="x" />
                              </button>
                            </span>
                          </form>
                        ) : (
                          <p className="inbox-bubble">{m.body}</p>
                        )}

                        {!m.deletedAt && editingId !== m.id ? (
                          <span className="inbox-msg-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => setPickerFor(pickerFor === m.id ? null : m.id)}
                              aria-label="واکنش"
                              title="واکنش"
                            >
                              <Icon name="smile" />
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => {
                                setEditingId(m.id);
                                setEditDraft(m.body);
                                setPickerFor(null);
                              }}
                              aria-label="ویرایش"
                              title="ویرایش"
                            >
                              <Icon name="edit" />
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => setConfirmMsgFor(m.id)}
                              aria-label="حذف"
                              title="حذف برای هر دو طرف"
                            >
                              <Icon name="trash" />
                            </button>
                          </span>
                        ) : null}

                        {pickerFor === m.id ? (
                          <span className="inbox-picker">
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
                        <span className="inbox-reactions">
                          {reactions.map(([emoji, list]) => (
                            <button
                              key={emoji}
                              type="button"
                              className="inbox-reaction"
                              data-mine={list.includes("admin") || undefined}
                              onClick={() => void react(m.id, emoji)}
                            >
                              {emoji}
                              {list.length > 1 ? <i>{toFa(list.length)}</i> : null}
                            </button>
                          ))}
                        </span>
                      ) : null}

                      <span className="inbox-time">
                        {time(m.createdAt)}
                        {m.editedAt && !m.deletedAt ? " · ویرایش‌شده" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
              {visitorTyping ? (
                <div className="inbox-msg" data-role="visitor">
                  <p className="inbox-bubble inbox-typing" aria-label="کاربر در حال نوشتن">
                    <i />
                    <i />
                    <i />
                  </p>
                </div>
              ) : null}
            </div>

            <form className="inbox-composer" onSubmit={send}>
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  pingTyping();
                }}
                placeholder={`پاسخ به ${selected.visitorName}…`}
                aria-label="پاسخ به کاربر"
                maxLength={MAX_BODY}
                disabled={busy}
              />
              <button
                type="submit"
                className="btn btn-brass inbox-send"
                disabled={busy || !draft.trim()}
              >
                <Icon name="send" /> ارسال
              </button>
            </form>
          </>
        )}
      </section>

      {confirmMsgFor ? (
        <Modal
          title="حذف پیام"
          sub="این پیام برای هر دو طرف حذف می‌شود و قابل بازگردانی نیست."
          onClose={() => setConfirmMsgFor(null)}
          size="narrow"
          foot={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmMsgFor(null)}
              >
                انصراف
              </button>
              <button
                type="button"
                className="btn btn-brass"
                onClick={() => void removeMessage(confirmMsgFor)}
              >
                <Icon name="trash" /> حذف پیام
              </button>
            </>
          }
        >
          <p>پیام حذف‌شده به شکل «این پیام حذف شد» در هر دو طرف دیده می‌شود.</p>
        </Modal>
      ) : null}

      {confirmRemove && selected ? (
        <Modal
          title="حذف گفتگو"
          sub={`گفتگو با «${selected.visitorName}» و همهٔ پیام‌هایش برای هر دو طرف حذف می‌شود.`}
          onClose={() => setConfirmRemove(false)}
          size="narrow"
          foot={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmRemove(false)}
              >
                انصراف
              </button>
              <button
                type="button"
                className="btn btn-brass"
                onClick={() => void removeConversation()}
              >
                <Icon name="trash" /> حذف گفتگو
              </button>
            </>
          }
        >
          <p>اگر فقط می‌خواهی از فهرست کنار برود، به‌جای حذف آن را بایگانی کن.</p>
        </Modal>
      ) : null}
    </div>
  );
}