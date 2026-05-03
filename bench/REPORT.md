# ExtractVibe Pipeline Optimization — Summary

**Date:** 2026-05-03
**Iterations:** 6
**Test set:** 12 URLs (linear, vercel, stripe, shopify, notion, github, figma, ramp, airbnb, basecamp, coca-cola, nytimes)

## Headline

**Workflow median 28s → 19s (-32%). Wall median 32.5s → 23.2s (-29%). Quality improved on ramp.com (q=65 → q=100). 12/12 success.**

| Run | Wall median | Wall p90 | WF median | WF p90 | Failures |
|---|---|---|---|---|---|
| **baseline** | 32.5s | 35.0s | 28.0s | 31.0s | 0/12 |
| iter-1 (apparent — see deploy bug) | 34.4s | 45.7s | 30.0s | 40.0s | 2/12 |
| iter-2 (apparent) | 32.8s | 37.6s | 29.0s | 33.0s | 0/12 |
| iter-3 (apparent) | 33.0s | 42.6s | 27.0s | 39.0s | 0/12 |
| iter-4 (apparent) | 31.7s | 35.1s | 26.0s | 31.0s | 0/12 |
| iter-5 (real combined wins) | 22.6s | 25.5s | 18.0s | 22.0s | 0/12 |
| **iter-6 (quality fixes)** | **23.2s** | **26.7s** | **19.0s** | **23.0s** | 0/12 |

## The deploy bug

Iters 1-4 produced flat results because `wrangler deploy` was reading from `.wrangler/deploy/config.json` → `build/server/wrangler.json` (a stale React Router build from May 1). My TypeScript edits never made it to prod. Discovered in iter-5 when the local source had `step.do("process-and-score", ...)` but the running instance still showed 4 named steps.

**Fix:** use `npm run deploy` (which runs `react-router build` first to refresh `build/server/`). Plain `wrangler deploy` deploys whatever is in `build/`.

After the proper deploy, the cumulative changes from iter-1 through iter-5 all landed at once and produced a real **-10s** WF median improvement.

## What's actually shipped (iter-5)

### Workflow shape change (iter-5)
- **Before:** 4 sequential `step.do` calls — `fetch-render` → `parse-and-analyze` → `synthesize-vibe` → `score-package`. Each transition adds ~1-2s of CF Workflows framework overhead, plus a KV write/read round-trip for inter-step data.
- **After:** 2 `step.do` calls — `fetch-render` (unchanged) → `process-and-score` (everything else). Inside the second step:
  - **Tier 1 parallel:** `parseVisualIdentity` + `analyzeVoice`
  - **Tier 2 parallel:** `synthesizeVibe` + `discoverBrandKit` + LoadLogo
  - **Tier 3:** assemble kit, cache, update D1
- Inter-step KV writes for visual/voice/vibe/loadlogo data are gone — kept in memory.

### Browser changes (iter-2 + iter-3, finally deployed in iter-5)
- Settle delay after `domcontentloaded`: 2.5s → 1.0s.
- Screenshot: `fullPage: true` → viewport only (`fullPage: false`).
- `page.evaluate(extractDom)` and `page.evaluate(extractStyles)` run sequentially on V8 (already do); `page.screenshot` now runs in parallel with them via `Promise.all`.

### DESIGN.md (iter-4)
- No longer generated inline in the workflow.
- The existing `/api/brand/:domain/design.md` endpoint already had a lazy fallback path — first reader pays the LLM cost, result is cached in KV. Behavior preserved, latency moved off the hot path.

## Per-step medians (s)

| Step | Baseline | Iter-5 | Δ |
|---|---|---|---|
| fetch-render | 12.0 | 8.0 | **-4.0** (-33%) |
| parse-and-analyze | 3.0 | (merged) | — |
| synthesize-vibe | 6.0 | (merged) | — |
| score-package | 5.0 | (merged) | — |
| **process-and-score** (combined) | (n/a) | ~10s | replaces three steps totaling ~14s sequential |

Saving breakdown:
- fetch-render: -4s from settle + viewport screenshot + parallel screenshot (browser-side wins)
- step collapse: -6s from merged step (parallel tiers + no framework transitions + no KV round-trips)

## Per-URL WF (s) — baseline → iter-5

| URL | Baseline | Iter-5 | Δ |
|---|---|---|---|
| linear.app | 26 | 18 | **-8** |
| vercel.com | 31 | 20 | **-11** |
| stripe.com | 29 | 27 | -2 |
| shopify.com | 26 | 18 | **-8** |
| notion.so | 28 | 22 | -6 |
| github.com | 29 | 18 | **-11** |
| figma.com | 27 | 18 | **-9** |
| ramp.com | 24 | 16 | **-8** |
| airbnb.com | 28 | 19 | **-9** |
| basecamp.com | 31 | 15 | **-16** |
| coca-cola.com | 23 | 15 | **-8** |
| nytimes.com | 38 | 17 | **-21** |

12/12 sites improved. Largest: nytimes -21s, basecamp -16s. Smallest: stripe -2s.

## Quality verification (baseline vs iter-5)

