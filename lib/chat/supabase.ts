// Supabase chat backend — same interface as ./local, via the service client
// (bypasses RLS; server-only). Tables: supabase/chat-schema.sql.

import { serviceClient } from "../db/supabase";
import type {
  ChatConversation,
  ChatMessage,
  ChatSender,
  ReactionMap,
} from "./types";
import { REACTION_EMOJIS } from "./types";

type Row = Record<string, unknown>;

const str = (v: unknown, fallback = "") =>
  typeof v === "string" ? v : fallback;
const num = (v: unknown, fallback = 0) =>
  typeof v === "number" ? v : fallback;
const nullable = (v: unknown) => (typeof v === "string" ? v : null);

function toConversation(r: Row): ChatConversation {
  return {
    id: str(r.id),
    visitorToken: str(r.visitor_token),
    visitorName: str(r.visitor_name),
    createdAt: str(r.created_at),
    lastMessageAt: str(r.last_message_at),
    lastPreview: str(r.last_preview),
    unreadAdmin: num(r.unread_admin),
    unreadVisitor: num(r.unread_visitor),
    archived: r.archived === true,
    visitorSeenAt: nullable(r.visitor_seen_at),
    adminSeenAt: nullable(r.admin_seen_at),
    visitorTypingAt: nullable(r.visitor_typing_at),
    adminTypingAt: nullable(r.admin_typing_at),
  };
}

function toMessage(r: Row): ChatMessage {
  const raw = r.reactions;
  const reactions: ReactionMap = {};
  if (raw && typeof raw === "object") {
    for (const [emoji, list] of Object.entries(raw as Row)) {
      if (Array.isArray(list)) {
        const parties = list.filter(
          (s): s is ChatSender => s === "visitor" || s === "admin",
        );
        if (parties.length) reactions[emoji] = parties;
      }
    }
  }
  return {
    id: str(r.id),
    conversationId: str(r.conversation_id),
    sender: r.sender === "admin" ? "admin" : "visitor",
    body: str(r.body),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
    editedAt: nullable(r.edited_at),
    deletedAt: nullable(r.deleted_at),
    reactions,
  };
}

function fail(context: string, error: { message: string } | null): void {
  if (error) throw new Error(`chat/${context}: ${error.message}`);
}

const now = () => new Date().toISOString();
const previewOf = (body: string) =>
  body.replace(/\s+/g, " ").trim().slice(0, 90);

// ------------------------------------------------------------ conversations

export async function startConversation(
  token: string,
  name: string,
): Promise<ChatConversation> {
  const db = serviceClient();
  const found = await db
    .from("chat_conversations")
    .select("*")
    .eq("visitor_token", token)
    .maybeSingle();
  fail("start.lookup", found.error);
  if (found.data) return toConversation(found.data);
  const upserted = await db
    .from("chat_conversations")
    .upsert(
      { visitor_token: token, visitor_name: name, visitor_seen_at: now() },
      { onConflict: "visitor_token", ignoreDuplicates: true },
    )
    .select("*")
    .maybeSingle();
  fail("start.insert", upserted.error);
  if (upserted.data) return toConversation(upserted.data);
  const retry = await db
    .from("chat_conversations")
    .select("*")
    .eq("visitor_token", token)
    .single();
  fail("start.retry", retry.error);
  return toConversation(retry.data);
}

export async function conversationByToken(
  token: string,
): Promise<ChatConversation | null> {
  const { data, error } = await serviceClient()
    .from("chat_conversations")
    .select("*")
    .eq("visitor_token", token)
    .maybeSingle();
  fail("byToken", error);
  return data ? toConversation(data) : null;
}

export async function renameConversation(
  token: string,
  name: string,
): Promise<ChatConversation | null> {
  const { data, error } = await serviceClient()
    .from("chat_conversations")
    .update({ visitor_name: name })
    .eq("visitor_token", token)
    .select("*")
    .maybeSingle();
  fail("rename", error);
  return data ? toConversation(data) : null;
}

export async function listConversations(): Promise<ChatConversation[]> {
  const { data, error } = await serviceClient()
    .from("chat_conversations")
    .select("*")
    .neq("last_preview", "")
    .order("last_message_at", { ascending: false })
    .limit(300);
  fail("list", error);
  return (data ?? []).map(toConversation);
}

export async function unreadTotal(): Promise<number> {
  const { data, error } = await serviceClient()
    .from("chat_conversations")
    .select("unread_admin")
    .eq("archived", false);
  fail("unread", error);
  return (data ?? []).reduce((sum, r) => sum + num(r.unread_admin), 0);
}

export async function setArchived(
  id: string,
  archived: boolean,
): Promise<void> {
  const { error } = await serviceClient()
    .from("chat_conversations")
    .update({ archived })
    .eq("id", id);
  fail("archive", error);
}

export async function removeConversation(id: string): Promise<void> {
  const { error } = await serviceClient()
    .from("chat_conversations")
    .delete()
    .eq("id", id);
  fail("remove", error);
}

// ------------------------------------------------------------------ polling

const INITIAL_LIMIT = 150;

