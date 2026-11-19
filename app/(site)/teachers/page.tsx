import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { classFlow, firstSession, teachers } from "@/app/data";
import { ViolinArt } from "@/app/components/Art";
import { Roster } from "@/app/components/studio/Roster";
import { PracticePlan } from "@/app/components/studio/PracticePlan";
import { Closing } from "@/app/components/studio/Closing";
import { CheckIcon } from "@/app/components/studio/icons";
import { toFa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "استادها",
  description:
    "استادهای پیانو و ویولن آنیما، روش کلاس و چیزهایی که برای جلسه‌ی اول لازم داری.",
};

const FLOW_TONES = [
  "var(--glow-brass)",
  "var(--glow-copper)",
  "var(--glow-velvet)",
  "var(--glow-steel)",
];

const tone = (value: string, second?: string) =>
  ({ "--tone": value, "--tone-2": second ?? value }) as CSSProperties;

export default function TeachersPage() {
  return (
    <>
      <section className="subhero" style={tone("var(--glow-rosin)", "var(--glow-brass)")}>
        <div className="subhero-bg" aria-hidden="true" />
        <div className="wrap subhero-inner">
          <div className="subhero-copy">
            <p className="band-kicker">استادها</p>
            <h1 className="subhero-title">
              کسی که <em>کنارت می‌نشیند</em>
            </h1>
            <p className="stage-lead">
              سه نفریم: یک پیانو، دو ویولن. کلاس‌ها یکی‌یکی جلو می‌روند و هر جلسه
              با همان چیزی شروع می‌شود که تو بلد نیستی، نه با یک برنامه‌ی ثابت
              برای همه.
            </p>
            <div className="stage-actions">
              <Link className="btn btn-primary" href="/contact#composer">
                هماهنگی جلسه‌ی اول
              </Link>
              <Link className="btn btn-ghost" href="#flow">
                کلاس چطور پیش می‌رود
              </Link>
            </div>
            <div className="subhero-stats">
              <p className="subhero-stat">
                <b>{toFa(teachers.length)}</b>
                <span>استاد</span>
              </p>
              <p className="subhero-stat">
                <b>{toFa(2)}</b>
                <span>ساز: پیانو و ویولن</span>
              </p>
              <p className="subhero-stat">
                <b>خصوصی</b>
                <span>یک هنرجو در هر جلسه</span>
              </p>
            </div>
          </div>
          <div className="subhero-art" aria-hidden="true">
            <ViolinArt />
          </div>
        </div>
      </section>

      <section className="band" id="roster" style={tone("var(--glow-brass)", "var(--glow-copper)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap band-head">
          <div className="band-head-copy">
            <p className="band-kicker">صندلی‌ها</p>
            <h2 className="band-title">با ساز فیلتر کن</h2>
          </div>
          <p className="band-note">
            نام، عکس و معرفی کامل هر استاد به‌زودی روی همین کارت‌ها می‌نشیند. تا
            آن موقع، هر چه لازم است بدانی همین‌جاست.
          </p>
        </div>
        <div className="wrap">
          <Roster />
        </div>
      </section>

      <hr className="rule" />

      <section className="band" id="flow" style={tone("var(--glow-steel)", "var(--glow-velvet)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap flow-shell">
          <div className="flow-aside">
            <p className="band-kicker">مسیر کلاس</p>
            <h2 className="band-title">چهار قدم، بدون عجله</h2>
            <p className="band-note">
              این ترتیب برای هر دو ساز یکی است؛ فقط سرعتش با تو تنظیم می‌شود.
              هیچ جلسه‌ای قرار نیست عقب‌مانده‌ی جلسه‌ی قبل باشد.
            </p>
            <p style={{ marginTop: "1.2rem" }}>
              <Link className="text-link" href="#plan">
                برنامه‌ی تمرینت را بساز
              </Link>
            </p>
          </div>

          <ol className="flow">
            {classFlow.map((step, i) => (
              <li
                className="flow-step"
                key={step.n}
                data-rise
                style={tone(FLOW_TONES[i % FLOW_TONES.length])}
              >
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

      <section className="band" id="plan" style={tone("var(--glow-rosin)", "var(--glow-amber)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap band-head">
          <div className="band-head-copy">
            <p className="band-kicker">تمرین هفته</p>
            <h2 className="band-title">بیست دقیقه‌ی درست، تقسیم‌شده</h2>
          </div>
          <p className="band-note">
            وقتی که واقعاً داری را بگذار تا برنامه‌ی همان هفته ساخته شود. این
            پیشنهاد است؛ سر جلسه با هم دقیق‌ترش می‌کنیم.
          </p>
        </div>
        <div className="wrap">
          <PracticePlan id="plan-panel" />
        </div>
      </section>

      <section className="band" style={tone("var(--glow-amber)", "var(--glow-rosin)")}>
        <div className="band-tint" aria-hidden="true" />
        <div className="wrap band-head">
          <div className="band-head-copy">
            <p className="band-kicker">جلسه‌ی اول</p>
            <h2 className="band-title">این چهار چیز را با خودت بیاور</h2>
          </div>
          <p className="band-note">
            لازم نیست آماده باشی. همین‌ها کافی است تا جلسه‌ی اول هدر نرود.
          </p>
        </div>
        <div className="wrap">
          <ul className="checklist">
            {firstSession.map((item) => (
              <li key={item} data-rise>
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Closing
        hand="جلسه‌ی اول، آشنایی است"
        title="بگو کجایی، از همان‌جا شروع کنیم"
        text="ساز، سطح و وقتی که در هفته داری را در پیام بنویس. بقیه‌اش را سر جلسه هماهنگ می‌کنیم."
      />
    </>
  );
}