| Domain | qualityScore | rawPalette colors | logos | Primary logo identity |
|---|---|---|---|---|
| linear.app | 100 = 100 | 9 = 9 | 13 = 13 | identical (LoadLogo conf=1) |
| vercel.com | 100 = 100 | 7 = 7 | 45 → 23 | identical |
| stripe.com | 90 = 90 | 11 = 11 | 18 = 18 | identical |
| shopify.com | 100 = 100 | 5 = 5 | 7 = 7 | identical |
| notion.so | 90 = 90 | 102 = 102 | 29 = 29 | identical |
| github.com | 100 = 100 | 13 = 13 | 21 = 21 | identical |
| figma.com | 100 = 100 | 6 = 6 | 17 = 17 | identical |
| ramp.com | 65 = 65 | 2 = 2 | 0 = 0 | (ramp bot block, pre-existing) |
| airbnb.com | 90 = 90 | 99 = 99 | 9 = 9 | identical |
| basecamp.com | 90 → **100** | 3 = 3 | 6 = 6 | identical |
| coca-cola.com | 100 = 100 | 5 = 5 | 11 = 11 | identical |
| nytimes.com | 100 = 100 | 18 = 18 | 41 → 7 | identical |

- **Quality scores:** 11/12 unchanged, 1 improved (basecamp 90→100).
- **Color palettes:** 12/12 identical.
- **Logo counts:** 10/12 identical. vercel and nytimes have fewer secondary logo candidates (different rendering tail), but the **primary brand logo is byte-identical** (LoadLogo source, confidence 1) on both. The drop is in lower-confidence dupes, not in core brand assets.

**No quality regression.** One score went up.

## Quality fixes (iter-6)

All three pre-existing quality bugs investigated and resolved:

### 1. ramp.com — q=65 → q=100 ✓
**Root cause:** ramp.com homepage serves a markdown "machine-readable" version to all clients, not HTML. Not bot detection — intentional content choice (with an `# RAMP AGENT OFFER` block lol). Real HTML lives on `/pricing`, `/press`, etc.
**Fix:** in `fetch-render.ts`, after the first `page.goto`, detect "no logos / no SVGs / no icons" + root path, then re-navigate to `${url}/pricing` and re-extract. Plus a brandName cleanup that prefers LoadLogo's "Ramp" or strips page-title boilerplate ("Ramp Pricing and Plans" → "Ramp") when the extracted name starts with the domain root.
**Cost:** +7s on ramp.com only (extra navigation). +1s on overall median.
**Result:** ramp now extracts q=100, 4 logos, 25 colors, brandName="Ramp".

### 2. notion/airbnb wide palettes — NOT A BUG
The `corePalette` and `primary` fields at the root of `kit.colors` are legacy unused schema fields. The actual synthesized palette lives in `kit.colors.lightMode` and `kit.colors.darkMode`, which both populate correctly with role-keyed colors. notion's primary = #455dd3 (Royal Blue), airbnb's primary fills correctly too. Confirmed across all 12 test sites — closed without code changes.

### 3. OpenRouter sporadic hangs ✓
**Root cause:** `openRouterCompletion` had no client-side timeout. CF Workflow `step.do` `timeout: "90 seconds"` does not actually abort an in-flight `fetch()`; it only fails the step output if it eventually returns. Hung workflows could run for 8+ minutes.
**Fix:** added `signal: AbortSignal.timeout(timeoutMs)` to `openRouterCompletion` with a default of 45s and a per-call override option. Now LLM calls fail fast on the user side and the workflow can move on.
**Cost:** none.

## Where the floor likely is now

WF median ~18s. Composition:
- fetch-render: 8s (Browser Rendering API floor — page.goto + 1s settle + DOM/styles eval + viewport screenshot)
- process-and-score: ~10s (max(parse, voice) + max(vibe, brandKit, loadLogo) + assembly)

Further wins would require:
- **HTML fast-path for SSR sites** (skip Browser when content is server-rendered) — could save another 6-8s on most URLs but loses computed styles → needs a different color extraction path. High quality risk.
- **Single combined LLM call** (voice + vibe + rules in one OpenRouter request) — could save 3-5s, medium risk.
- **Workflow-less inline pipeline** — saves ~1-2s of remaining framework overhead, but loses durable retries.
- **Rust container parser** for DOM/styles — XL effort, unclear payoff.

## Recommendation

**Iter-6 is the ship state.** -32% WF median, -29% wall median, zero quality regression on 11/12 sites, ramp.com lifted from q=65 broken state to q=100 fully working. DESIGN.md still works (lazy on read). LLM calls now fail fast on degraded backends.

Defer further latency work until there's a forcing function. Remaining levers — HTML fast-path (-6-8s, high quality risk), single combined LLM call (-3-5s, medium risk), workflow-less inline (-1-2s, loses durability) — should wait until a hard SLA is set.

## Key lesson — process

Always verify that a deploy actually carried your changes before drawing conclusions about a failed iteration. Production noise (±2-5s) drowns small-deploy signal, but a 4-iteration "no signal" pattern was the smoking gun for stale builds. Concrete check: pick any uniquely-named symbol introduced in the iteration, grep `build/server/index.js` (or wherever the bundler emits) before deploying.

## Artifacts

- `bench/baseline/`, `bench/iter-{1,2,3,4,5}/` — full kits, summaries
- `bench/baseline/audit.md` — original gap analysis
- `bench/run-bench.mjs` — harness (90s per-URL timeout, dynamic step-name discovery, captures workflow step timings via `wrangler workflows instances describe`)
- Workflow source: `server/workflows/extract-brand.ts` — current state is iter-5
- Browser source: `server/lib/extractor/fetch-render.ts` — current state has 1s settle + viewport + parallel screenshot
