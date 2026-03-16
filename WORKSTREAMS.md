# ExtractVibe — Phased Workstreams

> Execution plan broken into phases with clear deliverables. Each phase builds on the last and is independently shippable.

---

## Stack Decisions (Deviations from General Template)

| Area | Template Default | ExtractVibe Decision | Rationale |
|---|---|---|---|
| Frontend Rendering | SPA + server-side meta injection | **SSR with React Router v7** | Better SEO, faster FCP, brand kit pages benefit from server rendering |
| AI Provider | OpenRouter (Claude Sonnet default) | **Cloudflare AI primary**, OpenRouter fallback | Free/cheap models for most extraction. OpenRouter only for deep voice/vibe analysis where quality matters |
| Browser | `@cloudflare/puppeteer` | Same | Core to the product — full-page rendering for extraction |
| New Binding | — | **Cloudflare Browser Rendering** | Required for JS-rendered site extraction |
| New Binding | — | **Cloudflare Workflows** | Multi-step extraction pipeline (fetch → parse → analyze → synthesize) |

---

## Phase 0 — Project Scaffold & Infrastructure

**Goal:** Deployable skeleton with auth, database, and dev tooling. Zero features, but the full stack is wired.

### 0.1 — Project Init
- [ ] Init monorepo structure per template (`src/` for Worker, `app/` for frontend)
- [ ] `wrangler.jsonc` with D1, KV, R2, Browser Rendering, Workflows bindings
- [ ] TypeScript strict mode, `env.ts` with all binding types
- [ ] `.gitignore`, `package.json` scripts (`dev`, `deploy`, `db:migrate`)

### 0.2 — Backend Skeleton
- [ ] Hono app with route mounting (`/api`, `/.well-known`)
- [ ] Health check endpoint (`GET /api/health`)
- [ ] CORS middleware (credentials: true for Better Auth cookies)
- [ ] Error handling middleware (structured JSON errors)

### 0.3 — Auth (Better Auth + D1)
- [ ] `src/lib/auth.ts` — Better Auth instance factory with D1 Kysely dialect
- [ ] Auth route handler (`/api/auth/**`)
- [ ] Auth middleware (`src/lib/auth-middleware.ts`) — session + API key resolution
- [ ] D1 migration `0001_initial.sql` — Better Auth tables + `api_keys` table
- [ ] Admin user pattern (`ADMIN_USER_IDS` env var)

### 0.4 — Frontend Skeleton (React Router v7 SSR)
- [ ] React Router v7 with SSR configuration on Cloudflare Workers
- [ ] Root layout with `<head>` meta management (built-in to React Router)
- [ ] Tailwind CSS v4 + shadcn/ui primitives (Button, Card, Input, Badge)
- [ ] Auth client (`better-auth/react`) — `useSession`, sign in, sign up, sign out
- [ ] Basic pages: Landing (`/`), Sign In (`/sign-in`), Sign Up (`/sign-up`), Dashboard (`/dashboard`)
- [ ] API client wrapper (`app/src/lib/api.ts`)

