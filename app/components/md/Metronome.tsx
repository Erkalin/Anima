"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toFa } from "@/lib/utils";

const TEMPO_MARKS: [number, string][] = [
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

function tempoName(bpm: number): string {
  for (const [limit, name] of TEMPO_MARKS) if (bpm < limit) return name;
  return "Prestissimo";
}

export function Metronome({
  bpm: initialBpm = 80,
  label,
}: {
  bpm?: number;
  label?: string;
}) {
  const [bpm, setBpm] = useState(Math.min(240, Math.max(30, initialBpm)));
  const [beats, setBeats] = useState(4);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const [volume, setVolume] = useState(0.6);
  const [muted, setMuted] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const nextTimeRef = useRef(0);
  const beatRef = useRef(0);
  const queueRef = useRef<{ beat: number; time: number }[]>([]);
  const bpmRef = useRef(bpm);
  const beatsRef = useRef(beats);
  const gainRef = useRef(volume);
  const mutedRef = useRef(muted);
  const tapsRef = useRef<number[]>([]);

  bpmRef.current = bpm;
  beatsRef.current = beats;
  gainRef.current = volume;
  mutedRef.current = muted;

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    queueRef.current = [];
    beatRef.current = 0;
    setRunning(false);
    setBeat(-1);
  }, []);

  useEffect(() => stop, [stop]);

  const click = useCallback((time: number, accent: boolean) => {
    const ctx = ctxRef.current;
    if (!ctx || mutedRef.current) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1560 : 1040;
    osc.type = "square";
    const peak = gainRef.current * (accent ? 0.34 : 0.2);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);
  }, []);

  const start = useCallback(async () => {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    if (!ctxRef.current) ctxRef.current = new Ctor();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") await ctx.resume();

    nextTimeRef.current = ctx.currentTime + 0.08;
    beatRef.current = 0;
    queueRef.current = [];
    setRunning(true);

    timerRef.current = window.setInterval(() => {
      const context = ctxRef.current;
      if (!context) return;
      while (nextTimeRef.current < context.currentTime + 0.12) {
        const index = beatRef.current % beatsRef.current;
        click(nextTimeRef.current, index === 0);
        queueRef.current.push({
          beat: index,
          time: nextTimeRef.current,
        });
        nextTimeRef.current += 60 / bpmRef.current;
        beatRef.current += 1;
      }
    }, 25);

    const tick = () => {
      const context = ctxRef.current;
      if (!context) return;
      const now = context.currentTime;
      let shown: number | null = null;
      while (queueRef.current.length && queueRef.current[0].time <= now) {
        shown = queueRef.current.shift()!.beat;
      }
      if (shown !== null) setBeat(shown);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [click]);

  const toggle = () => {
    if (running) stop();
    else void start();
  };

  const tap = () => {
    const now = performance.now();
    const taps = tapsRef.current.filter((t) => now - t < 3000);
    taps.push(now);
    tapsRef.current = taps.slice(-5);
    if (tapsRef.current.length >= 2) {
      const list = tapsRef.current;
      const gaps = list.slice(1).map((t, i) => t - list[i]);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      setBpm(Math.min(240, Math.max(30, Math.round(60000 / avg))));
    }
  };

  useEffect(() => {
    return () => {
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  const swing = `${(60 / bpm) * 2}s`;

  return (
    <div className="md-metro" data-running={running || undefined}>
      <div className="md-metro-head">
        <span className="md-metro-label">{label || "مترونوم"}</span>
        <span className="md-metro-tempo">{tempoName(bpm)}</span>
      </div>

      <div className="md-metro-stage">
        <div className="md-metro-arm" style={{ animationDuration: swing }}>
          <span className="md-metro-rod" />
          <span className="md-metro-weight" />
        </div>
        <div className="md-metro-beats" role="status" aria-live="off">
          {Array.from({ length: beats }, (_, i) => (
            <span
              key={i}
              className="md-metro-dot"
              data-accent={i === 0 || undefined}
              data-on={running && beat === i || undefined}
            />
          ))}
        </div>
      </div>

      <div className="md-metro-readout">
        <button
          type="button"
          className="md-metro-step"
          onClick={() => setBpm((b) => Math.max(30, b - 1))}
          aria-label="یک ضربه کمتر"
        >
          −
        </button>
        <span className="md-metro-bpm">
          {toFa(bpm)}
          <small>ضربه در دقیقه</small>
        </span>
        <button
          type="button"
          className="md-metro-step"
          onClick={() => setBpm((b) => Math.min(240, b + 1))}
          aria-label="یک ضربه بیشتر"
        >
          +
        </button>
      </div>

      <input
        className="md-metro-slider"
        type="range"
        min={30}
        max={240}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        aria-label="سرعت مترونوم"
        style={{ "--fill": `${((bpm - 30) / 210) * 100}%` } as React.CSSProperties}
      />

      <div className="md-metro-controls">
        <button type="button" className="md-metro-toggle" onClick={toggle}>
          {running ? "توقف" : "شروع"}
        </button>
        <button type="button" className="md-metro-tap" onClick={tap}>
          ضربه بزن
        </button>
        <label className="md-metro-field">
          <span>ضرب در میزان</span>
          <select
            value={beats}
            onChange={(e) => {
              setBeats(Number(e.target.value));
              beatRef.current = 0;
            }}
          >
            {[2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {toFa(n)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="md-metro-mute"
          onClick={() => setMuted((m) => !m)}
          aria-pressed={muted}
        >
          {muted ? "صدا خاموش" : "صدا روشن"}
        </button>
        <label className="md-metro-field md-metro-vol">
          <span>بلندی</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            aria-label="بلندی صدای مترونوم"
            style={{ "--fill": `${volume * 100}%` } as React.CSSProperties}
          />
        </label>
      </div>
    </div>
  );
}