import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  instrumentFacts,
  instruments,
  repertoire,
  type Instrument,
  type Piece,
} from "@/app/data";
import { PianoKeys, ViolinArt } from "@/app/components/Art";
import { PracticeDesk } from "@/app/components/studio/PracticeDesk";
import { Chooser } from "@/app/components/studio/Chooser";
import { ListenButton } from "@/app/components/studio/ListenButton";
import { Closing } from "@/app/components/studio/Closing";
import { ArrowIcon } from "@/app/components/studio/icons";
import { toFa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "سازها",
  description:
    "پیانو و ویولن: صدای ساز را بشنو، ساز مناسب خودت را پیدا کن و با مترونوم تمرین کن.",
};

const TONE: Record<Instrument, string> = {
  piano: "var(--glow-brass)",
  violin: "var(--glow-copper)",
};

const LEVEL_TONE: Record<Piece["level"], string> = {
  "پایه": "var(--glow-rosin)",
  "میانه": "var(--glow-amber)",
  "پیشرفته": "var(--glow-copper)",
};

const tone = (value: string, second?: string) =>
  ({ "--tone": value, "--tone-2": second ?? value }) as CSSProperties;

export default function InstrumentsPage() {
  const piano = instruments[0];
  const violin = instruments[1];

  return (
    <>
      <section className="subhero" style={tone("var(--glow-brass)", "var(--glow-copper)")}>
        <div className="subhero-bg" aria-hidden="true" />
        <div className="wrap subhero-inner">
          <div className="subhero-copy">
            <p className="band-kicker">سازها</p>
            <h1 className="subhero-title">
              ساز را <em>بشنو</em>، بعد تصمیم بگیر
            </h1>
            <p className="stage-lead">
              صدای هر دو ساز را بشنو، با سه پرسش کوتاه ساز مناسب خودت را پیدا کن
              و با مترونوم تمرین کن. هر چه این پایین هست، همان چیزی است که سر
              جلسه با آن کار می‌کنیم.
            </p>
            <div className="stage-actions">
              <Link className="btn btn-primary" href="#piano-detail">
                پیانو
              </Link>
              <Link className="btn btn-ghost" href="#violin-detail">
                ویولن
              </Link>
              <Link className="btn btn-ghost" href="#chooser">
                کدام ساز برای من؟
              </Link>
            </div>
            <div className="subhero-stats">
              <p className="subhero-stat">
                <b>{toFa(88)}</b>
                <span>کلاویه‌ی پیانو</span>
              </p>
              <p className="subhero-stat">
                <b>{toFa(4)}</b>
                <span>سیم ویولن</span>
              </p>
              <p className="subhero-stat">
                <b>{toFa(40)} تا {toFa(240)}</b>
                <span>ضرب مترونوم در دقیقه</span>
              </p>
            </div>
          </div>
          <div className="subhero-art" aria-hidden="true">
            <PianoKeys />
          </div>
        </div>
      </section>

      <section className="band" id="piano-detail" style={tone(TONE.piano, "var(--glow-velvet)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap">
          <div className="detail-shell">
            <div className="detail-figure" aria-hidden="true">
              <PianoKeys />
            </div>
            <div>
              <p className="band-kicker">ساز یکم</p>
              <h2 className="detail-title">{piano.name}</h2>
              <p className="detail-tagline">{piano.tagline}</p>
              <p className="band-note">{piano.intro}</p>
              <ul className="fork-list" style={{ marginTop: "1rem" }}>
                {piano.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <dl className="fact-grid">
                {instrumentFacts.piano.map((fact) => (
                  <div className="fact-cell" key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mentor-actions">
                <ListenButton instrument="piano" />
                <Link className="chip-btn" href="/contact?instrument=piano#composer">
                  کلاس پیانو می‌خواهم
                  <ArrowIcon />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="rule" />

      <section className="band" id="violin-detail" style={tone(TONE.violin, "var(--glow-amber)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap">
          <div className="detail-shell" data-flip="true">
            <div className="detail-figure" aria-hidden="true">
              <ViolinArt />
            </div>
            <div>
              <p className="band-kicker">ساز دوم</p>
              <h2 className="detail-title">{violin.name}</h2>
              <p className="detail-tagline">{violin.tagline}</p>
              <p className="band-note">{violin.intro}</p>
              <ul className="fork-list" style={{ marginTop: "1rem" }}>
                {violin.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <dl className="fact-grid">
                {instrumentFacts.violin.map((fact) => (
                  <div className="fact-cell" key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mentor-actions">
                <ListenButton instrument="violin" />
                <Link className="chip-btn" href="/contact?instrument=violin#composer">
                  کلاس ویولن می‌خواهم
                  <ArrowIcon />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="band" id="chooser" style={tone("var(--glow-velvet)", "var(--glow-steel)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap band-head">
          <div className="band-head-copy">
            <p className="band-kicker">انتخاب ساز</p>
            <h2 className="band-title">سه سؤال، یک جواب روشن</h2>
          </div>
          <p className="band-note">
            این یک آزمون نیست؛ فقط کمک می‌کند بفهمی کدام ساز به زندگی‌ات می‌خورد.
            جواب را می‌شنوی و می‌توانی از اول شروع کنی.
          </p>
        </div>
        <div className="wrap">
          <Chooser id="chooser-panel" />
        </div>
      </section>

      <hr className="rule" />

      <section className="band" id="desk" style={tone("var(--glow-steel)", "var(--glow-rosin)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap band-head">
          <div className="band-head-copy">
            <p className="band-kicker">میز تمرین</p>
            <h2 className="band-title">بیست دقیقه‌ی درست، با ضرب درست</h2>
          </div>
          <p className="band-note">
            مترونوم را روشن کن، وزنه را بالا و پایین ببر و ببین تندتر می‌شود یا
            کندتر. با «ضرب من» هم می‌توانی سرعت قطعه‌ای که در گوش داری را پیدا
            کنی.
          </p>
        </div>
        <div className="wrap">
          <PracticeDesk id="desk-panel" />
        </div>
      </section>

      <section className="band" id="repertoire" style={tone("var(--glow-amber)", "var(--glow-brass)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap band-head">
          <div className="band-head-copy">
            <p className="band-kicker">قطعه‌ها</p>
            <h2 className="band-title">چیزهایی که کم‌کم می‌نوازی</h2>
          </div>
          <p className="band-note">
            نمونه‌ای از قطعه‌هایی که در مسیر کلاس می‌آیند. اگر قطعه‌ی دیگری دوست
            داری، اسمش را در پیام بنویس.
          </p>
        </div>
        <div className="wrap">
          <div className="fork-grid">
            {(Object.keys(repertoire) as Instrument[]).map((key) => (
              <div key={key} style={tone(TONE[key])}>
                <h3 className="rep-head">
                  {key === "piano" ? piano.name : violin.name}
                  <small>{toFa(repertoire[key].length)} قطعه</small>
                </h3>
                <div className="rep-grid" data-single="true">
                  {repertoire[key].map((piece, i) => (
                    <article className="rep-card" key={piece.title} data-rise>
                      <span className="rep-n" aria-hidden="true">
                        {toFa(String(i + 1).padStart(2, "0"))}
                      </span>
                      <div>
                        <h4 className="rep-title">{piece.title}</h4>
                        <p className="rep-composer">{piece.composer}</p>
                      </div>
                      <span
                        className="rep-level"
                        style={{ "--level": LEVEL_TONE[piece.level] } as CSSProperties}
                      >
                        {piece.level}
                      </span>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Closing
        hand="سازت را انتخاب کردی؟"
        title="از همین ساز شروع کنیم"
        text="اسم ساز و وقتی که در هفته داری را در پیام بنویس. اگر هنوز دو دلی، همان را هم بنویس تا با هم روشنش کنیم."
      />
    </>
  );
}