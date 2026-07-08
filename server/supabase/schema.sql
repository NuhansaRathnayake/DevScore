-- DevScore — Data Tier schema (Supabase / Postgres)
-- Member 1 database ownership: users, oauth_sessions.
-- Apply via the Supabase SQL editor or `supabase db push`.

-- ---------------------------------------------------------------------------
-- users  (SDS logical design: User + name fields)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  first_name     text not null default '',
  last_name      text not null default '',
  avatar_url     text not null default '',
  role           text not null default 'student'
                   check (role in ('student', 'recruiter', 'admin')),
  oauth_provider text not null check (oauth_provider in ('google', 'github')),
  oauth_id       text not null,
  -- Student's linked GitHub identity (FR 9/10) — set once the GitHub OAuth
  -- connect flow succeeds; the access token itself lives in oauth_sessions.
  github_username     text,
  github_connected_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- One account per provider identity (supports existing-user detection, FR 6).
  unique (oauth_provider, oauth_id)
);

-- ---------------------------------------------------------------------------
-- oauth_sessions  (FR 7 — server-side session tokens; SDS §4.7.5 audit trail)
-- ---------------------------------------------------------------------------
create table if not exists public.oauth_sessions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.users (id) on delete cascade,
  provider               text not null check (provider in ('google', 'github')),
  -- Opaque id embedded in the JWT (jti) so a token can be revoked server-side.
  token_id               text not null unique,
  -- Encrypted provider access token (via secureToken util; AES-256 is Member 5).
  encrypted_access_token text,
  user_agent             text not null default '',
  ip                     text not null default '',
  revoked_at             timestamptz,
  expires_at             timestamptz not null,
  created_at             timestamptz not null default now()
);

create index if not exists oauth_sessions_user_id_idx on public.oauth_sessions (user_id);

-- The API accesses these tables only through the service-role key, so RLS is
-- enabled with no public policies (deny-by-default for anon/authenticated).
alter table public.users enable row level security;
alter table public.oauth_sessions enable row level security;
