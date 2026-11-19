"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const ReadingCtx = createContext(0);
export const useReading = () => useContext(ReadingCtx);

export function ReadingProgress({
  targetId,
  children,
}: {
  targetId: string;
  children: ReactNode;
}) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const body = document.getElementById(targetId);
    if (!body) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = body.getBoundingClientRect();
      const view = window.innerHeight;
      const total = rect.height - view * 0.6;
      const done = view * 0.4 - rect.top;
      const next = total <= 0 ? 100 : (done / total) * 100;
      setPct(Math.max(0, Math.min(100, Math.round(next))));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetId]);

  return (
    <ReadingCtx value={pct}>
      <div
        className="read-progress"
        role="progressbar"
        aria-label="پیشرفتِ خواندن"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="read-progress-bar" style={{ width: `${pct}%` }} />
      </div>
      {children}
    </ReadingCtx>
  );
}