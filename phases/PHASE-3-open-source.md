# Phase 3 — Open Source & CLI

> **Goal:** Ship the open-source core. Get GitHub stars. Build community.
> **Estimated:** 1-2 sessions
> **Depends on:** Phase 2 complete (working product to demo)

---

## Session 3A: Core Package + CLI

### 3.1 — Extract Core into Standalone Package

- [ ] Create `packages/` directory structure:
  ```
  packages/
  ├── extractvibe-core/      # Extraction engine (no Cloudflare deps)
  ├── extractvibe-schema/    # TypeScript types + JSON Schema
  ├── extractvibe-cli/       # CLI tool
  └── extractvibe-mcp/       # MCP server
  ```
- [ ] `packages/extractvibe-schema/`
  - [ ] Export all TypeScript types from Phase 1 schema
  - [ ] Export JSON Schema v1
  - [ ] `package.json` with name `extractvibe-schema`
- [ ] `packages/extractvibe-core/`
  - [ ] Pluggable browser interface: `{ navigate(url), getHTML(), getComputedStyles(selectors), screenshot() }`
  - [ ] Pluggable AI provider interface: `{ complete(prompt, options): Promise<string> }`
  - [ ] Built-in AI providers:
    - [ ] `cloudflareAI(binding)` — uses Workers AI binding
    - [ ] `openRouter(apiKey)` — uses OpenRouter API
    - [ ] `ollama(baseUrl)` — for local self-hosting
    - [ ] `none()` — skips AI steps, visual extraction only
  - [ ] Core function: `extractBrand(browser, ai?, options?): Promise<BrandKit>`
  - [ ] All extraction logic moved from Workflow steps into core functions
  - [ ] Zero Cloudflare-specific imports in core package
  - [ ] `package.json` with name `extractvibe`

### 3.2 — CLI Tool

- [ ] `packages/extractvibe-cli/`
- [ ] Entry: `bin/extractvibe.js` → `#!/usr/bin/env node`
- [ ] `npx extractvibe <url>` — full extraction
- [ ] Uses Puppeteer (not CF Browser Rendering) for local execution
- [ ] Flags:
  - [ ] `--output json|css|tailwind|markdown` (default: json)
  - [ ] `--out <filepath>` (default: `<domain>-brand-kit.json`)
  - [ ] `--ai-provider openrouter|ollama|none` (default: none)
  - [ ] `--ai-key <key>` (for OpenRouter)
  - [ ] `--no-ai` — skip voice/vibe, visual extraction only
  - [ ] `--depth shallow|standard|deep` (default: standard)
  - [ ] `--no-screenshot` — skip screenshot capture
  - [ ] `--json` — raw JSON output (no formatting, for piping)
  - [ ] `--verbose` — show detailed extraction progress
- [ ] Pretty terminal output:
  - [ ] Spinner during extraction
  - [ ] Step-by-step progress (colored status indicators)
  - [ ] Summary on completion (domain, logos found, colors found, etc.)
  - [ ] Color palette preview in terminal (colored blocks)
- [ ] Error handling: timeout, unreachable URL, browser launch failure
- [ ] `package.json` with name `extractvibe-cli`, bin field

### Refactor Cloud Worker

- [ ] Update `src/workflows/extract-brand.ts` to import from `extractvibe-core`
- [ ] Worker-specific wrappers: CF Browser Rendering → core browser interface, CF AI → core AI interface
- [ ] Verify cloud extraction still works after refactor

---

## Session 3B: NPM Publish + MCP + GitHub Launch

### 3.3 — NPM Package

- [ ] Programmatic API:
  ```typescript
  import { extractBrand } from 'extractvibe'
  import { openRouter } from 'extractvibe/ai'

  const kit = await extractBrand('https://stripe.com', {
    ai: openRouter('sk-...'),
    depth: 'standard',
  })
  ```
- [ ] Works in Node.js with puppeteer
- [ ] Works in Cloudflare Workers with Browser Rendering
- [ ] TypeScript types included (from extractvibe-schema)
- [ ] README with quick start, API reference, examples
- [ ] Publish to npm: `extractvibe`, `extractvibe-schema`, `extractvibe-cli`

### 3.5 — MCP Server

- [ ] `packages/extractvibe-mcp/`
- [ ] Tools:
  - [ ] `extract_brand(url, depth?)` — returns full brand kit JSON
  - [ ] `get_brand_colors(url)` — returns just colors object
  - [ ] `get_brand_typography(url)` — returns just typography object
  - [ ] `get_brand_voice(url)` — returns just voice/tone object
  - [ ] `get_brand_vibe(url)` — returns just vibe synthesis
- [ ] Resources:
  - [ ] `brand://<domain>` — full cached brand kit
- [ ] Uses extractvibe-core under the hood
- [ ] Config for AI provider selection
- [ ] Publish as `extractvibe-mcp` on npm
- [ ] Add to MCP registry

### 3.4 — GitHub Repository

- [ ] Init public repo: `github.com/seangeng/extractvibe`
- [ ] Monorepo structure with all packages
- [ ] `README.md`:
  - [ ] Badges (npm version, license, stars)
  - [ ] Demo GIF / screenshot of brand kit output
  - [ ] One-liner description
  - [ ] Quick start (npx, npm, API)
  - [ ] Feature list with competitor comparison table
  - [ ] Schema overview
  - [ ] Self-hosting guide
  - [ ] Cloud service link
  - [ ] Links to sub-packages
- [ ] `CONTRIBUTING.md`:
  - [ ] How to add a new extractor
  - [ ] How to propose schema changes (RFC process)
  - [ ] How to add a new output format
  - [ ] Dev setup guide
  - [ ] Code style / lint rules
- [ ] `LICENSE` — MIT
- [ ] Issue templates:
  - [ ] Bug report
  - [ ] Feature request
  - [ ] New extractor proposal
  - [ ] Schema change RFC
- [ ] GitHub Actions CI:
  - [ ] Lint + type-check on PR
  - [ ] Test extraction against 5 known domains
  - [ ] Build all packages
- [ ] GitHub Releases workflow (tag → build → publish to npm)

### Launch Prep

- [ ] Extract 10-20 popular brands for demo data
- [ ] Record demo GIF for README
- [ ] Write launch post (HN, Reddit r/webdev, Twitter/X)
- [ ] Product Hunt listing draft

---

## Verification Checklist

- [ ] `npx extractvibe https://stripe.com` works locally (no AI)
- [ ] `npx extractvibe https://stripe.com --ai-provider openrouter --ai-key sk-...` works with voice analysis
- [ ] `npm install extractvibe` → programmatic API works
- [ ] MCP server connects to Claude Code and returns brand data
- [ ] Cloud product still works (imports from core package)
- [ ] GitHub repo is public, README renders correctly
- [ ] CI passes on main branch
- [ ] npm packages published and installable
