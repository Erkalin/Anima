import { NextResponse, connection, type NextRequest } from "next/server";
import {
  MAX_BODY,
  MAX_NAME,
  conversationByToken,
  sendMessage,
  setTyping,
  startConversation,
  toggleReaction,
  visitorPoll,
} from "@/lib/chat";
import { isOnline, isTyping } from "@/lib/chat/types";

// Visitor live chat. Identity is a random UUID token the widget keeps in
// localStorage and sends as x-visitor-token; it is the only key to the
// visitor's own conversation. All storage access is server-side.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Send throttle: 20 messages / minute per visitor token.
const hits = new Map<string, number[]>();
function throttled(token: string) {
  const now = Date.now();
  const arr = (hits.get(token) || []).filter((t) => now - t < 60_000);
  if (arr.length >= 20) return true;
  arr.push(now);
  hits.set(token, arr);
  return false;
}

const cleanName = (v: unknown) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, MAX_NAME) : "";
const cleanBody = (v: unknown) =>
  typeof v === "string" ? v.trim().slice(0, MAX_BODY) : "";

function publicConv(c: {
  id: string;
  visitorName: string;
  createdAt: string;
  archived: boolean;
  adminSeenAt: string | null;
  adminTypingAt: string | null;
}) {
  return {
    id: c.id,
    name: c.visitorName,
    createdAt: c.createdAt,
    archived: c.archived,
    adminOnline: isOnline(c.adminSeenAt),
    adminTyping: isTyping(c.adminTypingAt),
  };
}

export async function GET(req: NextRequest) {
  await connection();
  const token = req.headers.get("x-visitor-token") || "";
  if (!UUID_RE.test(token)) {
    return NextResponse.json({ started: false });
  }
  const serverNow = new Date().toISOString();
  try {
    // Lightweight probe for the closed-widget badge.
    if (req.nextUrl.searchParams.get("meta") === "1") {
      const conv = await conversationByToken(token);
      if (!conv) return NextResponse.json({ started: false });
      return NextResponse.json({
        started: true,
        name: conv.visitorName,
        unread: conv.unreadVisitor,
        adminOnline: isOnline(conv.adminSeenAt),
      });
    }
    const since = req.nextUrl.searchParams.get("since");
    const poll = await visitorPoll(
      token,
      since && !Number.isNaN(Date.parse(since)) ? since : null,
    );
    if (!poll) return NextResponse.json({ started: false });
    return NextResponse.json({
      started: true,
      conversation: publicConv(poll.conversation),
      messages: poll.messages,
      serverNow,
    });
  } catch {
    return NextResponse.json({ error: "store" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await connection();
  const token = req.headers.get("x-visitor-token") || "";
  if (!UUID_RE.test(token)) {
    return NextResponse.json({ error: "token" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  const action = typeof body.action === "string" ? body.action : "";

  try {
    if (action === "start") {
      const name = cleanName(body.name);
      if (!name) return NextResponse.json({ error: "name" }, { status: 400 });
      const conv = await startConversation(token, name);
      return NextResponse.json({ conversation: publicConv(conv) });
    }

    const conv = await conversationByToken(token);
    if (!conv) return NextResponse.json({ error: "conversation" }, { status: 404 });

    switch (action) {
      case "rename":
      case "edit":
      case "delete":
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      case "send": {
        const text = cleanBody(body.body);
        if (!text) return NextResponse.json({ error: "body" }, { status: 400 });
        if (throttled(token)) {
          return NextResponse.json({ error: "rate" }, { status: 429 });
        }
        const message = await sendMessage(conv.id, "visitor", text);
        return NextResponse.json({ message });
      }
      case "react": {
        const id = typeof body.id === "string" ? body.id : "";
        const emoji = typeof body.emoji === "string" ? body.emoji : "";
        const message = await toggleReaction(id, "visitor", emoji);
        if (!message) return NextResponse.json({ error: "bad" }, { status: 400 });
        return NextResponse.json({ message });
      }
      case "typing": {
        await setTyping(conv.id, "visitor", body.on === true);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "store" }, { status: 500 });
  }
}