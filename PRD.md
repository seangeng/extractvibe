# ExtractVibe - Product Requirements Document

## 1. Vision

**ExtractVibe** is an open-source brand intelligence engine that extracts, interprets, and reconstructs a comprehensive brand kit from any website or domain — going far beyond logos and colors to capture the full *vibe*: tone of voice, visual rhythm, design rules, asset library, and brand personality.

Where competitors stop at surface-level extraction (logos, a few hex codes, maybe fonts), ExtractVibe delivers a **media-kit-grade brand profile** — the kind of document a brand designer would produce after weeks of immersion — generated in seconds.

### Why Now

- AI models are cheap enough (many are free on Cloudflare AI) to do deep content analysis at near-zero marginal cost.
- Browser rendering (Cloudflare Browser Rendering / Puppeteer) makes full-page analysis trivial.
- Every product that integrates with other brands (CRMs, marketplaces, email tools, design tools, AI agents) needs structured brand data — and nobody is giving them enough depth.
- Open-source brand tools are nascent. OpenBrand has ~450 GitHub stars with minimal depth. There is a gap for a community-driven, deeply comprehensive alternative.

### Core Thesis

> A brand's *vibe* is more than its assets. It's a system of rules, personality, and visual language. ExtractVibe captures the full system — not just the pieces.

---

## 2. Target Users

| Segment | Use Case |
|---|---|
| **Developers & AI Agents** | Programmatic brand personalization — white-label products, personalized outreach, dynamic theming |
| **Designers & Agencies** | Rapid brand audits, competitive analysis, client onboarding — skip hours of manual asset collection |
| **Marketers & Content Creators** | On-brand content generation — feed brand rules into AI writing/design tools |
| **SaaS Products** | Embed brand extraction into their product (CRM, email, landing page builders) |
| **Brand Managers** | Monitor brand consistency across properties, audit partner usage |

---

## 3. Feature Requirements

### 3.1 Core Extraction Engine

#### 3.1.1 Visual Identity

| Feature | Detail | Competitors |
|---|---|---|
| **Logos** | Primary logo, secondary/alternate logos, logo mark (icon only), word mark (text only), monochrome variants, dark/light mode variants. Extracted as SVG (preferred), PNG, and original format. | OpenBrand: basic logo only. Brand.dev: logo + variants. |
| **Favicon & App Icons** | Favicon (all sizes), apple-touch-icon, manifest icons, PWA icons | OpenBrand: favicon only. |
| **Colors — Deep Palette** | Primary, secondary, accent, background, surface, text, link, success/warning/error/info semantic colors. Light mode + dark mode palettes separately. Named with role classification (not just hex dumps). | OpenBrand: basic dominant colors. Firecrawl: decent palette with roles. Brand.dev: colors with some roles. |
| **Typography System** | Font families (heading, body, mono, display), weights used, sizes (scale from h1-h6, body, caption, small), line heights, letter spacing, text transform rules (uppercase headings, etc.) | OpenBrand: none. Firecrawl: font families + sizes. Brand.dev: fonts + basic typography. |
| **Spacing & Layout System** | Base spacing unit, border radius tokens, padding/margin patterns, grid system (columns, gutter, max-width), container widths | Firecrawl: basic spacing. Others: none. |
| **Imagery Style** | Photography style (flat lay, lifestyle, abstract, etc.), illustration style, icon style (outline, filled, duotone), image treatment (rounded corners, shadows, overlays) | Nobody does this. |

#### 3.1.2 Brand Assets Library

| Feature | Detail |
|---|---|
| **Background Patterns** | Extract CSS background patterns, SVG patterns, texture images used as backgrounds |
| **Illustrations & Graphics** | Identify and extract inline SVGs, decorative elements, hero graphics, section dividers |
| **Icon Set** | Detect icon library in use (Heroicons, Lucide, Font Awesome, custom), extract sample icons |
| **OG/Social Images** | Open Graph images, Twitter cards, structured social media assets |
| **Backdrop/Hero Images** | Hero banners, featured images, key visual assets |

#### 3.1.3 Brand Voice & Personality (AI-Powered)

This is our **primary differentiator**. No competitor does this at depth.

| Feature | Detail |
|---|---|
| **Tone of Voice** | Formal ↔ Casual, Playful ↔ Serious, Enthusiastic ↔ Matter-of-fact, Respectful ↔ Irreverent — scored on spectrum scales |
| **Copywriting Style** | Sentence length patterns, vocabulary complexity (Flesch-Kincaid level), use of jargon, rhetorical devices, CTA style |
| **Brand Personality** | Mapped to brand archetype framework (Explorer, Creator, Ruler, etc.) with confidence score |
| **Tagline & Value Props** | Extract primary tagline, key value propositions, mission/about statements |
| **Content Patterns** | Heading conventions (title case, sentence case, lowercase), emoji usage, exclamation point frequency, question usage |

