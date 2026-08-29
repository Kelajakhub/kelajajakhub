alter table public.bot_users add column if not exists bio text;
alter table public.bot_users add column if not exists expertise text;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.bot_users(id) on delete cascade,
  title text not null,
  description text not null,
  logo_url text,
  funding_goal text,
  looking_for_team boolean not null default false,
  team_note text,
  telegram_group_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.projects to service_role;
alter table public.projects enable row level security;

create table if not exists public.mentor_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  mentor_id uuid not null references public.bot_users(id) on delete cascade,
  user_id uuid not null references public.bot_users(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (project_id, mentor_id)
);
grant all on public.mentor_links to service_role;
alter table public.mentor_links enable row level security;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.bot_users(id) on delete cascade,
  mentor_id uuid references public.bot_users(id) on delete cascade,
  kind text not null default 'mentor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.conversations to service_role;
alter table public.conversations enable row level security;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.bot_users(id) on delete set null,
  sender_role text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_conv on public.messages(conversation_id, created_at);
grant all on public.messages to service_role;
alter table public.messages enable row level security;

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  investor_id uuid not null references public.bot_users(id) on delete cascade,
  amount text not null,
  message text,
  status text not null default 'pending_parent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.investments to service_role;
alter table public.investments enable row level security;

create or replace function public.purge_old_messages()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.messages where created_at < now() - interval '30 days';
$$;