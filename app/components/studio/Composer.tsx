"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  eventKinds,
  lessonTimes,
  levels,
  telegramHref,
  telegramPending,
  type Instrument,
} from "@/app/data";
import { toFa } from "@/lib/utils";
import { copyText } from "@/lib/clipboard";
import { TelegramIcon } from "@/app/components/Art";
import { CheckIcon, CopyIcon, ResetIcon, SendIcon } from "./icons";

type Intent = "lesson" | "event";
type Choice = Instrument | "unsure";

const INSTRUMENTS: { id: Choice; label: string }[] = [
  { id: "piano", label: "پیانو" },
  { id: "violin", label: "ویولن" },
  { id: "unsure", label: "هنوز نمی‌دانم" },
];

const NAME: Record<Choice, string> = {
  piano: "پیانو",
  violin: "ویولن",
  unsure: "هنوز انتخاب نکرده‌ام",
};

export function Composer({ id = "composer" }: { id?: string }) {
  const params = useSearchParams();
  const [intent, setIntent] = useState<Intent>(
    params.get("intent") === "event" ? "event" : "lesson",
  );
  const [instrument, setInstrument] = useState<Choice>(() => {
    const v = params.get("instrument");
    return v === "piano" || v === "violin" ? v : "unsure";
  });
  const [level, setLevel] = useState(levels[0].id);
  const [time, setTime] = useState("");
  const [kind, setKind] = useState("");
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const lines: string[] = [];
  if (intent === "lesson") {
    lines.push(
      instrument === "unsure"
        ? "سلام. می‌خواهم کلاس را شروع کنم ولی هنوز سازم را انتخاب نکرده‌ام."
        : `سلام. می‌خواهم کلاس ${NAME[instrument]} را شروع کنم.`,
    );
    lines.push(`ساز: ${NAME[instrument]}`);
    lines.push(`سطح: ${levels.find((l) => l.id === level)?.label ?? ""}`);
    if (time) lines.push(`وقت مناسب: ${time}`);
  } else {
    lines.push("سلام. برای یک مراسم نوازنده می‌خواهم.");
    lines.push(`ساز: ${NAME[instrument]}`);
    if (kind) lines.push(`نوع مراسم: ${kind}`);
    if (date) lines.push(`تاریخ: ${date}`);
  }
  if (name.trim()) lines.push(`نام: ${name.trim()}`);
  if (note.trim()) lines.push(note.trim());
  const message = lines.join("\n");

  const copy = useCallback(async () => {
    const ok = await copyText(message);
    setCopied(ok ? "ok" : "fail");
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopied("idle"), 2600);
  }, [message]);

  const clear = () => {
    setIntent("lesson");
    setInstrument("unsure");
    setLevel(levels[0].id);
    setTime("");
    setKind("");
    setDate("");
    setName("");
    setNote("");
    setCopied("idle");
  };

  const chipTone = intent === "event" ? "var(--glow-velvet)" : "var(--glow-steel)";

  return (
    <div className="compose" id={id} style={{ "--tone": chipTone } as CSSProperties}>
      <div className="compose-form">
        <div className="compose-field">
          <span className="compose-label" id={`${id}-intent`}>
            چه می‌خواهی؟
          </span>
          <div className="compose-chips" role="group" aria-labelledby={`${id}-intent`}>
            <button
              type="button"
              className="compose-chip"
              aria-pressed={intent === "lesson"}
              onClick={() => setIntent("lesson")}
            >
              کلاس می‌خواهم
            </button>
            <button
              type="button"
              className="compose-chip"
              aria-pressed={intent === "event"}
              onClick={() => setIntent("event")}
            >
              نوازنده برای مراسم
            </button>
          </div>
        </div>

        <div className="compose-field">
          <span className="compose-label" id={`${id}-inst`}>
            ساز
          </span>
          <div className="compose-chips" role="group" aria-labelledby={`${id}-inst`}>
            {INSTRUMENTS.map((i) => (
              <button
                key={i.id}
                type="button"
                className="compose-chip"
                aria-pressed={instrument === i.id}
                onClick={() => setInstrument(i.id)}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>

        {intent === "lesson" ? (
          <>
            <div className="compose-field">
              <span className="compose-label" id={`${id}-level`}>
                کجای راهی؟
              </span>
              <div className="compose-chips" role="group" aria-labelledby={`${id}-level`}>
                {levels.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className="compose-chip"
                    aria-pressed={level === l.id}
                    onClick={() => setLevel(l.id)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="compose-field">
              <span className="compose-label" id={`${id}-time`}>
                چه وقتی برایت مناسب است؟ <small>اختیاری</small>
              </span>
              <div className="compose-chips" role="group" aria-labelledby={`${id}-time`}>
                {lessonTimes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="compose-chip"
                    aria-pressed={time === t}
                    onClick={() => setTime((cur) => (cur === t ? "" : t))}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="compose-field">
              <span className="compose-label" id={`${id}-kind`}>
                چه مراسمی؟ <small>اختیاری</small>
              </span>
              <div className="compose-chips" role="group" aria-labelledby={`${id}-kind`}>
                {eventKinds.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="compose-chip"
                    aria-pressed={kind === k}
                    onClick={() => setKind((cur) => (cur === k ? "" : k))}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div className="compose-field">
              <label className="compose-label" htmlFor={`${id}-date`}>
                تاریخ مراسم <small>اختیاری</small>
              </label>
              <input
                id={`${id}-date`}
                className="compose-input"
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="مثلاً جمعه ۲۳ آبان، ساعت ۷ عصر"
                maxLength={80}
              />
            </div>
          </>
        )}

        <div className="compose-field">
          <label className="compose-label" htmlFor={`${id}-name`}>
            اسمت <small>اختیاری</small>
          </label>
          <input
            id={`${id}-name`}
            className="compose-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="هر چه دوست داری صدایت کنیم"
            maxLength={60}
          />
        </div>

        <div className="compose-field">
          <label className="compose-label" htmlFor={`${id}-note`}>
            چیز دیگری هست؟ <small>اختیاری</small>
          </label>
          <textarea
            id={`${id}-note`}
            className="compose-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              intent === "lesson"
                ? "مثلاً: قبلاً گیتار زده‌ام، یا این قطعه را دوست دارم…"
                : "مثلاً: سالن کوچک است، یک ساعت اجرا می‌خواهیم…"
            }
            maxLength={600}
          />
        </div>
      </div>

      <div className="compose-preview">
        <div className="compose-bubble-head">
          <b>
            <SendIcon />
            پیش‌نمایش پیام
          </b>
          <span>{toFa(message.length)} نویسه</span>
        </div>
        <textarea
          className="compose-bubble"
          readOnly
          rows={Math.max(6, lines.length + 1)}
          value={message}
          aria-label="متن پیام، فقط خواندنی"
        />

        <div className="compose-actions">
          <button type="button" className="btn btn-primary" onClick={copy}>
            {copied === "ok" ? <CheckIcon /> : <CopyIcon />}
            {copied === "ok" ? "کپی شد" : "کپی پیام"}
          </button>
          <a
            className="btn btn-ghost"
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            <TelegramIcon />
            باز کردن تلگرام
          </a>
          <button type="button" className="chip-btn" onClick={clear}>
            <ResetIcon />
            پاک کردن
          </button>
        </div>

        <p className="compose-hint" role="status">
          {copied === "ok"
            ? "متن در حافظه کپی شد. در تلگرام پیست کن و بفرست."
            : copied === "fail"
              ? "کپی خودکار نشد. متن بالا را انتخاب و دستی کپی کن."
              : "این فرم چیزی را جایی نمی‌فرستد؛ فقط پیام را برایت می‌سازد تا خودت در تلگرام بفرستی."}
        </p>

        {telegramPending && (
          <p className="pending">
            نام کاربری تلگرام به‌زودی اضافه می‌شود. تا آن موقع پیام را کپی کن.
          </p>
        )}

        <p className="compose-hint">
          ترجیح می‌دهی اول سازها را ببینی؟{" "}
          <Link className="text-link" href="/instruments">
            صفحه‌ی سازها
          </Link>
        </p>
      </div>
    </div>
  );
}