// Shared chat types + constants. Client-safe (no server imports): the widget
// and the admin inbox both use the presence helpers and the emoji whitelist.

export type ChatSender = "visitor" | "admin";

/** emoji → the parties that reacted with it (max one entry per party). */
export type ReactionMap = Record<string, ChatSender[]>;

export type ChatMessage = {
  id: string;
  conversationId: string;
  sender: ChatSender;
  body: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  reactions: ReactionMap;
};

export type ChatConversation = {
  id: string;
  visitorToken: string;
  visitorName: string;
  createdAt: string;
  lastMessageAt: string;
  lastPreview: string;
  unreadAdmin: number;
  unreadVisitor: number;
  archived: boolean;
  visitorSeenAt: string | null;
  adminSeenAt: string | null;
  visitorTypingAt: string | null;
  adminTypingAt: string | null;
};

export const REACTION_EMOJIS = ["❤️", "👍", "😂", "😮", "🙏", "🎵"];
export const MAX_BODY = 2000;
export const MAX_NAME = 60;

/** Seen within 45s counts as online; a typing ping expires after 5s. */
export const isOnline = (iso: string | null | undefined) =>
  Boolean(iso) && Date.now() - new Date(iso as string).getTime() < 45_000;

export const isTyping = (iso: string | null | undefined) =>
  Boolean(iso) && Date.now() - new Date(iso as string).getTime() < 5_000;