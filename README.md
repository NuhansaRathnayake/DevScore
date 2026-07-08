# DevScore

**AI-Driven Job Readiness Scoring Using Semantic GitHub Analysis and Resume Verification for SE Roles**
Team Script Fusion — Final Year Project.

DevScore compares the skills a Software Engineering candidate *claims* on their resume
against *verifiable* evidence mined from their GitHub activity, and presents recruiters
with an evidence-based Job Readiness Score.

## Architecture (per SDS Chapter 2 — three-tier)

- **Client Tier** — `client/` — React.js (Vite) web application.
- **Application Logic Tier** — `server/` — Node.js + Express REST API.
- **Data Tier** — Supabase (Postgres), accessed via `@supabase/supabase-js`. Schema in `server/supabase/schema.sql`.
- **AI/ML Microservice** — Python 3.9 (added in a later implementation phase).

## Implementation status

This repository is at **Implementation 01 (Core System Development)**.

### Implemented in this pass — Member 1 (GRCL Rathnayake) authentication foundation
- OAuth sign-up / log-in entry point ("Sign in with Google").
- Google OAuth redirect + callback flow (structural; driven by environment config).
- Server-side secure session tokens (JWT) with an `OAuthSession` audit record.
- Role-based access control (Student / Recruiter / Admin).
- Role-appropriate dashboard shells with post-login redirect.
- `User` and `OAuthSession` data models (Member 1 database ownership).

See `docs`/project SRS & SDS for the full requirement set. Other members' modules
(resume upload & parsing, GitHub evidence mining, scoring engine, admin CRUD) are
scaffolded only where an integration seam is required.

## Getting started

```bash
# Backend
cd server
cp .env.example .env      # fill in Supabase URL + service-role key + Google OAuth
# apply the schema to your Supabase project (SQL editor or `supabase db push`):
#   server/supabase/schema.sql
npm install
npm run dev               # http://localhost:5000

# Frontend
cd client
npm install
npm run dev               # http://localhost:5173
```
