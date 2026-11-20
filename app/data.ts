export const brand = "آنیما";

// TODO: put the real Telegram handle here. Until it is set, every button points at
// Telegram's home page and the pages show a "به‌زودی" note instead of a dead link.
export const telegramUsername = "";
export const telegramHref = telegramUsername
  ? `https://t.me/${telegramUsername}`
  : "https://t.me/";
export const telegramPending = telegramUsername === "";

export type Instrument = "piano" | "violin";

export type Teacher = {
  id: string;
  name: string;
  role: string;
  bio: string;
  featured: boolean;
  instrument: Instrument;
};

export const teachers: Teacher[] = [
  {
    id: "piano",
    name: "[نام استاد]",
    role: "پیانو",
    bio: "[یک خط درباره‌ی این استاد]",
    featured: true,
    instrument: "piano",
  },
  {
    id: "violin-a",
    name: "[نام استاد]",
    role: "ویولن",
    bio: "[یک خط درباره‌ی این استاد]",
    featured: false,
    instrument: "violin",
  },
  {
    id: "violin-b",
    name: "[نام استاد]",
    role: "ویولن",
    bio: "[یک خط درباره‌ی این استاد]",
    featured: false,
    instrument: "violin",
  },
];

export const instruments = [
  {
    id: "piano",
    name: "پیانو",
    tagline: "ساز کلاویه ای، از مبتدی تا پیشرفته",
    intro:
      "برای کسی که تازه شروع می‌کند یا بعد از یک وقفه می‌خواهد دوباره بنشیند پشت ساز.",
    points: [
      "وضعیت دست و بدن، از جلسه‌ی اول",
      "خواندن نُت، آرام و پیوسته",
      "قطعه‌هایی که خودت دوست داری",
    ],
  },
  {
    id: "violin",
    name: "ویولن",
    tagline: "ساز آرشه ای، از مبتدی تا پیشرفته",
    intro:
      "برای مبتدی و برای کسی که می‌خواهد ادامه بدهد؛ از صداسازی تا اولین جمله‌ها.",
    points: [
      "گرفتن ساز و آرشه، بدون عجله",
      "کوک و صداسازی، گوش به گوش",
      "تمرین‌های کوتاه برای دست و گوش",
    ],
  },
] as const;

/** Vocabulary the studio actually uses, scrolling past as a marquee. */
export const terms: { term: string; gloss: string }[] = [
  { term: "Andante", gloss: "قدم‌زنان" },
  { term: "Legato", gloss: "پیوسته" },
  { term: "Pizzicato", gloss: "با انگشت" },
  { term: "Crescendo", gloss: "کم‌کم بلندتر" },
  { term: "Adagio", gloss: "آرام" },
  { term: "Vibrato", gloss: "لرزشِ نُت" },
  { term: "Rubato", gloss: "با آزادیِ زمان" },
  { term: "Arco", gloss: "با آرشه" },
  { term: "Sotto voce", gloss: "زیر لب" },
  { term: "Allegro", gloss: "تند و شاد" },
];

export const instrumentFacts: Record<
  Instrument,
  { label: string; value: string }[]
> = {
  piano: [
    { label: "کلاژه", value: "۸۸ عدد" },
    { label: "سفید و سیاه", value: "۵۲ و ۳۶" },
    { label: "گستره‌ی صدا", value: "لا۰ تا دو۸" },
    { label: "اولین جلسه", value: "نشستن و وضعیت دست" },
  ],
  violin: [
    { label: "سیم", value: "۴ عدد" },
    { label: "کوک", value: "سل · ر · لا · می" },
    { label: "فاصله‌ی سیم‌ها", value: "پنجمِ درست" },
    { label: "اولین جلسه", value: "گرفتن ساز و آرشه" },
  ],
};

export type Piece = {
  title: string;
  composer: string;
  level: "پایه" | "میانه" | "پیشرفته";
};

