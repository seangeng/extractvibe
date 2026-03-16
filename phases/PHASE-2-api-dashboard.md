# Phase 2 — API, Dashboard & Free Tier

> **Goal:** Usable product with web UI, API access, and free tier. People can sign up and use it.
> **Estimated:** 2-3 sessions
> **Depends on:** Phase 1 complete

---

## Session 2A: API Layer + Credits

### 2.1 — REST API

- [ ] `POST /api/extract` — start extraction
  - Input: `{ url: string, depth?: "shallow" | "standard" | "deep" }`
  - Returns: `{ jobId: string, status: "queued" }`
  - Requires: auth (session or API key)
  - Deducts: 1 credit
- [ ] `GET /api/extract/:jobId` — check job status
  - Returns: `{ jobId, status: "queued" | "running" | "complete" | "failed", progress?: { step, message } }`
- [ ] `GET /api/extract/:jobId/result` — get full brand kit
  - Returns: `ExtractVibeBrandKit` JSON
  - Only available when status = "complete"
- [ ] `GET /api/brand/:domain` — get cached result (no credit cost)
  - Returns cached brand kit if available, 404 if not
- [ ] `POST /api/keys` — generate API key
  - Returns: `{ key: "ev_...", id: string }` (key shown once)
- [ ] `GET /api/keys` — list user's API keys (masked)
- [ ] `DELETE /api/keys/:id` — revoke API key
- [ ] Rate limiting middleware:
  - [ ] KV-based rate limiter by user ID / API key
  - [ ] Free: 1 req/sec, Starter: 3 req/sec, Pro: 10 req/sec
- [ ] Request logging to D1 (endpoint, user_id, domain, latency_ms, credits_used, status_code)

### 2.2 — Credits & Free Tier

- [ ] `credits` table already created in Phase 0 migration
- [ ] Auto-create credits row on sign-up (50 balance, plan: "free")
- [ ] `GET /api/credits` — returns `{ balance, plan, reset_at, extractions_this_month }`
- [ ] Credit deduction middleware (check before extraction, deduct on success)
- [ ] Monthly credit reset via Cron Trigger:
  - [ ] `wrangler.jsonc` cron: `0 0 1 * *` (1st of each month)
  - [ ] Reset balance to plan allowance for all users
- [ ] Hard cap on Free tier (no overage, returns 403 with upgrade prompt)
- [ ] Admin bypass for credit checks
- [ ] `GET /api/usage` — usage stats for dashboard charts:
  - [ ] Extractions per day (last 30 days)
  - [ ] Credits consumed per day
  - [ ] Top domains extracted

---

## Session 2B: Dashboard UI — Extract + Brand Kit View

### 2.3a — Extract Page (`/dashboard/extract`)

- [ ] URL input with validation (must be valid domain/URL)
- [ ] "Extract" button → calls `POST /api/extract`
- [ ] Real-time progress via WebSocket:
  - [ ] Step indicator (5 steps with status: pending, running, complete)
  - [ ] Current step label and description
  - [ ] Elapsed time counter
  - [ ] Animated progress bar
- [ ] On complete → redirect to brand kit view
- [ ] Error state with retry button
- [ ] Credit balance shown in header

### 2.3b — Brand Kit View (`/dashboard/brand/:domain`)

**Identity Section:**
- [ ] Brand name, tagline, description
- [ ] Brand archetype badge with confidence

**Logo Gallery:**
- [ ] Grid of all extracted logos with labels (primary, wordmark, logomark, favicon, etc.)
- [ ] Light/dark variant toggle
- [ ] Click to view full size
- [ ] Download individual logo button
- [ ] Format label (SVG, PNG, ICO)

**Color Palette:**
- [ ] Color swatches in a grid, grouped by role (primary, secondary, accent, etc.)
- [ ] Light mode / dark mode toggle
- [ ] Each swatch shows: hex, RGB, role label
- [ ] Click to copy hex to clipboard
- [ ] Semantic colors section (success, warning, error, info)
- [ ] Full palette visualization (all colors side by side)

