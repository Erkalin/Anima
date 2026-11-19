"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { levels, type Instrument } from "@/app/data";
import { copyText } from "@/lib/clipboard";
import { toFa } from "@/lib/utils";
import { CheckIcon, CopyIcon, MetroIcon, ResetIcon, ShuffleIcon } from "./icons";

type Focus = "tone" | "reading" | "piece";
type BlockId = "warm" | "tech" | "read" | "piece" | "ear";

const BLOCKS: Record<Instrument, { id: BlockId; name: string; tone: string; hint: string }[]> = {
  piano: [
    { id: "warm", name: "گرم‌کردن دست", tone: "var(--glow-steel)", hint: "پنج‌انگشتی آرام، بدون فشار" },
    { id: "tech", name: "تمرین تکنیک", tone: "var(--glow-brass)", hint: "گام و آکورد، آرام و درست" },
    { id: "read", name: "نُت‌خوانی", tone: "var(--glow-rosin)", hint: "چند میزان جدید، با صدای بلند شمردن" },
    { id: "piece", name: "قطعه‌ی دلخواه", tone: "var(--glow-copper)", hint: "تکه‌ای کوچک، بارها تکرار" },
    { id: "ear", name: "گوش دادن", tone: "var(--glow-velvet)", hint: "یک ضبط خوب، بعد تکرار با گوش" },
  ],
  violin: [
    { id: "warm", name: "کوک و صداسازی", tone: "var(--glow-steel)", hint: "سیم باز، آرشه‌ی صاف و بلند" },
    { id: "tech", name: "آرشه و انگشت", tone: "var(--glow-brass)", hint: "یک تمرین کوتاه برای دست راست" },
    { id: "read", name: "نُت‌خوانی", tone: "var(--glow-rosin)", hint: "چند میزان جدید، آرام" },
    { id: "piece", name: "قطعه‌ی دلخواه", tone: "var(--glow-copper)", hint: "یک جمله، نه کل قطعه" },
    { id: "ear", name: "گوش دادن", tone: "var(--glow-velvet)", hint: "گوش دادن به جمله، بعد تکرار" },
  ],
};

const FOCUSES: { id: Focus; label: string }[] = [
  { id: "tone", label: "صداسازی" },
  { id: "reading", label: "نُت‌خوانی" },
  { id: "piece", label: "قطعه" },
];

const BASE: Record<BlockId, number> = { warm: 0.15, tech: 0.25, read: 0.2, piece: 0.3, ear: 0.1 };

const LEVEL_SHIFT: Record<string, Partial<Record<BlockId, number>>> = {
  new: { read: 0.08, tech: 0.05, piece: -0.1, ear: -0.03 },
  return: { warm: 0.05, tech: 0.03, piece: -0.08 },
  continue: { piece: 0.1, read: -0.05, tech: -0.05 },
};

const FOCUS_SHIFT: Record<Focus, Partial<Record<BlockId, number>>> = {
  tone: { tech: 0.12, piece: -0.08, read: -0.04 },
  reading: { read: 0.14, piece: -0.1, ear: -0.04 },
  piece: { piece: 0.15, tech: -0.07, read: -0.08 },
};

const DEFAULTS = {
  minutes: 20,
  days: 5,
  instrument: "piano" as Instrument,
  level: levels[0].id,
  focus: "piece" as Focus,
  warmup: true,
  metronome: true,
};

