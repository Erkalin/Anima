import { NextResponse, connection, type NextRequest } from "next/server";

// Gemini key rotation: try the primary model across every key (key 1 → n),
// then fall back to the secondary model across every key. Keys live only in
// server env — never shipped to the browser.
const PRIMARY = process.env.GEMINI_MODEL_PRIMARY || "gemini-3.5-flash-lite";
const FALLBACK = process.env.GEMINI_MODEL_FALLBACK || "gemini-3.1-flash-lite";
const KEYS = (process.env.GEMINI_API_KEYS || "")
  .split(/[,\s]+/)
  .map((k) => k.trim())
  .filter(Boolean);

const SYSTEM = `تو «دستیار آنیما» هستی، دستیار هوشمند وب‌سایت آموزشگاه موسیقی آنیما.
- آنیما آموزشگاه پیانو و ویولن است: پیانو (ساز کلاویه‌ای) و ویولن (ساز آرشه‌ای)، از مبتدی تا پیشرفته.
- درباره‌ی کلاس‌ها، سازها، روش شروع و بخش‌های سایت پاسخ بده؛ کوتاه، گرم و به فارسی (حداکثر ۳–۴ جمله).
- قیمت دقیق، زمان‌بندی و ظرفیت کلاس‌ها را نمی‌دانی؛ برای این‌ها و برای ثبت‌نام، کاربر را به تیم آنیما در تلگرام/بله یا فرم تماس سایت ارجاع بده.
- اگر کاربر انگلیسی نوشت، فارسی پاسخ بده مگر اینکه صراحتاً پاسخ انگلیسی بخواهد.
- در موضوعات نامرتبط، مؤدبانه گفتگو را به سمت موسیقی و آنیما برگردان.
- هرگز ادعا نکن انسان هستی؛ تو دستیار هوشمند سایت هستی.`;

type Msg = { role: "user" | "model"; text: string };

// Simple in-memory throttle: 20 requests / 10 minutes per IP.
const hits = new Map<string, number[]>();
function throttled(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  if (arr.length >= 20) return true;
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

async function ask(model: string, key: string, messages: Msg[]) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
        signal: ctrl.signal,
      },
    );
    if (!res.ok) return { ok: false as const };
    const data = await res.json();
    const text: string =
      data.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text || "")
        .join("")
        .trim() || "";
    if (!text) return { ok: false as const };
    return { ok: true as const, text };
  } catch {
    return { ok: false as const };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: NextRequest) {
  if (!KEYS.length) {
    return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (throttled(ip)) {
    return NextResponse.json({ error: "rate" }, { status: 429 });
  }

  let body: { messages?: Msg[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  const messages = (body.messages || [])
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "model") &&
        typeof m.text === "string" &&
        m.text.trim(),
    )
    .slice(-12)
    .map((m) => ({ role: m.role, text: m.text.slice(0, 2000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }

  for (const model of [PRIMARY, FALLBACK]) {
    for (const key of KEYS) {
      const r = await ask(model, key, messages);
      if (r.ok) return NextResponse.json({ reply: r.text });
    }
  }
  return NextResponse.json({ error: "unavailable" }, { status: 502 });
}

// Status probe for the widget header. connection() keeps this request-time
// under Cache Components, so key configuration is never baked in at build.
export async function GET() {
  await connection();
  const configured =
    (process.env.GEMINI_API_KEYS || "").split(/[,\s]+/).filter(Boolean).length > 0;
  return NextResponse.json({ configured });
}