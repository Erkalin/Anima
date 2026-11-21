import { NextResponse, connection, type NextRequest } from "next/server";
import { currentAdmin } from "@/lib/auth/dal";
import {
  MAX_BODY,
  adminPoll,
  deleteMessage,
  editMessage,
  listConversations,
  removeConversation,
  sendMessage,
  setArchived,
  setTyping,
  toggleReaction,
  unreadTotal,
} from "@/lib/chat";
import { isOnline, isTyping } from "@/lib/chat/types";

// Admin inbox API. Guarded by the sealed admin session cookie (same trust
// model as the panel reads). Visitors never reach these handlers.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cleanBody = (v: unknown) =>
  typeof v === "string" ? v.trim().slice(0, MAX_BODY) : "";

export async function GET(req: NextRequest) {
  await connection();
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const serverNow = new Date().toISOString();
  const convId = req.nextUrl.searchParams.get("conversation") || "";
  try {
    if (!convId) {
      const [conversations, unread] = await Promise.all([
        listConversations(),
        unreadTotal(),
      ]);
      return NextResponse.json({ conversations, unread, serverNow });
    }
    if (!UUID_RE.test(convId)) {
      return NextResponse.json({ error: "bad" }, { status: 400 });
    }
    const since = req.nextUrl.searchParams.get("since");
    const poll = await adminPoll(
      convId,
      since && !Number.isNaN(Date.parse(since)) ? since : null,
    );
    if (!poll) return NextResponse.json({ error: "conversation" }, { status: 404 });
    return NextResponse.json({
      conversation: poll.conversation,
      messages: poll.messages,
      visitorOnline: isOnline(poll.conversation.visitorSeenAt),
      visitorTyping: isTyping(poll.conversation.visitorTypingAt),
      serverNow,
    });
  } catch {
    return NextResponse.json({ error: "store" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await connection();
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  const action = typeof body.action === "string" ? body.action : "";
  const id = typeof body.id === "string" ? body.id : "";
  const convId = typeof body.conversation === "string" ? body.conversation : "";

  try {
    switch (action) {
      case "send": {
        const text = cleanBody(body.body);
        if (!text || !UUID_RE.test(convId)) {
          return NextResponse.json({ error: "bad" }, { status: 400 });
        }
        const message = await sendMessage(convId, "admin", text);
        if (!message) return NextResponse.json({ error: "conversation" }, { status: 404 });
        return NextResponse.json({ message });
      }
      case "edit": {
        const text = cleanBody(body.body);
        if (!text || !id) return NextResponse.json({ error: "bad" }, { status: 400 });
        const message = await editMessage(id, "admin", text);
        if (!message) return NextResponse.json({ error: "forbidden" }, { status: 403 });
        return NextResponse.json({ message });
      }
      case "delete": {
        // Admins may delete any message, on either side.
        const message = await deleteMessage(id, "admin");
        if (!message) return NextResponse.json({ error: "forbidden" }, { status: 403 });
        return NextResponse.json({ message });
      }
      case "react": {
        const emoji = typeof body.emoji === "string" ? body.emoji : "";
        const message = await toggleReaction(id, "admin", emoji);
        if (!message) return NextResponse.json({ error: "bad" }, { status: 400 });
        return NextResponse.json({ message });
      }
      case "typing": {
        if (!UUID_RE.test(convId)) return NextResponse.json({ error: "bad" }, { status: 400 });
        await setTyping(convId, "admin", body.on === true);
        return NextResponse.json({ ok: true });
      }
      case "archive": {
        if (!UUID_RE.test(convId)) return NextResponse.json({ error: "bad" }, { status: 400 });
        await setArchived(convId, body.on === true);
        return NextResponse.json({ ok: true });
      }
      case "remove": {
        if (!UUID_RE.test(convId)) return NextResponse.json({ error: "bad" }, { status: 400 });
        await removeConversation(convId);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "store" }, { status: 500 });
  }
}