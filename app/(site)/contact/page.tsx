import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { eventKinds, telegramPending } from "@/app/data";
import { Equalizer, Metronome } from "@/app/components/Art";
import { TelegramButton } from "@/app/components/TelegramButton";
import { Composer } from "@/app/components/studio/Composer";
import { ArrowIcon, SendIcon } from "@/app/components/studio/icons";
import { toFa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "تماس",
  description:
    "پیامت را همین‌جا بساز و در تلگرام بفرست: هماهنگی کلاس پیانو و ویولن، یا نوازنده برای مراسم.",
};

const tone = (value: string, second?: string) =>
  ({ "--tone": value, "--tone-2": second ?? value }) as CSSProperties;

const STEPS = [
  {
    n: "۰۱",
    title: "پیام را بساز",
    text: "ساز، سطح و وقتت را انتخاب کن؛ متن پیام خودش نوشته می‌شود.",
    tone: "var(--glow-steel)",
  },
  {
    n: "۰۲",
    title: "بفرست یا کپی کن",
    text: "دکمه‌ی تلگرام را بزن، یا متن را کپی کن و هر جای دیگری بفرست.",
    tone: "var(--glow-brass)",
  },
  {
    n: "۰۳",
    title: "زمان را می‌بندیم",
    text: "در پاسخ، ساعت و شکل جلسه را با هم مشخص می‌کنیم و شروع می‌کنیم.",
    tone: "var(--glow-rosin)",
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="subhero" style={tone("var(--glow-steel)", "var(--glow-velvet)")}>
        <div className="subhero-bg" aria-hidden="true" />
        <div className="wrap subhero-inner">
          <div className="subhero-copy">
            <p className="band-kicker">تماس</p>
            <h1 className="subhero-title">
              یک پیام، <em>شروعِ کلاس</em>
            </h1>
            <p className="stage-lead">
              لازم نیست متن بنویسی. پایین همین صفحه ساز و وقتت را انتخاب کن، متن
              پیام آماده می‌شود و با یک دکمه در تلگرام می‌فرستی.
            </p>
            <div className="stage-actions">
              <Link className="btn btn-primary" href="#composer">
                <SendIcon />
                ساختن پیام
              </Link>
              <TelegramButton variant="brass" />
            </div>
            {telegramPending && (
              <p className="pending">
                نام کاربری تلگرام به‌زودی اضافه می‌شود؛ تا آن موقع متن پیام را
                کپی کن.
              </p>
            )}
          </div>
          <div className="subhero-art" aria-hidden="true">
            <div className="contact-art-stack">
              <Metronome />
              <Equalizer />
            </div>
          </div>
        </div>
      </section>

      <section className="band" id="composer" style={tone("var(--glow-steel)", "var(--glow-brass)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap band-head">
          <div className="band-head-copy">
            <p className="band-kicker">پیام‌ساز</p>
            <h2 className="band-title">پیامت را همین‌جا بساز</h2>
          </div>
          <p className="band-note">
            هر چه انتخاب کنی، همان لحظه در پیش‌نمایش نوشته می‌شود. هیچ چیزی جایی
            ذخیره یا ارسال نمی‌شود؛ متن فقط برای خودت است.
          </p>
        </div>
        <div className="wrap">
          <Suspense
            fallback={
              <div className="compose" style={{ minHeight: "26rem" }}>
                <p className="compose-hint" role="status">
                  پیام‌ساز باز می‌شود…
                </p>
              </div>
            }
          >
            <Composer id="composer-panel" />
          </Suspense>
        </div>
      </section>

      <hr className="rule" />

      <section className="band" style={tone("var(--glow-brass)", "var(--glow-rosin)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap band-head">
          <div className="band-head-copy">
            <p className="band-kicker">بعد از پیام</p>
            <h2 className="band-title">سه قدم تا جلسه‌ی اول</h2>
          </div>
        </div>
        <div className="wrap">
          <ol className="flow">
            {STEPS.map((step) => (
              <li className="flow-step" key={step.n} data-rise style={tone(step.tone)}>
                <span className="flow-dot" aria-hidden="true">
                  {step.n}
                </span>
                <div className="flow-body">
                  <h3 className="flow-title">{step.title}</h3>
                  <p className="flow-text">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band" id="event" style={tone("var(--glow-velvet)", "var(--glow-copper)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap">
          <div className="event-card" data-rise>
            <div>
              <p className="band-kicker">مراسم و دورهمی</p>
              <h2 className="event-title">نوازنده می‌خواهی؟</h2>
              <p className="event-text">
                پیانو یا ویولن برای دورهمی، مراسم و رویداد کاری. نوع مراسم و
                تاریخ را بگو تا برنامه و زمان را با هم ببندیم.
              </p>
              <ul className="event-kinds">
                {eventKinds.map((kind) => (
                  <li key={kind}>{kind}</li>
                ))}
              </ul>
              <div className="mentor-actions">
                <Link className="chip-btn" href="/contact?intent=event#composer">
                  پیام مراسم را بساز
                  <ArrowIcon />
                </Link>
                <Link className="chip-btn" href="/instruments#repertoire">
                  قطعه‌ها را ببین
                </Link>
              </div>
            </div>
            <div className="subhero-art" aria-hidden="true">
              <Metronome />
            </div>
          </div>
        </div>
      </section>

      <section className="band" style={tone("var(--glow-rosin)", "var(--glow-steel)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap band-head">
          <div className="band-head-copy">
            <p className="band-kicker">پیش از پیام</p>
            <h2 className="band-title">اگر این‌ها را بنویسی، جواب سریع‌تر است</h2>
          </div>
          <p className="band-note">
            {toFa(4)} چیز کوچک که کار هر دو طرف را راحت می‌کند.
          </p>
        </div>
        <div className="wrap">
          <div className="fork-grid">
            <article className="fork-card" data-rise style={tone("var(--glow-brass)")}>
              <span className="fork-num">کلاس</span>
              <h3 className="fork-title">برای شروع کلاس</h3>
              <ul className="fork-list">
                <li>سازی که می‌خواهی، یا بنویس هنوز نمی‌دانی</li>
                <li>تازه‌کاری، برمی‌گردی یا قبلاً نواخته‌ای</li>
                <li>صبح، ظهر، عصر، شب یا آخر هفته</li>
                <li>روزی چند دقیقه واقعاً وقت تمرین داری</li>
              </ul>
              <div className="fork-foot">
                <Link className="chip-btn" href="/contact?instrument=piano#composer">
                  ساختن پیام کلاس
                  <ArrowIcon />
                </Link>
              </div>
            </article>
            <article className="fork-card" data-rise style={tone("var(--glow-velvet)")}>
              <span className="fork-num">مراسم</span>
              <h3 className="fork-title">برای گرفتن نوازنده</h3>
              <ul className="fork-list">
                <li>نوع مراسم و تعداد مهمان‌ها</li>
                <li>تاریخ و ساعت تقریبی</li>
                <li>ساز مورد علاقه‌ات</li>
                <li>اگر قطعه‌ی خاصی می‌خواهی، اسمش</li>
              </ul>
              <div className="fork-foot">
                <Link className="chip-btn" href="/contact?intent=event#composer">
                  ساختن پیام مراسم
                  <ArrowIcon />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}