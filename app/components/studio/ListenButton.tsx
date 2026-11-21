"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Instrument } from "@/app/data";
import { audio, audioSupported, bow, midiToFreq, now, strike, type NoteHandle } from "@/lib/audio/engine";
import { PlayIcon, StopIcon } from "./icons";

const PIANO_MOTIF = [64, 63, 64, 63, 64, 59, 62, 60, 57];
const VIOLIN_MOTIF = [69, 71, 72, 76];

export function ListenButton({ instrument }: { instrument: Instrument }) {
  const supported = useSyncExternalStore(() => () => {}, audioSupported, () => true);
  const [playing, setPlaying] = useState(false);
  const timers = useRef<number[]>([]);
  const handles = useRef<NoteHandle[]>([]);

  const halt = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
    const at = now();
    for (const handle of handles.current) handle.stop(at);
    handles.current = [];
    setPlaying(false);
  }, []);

  useEffect(() => halt, [halt]);

  const play = () => {
    const ac = audio();
    if (!ac) return;
    halt();
    const start = ac.currentTime + 0.06;
    let end = start;

    if (instrument === "piano") {
      PIANO_MOTIF.forEach((midi, i) => {
        const when = start + i * 0.27;
        const handle = strike({
          freq: midiToFreq(midi),
          when,
          dur: 1.5,
          gain: 0.5,
          voice: "grand",
          room: 0.6,
        });
        if (handle) handles.current.push(handle);
        end = when + 1.3;
      });
    } else {
      VIOLIN_MOTIF.forEach((midi, i) => {
        const when = start + i * 0.8;
        const dur = i === VIOLIN_MOTIF.length - 1 ? 2.2 : 1.1;
        const handle = bow({
          freq: midiToFreq(midi),
          when,
          dur,
          gain: 0.42,
          vibrato: 0.5,
          room: 0.7,
        });
        if (handle) handles.current.push(handle);
        end = when + dur;
      });
    }

    setPlaying(true);
    timers.current.push(
      window.setTimeout(() => {
        handles.current = [];
        setPlaying(false);
      }, Math.max(0, (end - now()) * 1000)),
    );
  };

  if (!supported) {
    return <span className="deck-note">مرورگر صدا ندارد.</span>;
  }

  return (
    <span className="listen">
      <button
        type="button"
        className="chip-btn"
        data-on={playing || undefined}
        onClick={playing ? halt : play}
      >
        {playing ? <StopIcon /> : <PlayIcon />}
        {playing ? "توقف" : "صدایش را بشنو"}
      </button>
    </span>
  );
}