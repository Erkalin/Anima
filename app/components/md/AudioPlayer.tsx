"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toFa } from "@/lib/utils";

function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "۰:۰۰";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return toFa(`${m}:${String(s).padStart(2, "0")}`);
}

const BARS = [0.35, 0.62, 0.48, 0.85, 0.55, 0.72, 0.4, 0.9, 0.58, 0.68, 0.44, 0.78];

export function AudioPlayer({
  src,
  title,
  artist,
  caption,
}: {
  src: string;
  title?: string;
  artist?: string;
  caption?: string;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onTime = () => setCurrent(el.currentTime);
    const onMeta = () => setDuration(el.duration || 0);
    const onEnd = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => {
      setFailed(true);
      setPlaying(false);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("ended", onEnd);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("error", onError);
    // Metadata can arrive before this effect runs, so seed from the element.
    if (el.readyState >= 1) setDuration(el.duration || 0);
    setCurrent(el.currentTime);
    if (el.error) setFailed(true);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("error", onError);
    };
  }, []);

  useEffect(() => {
    if (ref.current) ref.current.volume = volume;
  }, [volume]);

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      // An autoplay refusal is not a broken file; only a decode failure is.
      void el.play().catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "NotSupportedError") {
          setFailed(true);
        }
      });
    } else el.pause();
  }, []);

  const seek = (value: number) => {
    const el = ref.current;
    if (!el || !duration) return;
    el.currentTime = (value / 1000) * duration;
    setCurrent(el.currentTime);
  };

  const progress = duration ? (current / duration) * 1000 : 0;

  return (
    <figure className="md-audio" data-playing={playing || undefined}>
      <audio ref={ref} src={src} preload="metadata" />
      <div className="md-audio-row">
        <button
          type="button"
          className="md-audio-play"
          onClick={toggle}
          aria-label={playing ? "توقف پخش" : "پخش صدا"}
          aria-pressed={playing}
          disabled={failed}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          )}
        </button>

        <div className="md-audio-body">
          <div className="md-audio-meta">
            <span className="md-audio-title">{title || "فایل صوتی"}</span>
            {artist ? <span className="md-audio-artist">{artist}</span> : null}
          </div>

          <div className="md-audio-wave" aria-hidden="true">
            {BARS.map((h, i) => (
              <span
                key={i}
                style={{
                  height: `${h * 100}%`,
                  animationDelay: `${i * 0.07}s`,
                  opacity: progress / 1000 > i / BARS.length ? 1 : 0.32,
                }}
              />
            ))}
          </div>

          <input
            className="md-audio-seek"
            type="range"
            min={0}
            max={1000}
            value={Math.round(progress)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="جایگاه پخش"
            disabled={!duration || failed}
            style={{ "--fill": `${progress / 10}%` } as React.CSSProperties}
          />

          <div className="md-audio-times">
            <span>{clock(current)}</span>
            <span>{clock(duration)}</span>
          </div>
        </div>

        <label className="md-audio-vol">
          <span className="sr-only">بلندی صدا</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4z" />
            <path
              d="M16.5 8.5a5 5 0 010 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            aria-label="بلندی صدا"
            style={{ "--fill": `${volume * 100}%` } as React.CSSProperties}
          />
        </label>
      </div>

      {failed ? (
        <p className="md-audio-error">
          این فایل صوتی بارگذاری نشد.{" "}
          <a href={src} target="_blank" rel="noreferrer">
            دانلود مستقیم
          </a>
        </p>
      ) : null}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}