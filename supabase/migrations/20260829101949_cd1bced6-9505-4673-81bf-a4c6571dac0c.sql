
CREATE TABLE public.bot_users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  username text,
  first_name text,
  full_name text,
  phone text,
  role text,
  birth_year int,
  parent_phone text,
  parent_id uuid references public.bot_users(id) on delete set null,
  parent_secret text,
  is_verified boolean not null default false,
  state text not null default 'new',
  state_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT ALL ON public.bot_users TO service_role;
ALTER TABLE public.bot_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.channels (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null,
  title text not null,
  url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
GRANT ALL ON public.channels TO service_role;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.patent_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.bot_users(id) on delete cascade,
  telegram_id bigint,
  title text not null,
  description text not null,
  digital_seal text not null,
  status text not null default 'new',
  ministry_ref text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
GRANT ALL ON public.patent_applications TO service_role;
ALTER TABLE public.patent_applications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.bot_users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.waitlist (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text not null,
  contact text not null,
  created_at timestamptz not null default now()
);
GRANT ALL ON public.waitlist TO service_role;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_settings (key, value) VALUES
  ('ministry_email', 'info@adliya.uz'),
  ('ministry_name', 'O''zbekiston Respublikasi Adliya vazirligi');