export function PracticePlan({ id = "plan" }: { id?: string }) {
  const [minutes, setMinutes] = useState(DEFAULTS.minutes);
  const [days, setDays] = useState(DEFAULTS.days);
  const [instrument, setInstrument] = useState<Instrument>(DEFAULTS.instrument);
  const [level, setLevel] = useState(DEFAULTS.level);
  const [focus, setFocus] = useState<Focus>(DEFAULTS.focus);
  const [warmup, setWarmup] = useState(DEFAULTS.warmup);
  const [metronome, setMetronome] = useState(DEFAULTS.metronome);
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const plan = useMemo(() => {
    const weights = BLOCKS[instrument].map((block) => {
      let w = BASE[block.id];
      w += LEVEL_SHIFT[level]?.[block.id] ?? 0;
      w += FOCUS_SHIFT[focus][block.id] ?? 0;
      if (metronome) w += block.id === "tech" ? 0.04 : block.id === "piece" ? -0.04 : 0;
      if (!warmup && block.id === "warm") w = 0;
      return { ...block, w: Math.max(0, w) };
    });
    const sum = weights.reduce((a, b) => a + b.w, 0);
    const rows = weights.map((b) => ({ ...b, minutes: Math.round((b.w / sum) * minutes) }));
    const drift = minutes - rows.reduce((a, b) => a + b.minutes, 0);
    if (drift !== 0) {
      const biggest = rows.reduce((a, b) => (b.minutes > a.minutes ? b : a));
      biggest.minutes += drift;
    }
    return rows.filter((r) => r.minutes > 0);
  }, [instrument, level, focus, metronome, warmup, minutes]);

  const weekly = minutes * days;
  const levelLabel = levels.find((l) => l.id === level)?.label ?? "";

  const planText = [
    `برنامه‌ی تمرین ${instrument === "piano" ? "پیانو" : "ویولن"}`,
    `${toFa(minutes)} دقیقه در روز، ${toFa(days)} روز در هفته (${toFa(weekly)} دقیقه در هفته)`,
    `سطح: ${levelLabel}`,
    ...plan.map((row) => `${row.name}: ${toFa(row.minutes)} دقیقه`),
    metronome ? "تمرین تکنیک با مترونوم." : "این هفته بدون مترونوم، آزاد.",
  ].join("\n");

  const copy = useCallback(async () => {
    const ok = await copyText(planText);
    setCopied(ok ? "ok" : "fail");
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied("idle"), 2600);
  }, [planText]);

  const reset = () => {
    setMinutes(DEFAULTS.minutes);
    setDays(DEFAULTS.days);
    setInstrument(DEFAULTS.instrument);
    setLevel(DEFAULTS.level);
    setFocus(DEFAULTS.focus);
    setWarmup(DEFAULTS.warmup);
    setMetronome(DEFAULTS.metronome);
    setCopied("idle");
  };

  const shuffle = () => {
    const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
    setMinutes(pick([15, 20, 25, 30, 40, 45]));
    setDays(pick([3, 4, 5, 6, 7]));
    setInstrument(pick(["piano", "violin"] as Instrument[]));
    setLevel(pick(levels).id);
    setFocus(pick(FOCUSES).id);
    setWarmup(Math.random() > 0.25);
    setMetronome(Math.random() > 0.35);
  };

  return (
    <div className="plan-shell" id={id}>
      <div className="plan-stage">
        <div className="plan-head">
          <p className="deck-title">
            <MetroIcon />
            برنامه‌ی تمرین هفته
          </p>
          <p className="plan-total" role="status">
            <b>{toFa(weekly)}</b>
            <span>دقیقه در هفته</span>
          </p>
        </div>

        <div className="plan-bar" aria-hidden="true">
          {plan.map((row) => (
            <span
              key={row.id}
              style={{ "--tone": row.tone, flexGrow: row.minutes } as CSSProperties}
            />
          ))}
        </div>

        <ul className="plan-list">
          {plan.map((row) => (
            <li key={row.id} style={{ "--tone": row.tone } as CSSProperties}>
              <span className="plan-min">{toFa(row.minutes)}</span>
              <span className="plan-copy">
                <b>{row.name}</b>
                <small>{row.hint}</small>
              </span>
            </li>
          ))}
        </ul>

        <p className="deck-note" style={{ paddingInline: 0, paddingTop: "0.9rem" }}>
          {metronome
            ? "تمرین تکنیک را با مترونوم بزن؛ سرعت را آن‌قدر کم کن که هیچ نُتی غلط نشود."
            : "این هفته بدون مترونوم است؛ روی صدای تمیز و جمله‌بندی تمرکز کن."}
        </p>
      </div>

      <div className="deck-console">
        <div className="console-field">
          <label className="console-label" htmlFor={`${id}-min`}>
            دقیقه در روز <b>{toFa(minutes)}</b>
          </label>
          <input
            id={`${id}-min`}
            className="slider"
            type="range"
            min={10}
            max={90}
            step={5}
            value={minutes}
            style={{ "--fill": `${((minutes - 10) / 80) * 100}%`, "--tone": "var(--glow-brass)" } as CSSProperties}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </div>

        <div className="console-field">
          <span className="console-label" id={`${id}-days`}>
            روز در هفته
          </span>
          <div className="stepper" role="group" aria-labelledby={`${id}-days`}>
            <button
              type="button"
              onClick={() => setDays((d) => Math.max(3, d - 1))}
              disabled={days <= 3}
              aria-label="یک روز کمتر"
            >
              −
            </button>
            <output>{toFa(days)}</output>
            <button
              type="button"
              onClick={() => setDays((d) => Math.min(7, d + 1))}
              disabled={days >= 7}
              aria-label="یک روز بیشتر"
            >
              +
            </button>
          </div>
        </div>

        <div className="console-field">
          <span className="console-label" id={`${id}-inst`}>
            ساز
          </span>
          <div className="deck-seg" role="group" aria-labelledby={`${id}-inst`}>
            <button type="button" aria-pressed={instrument === "piano"} onClick={() => setInstrument("piano")}>
              پیانو
            </button>
            <button type="button" aria-pressed={instrument === "violin"} onClick={() => setInstrument("violin")}>
              ویولن
            </button>
          </div>
        </div>

        <div className="console-field">
          <label className="console-label" htmlFor={`${id}-level`}>
            سطح
          </label>
          <select
            id={`${id}-level`}
            className="console-select"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="console-field">
          <span className="console-label" id={`${id}-focus`}>
            تمرکز این هفته
          </span>
          <div className="deck-seg" role="group" aria-labelledby={`${id}-focus`}>
            {FOCUSES.map((f) => (
              <button key={f.id} type="button" aria-pressed={focus === f.id} onClick={() => setFocus(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="console-field">
          <span className="console-label">شرایط تمرین</span>
          <div className="toggle-pair">
            <button type="button" className="toggle" aria-pressed={warmup} onClick={() => setWarmup((v) => !v)}>
              <span className="toggle-track" aria-hidden="true" />
              {warmup ? "با گرم‌کردن" : "بدون گرم‌کردن"}
            </button>
            <button type="button" className="toggle" aria-pressed={metronome} onClick={() => setMetronome((v) => !v)}>
              <span className="toggle-track" aria-hidden="true" />
              {metronome ? "با مترونوم" : "بدون مترونوم"}
            </button>
          </div>
        </div>

        <div className="console-field" data-wide="true">
          <span className="console-label">برنامه</span>
          <div className="deck-actions">
            <button type="button" className="chip-btn" onClick={copy}>
              {copied === "ok" ? <CheckIcon /> : <CopyIcon />}
              {copied === "ok" ? "کپی شد" : "کپی برنامه"}
            </button>
            <button type="button" className="chip-btn" onClick={shuffle}>
              <ShuffleIcon />
              نمونه‌ی تصادفی
            </button>
            <button type="button" className="chip-btn" onClick={reset}>
              <ResetIcon />
              بازنشانی
            </button>
            <Link className="chip-btn" href="/instruments#desk">
              مترونوم را باز کن
            </Link>
          </div>
        </div>
      </div>

      <p className="deck-note" role="status">
        {copied === "ok"
          ? "برنامه کپی شد؛ می‌توانی در پیام تلگرام بچسبانی."
          : copied === "fail"
            ? "کپی نشد. متن برنامه را از همین‌جا انتخاب کن و دستی کپی کن."
            : "این یک پیشنهاد است، نه قانون. سر جلسه با هم تنظیمش می‌کنیم."}
      </p>
    </div>
  );
}