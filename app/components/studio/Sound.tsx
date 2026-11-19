"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isMuted, midiToFreq, setMuted, strike, watchMute } from "@/lib/audio/engine";

const STORE_KEY = "sepehr:muted";

type SoundState = {
  muted: boolean;
  supported: boolean;
  toggle: () => void;
};

const SoundContext = createContext<SoundState>({
  muted: false,
  supported: true,
  toggle: () => {},
});

export function useSound(): SoundState {
  return useContext(SoundContext);
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setLocal] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        Boolean(
          window.AudioContext ??
            (window as unknown as { webkitAudioContext?: unknown })
              .webkitAudioContext,
        ),
    );
    try {
      if (window.localStorage.getItem(STORE_KEY) === "1") {
        setMuted(true);
        setLocal(true);
      }
    } catch {
      /* private mode: the switch still works for this visit */
    }
    return watchMute(setLocal);
  }, []);

  const toggle = useCallback(() => {
    const next = !isMuted();
    setMuted(next);
    try {
      window.localStorage.setItem(STORE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
    // Unmuting confirms itself with one soft note, so the state is audible.
    if (!next) strike({ freq: midiToFreq(69), dur: 1.1, gain: 0.16, room: 0.4 });
  }, []);

  const value = useMemo(
    () => ({ muted, supported, toggle }),
    [muted, supported, toggle],
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function SoundToggle({ compact = false }: { compact?: boolean }) {
  const { muted, supported, toggle } = useSound();

  if (!supported) {
    return (
      <span className="sound-off-note" role="status">
        مرورگر صدا ندارد
      </span>
    );
  }

  return (
    <button
      type="button"
      className="sound-toggle"
      onClick={toggle}
      aria-pressed={!muted}
      data-muted={muted || undefined}
      title={muted ? "صدا خاموش است، روشن کن" : "صدا روشن است، خاموش کن"}
    >
      <span className="sound-bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="sound-text">
        {compact ? (muted ? "خاموش" : "روشن") : muted ? "صدا خاموش" : "صدا روشن"}
      </span>
    </button>
  );
}