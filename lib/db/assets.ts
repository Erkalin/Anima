/**
 * Seed artwork written to the upload store on first run. Original line art in
 * the studio's wood-and-brass language, so covers and the media library hold
 * real files instead of broken image slots.
 */

const W = 1200;
const H = 800;

function frame(inner: string, glow: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
<defs>
<linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#4a3424"/><stop offset="0.55" stop-color="#2a1e15"/><stop offset="1" stop-color="#1a120c"/>
</linearGradient>
<radialGradient id="lamp" cx="0.24" cy="0.12" r="0.85">
<stop offset="0" stop-color="${glow}" stop-opacity="0.5"/><stop offset="0.6" stop-color="${glow}" stop-opacity="0.08"/><stop offset="1" stop-color="#0f0a07" stop-opacity="0"/>
</radialGradient>
<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#e6bb72"/><stop offset="0.5" stop-color="#c08a3e"/><stop offset="1" stop-color="#8a5f26"/>
</linearGradient>
<linearGradient id="ivory" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#f6efe2"/><stop offset="1" stop-color="#cdbfa8"/>
</linearGradient>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#wood)"/>
<rect width="${W}" height="${H}" fill="url(#lamp)"/>
${inner}
<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.05"/>
</svg>`;
}

const pianoKeys = Array.from({ length: 14 }, (_, i) => {
  const x = 96 + i * 74;
  return `<rect x="${x}" y="300" width="70" height="330" rx="4" fill="url(#ivory)" stroke="#1a120c" stroke-width="2"/>`;
}).join("");

const blackKeys = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12]
  .map((i) => {
    const x = 96 + i * 74 + 50;
    return `<rect x="${x}" y="300" width="44" height="208" rx="4" fill="#150e09" stroke="#c08a3e" stroke-opacity="0.35" stroke-width="1.5"/>`;
  })
  .join("");

export const PLATE_PIANO = frame(
  `<g>
<rect x="72" y="272" width="1056" height="26" rx="6" fill="url(#brass)"/>
<rect x="72" y="292" width="1056" height="10" fill="#0f0a07" opacity="0.55"/>
${pianoKeys}
${blackKeys}
<rect x="72" y="630" width="1056" height="34" rx="6" fill="#241a13" stroke="#c08a3e" stroke-opacity="0.3"/>
<g stroke="#f1e7d7" stroke-opacity="0.16" stroke-width="1.5">
<line x1="120" y1="150" x2="1080" y2="150"/><line x1="120" y1="176" x2="1080" y2="176"/>
<line x1="120" y1="202" x2="1080" y2="202"/><line x1="120" y1="228" x2="1080" y2="228"/>
<line x1="120" y1="254" x2="1080" y2="254"/>
</g>
<g fill="url(#brass)">
<ellipse cx="300" cy="202" rx="17" ry="12" transform="rotate(-18 300 202)"/>
<ellipse cx="560" cy="176" rx="17" ry="12" transform="rotate(-18 560 176)"/>
<ellipse cx="820" cy="228" rx="17" ry="12" transform="rotate(-18 820 228)"/>
</g>
<g stroke="url(#brass)" stroke-width="4" stroke-linecap="round">
<line x1="315" y1="197" x2="315" y2="120"/><line x1="575" y1="171" x2="575" y2="94"/><line x1="835" y1="223" x2="835" y2="146"/>
</g>
</g>`,
  "#d9a558",
);

export const PLATE_VIOLIN = frame(
  `<g fill="none" stroke="#f1e7d7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
<path d="M600 96 C520 96 470 150 470 214 C470 262 500 292 500 330 C500 372 452 392 452 452 C452 546 520 700 600 700 C680 700 748 546 748 452 C748 392 700 372 700 330 C700 292 730 262 730 214 C730 150 680 96 600 96 Z" stroke-opacity="0.9"/>
<path d="M556 300 C520 316 512 372 534 412 C548 438 546 470 524 486" stroke="#c08a3e" stroke-width="7"/>
<path d="M644 300 C680 316 688 372 666 412 C652 438 654 470 676 486" stroke="#c08a3e" stroke-width="7"/>
<circle cx="534" cy="300" r="9" fill="#c08a3e" stroke="none"/>
<circle cx="524" cy="486" r="9" fill="#c08a3e" stroke="none"/>
<circle cx="666" cy="300" r="9" fill="#c08a3e" stroke="none"/>
<circle cx="676" cy="486" r="9" fill="#c08a3e" stroke="none"/>
<rect x="576" y="404" width="48" height="120" rx="8" stroke="#c08a3e" stroke-opacity="0.8"/>
<g stroke="#d9a558" stroke-width="1.6" stroke-opacity="0.85">
<line x1="586" y1="150" x2="586" y2="640"/><line x1="596" y1="146" x2="596" y2="646"/>
<line x1="606" y1="146" x2="606" y2="646"/><line x1="616" y1="150" x2="616" y2="640"/>
</g>
<path d="M600 96 L600 44 C640 44 664 66 664 92 C664 112 646 124 630 116" stroke="#c08a3e" stroke-width="5"/>
<path d="M180 620 L1020 210" stroke="#e6bb72" stroke-width="5" stroke-opacity="0.55"/>
<path d="M180 620 L1020 210" stroke="#f1e7d7" stroke-width="1.2" stroke-opacity="0.5"/>
<rect x="164" y="606" width="34" height="26" rx="5" fill="#c08a3e" stroke="none" transform="rotate(-26 181 619)"/>
</g>`,
  "#a2708f",
);

export const PLATE_METRONOME = frame(
  `<g fill="none" stroke="#f1e7d7" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
<path d="M600 120 L790 660 L410 660 Z" stroke-opacity="0.9"/>
<path d="M600 120 L640 132 L826 660 L790 660 Z" fill="#0f0a07" fill-opacity="0.45" stroke-opacity="0.5"/>
<rect x="376" y="660" width="448" height="42" rx="10" stroke="#c08a3e"/>
<g stroke="#f1e7d7" stroke-opacity="0.3" stroke-width="1.5">
<line x1="556" y1="250" x2="644" y2="250"/><line x1="540" y1="320" x2="660" y2="320"/>
<line x1="524" y1="390" x2="676" y2="390"/><line x1="508" y1="460" x2="692" y2="460"/>
<line x1="492" y1="530" x2="708" y2="530"/>
</g>
<g stroke="#c08a3e" stroke-width="6" stroke-linecap="round">
<line x1="600" y1="620" x2="700" y2="200"/>
</g>
<rect x="668" y="286" width="52" height="38" rx="6" fill="url(#brass)" stroke="#8a5f26" stroke-width="2" transform="rotate(13 694 305)"/>
<circle cx="600" cy="620" r="15" fill="url(#brass)" stroke="none"/>
<g stroke="#7fa86b" stroke-width="4" stroke-linecap="round" stroke-opacity="0.75">
<path d="M880 300 C930 340 930 420 880 460"/>
<path d="M920 268 C990 330 990 430 920 492"/>
</g>
<g stroke="#6f97b0" stroke-width="4" stroke-linecap="round" stroke-opacity="0.7">
<path d="M320 300 C270 340 270 420 320 460"/>
<path d="M280 268 C210 330 210 430 280 492"/>
</g>
</g>`,
  "#6f97b0",
);

export const PLATE_STAFF = frame(
  `<g>
<g stroke="#f1e7d7" stroke-opacity="0.22" stroke-width="2">
<line x1="80" y1="300" x2="1120" y2="300"/><line x1="80" y1="340" x2="1120" y2="340"/>
<line x1="80" y1="380" x2="1120" y2="380"/><line x1="80" y1="420" x2="1120" y2="420"/>
<line x1="80" y1="460" x2="1120" y2="460"/>
</g>
<g stroke="#f1e7d7" stroke-opacity="0.3" stroke-width="3">
<line x1="360" y1="300" x2="360" y2="460"/><line x1="640" y1="300" x2="640" y2="460"/><line x1="920" y1="300" x2="920" y2="460"/>
</g>
<g fill="url(#brass)">
<ellipse cx="180" cy="420" rx="21" ry="15" transform="rotate(-18 180 420)"/>
<ellipse cx="270" cy="380" rx="21" ry="15" transform="rotate(-18 270 380)"/>
<ellipse cx="450" cy="340" rx="21" ry="15" transform="rotate(-18 450 340)"/>
<ellipse cx="540" cy="420" rx="21" ry="15" transform="rotate(-18 540 420)"/>
<ellipse cx="730" cy="300" rx="21" ry="15" transform="rotate(-18 730 300)"/>
<ellipse cx="820" cy="380" rx="21" ry="15" transform="rotate(-18 820 380)"/>
<ellipse cx="1010" cy="340" rx="21" ry="15" transform="rotate(-18 1010 340)"/>
</g>
<g stroke="url(#brass)" stroke-width="5" stroke-linecap="round">
<line x1="199" y1="414" x2="199" y2="300"/><line x1="289" y1="374" x2="289" y2="260"/>
<line x1="469" y1="334" x2="469" y2="220"/><line x1="559" y1="414" x2="559" y2="300"/>
<line x1="749" y1="294" x2="749" y2="180"/><line x1="839" y1="374" x2="839" y2="260"/>
<line x1="1029" y1="334" x2="1029" y2="220"/>
</g>
<path d="M199 300 C240 288 260 274 289 260" stroke="url(#brass)" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M749 180 C790 168 810 154 839 140" stroke="url(#brass)" stroke-width="7" fill="none" stroke-linecap="round" opacity="0"/>
<g fill="#7fa86b" fill-opacity="0.5">
<circle cx="150" cy="600" r="5"/><circle cx="260" cy="640" r="4"/><circle cx="380" cy="590" r="6"/>
<circle cx="520" cy="646" r="4"/><circle cx="660" cy="600" r="5"/><circle cx="800" cy="650" r="4"/>
<circle cx="940" cy="596" r="6"/><circle cx="1060" cy="640" r="4"/>
</g>
</g>`,
  "#7fa86b",
);

export const SEED_ASSETS: { name: string; svg: string; alt: string }[] = [
  {
    name: "plate-piano.svg",
    svg: PLATE_PIANO,
    alt: "کلاویه‌های پیانو با خط حامل و نُت‌های برنجی روی زمینه‌ی چوبی",
  },
  {
    name: "plate-violin.svg",
    svg: PLATE_VIOLIN,
    alt: "بدنه‌ی ویولن با سوراخ‌های f، سیم‌ها و آرشه روی زمینه‌ی چوبی",
  },
  {
    name: "plate-metronome.svg",
    svg: PLATE_METRONOME,
    alt: "مترونوم هرمی با بازوی برنجی و موج‌های صدا در دو سو",
  },
  {
    name: "plate-staff.svg",
    svg: PLATE_STAFF,
    alt: "پنج خط حامل با نُت‌های برنجی و نقطه‌های سبز زیر آن",
  },
];

const RATE = 22050;

function wav(samples: Float32Array): Buffer {
  const bytes = samples.length * 2;
  const buf = Buffer.alloc(44 + bytes);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + bytes, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(bytes, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return buf;
}

/** 80 BPM click, accented every fourth beat. A real practice tool, not a stub. */
function metronomeClicks(): Buffer {
  const seconds = 12;
  const out = new Float32Array(RATE * seconds);
  const beat = 60 / 80;
  for (let n = 0; n * beat < seconds; n += 1) {
    const accent = n % 4 === 0;
    const start = Math.floor(n * beat * RATE);
    const len = Math.floor(0.05 * RATE);
    const freq = accent ? 1600 : 1100;
    for (let i = 0; i < len && start + i < out.length; i += 1) {
      const t = i / RATE;
      const env = Math.exp(-t * 55);
      out[start + i] +=
        Math.sin(2 * Math.PI * freq * t) * env * (accent ? 0.7 : 0.42);
    }
  }
  return wav(out);
}

/** A4 = 440 Hz reference for tuning by ear, with a soft attack and release. */
function tuningA440(): Buffer {
  const seconds = 10;
  const out = new Float32Array(RATE * seconds);
  for (let i = 0; i < out.length; i += 1) {
    const t = i / RATE;
    const attack = Math.min(1, t / 0.4);
    const release = Math.min(1, (seconds - t) / 0.8);
    const body =
      Math.sin(2 * Math.PI * 440 * t) * 0.5 +
      Math.sin(2 * Math.PI * 880 * t) * 0.12 +
      Math.sin(2 * Math.PI * 1320 * t) * 0.05;
    out[i] = body * attack * release * 0.7;
  }
  return wav(out);
}

const PRACTICE_LOG = `برنامه‌ی تمرین هفتگی — آموزشگاه موسیقی
=====================================

نام: ......................    ساز: ......................
هفته‌ی: ......................

راهنما: هر روز فقط یک ستون را پر کنید. بیست دقیقه‌ی پیوسته
از دو ساعتِ پراکنده بهتر است.

┌────────┬──────────┬───────────┬──────────┬─────────────┐
│  روز   │ گرم‌کردن │  تمرین    │  قطعه    │ یادداشت     │
├────────┼──────────┼───────────┼──────────┼─────────────┤
│ شنبه   │ ۵ دقیقه  │ ۱۰ دقیقه  │ ۵ دقیقه  │             │
│ یکشنبه │ ۵ دقیقه  │ ۱۰ دقیقه  │ ۵ دقیقه  │             │
│ دوشنبه │ ۵ دقیقه  │ ۱۰ دقیقه  │ ۵ دقیقه  │             │
│ سه‌شنبه│ ۵ دقیقه  │ ۱۰ دقیقه  │ ۵ دقیقه  │             │
│چهارشنبه│ ۵ دقیقه  │ ۱۰ دقیقه  │ ۵ دقیقه  │             │
│پنجشنبه │ ۵ دقیقه  │ ۱۰ دقیقه  │ ۵ دقیقه  │             │
│ جمعه   │        استراحت یا مرور آزاد       │             │
└────────┴──────────┴───────────┴──────────┴─────────────┘

سه پرسش پایان هفته:
۱. کدام بخش این هفته روان‌تر شد؟
۲. کدام میزان هنوز می‌لنگد؟
۳. هفته‌ی بعد فقط روی چه چیزی کار می‌کنم؟

سرعت مترونوم این هفته: ...... ضربه در دقیقه
`;

export const SEED_FILES: {
  name: string;
  mime: string;
  data: Buffer;
  alt: string;
  width?: number;
  height?: number;
}[] = [
  {
    name: "metronome-80bpm.wav",
    mime: "audio/wav",
    data: metronomeClicks(),
    alt: "صدای مترونوم با سرعت هشتاد ضربه در دقیقه، با تأکید روی ضرب اول",
  },
  {
    name: "tuning-a440.wav",
    mime: "audio/wav",
    data: tuningA440(),
    alt: "نُت مرجع لا با فرکانس چهارصد و چهل هرتز برای کوک کردن ساز",
  },
  {
    name: "weekly-practice-log.txt",
    mime: "text/plain; charset=utf-8",
    data: Buffer.from(PRACTICE_LOG, "utf8"),
    alt: "جدول برنامه‌ی تمرین هفتگی با ستون‌های گرم‌کردن، تمرین و قطعه",
  },
];