#### 3.1.4 Brand Rules (DOs and DON'Ts)

AI-generated rules inferred from the brand's actual usage patterns:

```
DO:
- Use sentence case for all headings
- Keep CTAs to 3 words or fewer ("Start free", "Get started")
- Use the green accent (#00C853) only for primary CTAs
- Photography should feature people, never stock illustrations

DON'T:
- Never use the logo below 80px width
- Don't combine the wordmark with a custom icon
- Avoid all-caps except for small labels/badges
- Don't use the brand blue (#1A73E8) as a background fill
```

These rules are **inferred by AI** from analyzing the brand's own patterns — not prescribed. This is a novel feature that no competitor offers.

#### 3.1.5 Brand Kit Page Discovery

Some brands publish official brand/press kits (e.g., `shopify.com/brand-assets`, `brand.company.com`, `/press`, `/media-kit`, `/brand`).

| Feature | Detail |
|---|---|
| **Auto-Discovery** | Crawl common brand kit paths (`/brand`, `/brand-assets`, `/press`, `/media-kit`, `/about/brand`, `/identity`) |
| **Guideline Extraction** | Use LLM to interpret official brand guidelines into our structured schema |
| **Asset Download** | Extract downloadable asset packages (logo ZIPs, brand PDFs) linked from brand pages |
| **Conflict Resolution** | When official guidelines exist, merge them with extracted data — official guidelines take precedence, with extracted data filling gaps |

#### 3.1.6 Vibe Synthesis (The "Vibe Score")

The capstone feature — an AI-synthesized holistic brand profile:

```json
{
  "vibe_summary": "Minimal, confident, developer-first. Stripe communicates authority through restraint — muted colors, generous whitespace, precise typography. The brand feels like a well-designed API: clean, predictable, powerful.",
  "vibe_tags": ["minimal", "technical", "premium", "developer-first", "confident"],
  "visual_energy": 3,        // 1 (calm/muted) to 10 (bold/energetic)
  "design_era": "contemporary-minimal",
  "comparable_brands": ["Linear", "Vercel", "Notion"],
  "emotional_tone": "trustworthy-premium",
  "target_audience_inferred": "developers, technical founders, enterprise engineering teams"
}
```

---

### 3.2 Output Schema

A single, comprehensive, **versioned JSON schema** that covers all extracted data. The schema must be:

- **Stable** — versioned with semver, backward-compatible changes only
- **Complete** — every field optional but comprehensively defined
- **Interoperable** — designed for consumption by AI tools, design tools, and code
- **Confidence-scored** — every extracted value includes a confidence score (0-1) so consumers can filter by quality

Top-level schema structure:

```
ExtractVibeBrandKit v1
├── meta (url, extracted_at, schema_version, extraction_duration)
├── identity
│   ├── brand_name
│   ├── tagline
│   ├── description
│   └── brand_archetypes[]
├── logos[]
│   ├── type (primary | secondary | wordmark | logomark | monochrome | favicon)
│   ├── url
│   ├── format (svg | png | ico | webp)
│   ├── variant (light | dark | color | mono)
│   └── dimensions
├── colors
│   ├── light_mode{}
│   │   ├── primary, secondary, accent, background, surface, text...
│   │   └── semantic (link, success, warning, error, info)
│   └── dark_mode{}
├── typography
│   ├── families[] (name, role, source, weights[], fallback)
│   ├── scale (h1-h6, body, small, caption — size, weight, line_height, letter_spacing, text_transform)
│   └── conventions (heading_case, body_style)
├── spacing
│   ├── base_unit, border_radius, grid, container_widths
│   └── component_patterns{}
├── assets[]
│   ├── type (pattern | illustration | icon | hero | social | backdrop)
│   ├── url, format, context
│   └── extracted_from
├── voice
│   ├── tone_spectrum{} (formal_casual, playful_serious, ...)
│   ├── copywriting_style{}
│   ├── content_patterns{}
│   └── sample_copy[]
├── rules
│   ├── dos[]
│   └── donts[]
├── vibe
│   ├── summary
│   ├── tags[]
│   ├── visual_energy
│   ├── design_era
│   ├── comparable_brands[]
│   └── emotional_tone
└── official_guidelines
    ├── discovered_url
    ├── has_official_kit (boolean)
    └── guideline_rules[] (merged with inferred rules)
```

### 3.3 Delivery Formats

| Format | Use Case |
|---|---|
| **JSON** (primary) | API consumers, AI agents, programmatic use |
| **Tailwind Config** | Drop-in `tailwind.config.js` with the brand's design tokens |
| **CSS Variables** | `:root` custom properties for vanilla CSS projects |
| **Design Tokens** (W3C format) | Interop with Figma, Style Dictionary, and design systems |
| **Figma Variables** (future) | Direct import into Figma |
| **Markdown Report** | Human-readable brand audit document |
| **PDF Brand Kit** (future) | Polished, downloadable brand kit document |

