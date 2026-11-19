"use client";

import Link from "next/link";
import { useCallback, useState, type CSSProperties } from "react";
import { chooserQuestions, instruments, type Instrument } from "@/app/data";
import { audio, bow, midiToFreq, strike } from "@/lib/audio/engine";
import { PianoKeys, ViolinArt } from "@/app/components/Art";
import { ArrowIcon, PlayIcon, ResetIcon } from "./icons";

const TONE: Record<Instrument, string> = {
  piano: "var(--glow-brass)",
  violin: "var(--glow-copper)",
};

export function Chooser({ id = "chooser" }: { id?: string }) {
  const [answers, setAnswers] = useState<(Instrument | null)[]>(
    chooserQuestions.map(() => null),
  );

  const step = answers.findIndex((a) => a === null);
  const done = step === -1;
  const piano = answers.filter((a) => a === "piano").length;
  const winner: Instrument = piano >= 2 ? "piano" : "violin";
  const instrument = instruments.find((i) => i.id === winner)!;

  const answer = (to: Instrument) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = to;
      return next;
    });
  };

  const listen = useCallback(() => {
    const ac = audio();
    if (!ac) return;
    const t = ac.currentTime + 0.05;
    if (winner === "piano") {
      [60, 64, 67, 72].forEach((midi, i) => {
        strike({
          freq: midiToFreq(midi),
          when: t + i * 0.22,
          dur: 2.4,
          gain: 0.42,
          voice: "grand",
          room: 1,
        });
      });
    } else {
      bow({ freq: midiToFreq(69), when: t, dur: 1.5, gain: 0.4, vibrato: 0.5, room: 1 });
      bow({ freq: midiToFreq(76), when: t + 1.3, dur: 2, gain: 0.36, vibrato: 0.5, room: 1 });
    }
  }, [winner]);

  const reset = () => setAnswers(chooserQuestions.map(() => null));

  return (
    <div className="pick-shell" id={id} style={{ "--tone": TONE[winner] } as CSSProperties}>
      <div className="pick-progress" aria-hidden="true">
        {chooserQuestions.map((_, i) => (
          <i key={i} data-done={answers[i] !== null || undefined} />
        ))}
      </div>

      {!done ? (
        <>
          <p className="pick-q">
            <span className="sr-only">
              پرسش {step + 1} از {chooserQuestions.length}:{" "}
            </span>
            {chooserQuestions[step].q}
          </p>
          <div className="pick-opts">
            {chooserQuestions[step].options.map((opt, i) => (
              <button key={opt.text} type="button" className="pick-opt" onClick={() => answer(opt.to)}>
                <span className="pick-opt-key" aria-hidden="true">
                  {i === 0 ? "الف" : "ب"}
                </span>
                {opt.text}
              </button>
            ))}
          </div>
          <p className="deck-note" style={{ paddingInline: 0, paddingTop: "1rem" }}>
            سه پرسش کوتاه، فقط برای اینکه بدانی از کدام ساز شروع کنی. جواب قطعی نیست؛
            جلسه‌ی اول هر دو را امتحان می‌کنیم.
          </p>
        </>
      ) : (
        <div className="pick-result">
          <div className="pick-result-art" aria-hidden="true">
            {winner === "piano" ? <PianoKeys /> : <ViolinArt />}
          </div>
          <div>
            <p className="pick-verdict">با {instrument.name} شروع کن</p>
            <p className="pick-why">
              از سه پرسش، {piano} پاسخ به سمت پیانو رفت و {3 - piano} پاسخ به سمت ویولن.
              این یعنی {instrument.tagline}
            </p>
            <ul className="fork-list" style={{ "--tone": TONE[winner] } as CSSProperties}>
              {answers.map((a, i) => (
                <li key={i}>
                  {chooserQuestions[i].options.find((o) => o.to === a)?.text}
                </li>
              ))}
            </ul>
            <div className="pick-actions">
              <button type="button" className="chip-btn" onClick={listen}>
                <PlayIcon />
                صدایش را بشنو
              </button>
              <Link className="chip-btn" href={`/contact?instrument=${winner}#composer`}>
                هماهنگی کلاس {instrument.name}
                <ArrowIcon />
              </Link>
              <Link className="chip-btn" href={`#${winner}-detail`}>
                جزئیات این ساز
              </Link>
              <button type="button" className="chip-btn" onClick={reset}>
                <ResetIcon />
                از اول
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}