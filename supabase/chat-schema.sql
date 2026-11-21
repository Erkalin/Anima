-- آموزشگاه موسیقی آنیما — live chat schema (visitor ↔ admin team)
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Idempotent: safe to re-run. All access goes through the server with the
-- service_role key; RLS is enabled with NO anon policies, so the public
-- anon key cannot read or write chat data directly.

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  visitor_token uuid not null unique,
  visitor_name text not null default '',
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  last_preview text not null default '',
  unread_admin integer not null default 0,
  unread_visitor integer not null default 0,
  archived boolean not null default false,
  visitor_seen_at timestamptz,
  admin_seen_at timestamptz,
  visitor_typing_at timestamptz,
  admin_typing_at timestamptz
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  sender text not null check (sender in ('visitor', 'admin')),
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  reactions jsonb not null default '{}'::jsonb
);

create index if not exists chat_messages_conv_idx
  on public.chat_messages (conversation_id, created_at);
create index if not exists chat_messages_updated_idx
  on public.chat_messages (updated_at);
create index if not exists chat_conversations_last_idx
  on public.chat_conversations (last_message_at desc);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;