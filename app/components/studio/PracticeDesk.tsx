"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { audio, now, tick } from "@/lib/audio/engine";
import { toFa } from "@/lib/utils";
import { useSound } from "./Sound";
import { MetroIcon, PlayIcon, ResetIcon, StopIcon } from "./icons";

const MARKS: [number, string][] = [
  [40, "Larghissimo"],
  [60, "Largo"],
  [66, "Larghetto"],
  [76, "Adagio"],
  [108, "Andante"],
  [120, "Moderato"],
  [156, "Allegro"],
  [176, "Vivace"],
  [200, "Presto"],
  [241, "Prestissimo"],
];

const METERS = [2, 3, 4, 5, 6, 7];
const DEFAULTS = { bpm: 96, meter: 4, accent: true, volume: 0.7 };

function tempoName(bpm: number): string {
  let name = MARKS[0][1];
  for (const [limit, label] of MARKS) if (bpm >= limit) name = label;
  return name;
}

export function PracticeDesk({ id = "desk" }: { id?: string }) {
  const { muted, supported } = useSound();
  const [bpm, setBpm] = useState(DEFAULTS.bpm);
  const [meter, setMeter] = useState(DEFAULTS.meter);
  const [accent, setAccent] = useState(DEFAULTS.accent);
  const [volume, setVolume] = useState(DEFAULTS.volume);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const [swing, setSwing] = useState(0);
  const [taps, setTaps] = useState(0);

  const cfg = useRef({ bpm, meter, accent, volume });
  cfg.current = { bpm, meter, accent, volume };
  const clock = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  const nextAt = useRef(0);
  const counter = useRef(0);
  const sign = useRef(1);
  const queue = useRef<{ beat: number; time: number }[]>([]);
  const tapLog = useRef<number[]>([]);

  const stop = useCallback(() => {
    if (clock.current !== null) window.clearInterval(clock.current);
    if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    clock.current = null;
    frame.current = null;
    queue.current = [];
    setRunning(false);
    setBeat(-1);
    setSwing(0);
  }, []);

  const start = useCallback(() => {
    const ac = audio();
    if (!ac) return;
    stop();
    counter.current = 0;
    sign.current = 1;
    nextAt.current = ac.currentTime + 0.08;
    clock.current = window.setInterval(() => {
      const c = cfg.current;
      const spb = 60 / c.bpm;
      while (nextAt.current < ac.currentTime + 0.12) {
        const b = counter.current % c.meter;
        tick(nextAt.current, c.accent && b === 0, c.volume);
        queue.current.push({ beat: b, time: nextAt.current });
        nextAt.current += spb;
        counter.current += 1;
      }
    }, 25);
    const drain = () => {
      const t = now();
      let hit = -1;
      while (queue.current.length && queue.current[0].time <= t) {
        hit = queue.current.shift()!.beat;
      }
      if (hit >= 0) {
        sign.current *= -1;
        setBeat(hit);
        setSwing(sign.current * 15);
      }
      frame.current = window.requestAnimationFrame(drain);
    };
    frame.current = window.requestAnimationFrame(drain);
    setRunning(true);
  }, [stop]);

  const tap = useCallback(() => {
    const t = performance.now();
    tapLog.current = [...tapLog.current.filter((x) => t - x < 3000), t].slice(-5);
    setTaps(tapLog.current.length);
    if (tapLog.current.length < 2) return;
    const gaps: number[] = [];
    for (let i = 1; i < tapLog.current.length; i += 1) {
      gaps.push(tapLog.current[i] - tapLog.current[i - 1]);
    }
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    setBpm(Math.min(240, Math.max(40, Math.round(60000 / avg))));
  }, []);

  const reset = useCallback(() => {
    stop();
    tapLog.current = [];
    setTaps(0);
    setBpm(DEFAULTS.bpm);
    setMeter(DEFAULTS.meter);
    setAccent(DEFAULTS.accent);
    setVolume(DEFAULTS.volume);
  }, [stop]);

  useEffect(() => stop, [stop]);

  const weight = 12 + ((bpm - 40) / 200) * 62;

  return (
    <div className="tempo-shell" id={id}>
      <div className="tempo-stage">
        <div className="tempo-body" aria-hidden="true">
          <div className="tempo-case" />
          <div className="tempo-scale" />
          <div className="tempo-arm" style={{ "--swing": `${swing}deg` } as CSSProperties}>
            <span className="tempo-weight" style={{ "--weight": `${weight}%` } as CSSProperties} />
          </div>
          <div className="tempo-pivot" />
        </div>
        <div className="tempo-beats" aria-hidden="true">
          {Array.from({ length: meter }, (_, i) => (
            <span
              key={i}
              className="tempo-beat"
              data-accent={(accent && i === 0) || undefined}
              data-on={beat === i || undefined}
            />
          ))}
        </div>
        <p className="sr-only" role="status">
          {running ? `ضرب ${toFa(beat + 1)} از ${toFa(meter)}` : "مترونوم خاموش است"}
        </p>
      </div>

      <div>
        <p className="deck-title">
          <MetroIcon />
          میز تمرین
        </p>
        <div className="tempo-readout">
          <span className="tempo-bpm">{toFa(bpm)}</span>
          <span className="tempo-unit">ضرب در دقیقه</span>
          <span className="tempo-mark">{tempoName(bpm)}</span>
        </div>

        <div className="tempo-controls">
          <div className="console-field">
            <label className="console-label" htmlFor={`${id}-bpm`}>
              تندی <b>{toFa(bpm)}</b>
            </label>
            <input
              id={`${id}-bpm`}
              className="slider"
              type="range"
              min={40}
              max={240}
              value={bpm}
              style={{ "--fill": `${((bpm - 40) / 200) * 100}%`, "--tone": "var(--glow-brass)" } as CSSProperties}
              onChange={(e) => setBpm(Number(e.target.value))}
            />
          </div>

          <div className="console-field">
            <span className="console-label" id={`${id}-step`}>
              گام پنج‌تایی
            </span>
            <div className="stepper" role="group" aria-labelledby={`${id}-step`}>
              <button
                type="button"
                onClick={() => setBpm((b) => Math.max(40, b - 5))}
                disabled={bpm <= 40}
                aria-label="پنج ضرب کندتر"
              >
                −
              </button>
              <output>{toFa(bpm)}</output>
              <button
                type="button"
                onClick={() => setBpm((b) => Math.min(240, b + 5))}
                disabled={bpm >= 240}
                aria-label="پنج ضرب تندتر"
              >
                +
              </button>
            </div>
          </div>

          <div className="console-field">
            <label className="console-label" htmlFor={`${id}-meter`}>
              ضرب در هر میزان
            </label>
            <select
              id={`${id}-meter`}
              className="console-select"
              value={meter}
              onChange={(e) => setMeter(Number(e.target.value))}
            >
              {METERS.map((m) => (
                <option key={m} value={m}>
                  {toFa(m)} ضربی
                </option>
              ))}
            </select>
          </div>

          <div className="console-field">
            <span className="console-label">تأکید</span>
            <button
              type="button"
              className="toggle"
              aria-pressed={accent}
              onClick={() => setAccent((a) => !a)}
            >
              <span className="toggle-track" aria-hidden="true" />
              {accent ? "ضرب اول بلندتر" : "همه یکسان"}
            </button>
          </div>

          <div className="console-field">
            <label className="console-label" htmlFor={`${id}-vol`}>
              بلندی تق‌تق <b>{toFa(Math.round(volume * 100))}٪</b>
            </label>
            <input
              id={`${id}-vol`}
              className="slider"
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              style={{ "--fill": `${volume * 100}%`, "--tone": "var(--glow-rosin)" } as CSSProperties}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
            />
          </div>

          <div className="console-field">
            <span className="console-label">
              با گوش <b>{taps > 1 ? `${toFa(taps)} ضربه` : "آماده"}</b>
            </span>
            <button type="button" className="chip-btn" onClick={tap}>
              ضربه بزن (Tap)
            </button>
          </div>
        </div>

        <div className="tempo-actions">
          <button
            type="button"
            className="tempo-play"
            data-running={running || undefined}
            onClick={() => (running ? stop() : start())}
          >
            {running ? <StopIcon /> : <PlayIcon />}
            {running ? "توقف" : "شروع"}
          </button>
          <button type="button" className="chip-btn" onClick={reset}>
            <ResetIcon />
            بازنشانی
          </button>
        </div>

        <p className="deck-note" style={{ paddingInline: 0, paddingTop: "0.8rem" }}>
          {!supported
            ? "این مرورگر صدا ندارد؛ بازو و چراغ‌ها همچنان حرکت می‌کنند."
            : muted
              ? "صدا خاموش است. از کلید صدا در بالای صفحه روشنش کن."
              : "وزنه که به سمت پایین می‌آید تندتر می‌شود؛ اسلایدر تندی همان کار را می‌کند. با «ضربه بزن» می‌توانی تندی قطعه‌ای را که می‌شنوی دربیآوری."}
        </p>
      </div>
    </div>
  );
}