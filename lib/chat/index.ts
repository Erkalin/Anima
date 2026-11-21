import "server-only";
import { storageMode } from "../db";
import * as local from "./local";
import * as remote from "./supabase";

export type {
  ChatConversation,
  ChatMessage,
  ChatSender,
  ReactionMap,
} from "./types";
export { REACTION_EMOJIS, MAX_BODY, MAX_NAME } from "./types";

const isRemote = () => storageMode() === "supabase";

export async function startConversation(token: string, name: string) {
  return isRemote()
    ? remote.startConversation(token, name)
    : local.startConversation(token, name);
}

export async function conversationByToken(token: string) {
  return isRemote()
    ? remote.conversationByToken(token)
    : local.conversationByToken(token);
}

export async function renameConversation(token: string, name: string) {
  return isRemote()
    ? remote.renameConversation(token, name)
    : local.renameConversation(token, name);
}

export async function listConversations() {
  return isRemote() ? remote.listConversations() : local.listConversations();
}

export async function unreadTotal() {
  return isRemote() ? remote.unreadTotal() : local.unreadTotal();
}

export async function setArchived(id: string, archived: boolean) {
  return isRemote()
    ? remote.setArchived(id, archived)
    : local.setArchived(id, archived);
}

export async function removeConversation(id: string) {
  return isRemote()
    ? remote.removeConversation(id)
    : local.removeConversation(id);
}

export async function visitorPoll(token: string, since: string | null) {
  return isRemote()
    ? remote.visitorPoll(token, since)
    : local.visitorPoll(token, since);
}

export async function adminPoll(convId: string, since: string | null) {
  return isRemote()
    ? remote.adminPoll(convId, since)
    : local.adminPoll(convId, since);
}

export async function sendMessage(
  convId: string,
  sender: "visitor" | "admin",
  body: string,
) {
  return isRemote()
    ? remote.sendMessage(convId, sender, body)
    : local.sendMessage(convId, sender, body);
}

export async function editMessage(
  id: string,
  actor: "visitor" | "admin",
  body: string,
) {
  return isRemote()
    ? remote.editMessage(id, actor, body)
    : local.editMessage(id, actor, body);
}

export async function deleteMessage(id: string, actor: "visitor" | "admin") {
  return isRemote()
    ? remote.deleteMessage(id, actor)
    : local.deleteMessage(id, actor);
}

export async function toggleReaction(
  id: string,
  actor: "visitor" | "admin",
  emoji: string,
) {
  return isRemote()
    ? remote.toggleReaction(id, actor, emoji)
    : local.toggleReaction(id, actor, emoji);
}

export async function setTyping(
  convId: string,
  who: "visitor" | "admin",
  on: boolean,
) {
  return isRemote()
    ? remote.setTyping(convId, who, on)
    : local.setTyping(convId, who, on);
}