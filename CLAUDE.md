# CLAUDE.md — ExtractVibe

> This file is the single source of truth for AI-assisted development on ExtractVibe.
> Keep it updated as work progresses.

---

## Project Overview

- **Product**: ExtractVibe
- **Domain**: extractvibe.com
- **One-liner**: Open-source brand intelligence engine that extracts comprehensive brand kits (logos, colors, typography, voice, personality, rules) from any website.
- **Status**: building (Phase 0 — scaffold)
- **Last updated**: 2026-03-20

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Runtime | **Cloudflare Workers** | Single Worker serves API + SSR pages. Config in `wrangler.jsonc` |
| API Framework | **Hono** | Typed `Hono<{ Bindings: Env }>`. Handles `/api/*`, `/robots.txt`, `/sitemap.xml` |
| Language | **TypeScript** | Strict mode, no `any` types |
| Frontend | **React Router v7 (framework mode)** | SSR on Workers via `@react-router/cloudflare` + `@cloudflare/vite-plugin` |
| Styling | **Tailwind CSS v4** | `@tailwindcss/vite` plugin |
| UI Components | **Radix UI + shadcn/ui pattern** | `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` |
| Auth | **Better Auth** | `better-auth/react` on frontend, Kysely D1 dialect on server. Cookie sessions. |
| AI (primary) | **Cloudflare Workers AI** | Free models (`@cf/meta/llama-3.1-8b-instruct`). Used for most extraction tasks |
| AI (fallback) | **OpenRouter** | Cheap models (`google/gemini-flash-2.0` default). Used when quality matters (voice/vibe analysis) |
| Database | **Cloudflare D1** (SQLite) | Raw SQL via `env.DB.prepare()` or Kysely. No ORM. Migrations in `server/db/migrations/` |
| KV | **Cloudflare KV** | Binding: `CACHE`. Caches extraction results (`result:{jobId}`) |
| R2 | **Cloudflare R2** | Binding: `R2_BUCKET`. Stores brand assets (logos, screenshots) |
| Browser | **Cloudflare Browser Rendering** | Binding: `BROWSER`. `@cloudflare/puppeteer` for full-page extraction |
| Workflows | **Cloudflare Workflows** | Binding: `EXTRACT_BRAND`. Multi-step extraction pipeline |
| Durable Objects | **Cloudflare Durable Objects** | Binding: `JOB_PROGRESS`. WebSocket progress reporting for extraction jobs |
| Cron | **Cloudflare Cron Triggers** | `0 0 1 * *` — monthly credit reset |
| Icons | **lucide-react** | Consistent icon library |
| Font | **Inter** | Loaded from Google Fonts CDN |

---

## Project Structure

```
extractvibe/
├── CLAUDE.md                           # This file
├── PRD.md                              # Product requirements document
├── WORKSTREAMS.md                      # Phased execution plan
├── phases/                             # Detailed phase specs
│   ├── PHASE-0-scaffold.md
│   ├── PHASE-1-extraction-engine.md
│   ├── PHASE-2-api-dashboard.md
│   ├── PHASE-3-open-source.md
│   ├── PHASE-4-monetization.md
│   └── PHASE-5-polish-scale.md
├── workers/
│   └── app.ts                          # Hono entry point: API + SSR catch-all + scheduled handler
├── server/                             # Server-side code (runs on Workers)
│   ├── env.ts                          # Env interface with all binding types
│   ├── api/
│   │   └── index.ts                    # API routes (extract, credits, keys)
│   ├── lib/
│   │   ├── auth.ts                     # Better Auth instance factory (createAuth)
│   │   ├── auth-middleware.ts           # resolveAuth (session + API key), isAdminUser
│   │   └── ai.ts                       # openRouterCompletion + cloudflareAI wrappers
│   ├── workflows/
│   │   └── extract-brand.ts            # ExtractBrandWorkflow class
│   ├── durable-objects/
│   │   └── job-progress.ts             # JobProgressDO — WebSocket progress
│   ├── schema/                         # (empty — for future extraction schemas)
│   └── db/
│       └── migrations/
│           └── 0001_initial.sql        # Better Auth + api_keys + extractions + credits tables
├── app/                                # React Router v7 app (SSR)
│   ├── root.tsx                        # Root layout: <html>, <head>, <body>, error boundary
│   ├── routes.ts                       # Config-based route definitions
│   ├── routes/                         # Route files (currently empty — shells not yet created)
│   ├── components/
│   │   └── ui/                         # shadcn/ui primitives: button, card, input, badge
│   ├── lib/
│   │   ├── auth-client.ts              # Better Auth React client (useSession, signIn, signUp, signOut)
│   │   ├── api.ts                      # Fetch wrapper (GET, POST, DELETE with credentials)
│   │   └── utils.ts                    # cn() helper (clsx + tailwind-merge)
│   └── styles/
│       └── app.css                     # Tailwind imports
├── public/
│   ├── llms.txt                        # LLM-optimized site summary
│   └── robots.txt                      # Static fallback
├── react-router.config.ts              # SSR: true, future: { v8_viteEnvironmentApi: true }
├── vite.config.ts                      # cloudflare + tailwindcss + reactRouter + tsconfigPaths
├── wrangler.jsonc                      # All bindings: D1, KV, R2, Browser, Workflows, DO, crons
├── tsconfig.json                       # Strict mode, path alias ~/*, Workers types
├── package.json                        # Single package.json, scripts: dev, build, deploy, typecheck
└── .dev.vars.example                   # Template for local secrets
```

