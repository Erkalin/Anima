import { Suspense } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  instruments,
  teachers,
  terms,
  type Instrument,
} from "@/app/data";
import { PianoKeys, ViolinArt } from "@/app/components/Art";
import { TelegramButton } from "@/app/components/TelegramButton";
import { Closing } from "@/app/components/studio/Closing";
import { PostShelf, ShelfFallback } from "@/app/components/studio/PostShelf";
import { ArrowIcon } from "@/app/components/studio/icons";
import { toFa } from "@/lib/utils";

const TONE: Record<Instrument, string> = {
  piano: "var(--glow-brass)",
  violin: "var(--glow-copper)",
};

const tone = (value: string, second?: string) =>
  ({ "--tone": value, "--tone-2": second ?? value }) as CSSProperties;

export default function Home() {
  return (
    <>
      <section className="stage">
        <div className="stage-bg" aria-hidden="true">
          <div className="stage-photo" />
          <div className="stage-vignette" />
        </div>

        <div className="wrap-wide stage-inner">
          <div className="stage-top">
            <div className="stage-copy">
              <p className="band-kicker">کارگاه پیانو و ویولن</p>
              <h1 className="stage-title">
                از اولین نُت تا <em>اولین اجرا</em>
              </h1>
              <p className="stage-lead">
                گروه موسیقی آنیما تقدیم می‌کند
                <br />
                در ادامه با ما همراه باشید
              </p>
              <div className="stage-actions">
                <TelegramButton />
                <Link className="btn btn-ghost" href="#instruments">
                  سازها را ببین
                </Link>
              </div>
              <ul className="stage-tags">
                <li className="stage-tag" style={tone("var(--glow-brass)")}>
                  <i aria-hidden="true" />
                  کلاس خصوصی
                </li>
                <li className="stage-tag" style={tone("var(--glow-rosin)")}>
                  <i aria-hidden="true" />
                  از صفر تا قطعه‌ی دلخواه
                </li>
                <li className="stage-tag" style={tone("var(--glow-velvet)")}>
                  <i aria-hidden="true" />
                  نوازنده برای مراسم
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="ticker">
        <div className="ticker-track">
          {[0, 1, 2, 3].map((copy) => (
            <div className="ticker-set" key={copy} aria-hidden={copy > 0 || undefined}>
              {terms.map((item) => (
                <span className="ticker-item" key={item.term}>
                  <span className="ticker-term">{item.term}</span>
                  <span className="ticker-gloss">{item.gloss}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="band" id="instruments" style={tone("var(--glow-brass)", "var(--glow-copper)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap band-head">
          <div className="band-head-copy">
            <h2 className="band-title">
              اگه تو انتخاب ساز مورد نظرت شک داری، از ما دریغ نکن!
            </h2>
          </div>
          <p className="band-note">
            هدف ما اینه که هنرجو با پیدا کردن ساز مورد علاقش به دنبال اون چیزی
            که واقعا دوستش داره بره و ما تو همین مرحله کنارتون هستیم و بهتون
            مشاوره های لازم رو میدیم.
          </p>
        </div>

        <div className="wrap">
          <div className="duet">
            {instruments.map((instrument) => (
              <article
                className="duet-panel"
                data-instrument={instrument.id}
                key={instrument.id}
                style={tone(TONE[instrument.id], instrument.id === "piano" ? "var(--glow-velvet)" : "var(--glow-amber)")}
              >
                <div className="duet-photo" aria-hidden="true" />
                <div className="duet-scrim" aria-hidden="true" />
                <div className="duet-top">
                  <h3 className="duet-name">{instrument.name}</h3>
                  <p className="duet-tagline">{instrument.tagline}</p>
                </div>
                <div className="duet-foot">
                  <Link className="duet-link" href={`/instruments#${instrument.id}-detail`}>
                    کلاس {instrument.name}
                    <ArrowIcon />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="band-note" style={{ marginTop: "1.1rem" }}>
            دنبال جواب سریع میگردی؟{" "}
            <Link className="text-link" href="/instruments#chooser">
              این سه تا سوال رو از خودت بپرس و جواب بگیر
            </Link>
          </p>
        </div>
      </section>

      <hr className="rule" />

      <section className="band" id="teachers" style={tone("var(--glow-rosin)", "var(--glow-steel)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap band-head">
          <div className="band-head-copy">
            <p className="band-kicker">استادها</p>
            <h2 className="band-title">سه صندلی، یک اتاق</h2>
          </div>
          <p className="band-note">
            فعلاً سه نفریم و کلاس‌ها را خودمان می‌گذاریم. جای عکس و معرفی هر
            استاد روی همین صندلی‌ها رزرو است.
          </p>
        </div>

        <div className="wrap">
          <div className="ensemble">
            {teachers.map((teacher, i) => {
              const pending = teacher.name.startsWith("[");
              return (
                <article
                  className="seat"
                  key={teacher.id}
                  data-featured={teacher.featured || undefined}
                  data-rise
                  style={tone(TONE[teacher.instrument])}
                >
                  <div className="seat-frame">
                    <div className="seat-art" aria-hidden="true">
                      {teacher.instrument === "piano" ? <PianoKeys /> : <ViolinArt />}
                    </div>
                    <span className="seat-num">{toFa(String(i + 1).padStart(2, "0"))}</span>
                    <span className="seat-role">{teacher.role}</span>
                  </div>
                  <div className="seat-body">
                    <h3 className="seat-name" data-pending={pending || undefined}>
                      {teacher.name}
                    </h3>
                    <p className="seat-bio">{teacher.bio}</p>
                    {pending && <span className="seat-slot">معرفی به‌زودی</span>}
                  </div>
                </article>
              );
            })}
          </div>
          <p style={{ marginTop: "1.6rem" }}>
            <Link className="text-link" href="/teachers">
              دیدن استادها و روش کلاس
            </Link>
          </p>
        </div>
      </section>

      <section className="band" style={tone("var(--glow-steel)", "var(--glow-velvet)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap band-head">
          <div className="band-head-copy">
            <p className="band-kicker">دو راه</p>
            <h2 className="band-title">یاد بگیر، یا نوازنده بگیر</h2>
          </div>
        </div>

        <div className="wrap">
          <div className="fork-grid">
            <article className="fork-card" data-rise style={tone("var(--glow-brass)")}>
              <span className="fork-num">۰۱</span>
              <h3 className="fork-title">کلاس خصوصی</h3>
              <p className="fork-text">
                برای کسی که تازه شروع می‌کند و برای کسی که بعد از یک وقفه
                برمی‌گردد پشت ساز.
              </p>
              <ul className="fork-list">
                <li>جلسه‌ی اول: تعیین سطح و وضعیت دست</li>
                <li>تمرین هفتگیِ کوتاه، اندازه‌ی وقت واقعی‌ات</li>
                <li>از هفته‌های اول، تکه‌ای از قطعه‌ی دلخواهت</li>
              </ul>
              <div className="fork-foot">
                <Link className="chip-btn" href="/contact#composer">
                  هماهنگی کلاس
                  <ArrowIcon />
                </Link>
              </div>
            </article>

            <article className="fork-card" data-rise style={tone("var(--glow-velvet)")}>
              <span className="fork-num">۰۲</span>
              <h3 className="fork-title">نوازنده برای مراسم</h3>
              <p className="fork-text">
                پیانو یا ویولن برای دورهمی، مراسم و رویداد کاری. برنامه و زمان را
                با هم می‌بندیم.
              </p>
              <ul className="fork-list">
                <li>دورهمی خانوادگی، عقد و عروسی</li>
                <li>کافه، گالری و رویداد کاری</li>
                <li>قطعه‌های درخواستی، از قبل هماهنگ‌شده</li>
              </ul>
              <div className="fork-foot">
                <Link className="chip-btn" href="/contact?intent=event#composer">
                  گفت‌وگو درباره‌ی مراسم
                  <ArrowIcon />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <Suspense fallback={<ShelfFallback />}>
        <PostShelf />
      </Suspense>

      <Closing />
    </>
  );
}