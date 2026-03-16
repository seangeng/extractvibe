# Phase 4 — Monetization & Growth

> **Goal:** Paid tiers, bulk features, and growth loops that drive revenue.
> **Estimated:** 2-3 sessions
> **Depends on:** Phase 3 complete (open-source launched, traffic coming in)

---

## Session 4A: Payments + Plans

### 4.1 — Paid Plans

- [ ] Choose payment provider: Stripe (fiat) and/or AnySpend (credits) and/or x402 (crypto)
- [ ] Plan definitions in config:
  ```
  free:    $0/mo  — 50 extractions, 1 req/sec
  starter: $12/mo — 500 extractions, 3 req/sec
  pro:     $39/mo — 5,000 extractions, 10 req/sec
  scale:   $99/mo — 50,000 extractions, 25 req/sec
  ```
- [ ] Stripe Checkout integration (or AnySpend):
  - [ ] `POST /api/billing/checkout` — create checkout session
  - [ ] `POST /api/billing/webhook` — handle payment events
  - [ ] `POST /api/billing/portal` — customer portal link
- [ ] D1 schema update: `plans` table or `plan` field on users
- [ ] Plan upgrade flow in dashboard
- [ ] Plan downgrade handling (at end of billing period)
- [ ] Overage handling:
  - [ ] Free: hard cap, 403 with upgrade prompt
  - [ ] Paid: $0.005/extra extraction, tracked and billed
- [ ] x402 per-request option:
  - [ ] `x402-hono` middleware on `/v1/extract`
  - [ ] Price: $0.01 per extraction (no account needed)
- [ ] Billing history page in dashboard
- [ ] Upgrade prompts at appropriate friction points (credit limit, rate limit)

### 4.6 — Public API v1

- [ ] Versioned routes at `/v1/`:
  - [ ] `POST /v1/extract` — start extraction
  - [ ] `GET /v1/extract/:jobId` — check status
  - [ ] `GET /v1/extract/:jobId/result` — get result
  - [ ] `GET /v1/brand/:domain` — get cached brand kit
  - [ ] `GET /v1/brand/:domain/colors` — just colors
  - [ ] `GET /v1/brand/:domain/typography` — just typography
  - [ ] `GET /v1/brand/:domain/voice` — just voice
  - [ ] `GET /v1/brand/:domain/vibe` — just vibe
- [ ] OpenAPI spec at `/v1/openapi.json`
- [ ] API docs page in dashboard (`/dashboard/docs`)
- [ ] Rate limiting per plan tier on `/v1/*`
- [ ] x402 middleware on `/v1/*` as alternative to API key

---

## Session 4B: Bulk + Monitoring

### 4.2 — Bulk Extraction

- [ ] `POST /v1/extract/bulk` — submit array of URLs (max 100)
  - Input: `{ urls: string[], webhook_url?: string, depth?: string }`
  - Returns: `{ batchId, jobIds[], status: "queued" }`
- [ ] Queue-based processing:
  - [ ] Cloudflare Queue or sequential Workflow fan-out
  - [ ] Concurrency limit based on plan (Starter: 3, Pro: 10, Scale: 25)
- [ ] `GET /v1/extract/bulk/:batchId` — batch status (counts: pending, running, complete, failed)
- [ ] Webhook callback on batch completion
- [ ] CSV upload in dashboard UI:
  - [ ] Upload CSV with domain column
  - [ ] Parse and submit as bulk extraction
  - [ ] Progress table showing each domain's status
- [ ] Bulk result download: ZIP of individual JSON files
- [ ] Credit cost: 1 credit per domain in batch

### 4.3 — Brand Monitoring

- [ ] `POST /api/monitors` — create monitor
  - Input: `{ domain, interval: "weekly" | "monthly" }`
- [ ] `GET /api/monitors` — list monitors
- [ ] `DELETE /api/monitors/:id` — remove monitor
- [ ] D1 table: `monitors` (id, user_id, domain, interval, last_run, next_run, created_at)
- [ ] Cron trigger: daily check for monitors due to run
- [ ] Diff detection:
  - [ ] Compare current extraction with previous
  - [ ] Detect: color changes, logo changes, font changes, tone shifts
  - [ ] Store diff summary in D1
- [ ] Email notification on changes (Cloudflare Email Workers)
- [ ] Dashboard: monitor list with last change date, diff view
- [ ] History view: timeline of extractions with visual diff
- [ ] Credit cost: 1 credit per scheduled extraction
- [ ] Plan limits: Free: 0 monitors, Starter: 5, Pro: 25, Scale: 100

---

## Session 4C: Growth Loops

### 4.4 — Advanced Export Formats

- [ ] W3C Design Tokens (JSON) — for Style Dictionary / Figma
- [ ] Figma Variables export (JSON format for Figma import)
- [ ] PDF Brand Kit:
  - [ ] Use satori/resvg to generate multi-page PDF-style images
  - [ ] Or use a lightweight PDF library
  - [ ] Branded, polished layout with all sections
- [ ] shadcn/ui theme config export
- [ ] Storybook theme export

### 4.5 — Growth Loops

**Public Brand Pages (SEO):**
- [ ] `/brand/:domain` pages are public and SSR'd
- [ ] Optimize for "[brand name] brand kit", "[brand] colors", "[brand] fonts"
- [ ] Index top 500 brands automatically (batch extract popular domains)
- [ ] Internal linking between comparable brands
- [ ] Breadcrumbs for SEO

**Comparison Pages (Programmatic SEO):**
- [ ] `/compare/:domain1-vs-:domain2` — side-by-side brand comparison
- [ ] Auto-generate for comparable brands (from vibe synthesis)
- [ ] SSR with structured data
- [ ] Target: "[brand] vs [brand] design" search queries

**Social Proof:**
- [ ] "Powered by ExtractVibe" badge in exported kits (optional, removable on Pro+)
- [ ] Share button on brand kit pages (Twitter, LinkedIn)
- [ ] "Brand of the Day" automated social posts (cron-triggered)

**Integration Showcases:**
- [ ] Blog posts / docs: "How to use ExtractVibe with Cursor"
- [ ] "How to use ExtractVibe with v0"
- [ ] "How to use ExtractVibe with Figma"
- [ ] "Feed brand rules to Claude/GPT for on-brand content"

---

## Verification Checklist

- [ ] Can upgrade from Free to Starter via Stripe checkout
- [ ] Credits increase on plan upgrade
- [ ] Overage charges tracked on paid plans
- [ ] x402 payment works for unauthenticated API access
- [ ] Bulk extraction of 10 URLs works end-to-end
- [ ] Webhook fires on bulk completion
- [ ] Monitor triggers re-extraction on schedule
- [ ] Email notification sent on brand change detected
- [ ] PDF export generates polished document
- [ ] Public brand pages rank in search (verify with site: query after indexing)
- [ ] Comparison pages render correctly
