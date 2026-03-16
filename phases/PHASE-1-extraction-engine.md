# Phase 1 — Core Extraction Engine

> **Goal:** Enter a URL → get a comprehensive brand kit JSON. The product's core value.
> **Estimated:** 2-3 sessions
> **Depends on:** Phase 0 complete

---

## Session 1A: Schema + Pipeline Skeleton

### 1.8 — Schema Definition (do first — everything else depends on this)

- [ ] `src/schema/v1.ts` — full TypeScript types for `ExtractVibeBrandKit`
  - [ ] `BrandKitMeta` (url, extracted_at, schema_version, duration_ms)
  - [ ] `BrandIdentity` (brand_name, tagline, description, archetypes[])
  - [ ] `BrandLogo` (type, url, format, variant, dimensions, confidence)
  - [ ] `BrandColors` (light_mode, dark_mode — each with primary, secondary, accent, background, surface, text, border, link, semantic{})
  - [ ] `BrandTypography` (families[], scale{}, conventions{})
  - [ ] `BrandSpacing` (base_unit, border_radius, grid, container_widths)
  - [ ] `BrandAsset` (type, url, format, context, extracted_from)
  - [ ] `BrandVoice` (tone_spectrum{}, copywriting_style{}, content_patterns{}, sample_copy[])
  - [ ] `BrandRules` (dos[], donts[])
  - [ ] `BrandVibe` (summary, tags[], visual_energy, design_era, comparable_brands[], emotional_tone, target_audience)
  - [ ] `OfficialGuidelines` (discovered_url, has_official_kit, guideline_rules[])
- [ ] Every field optional, every value has `confidence: number` (0-1)
- [ ] Export as both TS types and JSON Schema

### 1.1 — Extraction Workflow Skeleton

- [ ] `src/workflows/extract-brand.ts` — `ExtractBrandWorkflow` class
- [ ] 5 step stubs: `fetch-render`, `parse-assets`, `analyze-voice`, `synthesize-vibe`, `score-package`
- [ ] Wire Workflow binding in `wrangler.jsonc`
- [ ] `POST /api/extract` route — accepts `{ url }`, starts Workflow, returns `{ jobId }`
- [ ] `GET /api/extract/:jobId` route — returns Workflow status
- [ ] Durable Object for job progress (`src/durable-objects/job-progress.ts`)
- [ ] WebSocket endpoint for real-time progress: `GET /api/ws/:jobId`

---

## Session 1B: Fetch + Parse (Steps 1-2)

### 1.2 — Step 1: Fetch & Render

- [ ] Navigate to URL via Browser Rendering, wait for network idle
- [ ] Extract rendered HTML (full DOM, not source)
- [ ] Extract computed styles on key elements:
  - [ ] `html`, `body` (background, color, font)
  - [ ] `h1`-`h6` (font-family, size, weight, line-height, letter-spacing, text-transform, color)
  - [ ] `a`, `button` (color, background, font, border-radius, padding)
  - [ ] `nav`, `header`, `footer` (background, border)
  - [ ] `input`, `textarea` (border, border-radius, font)
- [ ] Extract all `<link>` tags (icons, stylesheets, manifest)
- [ ] Extract all `<meta>` tags (theme-color, OG tags, twitter cards)
- [ ] Extract inline `<style>` content
- [ ] Fetch `manifest.json` / `site.webmanifest` if linked
- [ ] Take full-page screenshot → store in R2
- [ ] Emit progress: `{ step: "fetch-render", status: "complete" }`

### 1.3 — Step 2: Parse Visual Identity

**Logos:**
- [ ] Extract from `<link rel="icon">` (all sizes)
- [ ] Extract apple-touch-icon
- [ ] Extract `<img>` tags in `<nav>` / `<header>` (likely logos)
- [ ] Extract inline SVGs in header/nav (with dimension probing)
- [ ] Extract OG image
- [ ] Extract manifest icons
- [ ] Classify each: primary, logomark, wordmark, favicon, monochrome, social
- [ ] Detect light/dark variants if both exist
- [ ] Download and store originals in R2
- [ ] Record dimensions, format, source URL

**Colors:**
- [ ] Parse CSS custom properties from `:root` / `html` / `body`
- [ ] Extract `theme-color` from meta tag
- [ ] Extract from manifest `theme_color` and `background_color`
- [ ] Extract computed colors from key elements
- [ ] Detect dark mode: check for `@media (prefers-color-scheme: dark)` or `.dark` class CSS
- [ ] Classify colors by role: primary, secondary, accent, bg, surface, text, border, link
- [ ] Classify semantic colors: success, warning, error, info
- [ ] Deduplicate similar colors (within ΔE < 5)
- [ ] Separate into light_mode and dark_mode palettes

**Typography:**
- [ ] Extract computed font-family for: h1-h6, body, button, nav, code
- [ ] Detect font source (Google Fonts URL, Adobe Fonts, self-hosted, system)
- [ ] Map weights used (check computed font-weight across elements)
- [ ] Extract full type scale: size, weight, line-height, letter-spacing, text-transform for each level
- [ ] Detect font fallback stack
- [ ] Identify heading vs body vs mono vs display roles