---

## Key Architectural Decisions

| Decision | Detail | Rationale |
|---|---|---|
| SSR via React Router v7 | Not SPA. Full SSR on Cloudflare Workers | Better SEO, faster FCP, brand kit pages benefit from server rendering |
| Single Worker: Hono + React Router | Hono handles `/api/*`, React Router SSR catch-all handles pages | Simpler deployment, single entry point, shared env bindings |
| Workers AI primary, OpenRouter fallback | Free Cloudflare AI models for bulk extraction; OpenRouter for deep analysis | Near-zero AI cost for most operations; quality models only when needed |
| Workflow-based extraction pipeline | `ExtractBrandWorkflow` handles fetch -> parse -> analyze -> synthesize | Multi-step durability, automatic retries, progress tracking via DO |
| D1 transactions disabled | `advanced.database.transaction: false` in Better Auth config | D1 does not support interactive transactions |
| Config-based routes (not file-based) | `app/routes.ts` explicitly defines route tree | More control over layout nesting and route organization |
| Entry point at `workers/app.ts` | Not `server/index.ts` | `wrangler.jsonc` `main` points here; re-exports Workflow + DO classes |
| Kysely for Better Auth only | Better Auth requires Kysely dialect; all other queries use raw D1 or Kysely ad-hoc | Avoid ORM overhead; keep queries explicit |
| API keys with `ev_` prefix | Custom API key generation (`ev_` + 48 hex chars) | Identifiable prefix for key scanning/rotation |

---

## API Routes

### Hono routes (in `workers/app.ts`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET,POST | `/api/auth/**` | Better Auth | None | Auth flow (sign-in, sign-up, session, etc.) |
| GET | `/api/health` | Inline | None | Health check `{ ok, version, timestamp }` |
| GET | `/robots.txt` | Inline | None | Dynamic robots.txt with AI crawler directives |
| GET | `/sitemap.xml` | Inline | None | Dynamic sitemap (static pages + brands + docs) |
| GET | `/docs/:file` | Inline | None | Markdown API docs (11 pages) |
| GET | `/llms-full.txt` | Inline | None | Complete API docs in one file |
| GET | `/.well-known/openapi.json` | Redirect | None | Redirects to `/api/openapi.json` |
| * | `*` (catch-all) | React Router SSR | None | All page routes |

