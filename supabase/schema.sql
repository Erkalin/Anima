-- آموزشگاه موسیقی — blog + admin schema
-- Run once in the Supabase SQL editor, then fill .env.local from .env.example.
-- The app talks to these tables with the service_role key on the server only;
-- the policies below are what the public anon key is allowed to see.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- people
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  -- must equal auth.users.id so the allow-list check is a single lookup
  user_id uuid unique references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null default '',
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);

create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default '',
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------- taxonomy
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  accent text not null default 'brass',
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------- media
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  kind text not null check (kind in ('image', 'video', 'audio', 'file')),
  mime text not null default 'application/octet-stream',
  size bigint not null default 0,
  width int,
  height int,
  alt text not null default '',
  caption text not null default '',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------- posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'scheduled', 'archived')),
  cover_url text,
  cover_alt text not null default '',
  cover_layout text not null default 'contained'
    check (cover_layout in ('bleed', 'contained', 'split', 'none')),
  category_id uuid references public.categories (id) on delete set null,
  tags text[] not null default '{}',
  author_id uuid references public.authors (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  featured boolean not null default false,
  toc boolean not null default true,
  reading_minutes int,
  typography jsonb not null default
    '{"scale":1,"leading":1.95,"measure":42,"accent":"brass"}'::jsonb,
  seo jsonb not null default
    '{"title":"","description":"","ogImage":null,"noindex":false}'::jsonb,
  custom_css text not null default '',
  show_author boolean not null default true,
  show_share boolean not null default true,
  show_related boolean not null default true,
  views bigint not null default 0
);

create index if not exists posts_status_published_idx
  on public.posts (status, published_at desc);
create index if not exists posts_slug_idx on public.posts (slug);
create index if not exists posts_category_idx on public.posts (category_id);
create index if not exists posts_tags_idx on public.posts using gin (tags);

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- keep updated_at honest without trusting the client
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- atomic view counter used by the public post page beacon
create or replace function public.increment_post_views(post_slug text)
returns void language sql security definer set search_path = public as $$
  update public.posts set views = views + 1
  where slug = post_slug and status = 'published';
$$;

-- ------------------------------------------------------------------- RLS
alter table public.admins enable row level security;
alter table public.authors enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.media enable row level security;
alter table public.posts enable row level security;
alter table public.settings enable row level security;

-- admins is an allow-list: never readable with the anon key
drop policy if exists "admins self read" on public.admins;
create policy "admins self read" on public.admins
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "public read authors" on public.authors;
create policy "public read authors" on public.authors
  for select to anon, authenticated using (true);

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "public read tags" on public.tags;
create policy "public read tags" on public.tags
  for select to anon, authenticated using (true);

drop policy if exists "public read media" on public.media;
create policy "public read media" on public.media
  for select to anon, authenticated using (true);

drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings
  for select to anon, authenticated using (true);

-- drafts stay invisible to the public key
drop policy if exists "public read published posts" on public.posts;
create policy "public read published posts" on public.posts
  for select to anon, authenticated
  using (status = 'published' and published_at <= now());

drop policy if exists "admins read all posts" on public.posts;
create policy "admins read all posts" on public.posts
  for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- --------------------------------------------------------------- storage
insert into storage.buckets (id, name, public)
values ('blog-media', 'blog-media', true)
on conflict (id) do nothing;

drop policy if exists "public read blog media" on storage.objects;
create policy "public read blog media" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'blog-media');

drop policy if exists "admins write blog media" on storage.objects;
create policy "admins write blog media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'blog-media'
    and exists (select 1 from public.admins a where a.user_id = auth.uid())
  );

drop policy if exists "admins delete blog media" on storage.objects;
create policy "admins delete blog media" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'blog-media'
    and exists (select 1 from public.admins a where a.user_id = auth.uid())
  );

-- ------------------------------------------------------------------ seed
insert into public.settings (id, data) values (1, '{
  "brand": "آنیما",
  "telegramUsername": "",
  "blogTitle": "وبلاگ آموزشگاه",
  "blogDescription": "نوشته‌هایی درباره‌ی تمرین، کوک، نُت‌خوانی و شروعِ پیانو و ویولن.",
  "postsPerPage": 6,
  "defaultAuthorId": null,
  "defaultToc": true,
  "defaultAccent": "brass"
}'::jsonb)
on conflict (id) do nothing;

insert into public.categories (name, slug, accent, description) values
  ('آموزش', 'teaching', 'brass', 'شروعِ کار، کلاس، و خواندنِ نُت.'),
  ('تمرین', 'practice', 'verdigris', 'روشِ تمرین کردن در خانه.'),
  ('سازها', 'instruments', 'steel', 'نگهداری، کوک و شناختِ ساز.'),
  ('رویداد', 'events', 'velvet', 'اعزام نوازنده و اجرا در مراسم.')
on conflict (slug) do nothing;

insert into public.authors (name, role, bio) values
  ('استاد پیانو', 'بنیان‌گذار آموزشگاه', 'پیانو درس می‌دهد؛ از اولین نشست پشت ساز تا قطعه‌های کوچک.'),
  ('استاد ویولن', 'ویولن', 'روی صداسازی و گرفتنِ درستِ آرشه کار می‌کند.'),
  ('تحریریه‌ی آموزشگاه', 'نوشته‌های عمومی', 'راهنماها و اطلاعیه‌های آموزشگاه.')
on conflict do nothing;

-- After creating your user in Authentication → Users, allow it in:
--   insert into public.admins (user_id, email, name, role)
--   values ('<auth user uuid>', 'you@example.com', 'مدیر آموزشگاه', 'owner');