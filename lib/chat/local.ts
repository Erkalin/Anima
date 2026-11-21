// Local-mode chat store (.data/chat.json) — mirrors lib/db/local.ts patterns.
// Used only when Supabase env vars are absent; Vercel always runs Supabase.

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  ChatConversation,
  ChatMessage,
  ChatSender,
  ReactionMap,
} from "./types";
import { REACTION_EMOJIS } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "chat.json");

type Store = { conversations: ChatConversation[]; messages: ChatMessage[] };

let cache: Store | null = null;

async function read(): Promise<Store> {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(await readFile(FILE, "utf8")) as Store;
    cache = {
      conversations: parsed.conversations ?? [],
      messages: parsed.messages ?? [],
    };
  } catch {
    cache = { conversations: [], messages: [] };
  }
  return cache;
}

async function write(store: Store): Promise<void> {
  cache = store;
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(store));
  await rename(tmp, FILE);
}

const now = () => new Date().toISOString();

function conversationOf(
  store: Store,
  id: string,
): ChatConversation | undefined {
  return store.conversations.find((c) => c.id === id);
}

function messageOf(store: Store, id: string): ChatMessage | undefined {
  return store.messages.find((m) => m.id === id);
}

function previewOf(body: string): string {
  return body.replace(/\s+/g, " ").trim().slice(0, 90);
}

// ------------------------------------------------------------ conversations

export async function startConversation(
  token: string,
  name: string,
): Promise<ChatConversation> {
  const store = await read();
  const existing = store.conversations.find((c) => c.visitorToken === token);
  if (existing) return existing;
  const conv: ChatConversation = {
    id: randomUUID(),
    visitorToken: token,
    visitorName: name,
    createdAt: now(),
    lastMessageAt: now(),
    lastPreview: "",
    unreadAdmin: 0,
    unreadVisitor: 0,
    archived: false,
    visitorSeenAt: now(),
    adminSeenAt: null,
    visitorTypingAt: null,
    adminTypingAt: null,
  };
  store.conversations.push(conv);
  await write(store);
  return conv;
}

export async function conversationByToken(
  token: string,
): Promise<ChatConversation | null> {
  const store = await read();
  return store.conversations.find((c) => c.visitorToken === token) ?? null;
}

export async function renameConversation(
  token: string,
  name: string,
): Promise<ChatConversation | null> {
  const store = await read();
  const conv = store.conversations.find((c) => c.visitorToken === token);
  if (!conv) return null;
  conv.visitorName = name;
  await write(store);
  return conv;
}

export async function listConversations(): Promise<ChatConversation[]> {
  const store = await read();
  return [...store.conversations].sort(
    (a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt),
  );
}

export async function unreadTotal(): Promise<number> {
  const store = await read();
  return store.conversations.reduce(
    (sum, c) => sum + (c.archived ? 0 : c.unreadAdmin),
    0,
  );
}

export async function setArchived(
  id: string,
  archived: boolean,
): Promise<void> {
  const store = await read();
  const conv = conversationOf(store, id);
  if (!conv) return;
  conv.archived = archived;
  await write(store);
}

export async function removeConversation(id: string): Promise<void> {
  const store = await read();
  store.conversations = store.conversations.filter((c) => c.id !== id);
  store.messages = store.messages.filter((m) => m.conversationId !== id);
  await write(store);
}

// ------------------------------------------------------------------ polling

const INITIAL_LIMIT = 150;

function threadMessages(
  store: Store,
  convId: string,
  since: string | null,
): ChatMessage[] {
  const all = store.messages.filter((m) => m.conversationId === convId);
  const picked = since
    ? all.filter((m) => m.updatedAt > since)
    : all
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, INITIAL_LIMIT);
  return picked.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** One read + one write per poll: messages, mark-read and presence together. */
export async function visitorPoll(token: string, since: string | null) {
  const store = await read();
  const conv = store.conversations.find((c) => c.visitorToken === token);
  if (!conv) return null;
  const messages = threadMessages(store, conv.id, since);
  conv.unreadVisitor = 0;
  conv.visitorSeenAt = now();
  await write(store);
  return { conversation: conv, messages };
}

export async function adminPoll(convId: string, since: string | null) {
  const store = await read();
  const conv = conversationOf(store, convId);
  if (!conv) return null;
  const messages = threadMessages(store, conv.id, since);
  conv.unreadAdmin = 0;
  conv.adminSeenAt = now();
  await write(store);
  return { conversation: conv, messages };
}

// ----------------------------------------------------------------- messages

export async function sendMessage(
  convId: string,
  sender: ChatSender,
  body: string,
): Promise<ChatMessage | null> {
  const store = await read();
  const conv = conversationOf(store, convId);
  if (!conv) return null;
  const msg: ChatMessage = {
    id: randomUUID(),
    conversationId: convId,
    sender,
    body,
    createdAt: now(),
    updatedAt: now(),
    editedAt: null,
    deletedAt: null,
    reactions: {},
  };
  store.messages.push(msg);
  conv.lastMessageAt = msg.createdAt;
  conv.lastPreview = previewOf(body);
  if (sender === "visitor") conv.unreadAdmin += 1;
  else conv.unreadVisitor += 1;
  await write(store);
  return msg;
}

export async function editMessage(
  id: string,
  actor: ChatSender,
  body: string,
): Promise<ChatMessage | null> {
  const store = await read();
  const msg = messageOf(store, id);
  if (!msg || msg.sender !== actor || msg.deletedAt) return null;
  msg.body = body;
  msg.editedAt = now();
  msg.updatedAt = msg.editedAt;
  const conv = conversationOf(store, msg.conversationId);
  if (conv && conv.lastMessageAt === msg.createdAt) {
    conv.lastPreview = previewOf(body);
  }
  await write(store);
  return msg;
}

/** Visitors delete only their own; admins may delete any message. */
export async function deleteMessage(
  id: string,
  actor: ChatSender,
): Promise<ChatMessage | null> {
  const store = await read();
  const msg = messageOf(store, id);
  if (!msg || msg.deletedAt) return null;
  if (actor === "visitor" && msg.sender !== "visitor") return null;
  msg.deletedAt = now();
  msg.updatedAt = msg.deletedAt;
  msg.body = "";
  msg.reactions = {};
  const conv = conversationOf(store, msg.conversationId);
  if (conv && conv.lastMessageAt === msg.createdAt) {
    conv.lastPreview = "این پیام حذف شد";
  }
  await write(store);
  return msg;
}

export async function toggleReaction(
  id: string,
  actor: ChatSender,
  emoji: string,
): Promise<ChatMessage | null> {
  if (!REACTION_EMOJIS.includes(emoji)) return null;
  const store = await read();
  const msg = messageOf(store, id);
  if (!msg || msg.deletedAt) return null;
  const reactions: ReactionMap = { ...msg.reactions };
  const list = reactions[emoji] ?? [];
  reactions[emoji] = list.includes(actor)
    ? list.filter((s) => s !== actor)
    : [...list, actor];
  if (!reactions[emoji].length) delete reactions[emoji];
  msg.reactions = reactions;
  msg.updatedAt = now();
  await write(store);
  return msg;
}

export async function setTyping(
  convId: string,
  who: ChatSender,
  on: boolean,
): Promise<void> {
  const store = await read();
  const conv = conversationOf(store, convId);
  if (!conv) return;
  if (who === "visitor") conv.visitorTypingAt = on ? now() : null;
  else conv.adminTypingAt = on ? now() : null;
  await write(store);
}