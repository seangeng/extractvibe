# Phase 0 — Project Scaffold & Infrastructure

> **Goal:** Deployable skeleton with auth, database, and dev tooling. Zero features, full stack wired.
> **Estimated:** 1 session

---

## 0.1 — Project Init

- [ ] Init project structure (`src/` for Worker, `app/` for frontend)
- [ ] Create `package.json` with scripts: `dev`, `deploy`, `db:migrate`
- [ ] Create `app/package.json` with frontend deps (React 19, React Router v7, Tailwind v4, shadcn/ui, Better Auth, lucide-react)
- [ ] `wrangler.jsonc` with bindings:
  - [ ] D1 database (`extractvibe-db`)
  - [ ] KV namespace (`CACHE`)
  - [ ] R2 bucket (`extractvibe-assets`)
  - [ ] Browser Rendering (`BROWSER`)
  - [ ] Workflows (`EXTRACT_BRAND`)
  - [ ] Durable Objects (`JOB_PROGRESS`)
  - [ ] Assets binding (SSR output)
- [ ] `src/env.ts` with all binding types
- [ ] TypeScript strict mode configs (backend + frontend)
- [ ] `.gitignore` (node_modules, dist, .wrangler, .dev.vars)
- [ ] Init git repo

## 0.2 — Backend Skeleton

- [ ] `src/index.ts` — Hono app entry point
- [ ] Route mounting: `/api`, `/.well-known`
- [ ] `GET /api/health` — returns `{ ok: true, version: "0.1.0" }`
- [ ] CORS middleware (`credentials: true`)
- [ ] Error handling middleware (structured JSON errors)
- [ ] www → root domain redirect
- [ ] `robots.txt` route (disallow `/api/`, `/dashboard/`)
- [ ] `sitemap.xml` route (placeholder)

## 0.3 — Auth (Better Auth + D1)

- [ ] `src/lib/auth.ts` — `createAuth(env)` factory with D1 Kysely dialect
- [ ] Auth route handler: `app.on(["GET", "POST"], "/api/auth/**", ...)`
- [ ] `src/lib/auth-middleware.ts` — resolve session from cookies or API key
- [ ] D1 migration `0001_initial.sql`:
  - [ ] Better Auth tables (user, session, account, verification)
  - [ ] `api_keys` table (id, user_id, key_hash, name, created_at, last_used_at)
  - [ ] `extractions` table (id, user_id, domain, status, result_key, created_at)
  - [ ] `credits` table (user_id, balance, plan, reset_at)
- [ ] Admin user pattern (`ADMIN_USER_IDS` env var)
- [ ] Run migration against D1

## 0.4 — Frontend Skeleton (React Router v7 SSR)

- [ ] React Router v7 SSR setup targeting Cloudflare Workers
- [ ] Root layout with `<head>` meta management
- [ ] Tailwind CSS v4 with `@tailwindcss/vite`
- [ ] shadcn/ui primitives: Button, Card, Input, Badge, Dialog
- [ ] Auth client: `app/src/lib/auth-client.ts` using `createAuthClient()`
- [ ] API client wrapper: `app/src/lib/api.ts`
- [ ] Pages (minimal shells):
  - [ ] `/` — Landing page (hero + CTA)
  - [ ] `/sign-in` — Sign in form
  - [ ] `/sign-up` — Sign up form
  - [ ] `/dashboard` — Protected route, empty state
  - [ ] `/dashboard/extract` — URL input (placeholder)
  - [ ] `/dashboard/history` — Empty list
  - [ ] `/dashboard/settings` — Account settings
- [ ] Auth guard on `/dashboard/*` routes
- [ ] Dark mode support (system preference)

## 0.5 — Infrastructure Wiring

- [ ] Create D1 database: `wrangler d1 create extractvibe-db`
- [ ] Create KV namespace: `wrangler kv namespace create CACHE`
- [ ] Create R2 bucket: `wrangler r2 bucket create extractvibe-assets`
- [ ] Set secrets: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- [ ] Verify Browser Rendering binding works (simple test: navigate to google.com, get title)
- [ ] Deploy to Cloudflare Workers
- [ ] Verify auth flow works end-to-end (sign up → sign in → session → sign out)

## Verification Checklist

- [ ] `wrangler dev` runs locally without errors
- [ ] Can sign up, sign in, sign out
- [ ] Protected routes redirect to sign-in when unauthenticated
- [ ] `GET /api/health` returns 200
- [ ] D1 migration applied successfully
- [ ] Browser Rendering binding accessible
- [ ] Deploys to production URL