---

### 3.4 API & Integration

| Feature | Detail |
|---|---|
| **REST API** | `POST /extract` with URL, returns full brand kit JSON |
| **Webhook** | Optional webhook for async extraction completion |
| **MCP Server** | Model Context Protocol server for direct use by AI agents (Claude, Cursor, etc.) |
| **NPM Package** | `extractvibe` — self-hostable extraction as a library |
| **CLI** | `npx extractvibe https://example.com` for quick local use |
| **Bulk Extraction** | Submit a list of domains, get results via webhook or polling |

### 3.5 Web Dashboard (Cloud)

- Enter a URL → see a beautifully rendered brand kit
- Side-by-side comparison of two brands
- History of extractions with diffs (track brand evolution)
- Export in any supported format
- Share link (public brand kit page per domain)
- API key management

---

## 4. Competitive Analysis

| Capability | ExtractVibe | OpenBrand | Firecrawl Branding | Brand.dev |
|---|---|---|---|---|
| **Logos** (multi-variant) | Deep (6+ types) | Basic (1-2) | Primary only | Logo + variants |
| **Colors** (role-classified) | Full palette, light+dark, semantic | Dominant colors only | Good palette with roles | Colors with some roles |
| **Typography system** | Full scale + conventions | None | Families + sizes | Families + basic |
| **Spacing/layout tokens** | Full system | None | Basic | None |
| **Brand voice/tone** | Deep (spectrums, patterns, style) | None | Basic personality traits | None |
| **Brand rules (DOs/DON'Ts)** | AI-inferred | None | None | None |
| **Brand kit page discovery** | Auto-discover + LLM interpret | None | None | None |
| **Vibe synthesis** | Full profile | None | None | None |
| **Asset extraction** | Patterns, icons, illustrations | Backdrop images | OG images | Backdrop images |
| **Confidence scores** | Per-field | None | None | None |
| **Output formats** | JSON, Tailwind, CSS vars, tokens, MD | JSON | JSON | JSON |
| **Open source** | Yes (core) | Yes | No | No |
| **Self-hostable** | Yes | Yes | No | No |
| **MCP Server** | Yes | Yes | No | No |
| **Pricing** | Generous free tier | Free (limited) | Credit-based (scrape credits) | $0-$949/mo |

---

## 5. Pricing

### Philosophy

- **Open source core** — the extraction engine is fully open source. Self-host for free, forever.
- **Cloud is a convenience layer** — we host it, handle scale, cache results, provide a dashboard.
- **Radically undercut competitors** — Brand.dev charges $49/mo for 3,000 brands. We'll do 10x the value at a fraction.
- **Generous free tier** — enough for indie hackers, side projects, and evaluation.

### Cloud Pricing

| Tier | Price | Extractions/mo | Features |
|---|---|---|---|
| **Free** | $0 | 50 extractions | Full schema, all output formats, API access, MCP server, 1 req/sec |
| **Starter** | $12/mo | 500 extractions | Everything in Free + bulk extraction, webhook, priority queue, 3 req/sec |
| **Pro** | $39/mo | 5,000 extractions | Everything in Starter + brand monitoring (re-extract on schedule), comparison view, 10 req/sec |
| **Scale** | $99/mo | 50,000 extractions | Everything in Pro + dedicated support, SLA, custom export formats, 25 req/sec |
| **Enterprise** | Custom | Unlimited | Custom SLAs, on-prem deployment support, dedicated infrastructure |

### Overage

- $0.005 per extra extraction (Free tier: no overage, hard cap)
- Half-cent per extraction is dramatically cheaper than Brand.dev (~$0.016/extraction on Starter) and Firecrawl (1 credit per scrape)

### Why We Can Be This Cheap

- **Cloudflare AI** — many models are free or near-free on Workers AI
- **OpenRouter fallback** — access to dozens of cheap/free models for text analysis
- **Aggressive caching** — brands don't change daily; cache results for 24-72 hours
- **No expensive infrastructure** — Cloudflare Workers + Browser Rendering = serverless, pay-per-use
- **Open source contributors** — community improves the engine at zero cost to us

---

## 6. Top Differentiators

### 1. Depth of Extraction
Competitors extract 5-10 fields. We extract 50+. This is the single biggest gap in the market — everyone returns a shallow brand profile. We return a media-kit-grade brand system.

### 2. Brand Voice & Personality Analysis
No competitor analyzes copywriting style, tone of voice, or content patterns. This is table stakes for anyone using brand data for AI-generated content — which is a massive and growing use case.

### 3. AI-Inferred Brand Rules
Automatically generating DOs and DON'Ts from observed patterns is a novel feature. This transforms raw extraction into actionable brand governance that can be fed directly into AI writing tools, design tools, or brand compliance systems.

### 4. Vibe Synthesis
The holistic "vibe" profile — summary, tags, energy score, comparable brands, design era — gives users an immediate, intuitive understanding of a brand's identity. This is the kind of insight a brand strategist provides. We automate it.

### 5. Brand Kit Page Discovery
Automatically finding and interpreting official brand guideline pages means we can merge official rules with extracted data. Nobody else does this. When a brand has published guidelines, our output is dramatically more accurate and complete.

### 6. Open Source + Self-Hostable
OpenBrand is open source but shallow. Firecrawl and Brand.dev are closed. We combine the depth of a premium API with the accessibility of open source. Companies with data sensitivity concerns can self-host. The community can extend and improve the schema.

### 7. Multi-Format Output
JSON is table stakes. Generating Tailwind configs, CSS custom properties, and W3C design tokens means ExtractVibe output can be *directly consumed* by development workflows — not just read by humans.

### 8. Confidence Scoring
Every extracted value includes a confidence score. Consumers can filter by quality, prioritize high-confidence data, and flag low-confidence fields for manual review. No competitor offers this granularity.

---

## 7. Open Source Strategy

### What's Open Source (MIT License)

- Core extraction engine (scraper + analyzers + schema)
- CLI tool
- NPM package
- MCP server
- Output format generators (Tailwind, CSS vars, design tokens)
- Full JSON schema + TypeScript types

### What's Cloud-Only

- Hosted API with caching and CDN
- Web dashboard with comparison, history, and sharing
- Bulk extraction queue
- Brand monitoring (scheduled re-extraction)
- Managed infrastructure and uptime SLA

### Community Growth Strategy

- Ship the core engine first, get stars, build community
- Accept PRs for new extractors (e.g., "extract animation style", "extract form patterns")
- Schema is extensible — community can propose new fields via RFC process
- Plugin system for custom output formats
- Public roadmap on GitHub

---

## 8. Success Metrics

| Metric | 3-Month Target | 6-Month Target |
|---|---|---|
| GitHub Stars | 500 | 2,000 |
| NPM Weekly Downloads | 200 | 1,000 |
| Cloud Free Tier Users | 100 | 500 |
| Cloud Paid Users | 10 | 50 |
| Monthly Revenue | $500 | $2,500 |
| Extraction Accuracy (logos) | 90%+ | 95%+ |
| Extraction Accuracy (colors) | 85%+ | 92%+ |
| Schema Coverage (fields filled) | 70%+ per domain | 80%+ per domain |

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Anti-scraping measures** | Cloudflare Browser Rendering handles JS-rendered sites. Respect robots.txt. Offer authenticated extraction for users' own domains. |
| **AI extraction quality** | Confidence scores let users filter. Continuous model improvement. Community feedback loop. |
| **Schema bloat** | Strict versioning, RFC process for new fields, everything optional. |
| **Cost overruns on AI inference** | Default to free/cheap Cloudflare AI models. Cache aggressively. Only use expensive models for voice/vibe analysis (higher-value features). |
| **OpenBrand catches up** | Move fast, build community, depth is hard to replicate. Our schema and voice analysis are 6+ months ahead. |
| **Brand.dev competes on price** | We're open source. They can't compete with free self-hosting. Cloud pricing is already 3-5x cheaper. |

---

## 10. Phase 1 Scope (MVP)

Ship the smallest thing that demonstrates our depth advantage:

1. **Core extraction** — logos (multi-variant), colors (role-classified, light+dark), typography (full scale), favicon/icons
2. **Brand voice analysis** — tone spectrum, copywriting style, content patterns
3. **Brand rules** — AI-generated DOs and DON'Ts
4. **Vibe synthesis** — summary, tags, energy score, comparable brands
5. **Brand kit page discovery** — auto-detect and extract official brand pages
6. **JSON output** with confidence scores
7. **CLI** — `npx extractvibe <url>`
8. **REST API** — single endpoint, returns full kit
9. **Landing page** — enter a URL, see the magic

### Deferred to Phase 2

- Tailwind/CSS/design token output formats
- MCP server
- Web dashboard (comparison, history, sharing)
- Bulk extraction
- Brand monitoring
- Asset extraction (patterns, illustrations, icons)
- Spacing/layout system extraction
- PDF export

---

## 11. Naming & Positioning

**Name:** ExtractVibe

**Tagline:** "The brand kit your website already has."

**Positioning:** The deepest, most comprehensive brand extraction tool — open source, self-hostable, and radically affordable. Not just logos and colors. The full vibe.

**Domain ideas:** extractvibe.com, extractvibe.dev, extractvibe.sh