async function threadMessages(
  convId: string,
  since: string | null,
): Promise<ChatMessage[]> {
  const db = serviceClient();
  const query = db
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", convId);
  const { data, error } = since
    ? await query.gt("updated_at", since).order("created_at", { ascending: true })
    : await query
        .order("created_at", { ascending: false })
        .limit(INITIAL_LIMIT);
  fail("thread", error);
  const rows = (data ?? []).map(toMessage);
  return since
    ? rows
    : rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function visitorPoll(token: string, since: string | null) {
  const conv = await conversationByToken(token);
  if (!conv) return null;
  const messages = await threadMessages(conv.id, since);
  const { error } = await serviceClient()
    .from("chat_conversations")
    .update({ unread_visitor: 0, visitor_seen_at: now() })
    .eq("id", conv.id);
  fail("visitorPoll.read", error);
  return {
    conversation: { ...conv, unreadVisitor: 0, visitorSeenAt: now() },
    messages,
  };
}

export async function adminPoll(convId: string, since: string | null) {
  const { data, error } = await serviceClient()
    .from("chat_conversations")
    .select("*")
    .eq("id", convId)
    .maybeSingle();
  fail("adminPoll.lookup", error);
  if (!data) return null;
  const conv = toConversation(data);
  const messages = await threadMessages(convId, since);
  const upd = await serviceClient()
    .from("chat_conversations")
    .update({ unread_admin: 0, admin_seen_at: now() })
    .eq("id", convId);
  fail("adminPoll.read", upd.error);
  return {
    conversation: { ...conv, unreadAdmin: 0, adminSeenAt: now() },
    messages,
  };
}

// ----------------------------------------------------------------- messages

async function bumpConversation(
  convId: string,
  sender: ChatSender,
  body: string,
  at: string,
): Promise<void> {
  const db = serviceClient();
  const { data, error } = await db
    .from("chat_conversations")
    .select("unread_admin, unread_visitor")
    .eq("id", convId)
    .single();
  fail("bump.lookup", error);
  if (!data) throw new Error("chat/bump.lookup: missing conversation");
  const upd = await db
    .from("chat_conversations")
    .update({
      last_message_at: at,
      last_preview: previewOf(body),
      unread_admin: num(data.unread_admin) + (sender === "visitor" ? 1 : 0),
      unread_visitor: num(data.unread_visitor) + (sender === "admin" ? 1 : 0),
    })
    .eq("id", convId);
  fail("bump.update", upd.error);
}

export async function sendMessage(
  convId: string,
  sender: ChatSender,
  body: string,
): Promise<ChatMessage | null> {
  const db = serviceClient();
  const { data, error } = await db
    .from("chat_messages")
    .insert({ conversation_id: convId, sender, body })
    .select("*")
    .single();
  fail("send", error);
  if (!data) return null;
  const msg = toMessage(data);
  await bumpConversation(convId, sender, body, msg.createdAt);
  return msg;
}

async function messageById(id: string): Promise<ChatMessage | null> {
  const { data, error } = await serviceClient()
    .from("chat_messages")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  fail("message.lookup", error);
  return data ? toMessage(data) : null;
}

export async function editMessage(
  id: string,
  actor: ChatSender,
  body: string,
): Promise<ChatMessage | null> {
  const msg = await messageById(id);
  if (!msg || msg.sender !== actor || msg.deletedAt) return null;
  const at = now();
  const { data, error } = await serviceClient()
    .from("chat_messages")
    .update({ body, edited_at: at, updated_at: at })
    .eq("id", id)
    .select("*")
    .single();
  fail("edit", error);
  return data ? toMessage(data) : null;
}

export async function deleteMessage(
  id: string,
  actor: ChatSender,
): Promise<ChatMessage | null> {
  const msg = await messageById(id);
  if (!msg || msg.deletedAt) return null;
  if (actor === "visitor" && msg.sender !== "visitor") return null;
  const at = now();
  const { data, error } = await serviceClient()
    .from("chat_messages")
    .update({
      body: "",
      reactions: {},
      deleted_at: at,
      updated_at: at,
    })
    .eq("id", id)
    .select("*")
    .single();
  fail("delete", error);
  return data ? toMessage(data) : null;
}

export async function toggleReaction(
  id: string,
  actor: ChatSender,
  emoji: string,
): Promise<ChatMessage | null> {
  if (!REACTION_EMOJIS.includes(emoji)) return null;
  const msg = await messageById(id);
  if (!msg || msg.deletedAt) return null;
  const reactions: ReactionMap = { ...msg.reactions };
  const list = reactions[emoji] ?? [];
  reactions[emoji] = list.includes(actor)
    ? list.filter((s) => s !== actor)
    : [...list, actor];
  if (!reactions[emoji].length) delete reactions[emoji];
  const { data, error } = await serviceClient()
    .from("chat_messages")
    .update({ reactions, updated_at: now() })
    .eq("id", id)
    .select("*")
    .single();
  fail("react", error);
  return data ? toMessage(data) : null;
}

export async function setTyping(
  convId: string,
  who: ChatSender,
  on: boolean,
): Promise<void> {
  const patch =
    who === "visitor"
      ? { visitor_typing_at: on ? now() : null }
      : { admin_typing_at: on ? now() : null };
  const { error } = await serviceClient()
    .from("chat_conversations")
    .update(patch)
    .eq("id", convId);
  fail("typing", error);
}