### API sub-router (in `server/api/index.ts`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Health check (also mounted on sub-router) |
| GET | `/api` | None | API index with endpoint listing |
| GET | `/api/openapi.json` | None | OpenAPI 3.1 spec (cached 1h) |
| POST | `/api/agent/bootstrap` | None (IP rate-limited) | LLM/agent self-provisioning: creates account + API key (5 credits) |
| POST | `/api/extract` | Session/API key | Start extraction job. Deducts 1 credit. Returns `{ jobId }` (202) |
| GET | `/api/extract/:jobId` | Session/API key | Poll job status from Workflow |
| GET | `/api/extract/:jobId/result` | Session/API key | Get cached extraction result from KV |
| GET | `/api/extract/:jobId/export/:format` | Session/API key | Export brand kit (json, css, tailwind, markdown, tokens) |
| GET | `/api/extract/history` | Session/API key | Extraction history for authenticated user |
| GET | `/api/brand/:domain` | Optional | Cached brand kit lookup by domain |
| GET | `/api/credits` | Session/API key | Get user credit balance |
| POST | `/api/keys` | Session/API key | Create new API key |
| GET | `/api/keys` | Session/API key | List active (non-revoked) API keys |
| DELETE | `/api/keys/:id` | Session/API key | Revoke an API key |

### React Router SSR pages (in `app/routes.ts`)

| Path | Route File | Description |
|---|---|---|
| `/` | `routes/_index.tsx` | Landing page |
| `/sign-in` | `routes/sign-in.tsx` | Sign in form |
| `/sign-up` | `routes/sign-up.tsx` | Sign up form |
| `/dashboard` | `routes/dashboard._index.tsx` | Dashboard home (layout: `dashboard.tsx`) |
| `/dashboard/extract` | `routes/dashboard.extract.tsx` | URL input for extraction |
| `/dashboard/history` | `routes/dashboard.history.tsx` | Extraction history |
| `/dashboard/keys` | `routes/dashboard.keys.tsx` | API key management |
| `/dashboard/settings` | `routes/dashboard.settings.tsx` | Account settings |

---

## Environment Variables

```bash
# Secrets (set via `wrangler secret put`)
BETTER_AUTH_SECRET=             # Min 32 chars. Auth encryption key
BETTER_AUTH_URL=                # e.g. https://extractvibe.com (or http://localhost:5173 for dev)
OPENROUTER_API_KEY=             # sk-or-v1-... for fallback AI provider

# Vars (set in wrangler.jsonc)
ADMIN_USER_IDS=                 # Comma-separated Better Auth user IDs

# Cloudflare bindings (auto-injected via wrangler.jsonc)
# DB            — D1 database (extractvibe-db)
# CACHE         — KV namespace
# R2_BUCKET     — R2 bucket (extractvibe-assets)
# BROWSER       — Browser Rendering
# EXTRACT_BRAND — Workflow binding
# JOB_PROGRESS  — Durable Object namespace
```

Local dev secrets go in `.dev.vars` (see `.dev.vars.example`).

---

## CLAUDE.md Maintenance Rules

After every significant work session:

1. Update `## Work Log` with what was done
2. Update `## Current State` with what is working vs. pending
3. Update `## Decisions` if architectural choices were made
4. If a new dependency is added, add it to the stack table
5. If an API route is added/changed, update `## API Routes`

### Format for work log entries:
```
### YYYY-MM-DD — [Summary]
- What was built/changed
- Key decisions made
- What's next
```

---

## Common Patterns

### Accessing env in React Router loaders
```typescript
export async function loader({ context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  // env.DB, env.CACHE, env.R2_BUCKET, etc.
}
```

### Auth check in loaders
```typescript
import { createAuth } from "../../server/lib/auth";

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw redirect("/sign-in");
  return { user: session.user };
}
```

### Auth check in API routes
```typescript
const auth = await resolveAuth(c); // session cookie OR x-api-key header
if (!auth.authenticated) return c.json({ error: "Unauthorized" }, 401);
```

### Starting a workflow
```typescript
const instance = await c.env.EXTRACT_BRAND.create({
  id: jobId,
  params: { url, jobId, userId },
});
```

### AI completion (OpenRouter)
```typescript
import { openRouterCompletion } from "../lib/ai";
const result = await openRouterCompletion(env.OPENROUTER_API_KEY, messages, {
  model: "google/gemini-flash-2.0",
  temperature: 0.3,
});
```

---

## Decisions