**Spacing & Layout:**
- [ ] Extract most common padding/margin values (statistical mode)
- [ ] Extract border-radius values from buttons, cards, inputs
- [ ] Detect container max-width
- [ ] Detect grid system if CSS Grid used (columns, gap)

**Assets:**
- [ ] Extract CSS `background-image` URLs (patterns, textures)
- [ ] Extract hero/banner images from common selectors
- [ ] Extract decorative inline SVGs (not in nav/header)
- [ ] Detect icon library: scan class names for `lucide-*`, `fa-*`, `heroicon-*`, `material-*`, `icon-*`
- [ ] Extract OG image and Twitter card image

- [ ] Emit progress: `{ step: "parse-assets", status: "complete" }`

---

## Session 1C: AI Analysis + Assembly (Steps 3-5)

### 1.4 — Step 3: Brand Voice Analysis

- [ ] Collect visible text: headings, hero copy, CTAs, nav labels, footer, about/mission
- [ ] Set up Cloudflare AI client (`src/lib/cf-ai.ts`)
- [ ] Set up OpenRouter client (`src/lib/ai.ts`) as fallback
- [ ] LLM prompt for tone spectrum:
  - [ ] formal ↔ casual (1-10)
  - [ ] playful ↔ serious (1-10)
  - [ ] enthusiastic ↔ matter-of-fact (1-10)
  - [ ] respectful ↔ irreverent (1-10)
  - [ ] technical ↔ accessible (1-10)
- [ ] LLM prompt for copywriting style:
  - [ ] Average sentence length
  - [ ] Vocabulary complexity (simple/moderate/advanced)
  - [ ] Jargon usage (none/some/heavy)
  - [ ] Rhetorical devices detected
  - [ ] CTA style (imperative, question, benefit-led)
- [ ] LLM prompt for content patterns:
  - [ ] Heading case (title case, sentence case, lowercase, UPPERCASE)
  - [ ] Emoji usage (none, light, heavy)
  - [ ] Exclamation point frequency
  - [ ] Question usage in headings
  - [ ] Bullet point vs paragraph preference
- [ ] LLM prompt for brand personality:
  - [ ] Brand archetype (Explorer, Creator, Ruler, etc.)
  - [ ] Confidence score for archetype
- [ ] Extract tagline and value propositions from hero/header text
- [ ] Model selection: try `@cf/meta/llama-3.1-70b-instruct` first, fallback to OpenRouter `google/gemini-flash-2.0`
- [ ] Emit progress: `{ step: "analyze-voice", status: "complete" }`

### 1.5 — Step 4: Vibe Synthesis

- [ ] Feed visual identity summary + voice analysis to LLM
- [ ] Generate vibe summary (2-3 sentences, natural language)
- [ ] Generate vibe tags (5-8 descriptive strings)
- [ ] Score visual energy (1-10)
- [ ] Classify design era (e.g., "contemporary-minimal", "bold-maximalist", "neo-brutalist")
- [ ] Identify 3-5 comparable brands
- [ ] Label emotional tone (e.g., "trustworthy-premium", "friendly-approachable")
- [ ] Infer target audience
- [ ] Generate DOs and DON'Ts rules (8-15 rules total, inferred from patterns)
- [ ] Model: Cloudflare AI primary, OpenRouter fallback
- [ ] Emit progress: `{ step: "synthesize-vibe", status: "complete" }`

### 1.6 — Step 5: Score & Package

- [ ] Assign confidence scores:
  - [ ] Meta tag source → 0.9-1.0
  - [ ] Computed style source → 0.7-0.9
  - [ ] CSS parsing source → 0.6-0.8
  - [ ] LLM inference → 0.5-0.7
  - [ ] Corroboration bonus: +0.1 when multiple sources agree
- [ ] Assemble full `ExtractVibeBrandKit` object
- [ ] Cache in KV: key = `brand:${domain}`, TTL = 72 hours
- [ ] Store assets in R2: `brands/${domain}/logo-primary.svg`, etc.
- [ ] Write extraction record to D1
- [ ] Return result via Workflow completion
- [ ] Emit progress: `{ step: "score-package", status: "complete" }`

### 1.7 — Brand Kit Page Discovery

- [ ] Probe paths: `/brand`, `/brand-assets`, `/press`, `/media-kit`, `/press-kit`, `/about/brand`, `/identity`, `/brand-guidelines`, `/logos`
- [ ] Check `<link>` tags and footer links for "brand", "press", "media kit"
- [ ] If found: fetch page content
- [ ] LLM prompt: extract official guidelines into schema fields
- [ ] Merge: official guidelines override inferred values
- [ ] Set `has_official_kit: true` and `discovered_url`

---

## Verification Checklist

- [ ] `POST /api/extract { url: "https://stripe.com" }` returns jobId
- [ ] Workflow runs all 5 steps without error
- [ ] Result contains: logos (2+), colors (5+ with roles), typography (2+ families), voice analysis, vibe synthesis, rules
- [ ] Confidence scores present on all fields
- [ ] Result cached in KV
- [ ] Assets stored in R2
- [ ] Extraction record in D1
- [ ] WebSocket progress works end-to-end
- [ ] Test against 5 diverse domains: stripe.com, shopify.com, linear.app, notion.so, vercel.com