export const repertoire: Record<Instrument, Piece[]> = {
  piano: [
    { title: "پرلود در دو ماژور", composer: "باخ", level: "پایه" },
    { title: "ژیم‌نوپدی شمارهٔ ۱", composer: "اریک ساتی", level: "پایه" },
    { title: "برای الیزه", composer: "بتهوون", level: "میانه" },
    { title: "والس در لا مینور", composer: "شوپن", level: "میانه" },
    { title: "سونات مهتاب، موومان اول", composer: "بتهوون", level: "پیشرفته" },
    { title: "رقص مجارستانی شمارهٔ ۵", composer: "برامس", level: "پیشرفته" },
  ],
  violin: [
    { title: "مینوئت در سل ماژور", composer: "باخ", level: "پایه" },
    { title: "هوا روی سیم سل", composer: "باخ", level: "میانه" },
    { title: "کانن در ر", composer: "پاخلبل", level: "میانه" },
    { title: "سالوت دامور", composer: "الگار", level: "میانه" },
    { title: "مدیتاسیون از تائیس", composer: "ماسنه", level: "پیشرفته" },
    { title: "چاردش", composer: "مونتی", level: "پیشرفته" },
  ],
};

export const classFlow = [
  {
    n: "۰۱",
    title: "آشنایی و تعیین سطح",
    text: "می‌بینیم کجایی، چه شنیده‌ای و چه می‌خواهی. اگر تازه‌کاری، از صفر شروع می‌کنیم.",
  },
  {
    n: "۰۲",
    title: "وضعیت دست و بدن",
    text: "نشستن، مچ، انگشت‌ها. این جلسه‌ها حوصله می‌خواهند ولی بعداً همه‌چیز را آسان می‌کنند.",
  },
  {
    n: "۰۳",
    title: "تمرین کوتاهِ هفتگی",
    text: "هر هفته یک تمرین کوچک که واقعاً وقتش را داری؛ بیست دقیقه‌ی درست بهتر از دو ساعتِ پراکنده است.",
  },
  {
    n: "۰۴",
    title: "قطعه‌ی دلخواه",
    text: "از همان هفته‌های اول تکه‌ای از قطعه‌ای که دوست داری می‌نوازی، نه فقط تمرینِ خشک.",
  },
];

export const firstSession = [
  "اگر ساز داری بیاور؛ اگر نداری در پیام بگو تا هماهنگ کنیم.",
  "اسم یک قطعه که دوستش داری، حتی اگر فقط شنیده‌ای‌اش.",
  "اگر قبلاً نواخته‌ای، آخرین چیزی که تمرین کردی.",
  "روزی چند دقیقه واقعاً می‌توانی تمرین کنی.",
];

export const chooserQuestions = [
  {
    q: "چه صدایی را بیشتر دوست داری؟",
    options: [
      { text: "صدای کامل، با چند نُت هم‌زمان", to: "piano" as Instrument },
      { text: "صدای کشیده و آوازگونه", to: "violin" as Instrument },
    ],
  },
  {
    q: "ساز کجا می‌ماند؟",
    options: [
      { text: "یک گوشه‌ی ثابت در خانه", to: "piano" as Instrument },
      { text: "همراهم، در کیفش", to: "violin" as Instrument },
    ],
  },
  {
    q: "اولین چیزی که می‌خواهی بنوازی چیست؟",
    options: [
      { text: "یک قطعه‌ی کامل با دو دست", to: "piano" as Instrument },
      { text: "یک ملودی که خودم شکلش بدهم", to: "violin" as Instrument },
    ],
  },
];

export const eventKinds = [
  "دورهمی خانوادگی",
  "مراسم عقد یا عروسی",
  "رویداد کاری",
  "کافه یا گالری",
];

export const lessonTimes = ["صبح", "ظهر", "عصر", "شب", "آخر هفته"];

export const levels = [
  { id: "new", label: "تازه‌کارم" },
  { id: "return", label: "بعد از وقفه برمی‌گردم" },
  { id: "continue", label: "قبلاً نواخته‌ام" },
];