| Date | Decision | Rationale |
|---|---|---|
| 2026-03-16 | SSR with React Router v7 instead of SPA | Better SEO for brand kit pages, faster FCP, simpler meta tag handling |
| 2026-03-16 | Cloudflare Workers AI as primary AI, OpenRouter as fallback | Free models for bulk extraction; OpenRouter only for deep voice/vibe analysis |
| 2026-03-16 | Workflow-based extraction pipeline | Multi-step durability (fetch -> screenshot -> parse -> AI analyze -> synthesize), automatic retries, progress tracking |
| 2026-03-16 | D1 transactions disabled for Better Auth | D1 does not support interactive transactions; set `advanced.database.transaction: false` |
| 2026-03-16 | Single Worker entry via `workers/app.ts` | Hono app mounts API + auth + SEO routes, then React Router SSR catch-all. Durable Objects and Workflows re-exported from this file. |
| 2026-03-16 | Config-based routing in `app/routes.ts` | Explicit route tree with layout nesting for dashboard. More control than file-based convention. |
| 2026-03-16 | Credit system: 5 free extractions, monthly reset | Low barrier to try, cron resets at `0 0 1 * *` |
| 2026-03-20 | Serper.dev replaces Firecrawl for brand kit discovery | ~$0.001/query vs $1.50. URL probing (free) runs first; Serper only as fallback |
| 2026-03-20 | Agent bootstrap endpoint for LLM self-provisioning | AI agents can get API keys without human interaction. 5 credits, 30-day expiry unless claimed |
| 2026-03-20 | API docs served as markdown at `/docs/*.md` | Optimized for both human developers (interactive /docs page) and LLMs (raw .md files) |
| 2026-03-20 | Skip ai-plugin.json (dead standard) | OpenAI deprecated plugins in 2024. Invest in MCP + OpenAPI + llms.txt instead |

---

## Current State

### Working
- [x] Project structure scaffolded
- [x] `wrangler.jsonc` with all bindings (D1, KV, R2, Browser, Workflow, DO, cron)
- [x] Hono entry point with CORS, www redirect, auth routes, API sub-router, SSR catch-all
- [x] Better Auth with D1 Kysely dialect (transactions disabled)
- [x] Auth middleware (session + API key resolution)
- [x] AI client wrappers (OpenRouter + Cloudflare Workers AI)
- [x] API routes: extract (start/poll/result/export), credits, API keys CRUD, agent bootstrap
- [x] Agent bootstrap endpoint (`POST /api/agent/bootstrap`) for LLM self-provisioning
- [x] Comprehensive markdown API docs served at `/docs/*.md` (11 pages)
- [x] `llms-full.txt` — complete API reference in one file
- [x] AI/SEO: robots.txt with 12 AI crawler directives, link discovery tags, .well-known/openapi.json
- [x] Serper.dev integration replacing Firecrawl for brand kit discovery (~$0.001/query vs $1.50)
- [x] React Router v7 SSR config with `@cloudflare/vite-plugin`
- [x] Root layout with Inter font, Tailwind v4, error boundary
- [x] Route config (`app/routes.ts`) with dashboard layout nesting
- [x] shadcn/ui primitives (Button, Card, Input, Badge)
- [x] Auth client + API client on frontend
- [x] ExtractBrandWorkflow class
- [x] JobProgressDO (WebSocket progress)
- [x] Migration `0001_initial.sql`
- [x] `llms.txt`
- [x] Scheduled handler (monthly credit reset)

### In Progress
- [ ] Route page components (files defined in `routes.ts` but `app/routes/` directory is empty)
- [ ] Infrastructure wiring (D1 database creation, KV namespace, R2 bucket, secrets)
- [ ] End-to-end auth flow verification

### Pending (Phase 1+)
- [ ] Extraction engine: HTML/CSS parser, screenshot capture, asset extraction
- [ ] AI analysis: color extraction, typography detection, brand voice analysis
- [ ] Brand kit output schema and rendering
- [ ] Dashboard UI: extraction form, results display, history list
- [ ] Public API (`/v1/*`) with docs
- [ ] OG image generation
- [ ] Open-source release, GitHub setup
- [ ] Monetization (paid plans, x402, AnySpend)

---

## Work Log

