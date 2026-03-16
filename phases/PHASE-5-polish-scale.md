# Phase 5 — Polish & Scale

> **Goal:** Production hardening, advanced features, ecosystem expansion.
> **Estimated:** Ongoing
> **Depends on:** Phase 4 complete (revenue-generating product)

---

## 5.1 — Extraction Quality & Testing

### Test Infrastructure
- [ ] Curate test suite of 100+ domains across categories:
  - [ ] Tech/SaaS (Stripe, Linear, Vercel, Notion, Figma)
  - [ ] E-commerce (Shopify, Amazon, Etsy)
  - [ ] Media (NYT, Medium, Substack)
  - [ ] Enterprise (Salesforce, Microsoft, Oracle)
  - [ ] Small business / indie sites
  - [ ] Non-English sites (Japanese, German, Portuguese)
  - [ ] Minimalist / brutalist / maximalist designs
- [ ] Expected results snapshots for each domain (manually verified)
- [ ] Accuracy scoring pipeline:
  - [ ] Compare extracted logos vs known logos (image similarity)
  - [ ] Compare extracted colors vs known brand colors
  - [ ] Compare fonts vs known brand fonts
  - [ ] Voice analysis quality scoring (human review)
- [ ] CI job: run extraction on test domains, flag regressions
- [ ] Accuracy dashboard: track scores over time

### Model Quality
- [ ] A/B test different models for voice analysis:
  - [ ] Cloudflare AI Llama 3.1 8B vs 70B
  - [ ] Gemini Flash vs Haiku
  - [ ] Measure quality + latency + cost for each
- [ ] Prompt optimization: iterate on prompts based on accuracy results
- [ ] Structured output enforcement (JSON mode) to reduce parsing failures

### Edge Cases
- [ ] SPAs (React, Vue, Angular) — ensure Browser Rendering waits for hydration
- [ ] Sites behind cookie consent banners — dismiss common consent patterns
- [ ] Very large sites (100+ CSS files) — cap and prioritize critical CSS
- [ ] Sites with anti-bot (Cloudflare challenges, CAPTCHAs) — graceful failure
- [ ] Sites with no CSS custom properties — fallback to computed style analysis
- [ ] Dark-mode-only sites — detect and handle
- [ ] Sites with CSS-in-JS — extract from computed styles, not stylesheets

---

## 5.2 — Advanced Extraction Features

### Multi-Page Analysis
- [ ] Crawl beyond homepage: `/about`, `/pricing`, `/blog` (first post), `/contact`
- [ ] Merge text content from multiple pages for richer voice analysis
- [ ] Detect page-specific styling variations
- [ ] Pro/Scale tier feature (higher credit cost: 3 credits)

### Social Media Extraction
- [ ] Fetch Twitter/X profile: bio, header image, profile photo, pinned tweet tone
- [ ] Fetch LinkedIn company page: description, banner, logo
- [ ] Fetch Instagram: profile photo, recent post aesthetic analysis
- [ ] Merge social presence into brand voice analysis

### Motion & Interaction Patterns
- [ ] Detect CSS transitions (duration, easing, properties)
- [ ] Detect CSS animations (@keyframes)
- [ ] Scroll behavior (smooth, snap)
- [ ] Hover effects on buttons/links
- [ ] Classify: "minimal motion", "standard transitions", "animation-heavy"

### Component Patterns
- [ ] Button styles (primary, secondary, ghost, link)
- [ ] Card patterns (shadow, border, border-radius, padding)
- [ ] Input/form styles
- [ ] Navigation patterns (top bar, sidebar, hamburger)
- [ ] Footer layout pattern

### Accessibility Profile
- [ ] ARIA usage patterns
- [ ] Color contrast ratios (WCAG compliance per color pair)
- [ ] Focus styles present/absent
- [ ] Alt text usage on images
- [ ] Semantic HTML usage score

---

## 5.3 — Platform Integrations

### Browser Extension
- [ ] Chrome extension: "Extract brand from current tab"
- [ ] Popup UI showing quick color palette + fonts
- [ ] "Full extraction" button → opens ExtractVibe dashboard
- [ ] Chrome Web Store listing

### Figma Plugin
- [ ] Import ExtractVibe brand kit as Figma variables
- [ ] Colors → color variables
- [ ] Typography → text styles
- [ ] Spacing → spacing variables
- [ ] Figma Community listing

### VS Code Extension
- [ ] Command: "ExtractVibe: Generate theme from URL"
- [ ] Outputs Tailwind config or CSS variables into project
- [ ] VS Code Marketplace listing

### Zapier / Make
- [ ] Zapier app: trigger on extraction complete, actions: get brand kit
- [ ] Make module: extract brand, get colors, get voice

### Webhook Integrations
- [ ] Configurable webhook URLs per user
- [ ] Events: extraction.complete, extraction.failed, monitor.change_detected
- [ ] Webhook signature verification (HMAC)
- [ ] Webhook delivery logs in dashboard

---

## 5.4 — Enterprise Features

### Team Workspaces
- [ ] Better Auth organization plugin
- [ ] Create/manage teams
- [ ] Invite members (email invitation flow)
- [ ] Roles: owner, admin, member, viewer
- [ ] Shared extraction history within team
- [ ] Team-level API keys
- [ ] Team billing (plan applies to team, not individual)

### Brand Collections
- [ ] Group extractions by project/client
- [ ] Collection CRUD (create, rename, add/remove brands, delete)
- [ ] Collection-level sharing (public link)
- [ ] Export entire collection as ZIP

### Custom Schema Extensions
- [ ] Define custom fields per team
- [ ] Custom fields populated by user-provided LLM prompts
- [ ] Custom fields included in API response and exports

### Audit Log
- [ ] Track all actions: extraction, export, key creation, plan change, member invite
- [ ] Filterable by user, action type, date range
- [ ] Export audit log as CSV

### SLA Dashboard
- [ ] Uptime monitoring display
- [ ] API response time P50/P95/P99
- [ ] Extraction success rate
- [ ] Status page (public)

---

## Verification Checklist

- [ ] Extraction accuracy ≥ 90% on logos, ≥ 85% on colors across test suite
- [ ] Multi-page analysis provides measurably richer voice data
- [ ] Chrome extension works end-to-end
- [ ] Figma plugin imports brand kit correctly
- [ ] Team workspace with 3+ members works correctly
- [ ] Webhook delivery with retry works
- [ ] Audit log captures all actions
- [ ] Non-English site extraction produces reasonable results