### 0.5 — Infrastructure Wiring
- [ ] R2 bucket for extracted assets (logos, images, patterns)
- [ ] KV namespace for extraction result caching
- [ ] Cloudflare Browser Rendering binding verified working
- [ ] `wrangler secret put` for `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `OPENROUTER_API_KEY`
- [ ] Deploy to `extractvibe.dev` (or chosen domain)

**Deliverable:** Deployed app with working auth, empty dashboard, and all infra bindings live.

---

## Phase 1 — Core Extraction Engine (MVP)

**Goal:** Enter a URL, get a comprehensive brand kit JSON back. This is the product's core value.

### 1.1 — Extraction Pipeline (Cloudflare Workflow)

The extraction is a multi-step Workflow:

```
Step 1: Fetch & Render   → Browser Rendering gets full DOM + computed styles
Step 2: Parse Assets      → Extract logos, favicons, colors, fonts from HTML/CSS
Step 3: Analyze Voice     → LLM analyzes page copy for tone, style, patterns
Step 4: Synthesize Vibe   → LLM generates rules, vibe summary, brand personality
Step 5: Score & Package   → Confidence scoring, schema assembly, cache result
```

- [ ] `src/workflows/extract-brand.ts` — Workflow class with 5 steps
- [ ] Each step is independently retryable (Workflow step isolation)
- [ ] Progress reporting via Durable Object WebSocket (real-time UI updates)

### 1.2 — Step 1: Fetch & Render
- [ ] Cloudflare Browser Rendering — navigate to URL, wait for network idle
- [ ] Extract full page HTML (rendered, not source)
- [ ] Extract all computed styles via `getComputedStyle()` on key elements (h1-h6, body, a, button, nav, footer)
- [ ] Extract all `<link>`, `<meta>`, `<style>` tags
- [ ] Extract `manifest.json` / `site.webmanifest` if present
- [ ] Take full-page screenshot (stored in R2 for reference)
- [ ] Detect and fetch `robots.txt` for crawl hints

### 1.3 — Step 2: Parse Visual Identity
- [ ] **Logos** — Extract from: `<link rel="icon">`, apple-touch-icon, `<img>` in `<nav>`/`<header>`, inline SVGs with dimension probing, OG image, manifest icons. Classify as: primary, logomark, wordmark, favicon, monochrome. Store originals in R2.
- [ ] **Colors** — Extract from: CSS custom properties (`:root`), computed styles on key elements, `theme-color` meta, manifest `theme_color`/`background_color`. Classify by role: primary, secondary, accent, background, surface, text, border, link, semantic (success/warning/error/info). Separate light mode / dark mode (detect `prefers-color-scheme` media queries or `.dark` class variants).
- [ ] **Typography** — Extract from: computed font-family on h1-h6, body, button, nav, code elements. Map weights, sizes, line-heights, letter-spacing, text-transform. Detect Google Fonts / Adobe Fonts / self-hosted. Extract the full type scale.
- [ ] **Spacing & Layout** — Extract base spacing unit (most common margin/padding value), border-radius tokens, max-width/container, grid columns/gap if CSS Grid detected.
- [ ] **Assets** — Background images from CSS, hero images, decorative SVGs, icon library detection (class name patterns: `lucide-*`, `fa-*`, `heroicon-*`, etc.), section dividers, pattern images.

### 1.4 — Step 3: Brand Voice Analysis (LLM)
- [ ] Collect visible text content: headings, hero copy, CTAs, navigation labels, footer text, about/mission sections
- [ ] **Cloudflare AI** call (primary — `@cf/meta/llama-3.1-8b-instruct` or similar free model):
  - Tone spectrum scoring (formal↔casual, playful↔serious, etc.)
  - Copywriting style analysis (sentence length, vocabulary level, jargon usage)
  - Content pattern detection (heading case, CTA style, emoji usage, punctuation patterns)
  - Brand personality / archetype classification
  - Tagline and value proposition extraction
- [ ] If Cloudflare AI quality is insufficient for a given analysis, fallback to OpenRouter with a cheap model (`google/gemini-flash-2.0`, `anthropic/claude-haiku`)

### 1.5 — Step 4: Vibe Synthesis (LLM)
- [ ] Feed extracted visual identity + voice analysis to LLM
- [ ] Generate:
  - Vibe summary (2-3 sentence natural language description)
  - Vibe tags (5-8 descriptive tags)
  - Visual energy score (1-10)
  - Design era classification
  - Comparable brands (3-5)
  - Emotional tone label
  - Target audience inference
- [ ] Generate DOs and DON'Ts rules (inferred from patterns)
- [ ] Use Cloudflare AI for synthesis (this is a summarization task — cheap models handle it well)

### 1.6 — Step 5: Score & Package
- [ ] Assign confidence score (0.0-1.0) to every extracted field based on:
  - Source reliability (official meta tag = high, CSS inference = medium, LLM guess = lower)
  - Corroboration (multiple sources agreeing = higher confidence)
- [ ] Assemble into ExtractVibe schema v1
- [ ] Cache full result in KV (keyed by domain, TTL 72 hours)
- [ ] Store extracted assets (logos, screenshots) in R2
- [ ] Write extraction record to D1 (user_id, domain, status, created_at, schema_version)

### 1.7 — Brand Kit Page Discovery
- [ ] Probe common brand kit paths: `/brand`, `/brand-assets`, `/press`, `/media-kit`, `/press-kit`, `/about/brand`, `/identity`, `/brand-guidelines`, `/logos`
- [ ] Check for `<link>` tags or footer links containing "brand", "press", "media kit"
- [ ] If found: fetch the page, send to LLM to extract official guidelines into our schema
- [ ] Merge official guidelines with extracted data (official takes precedence)
- [ ] Flag `has_official_kit: true` in output

### 1.8 — Schema Definition
- [ ] Define TypeScript types for `ExtractVibeBrandKit` v1 (as outlined in PRD)
- [ ] Publish as `src/schema/v1.ts` — shared between worker and consumers
- [ ] JSON Schema version for external validation
- [ ] Every field optional, every field has `confidence` sibling

**Deliverable:** `POST /api/extract` accepts a URL, runs the Workflow, returns a full brand kit JSON with confidence scores.

---

## Phase 2 — API, Dashboard & Free Tier

**Goal:** Usable product with a web UI, API access, and free tier. People can sign up and use it.

### 2.1 — REST API
- [ ] `POST /api/extract` — start extraction (returns job ID)
- [ ] `GET /api/extract/:jobId` — poll for result (or WebSocket for real-time)
- [ ] `GET /api/extract/:jobId/result` — get full brand kit JSON
- [ ] `GET /api/brand/:domain` — get cached result for a domain (if exists)
- [ ] API key generation and management (`POST /api/keys`, `DELETE /api/keys/:id`)
- [ ] Rate limiting via KV (by user ID or API key)
- [ ] Request logging to D1 (endpoint, user, domain, latency, credits used)

### 2.2 — Credits & Free Tier
- [ ] D1 table: `credits` (user_id, balance, plan, reset_at)
- [ ] Free tier: 50 extractions/month, auto-reset on billing cycle
- [ ] Credit deduction per extraction (1 credit = 1 extraction)
- [ ] Credit balance check middleware
- [ ] Admin bypass for credit checks
- [ ] `GET /api/credits` — check balance
- [ ] Usage tracking dashboard data (`GET /api/usage`)

### 2.3 — Dashboard UI
- [ ] **Extract page** — URL input → real-time progress → rendered brand kit
- [ ] **Brand Kit View** — beautiful rendering of the full kit:
  - Logo gallery (all variants with labels)
  - Color palette (swatches with hex/rgb, role labels, copy-to-clipboard)
  - Typography preview (rendered samples of each font at each scale level)
  - Voice & personality section (tone spectrums as visual bars, archetype badge)
  - DOs and DON'Ts as a styled checklist
  - Vibe summary card (tags, energy meter, comparable brands)
- [ ] **History page** — list of past extractions with domain, date, status
- [ ] **API Keys page** — generate, view, revoke keys
- [ ] **Usage page** — credits remaining, usage chart, plan info
- [ ] **Settings page** — account, email, password change

### 2.4 — Export Formats (Phase 1 set)
- [ ] JSON download (full schema)
- [ ] CSS Variables (`:root { --color-primary: ... }`)
- [ ] Tailwind config snippet (theme.extend with colors, fonts, spacing)
- [ ] Markdown report (human-readable brand audit)

### 2.5 — Real-Time Progress
- [ ] Durable Object for extraction job progress
- [ ] WebSocket connection from dashboard to DO
- [ ] Workflow steps emit progress events: `rendering`, `parsing`, `analyzing`, `synthesizing`, `complete`
- [ ] UI shows step-by-step progress with status indicators

### 2.6 — SEO & Landing
- [ ] SSR landing page with hero, feature showcase, competitor comparison
- [ ] `/brand/:domain` — public brand kit pages (SEO-indexed, drives organic traffic)
- [ ] Dynamic OG images for brand kit pages (show logo + colors + domain)
- [ ] `sitemap.xml` includes public brand pages
- [ ] JSON-LD structured data (SoftwareApplication on homepage, WebPage on brand pages)
- [ ] `llms.txt` and `llms-full.txt`

**Deliverable:** Fully functional product — sign up, extract brands, view results, export, API access, free tier.

---

## Phase 3 — Open Source & CLI

**Goal:** Ship the open-source core. Get GitHub stars. Build community.

### 3.1 — Extract Core into Package
- [ ] Separate extraction engine into standalone package: `packages/extractvibe-core`
- [ ] Zero Cloudflare dependencies in core — accepts generic browser page + fetch function
- [ ] Core exports: `extractBrand(page: Page, options?: ExtractOptions): Promise<BrandKit>`
- [ ] Schema types exported: `packages/extractvibe-schema`
- [ ] Pluggable AI provider interface: `{ complete(prompt, options): Promise<string> }`
  - Built-in providers: `cloudflareAI`, `openRouter`, `ollama` (for local self-hosting)

### 3.2 — CLI Tool
- [ ] `npx extractvibe <url>` — run extraction locally
- [ ] Uses Puppeteer (not Cloudflare Browser Rendering) for local execution
- [ ] `--output json|css|tailwind|markdown` flag
- [ ] `--ai-provider cloudflare|openrouter|ollama|none` flag
- [ ] `--no-ai` flag — skip voice/vibe analysis, just extract visual assets
- [ ] `--depth shallow|standard|deep` — control extraction thoroughness
- [ ] Pretty terminal output with colors and progress spinner
- [ ] Writes result to `<domain>-brand-kit.json` by default

### 3.3 — NPM Package
- [ ] `npm install extractvibe` for programmatic use
- [ ] Documented API: `import { extractBrand } from 'extractvibe'`
- [ ] Works in Node.js with Puppeteer
- [ ] Works in Cloudflare Workers with Browser Rendering
- [ ] TypeScript types included

### 3.4 — GitHub Repo & Community
- [ ] Public repo: `github.com/[org]/extractvibe`
- [ ] README with: badges, demo GIF, quick start, feature list, comparison table
- [ ] CONTRIBUTING.md — how to add new extractors, how to propose schema changes
- [ ] Issue templates (bug report, feature request, new extractor proposal)
- [ ] GitHub Actions CI: lint, type-check, test against known domains
- [ ] MIT license

### 3.5 — MCP Server
- [ ] `packages/extractvibe-mcp` — Model Context Protocol server
- [ ] Tool: `extract_brand(url)` — returns full brand kit
- [ ] Tool: `get_brand_colors(url)` — returns just colors
- [ ] Tool: `get_brand_voice(url)` — returns just voice/tone
- [ ] Works with Claude Code, Cursor, and other MCP-compatible clients
- [ ] Publish to MCP registry

**Deliverable:** Open-source repo with CLI, NPM package, and MCP server. People can self-host or use locally without our cloud.

---

## Phase 4 — Monetization & Growth

**Goal:** Paid tiers, bulk features, and growth loops that drive revenue.

### 4.1 — Paid Plans
- [ ] Stripe or AnySpend integration for fiat payments
- [ ] Plan tiers: Free ($0/50), Starter ($12/500), Pro ($39/5000), Scale ($99/50000)
- [ ] Plan upgrade/downgrade in dashboard
- [ ] Overage handling ($0.005/extra extraction on paid plans, hard cap on free)
- [ ] x402 per-request option for no-account API access
- [ ] Billing history and invoice download

### 4.2 — Bulk Extraction
- [ ] `POST /api/extract/bulk` — submit array of URLs
- [ ] Queue-based processing via Cloudflare Queue or Workflow fan-out
- [ ] Webhook callback on completion
- [ ] CSV upload for domain lists
- [ ] Bulk result download (ZIP of JSON files)

### 4.3 — Brand Monitoring
- [ ] Schedule re-extraction on interval (weekly, monthly)
- [ ] Diff detection: highlight what changed between extractions
- [ ] Email notification on brand changes
- [ ] Cron trigger in `wrangler.jsonc` for scheduled re-extractions
- [ ] History view with visual diff (color changed, logo changed, tone shifted)

### 4.4 — Advanced Export Formats
- [ ] W3C Design Tokens (JSON) — for Style Dictionary / Figma interop
- [ ] Figma Variables (via Figma Plugin API) — direct Figma import
- [ ] PDF Brand Kit — polished, downloadable brand guide document
- [ ] Storybook theme config
- [ ] shadcn/ui theme config

### 4.5 — Growth Loops
- [ ] Public brand pages (`extractvibe.dev/brand/stripe.com`) — SEO magnet
- [ ] "Powered by ExtractVibe" badge on exported kits
- [ ] Comparison pages (`extractvibe.dev/compare/stripe-vs-square`) — programmatic SEO
- [ ] GitHub star/fork growth via open-source community
- [ ] Integration showcases (show how to plug ExtractVibe into Cursor, v0, Figma, etc.)
- [ ] "Brand of the Day" automated social content

### 4.6 — API v1 (Public)
- [ ] Versioned API at `/v1/extract`, `/v1/brand/:domain`
- [ ] OpenAPI spec at `/v1/openapi.json`
- [ ] Rate limiting per plan tier
- [ ] API docs page in dashboard
- [ ] SDK generation from OpenAPI spec (TypeScript, Python)

**Deliverable:** Revenue-generating product with paid plans, bulk features, monitoring, and organic growth loops.

---

## Phase 5 — Polish & Scale

**Goal:** Production hardening, advanced features, and ecosystem expansion.

### 5.1 — Extraction Quality
- [ ] Test suite against 100+ known domains with expected results
- [ ] Accuracy scoring pipeline (compare extracted vs. known brand kits)
- [ ] Model A/B testing — try different LLMs for voice analysis, measure quality
- [ ] Edge case handling: SPAs, sites behind auth walls (user-provided cookies), non-English sites
- [ ] Anti-bot detection handling (rotate user agents, respect rate limits)

### 5.2 — Advanced Extraction
- [ ] Multi-page analysis — scan homepage + about + pricing + blog for richer voice data
- [ ] Social media profile extraction (Twitter bio, LinkedIn about, Instagram aesthetic)
- [ ] Animation & motion patterns (transition durations, easing functions, scroll behavior)
- [ ] Form & component patterns (button styles, input styles, card patterns)
- [ ] Accessibility patterns (ARIA usage, contrast ratios, focus styles)

### 5.3 — Platform Integrations
- [ ] Zapier / Make integration
- [ ] Figma plugin
- [ ] Chrome extension (extract brand from current tab)
- [ ] VS Code extension (generate theme from brand URL)
- [ ] Webhooks for third-party integrations

### 5.4 — Enterprise Features
- [ ] Team workspaces
- [ ] Brand collections (organize extractions by client/project)
- [ ] Custom schema extensions (add your own fields)
- [ ] SSO (Better Auth organization plugin)
- [ ] Audit log
- [ ] SLA dashboard

**Deliverable:** Production-grade platform with high extraction quality, integrations, and enterprise readiness.

---

## Execution Timeline (Suggested)

| Phase | Duration | Milestone |
|---|---|---|
| **Phase 0** — Scaffold | 1 session | Deployed skeleton with auth |
| **Phase 1** — Extraction Engine | 2-3 sessions | `POST /api/extract` returns full brand kit |
| **Phase 2** — API + Dashboard | 2-3 sessions | Usable product with UI, API, free tier |
| **Phase 3** — Open Source + CLI | 1-2 sessions | Public repo, CLI, NPM, MCP |
| **Phase 4** — Monetization | 2-3 sessions | Paid plans, bulk, monitoring |
| **Phase 5** — Polish & Scale | Ongoing | Quality, integrations, enterprise |

**Ship Phase 2 first, then open-source Phase 3.** This gives us a working product to demo when we launch the repo. The open-source launch drives traffic to the cloud product.

---

## AI Model Strategy

Cost is a primary concern. Here's the model allocation:

| Task | Provider | Model | Cost | Why |
|---|---|---|---|---|
| HTML/CSS parsing | None (code) | — | Free | No AI needed, pure DOM parsing |
| Color classification | Cloudflare AI | `@cf/meta/llama-3.1-8b-instruct` | Free | Simple classification task |
| Typography mapping | None (code) | — | Free | Computed style extraction |
| Voice/tone analysis | Cloudflare AI | `@cf/meta/llama-3.1-70b-instruct` | Free tier / very cheap | Needs decent reasoning |
| Brand rules generation | Cloudflare AI | `@cf/meta/llama-3.1-70b-instruct` | Free tier / very cheap | Pattern inference |
| Vibe synthesis | OpenRouter fallback | `google/gemini-flash-2.0` | ~$0.001/req | Quality matters here, still very cheap |
| Brand kit page interpretation | OpenRouter fallback | `google/gemini-flash-2.0` | ~$0.001/req | Needs to parse complex pages |
| Deep analysis (Pro tier) | OpenRouter | `anthropic/claude-haiku` | ~$0.003/req | Premium quality for paid users |

**Target cost per extraction: $0.002-$0.008** — well under the $0.005 overage price.

---

## Key Technical Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Browser Rendering cold starts | Slow first extraction (~5-10s) | Cache rendered pages in KV, warm browser pool |
| Cloudflare AI rate limits | Blocked extractions | Queue-based processing, backoff, OpenRouter fallback |
| React Router v7 SSR on Workers | New pattern, potential issues | Prototype in Phase 0, fallback to SPA if blockers |
| Large sites (100+ CSS files) | Timeout on extraction | Cap CSS file count, prioritize critical CSS, timeout per step |
| Anti-bot protections | Failed extractions for some domains | Honest user-agent, respect robots.txt, offer "bring your own cookies" for auth'd sites |