### 2026-03-16 — Phase 0 scaffold created
- Scaffolded full project structure: Workers entry, Hono API, React Router v7 SSR, Better Auth, AI clients
- Configured all Cloudflare bindings (D1, KV, R2, Browser Rendering, Workflows, Durable Objects, crons)
- Built API routes for extraction jobs, credits, and API key management
- Created ExtractBrandWorkflow and JobProgressDO stubs
- Set up frontend skeleton: root layout, route config, shadcn/ui components, auth/api clients
- Key decision: SSR over SPA, Workers AI primary + OpenRouter fallback, Workflow-based extraction pipeline
- What's next: Create route page components (landing, auth, dashboard pages), wire infrastructure (create D1/KV/R2 resources), verify end-to-end auth flow

### 2026-03-20 — API docs, agent bootstrap, AI/SEO optimization
- Replaced Firecrawl with Serper.dev + enhanced URL probing (30 paths + 4 subdomains) for brand kit discovery. Cost: ~$0.001/query vs $1.50.
- Added `POST /api/agent/bootstrap` — LLMs self-provision API keys (5 credits, 30-day claim URL)
- Created 11 markdown API doc pages served at `/docs/*.md` with cURL/JS/Python examples
- Added `/llms-full.txt` — complete API reference in one file (~58KB)
- Rewrote `llms.txt` to follow the llms.txt spec with structured section links
- Updated `robots.txt` with explicit Allow for 12 AI crawlers
- Added `<link rel="alternate">` discovery tags for llms.txt, llms-full.txt, OpenAPI in root layout
- Added `/.well-known/openapi.json` redirect, doc pages in sitemap.xml
- Key decisions: Serper.dev over Firecrawl (1500x cheaper), URL probing first (free), agent bootstrap for LLM-first API access
- What's next: MCP server (Phase 2-3), x402 micropayments (Phase 4), OAuth 2.1 for MCP auth

---

## Design Context

### Users
Three audiences in roughly equal measure: **developers** integrating brand data via API, **designers** extracting brand kits for competitive analysis or client work, and **AI agents** using the API to understand brands programmatically. All value speed, precision, and structured output. Developers want great docs and copy-paste code. Designers want visual clarity and exportable assets. AI agents want clean JSON and discoverable endpoints.

### Brand Personality
**Technical. Precise. Clean.** ExtractVibe is a sharp, developer-focused tool — confident in its capabilities without being loud about it. The tone is direct and informative, never corporate or marketing-heavy. Think Linear or Vercel: restrained, quietly excellent, zero fluff.

### Aesthetic Direction

**Visual tone:** Minimal, high-contrast, typographically driven. Let whitespace and structure do the work. Every element earns its place.

**References:**
- **Linear** — Clean, fast, developer-focused. Dark mode excellence, subtle animations, restrained palette.
- **Vercel** — Minimal black/white, strong typography, modern SaaS feel, confident simplicity.

**Anti-references (what ExtractVibe must NOT look like):**
- Generic SaaS templates (gradient heroes, stock illustrations, bland copy)
- Enterprise/corporate (stiff dashboards, formal tone, blue-gray everything)
- Overly playful/cute (emojis, cartoon illustrations, childish colors)
- Data-heavy dashboards (charts everywhere, dense tables, analytics-tool aesthetic)

**Theme:** Light mode default, dark mode supported. Orange primary (`hsl(24 95% 46%)`) as the sole accent — used sparingly for CTAs and interactive states, never splashed across backgrounds.

### Design Principles

1. **Structure over decoration.** Use borders, spacing, and typography to create hierarchy — not gradients, shadows, or color fills. A well-spaced page with clear sections beats a colorful one.

2. **Show, don't tell.** The brand kit results page IS the product demo. Every visual element (color strips, type scales, radar charts) should be immediately legible and useful, not decorative.

3. **Developer-grade precision.** Mono font for values. Exact hex codes, not swatches alone. Copyable code blocks. Tables over prose. Treat every detail as something a developer might need to reference.

4. **Purposeful motion only.** Animations must communicate state change (loading, appearing, transitioning). No decorative parallax, floating elements, or attention-seeking motion. Fade-up on entry, scale on press, nothing more.

5. **One accent, used sparingly.** The orange primary appears on primary CTAs, active states, and the brand mark. Everything else is grayscale. If you're reaching for color, reconsider whether the element actually needs emphasis.
