-- DevScore — Data Tier schema (Supabase / Postgres)
-- Member 1 database ownership: users, oauth_sessions.
-- Apply via the Supabase SQL editor or `supabase db push`.
--
-- Table layout (SDS logical design): users (identity/auth only),
-- oauth_sessions (session audit trail), github_connections (1:1 per
-- student), resumes (1:1 per student, current resume), skills (canonical
-- catalog), resume_skills (junction — one row per skill found in a resume).

-- ---------------------------------------------------------------------------
-- users  — identity and authentication ONLY. Resume/GitHub/skills data used
-- to live here as bolted-on columns; they now live in their own tables below.
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  first_name     text not null default '',
  last_name      text not null default '',
  avatar_url     text not null default '',
  role           text not null default 'student'
                   check (role in ('student', 'recruiter', 'admin')),
  -- Identity provider for this account. 'local' = email/password signup;
  -- oauth_id/oauth_provider are both null for local accounts.
  oauth_provider text check (oauth_provider in ('google', 'github')),
  oauth_id       text,
  -- Set only for local (email/password) accounts — bcrypt hash, never plaintext.
  password_hash  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- One account per provider identity (supports existing-user detection, FR 6).
  -- Postgres treats NULLs as distinct, so multiple local (null, null) rows are fine.
  unique (oauth_provider, oauth_id),
  -- Every account must be reachable through at least one credential.
  constraint users_has_credential check (
    (oauth_provider is not null and oauth_id is not null) or password_hash is not null
  )
);

-- Idempotent upgrade path for databases created before password auth existed.
alter table public.users add column if not exists password_hash text;
alter table public.users alter column oauth_provider drop not null;
alter table public.users alter column oauth_id drop not null;
alter table public.users drop constraint if exists users_has_credential;
alter table public.users add constraint users_has_credential check (
  (oauth_provider is not null and oauth_id is not null) or password_hash is not null
);

-- ---------------------------------------------------------------------------
-- oauth_sessions  (FR 7 — server-side session tokens; SDS §4.7.5 audit trail)
-- ---------------------------------------------------------------------------
create table if not exists public.oauth_sessions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.users (id) on delete cascade,
  provider               text not null check (provider in ('google', 'github', 'local')),
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

-- Idempotent upgrade path for the 'local' (email/password) provider value.
alter table public.oauth_sessions drop constraint if exists oauth_sessions_provider_check;
alter table public.oauth_sessions add constraint oauth_sessions_provider_check
  check (provider in ('google', 'github', 'local'));

-- ---------------------------------------------------------------------------
-- job_roles  (recruiter-authored postings a student applies to before we have
-- anything to score them against)
-- ---------------------------------------------------------------------------
-- Declared before job_applications, which references it.
create table if not exists public.job_roles (
  id              uuid primary key default gen_random_uuid(),
  recruiter_id    uuid not null references public.users (id) on delete cascade,
  title           text not null,
  description     text not null default '',
  -- Skills the role asks for, as a flat jsonb array of names:
  -- ["React", "PostgreSQL", ...]. jsonb rather than text[] so this column and
  -- users.claimed_skills (also jsonb) stay one type end-to-end — the eventual
  -- claimed-vs-required comparison then reads both through the same JSON
  -- round-trip, with no PostgREST array-literal escaping to get wrong.
  required_skills jsonb not null default '[]'::jsonb,
  employment_type text not null default 'full-time'
                    check (employment_type in ('full-time', 'part-time', 'internship', 'contract')),
  location        text not null default '',
  -- A closed posting stops accepting new applications but keeps its applicants.
  status          text not null default 'open'
                    check (status in ('open', 'closed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists job_roles_recruiter_id_idx on public.job_roles (recruiter_id);
create index if not exists job_roles_status_idx on public.job_roles (status);

-- Idempotent upgrade path for the employment_type / status value sets.
alter table public.job_roles drop constraint if exists job_roles_employment_type_check;
alter table public.job_roles add constraint job_roles_employment_type_check
  check (employment_type in ('full-time', 'part-time', 'internship', 'contract'));
alter table public.job_roles drop constraint if exists job_roles_status_check;
alter table public.job_roles add constraint job_roles_status_check
  check (status in ('open', 'closed'));

-- ---------------------------------------------------------------------------
-- job_applications  (student -> job_role; a student may apply to many roles)
-- ---------------------------------------------------------------------------
-- The resume and the GitHub link stay one-per-student on public.users and are
-- shared across every application, so an application row carries no artefacts
-- of its own — the (job_id, student_id) pair plus a timestamp is the whole fact.
create table if not exists public.job_applications (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references public.job_roles (id) on delete cascade,
  student_id uuid not null references public.users (id) on delete cascade,
  applied_at timestamptz not null default now(),
  -- One application per student per role; withdrawing deletes the row.
  unique (job_id, student_id)
);

create index if not exists job_applications_job_id_idx on public.job_applications (job_id);
create index if not exists job_applications_student_id_idx on public.job_applications (student_id);

-- The API accesses these tables only through the service-role key, so RLS is
-- enabled with no public policies (deny-by-default for anon/authenticated).
alter table public.users enable row level security;
alter table public.oauth_sessions enable row level security;
alter table public.job_roles enable row level security;
alter table public.job_applications enable row level security;
