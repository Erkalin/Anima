"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { instruments, teachers, type Instrument } from "@/app/data";
import { PianoKeys, ViolinArt } from "@/app/components/Art";
import { toFa } from "@/lib/utils";
import { ArrowIcon } from "./icons";

const TONE: Record<Instrument, string> = {
  piano: "var(--glow-brass)",
  violin: "var(--glow-copper)",
};

const FILTERS: { id: "all" | Instrument; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "piano", label: "پیانو" },
  { id: "violin", label: "ویولن" },
];

export function Roster() {
  const [filter, setFilter] = useState<"all" | Instrument>("all");
  const shown = teachers.filter((t) => filter === "all" || t.instrument === filter);

  return (
    <div>
      <div className="roster-bar">
        <div className="deck-seg" role="group" aria-label="فیلتر ساز">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="roster-count" role="status">
          {toFa(shown.length)} استاد از {toFa(teachers.length)}
        </p>
      </div>

      {shown.length === 0 ? (
        <div className="pick-shell">
          <p className="pick-q">با این فیلتر استادی نیست.</p>
          <p className="pick-why">فعلاً فقط پیانو و ویولن داریم. فیلتر را بردار تا هر سه نفر را ببینی.</p>
          <div className="pick-actions">
            <button type="button" className="chip-btn" onClick={() => setFilter("all")}>
              نمایش همه
            </button>
          </div>
        </div>
      ) : (
        <div className="mentor-list">
          {shown.map((teacher) => {
            const instrument = instruments.find((i) => i.id === teacher.instrument)!;
            const pending = teacher.name.startsWith("[");
            return (
              <article
                className="mentor"
                key={teacher.id}
                data-rise
                style={{ "--tone": TONE[teacher.instrument] } as CSSProperties}
              >
                <div className="mentor-frame">
                  <div className="mentor-art" aria-hidden="true">
                    {teacher.instrument === "piano" ? <PianoKeys /> : <ViolinArt />}
                  </div>
                  <span className="mentor-badge">{teacher.role}</span>
                </div>

                <div className="mentor-copy">
                  <p className="mentor-role">
                    {teacher.featured ? "بنیان‌گذار آموزشگاه" : "استاد آموزشگاه"}
                  </p>
                  <h3 className="mentor-name" data-pending={pending || undefined}>
                    {teacher.name}
                  </h3>
                  <p className="mentor-bio">{teacher.bio}</p>
                  <ul className="mentor-tags">
                    {instrument.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  <div className="mentor-actions">
                    <Link
                      className="chip-btn"
                      href={`/contact?instrument=${teacher.instrument}#composer`}
                    >
                      هماهنگی کلاس {teacher.role}
                      <ArrowIcon />
                    </Link>
                    <Link className="chip-btn" href={`/instruments#${teacher.instrument}-detail`}>
                      درباره‌ی {teacher.role}
                    </Link>
                  </div>
                  {pending && (
                    <p className="seat-slot" style={{ "--tone": TONE[teacher.instrument] } as CSSProperties}>
                      نام و معرفی این استاد به‌زودی کامل می‌شود.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}