**Typography Preview:**
- [ ] Each font family rendered as a sample
- [ ] Type scale preview (h1-h6, body, small rendered at actual sizes)
- [ ] Weight samples
- [ ] Font source label (Google Fonts, Adobe, self-hosted)
- [ ] Conventions summary (heading case, body style)

**Voice & Personality:**
- [ ] Tone spectrum as visual bars (e.g., formal ←——●——→ casual)
- [ ] Brand archetype card with description
- [ ] Copywriting style summary
- [ ] Content patterns list
- [ ] Sample copy excerpts

**Brand Rules:**
- [ ] DOs as green checkmark list
- [ ] DON'Ts as red X list
- [ ] Official guidelines merged (flagged with "official" badge)

**Vibe Card:**
- [ ] Vibe summary paragraph
- [ ] Tag chips
- [ ] Visual energy meter (1-10 bar)
- [ ] Design era label
- [ ] Comparable brands list
- [ ] Emotional tone label
- [ ] Target audience

**Confidence Indicators:**
- [ ] Subtle confidence indicator on each section (high/medium/low)
- [ ] Tooltip showing exact confidence score

---

## Session 2C: History, Settings, Export, SEO

### 2.3c — Remaining Dashboard Pages

**History (`/dashboard/history`):**
- [ ] Table/list of past extractions
- [ ] Columns: domain, favicon, status, date, actions (view, re-extract, delete)
- [ ] Search/filter by domain
- [ ] Pagination

**API Keys (`/dashboard/keys`):**
- [ ] List of API keys (name, created date, last used, masked key)
- [ ] Create new key dialog (name input)
- [ ] Copy key to clipboard (shown once on creation)
- [ ] Delete key with confirmation

**Usage (`/dashboard/usage`):**
- [ ] Credits remaining (big number)
- [ ] Plan name and limits
- [ ] Usage chart (extractions per day, last 30 days)
- [ ] Upgrade CTA for free users

**Settings (`/dashboard/settings`):**
- [ ] Email display
- [ ] Password change
- [ ] Delete account

### 2.4 — Export Formats

- [ ] Export button on brand kit view with format dropdown
- [ ] **JSON** — full `ExtractVibeBrandKit` schema download
- [ ] **CSS Variables** — generate `:root { --ev-color-primary: #xxx; ... }` file
- [ ] **Tailwind Config** — generate `theme.extend` object with colors, fonts, spacing
- [ ] **Markdown Report** — human-readable brand audit document
- [ ] Each export served as a file download with appropriate content type

### 2.5 — Real-Time Progress (if not completed in Phase 1)

- [ ] Durable Object `JobProgressDO` handles WebSocket connections per job
- [ ] Workflow steps call DO to broadcast progress
- [ ] Dashboard auto-connects WebSocket on extract page
- [ ] Reconnection logic on WebSocket drop

### 2.6 — SEO & Landing Page

- [ ] Landing page with:
  - [ ] Hero section (headline, subline, URL input CTA)
  - [ ] Feature showcase (the 8 differentiators)
  - [ ] Competitor comparison table
  - [ ] Pricing section
  - [ ] "Try it free" CTA
- [ ] `/brand/:domain` — public brand kit pages (SSR, SEO-indexed)
  - [ ] Condensed version of brand kit view (no auth required)
  - [ ] "Extract your brand" CTA
  - [ ] Drives organic traffic for "[brand] brand kit" searches
- [ ] Dynamic OG images via satori/resvg:
  - [ ] Landing page OG (product name + tagline)
  - [ ] Brand kit page OG (domain + logo + top colors)
- [ ] `sitemap.xml` includes public brand pages
- [ ] JSON-LD: `SoftwareApplication` on homepage, `WebPage` on brand pages
- [ ] `llms.txt` and `llms-full.txt` in public/

---

## Verification Checklist

- [ ] Full flow: sign up → extract → view result → export JSON
- [ ] API key flow: create key → extract via curl with API key → get result
- [ ] Credit deduction working (check balance decrements)
- [ ] Rate limiting working (exceeding limit returns 429)
- [ ] History shows all past extractions
- [ ] All export formats download correctly
- [ ] Public brand pages render for cached domains
- [ ] OG images generate correctly
- [ ] Landing page looks polished
- [ ] Mobile responsive
