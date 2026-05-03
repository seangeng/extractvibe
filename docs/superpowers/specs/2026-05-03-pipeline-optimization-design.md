# ExtractVibe Pipeline Optimization — Design

**Date:** 2026-05-03
**Goal:** Find latency floor without sacrificing quality.

## Constraints

- **Latency target:** Whatever floor is achievable; quality may not regress.
- **Infra:** Anything goes (CF Workers, Containers, external Rust/Go services).
- **Quality bar:** Existing `qualityScore` (0-100) must not drop on any URL by >5 points; structural diff of brand kit JSON must show no missing core fields (logos, colors, typography, voice, vibe).

## Pipeline (current)

```
fetch-render (90s)
  → parse-and-analyze (90s, parallel: parse-visual + analyze-voice)
    → synthesize-vibe (60s, parallel: synthesize-vibe + discover-brand-kit)
      → score-package (15s, includes design-md generation)
```

Hot suspects: Browser Rendering API latency, multiple LLM round-trips, design-md on critical path.

## Phase A — Benchmark harness

**Inputs:** 12 URLs covering SaaS, fintech, ecom, content, dev tools, marketplace, legacy brands.

```
linear.app, vercel.com, stripe.com, shopify.com, notion.so, github.com,
figma.com, ramp.com, airbnb.com, basecamp.com, coca-cola.com, nytimes.com
```

**Harness behavior:**
1. POST `/api/extract` for each URL (sequential or capped concurrency to avoid rate limits).
2. Poll job status until `complete` or `failed`. Capture wall-clock duration and quality score.
3. Fetch `/api/extract/:jobId/result` — save full kit JSON.
4. Pull per-step durations from logs (or extend workflow to emit step timings into the kit `meta`).
5. Output to `bench/baseline-{ISO-timestamp}/`:
   - `summary.json` — { url, totalMs, qualityScore, stepTimings, kitSize }
   - `kits/{domain}.json` — full brand kit
   - `summary.md` — human-readable table

**Audit deliverable:** `bench/baseline-{ts}/audit.md` listing:
- Slowest step per URL
- Top 3 bottleneck steps overall (median + p90)
- Missing/empty kit fields
- Errors / degraded stages
- Top 3 optimization candidates ranked by expected impact × effort

## Phase B — Iteration loop

**Per iteration:**
1. Pick highest-leverage candidate from audit (or last iteration's audit).
2. Implement on a feature branch / inline edits.
3. Re-run harness → `bench/iter-N-{ts}/`.
4. Diff vs baseline:
   - Total duration delta (median + p90)
   - Per-URL quality score delta (must not drop >5)
   - Structural diff (missing fields)
   - Eyeball worst 3 quality regressions if any
5. Decision: keep (commit) / revert (discard).
6. Update audit with new bottleneck.

**Stop conditions:**
- 2 consecutive iterations with <10% total-duration improvement
- Quality regression detected and not recoverable
- User says stop

## Optimization candidates (pre-benchmark hypotheses)

| # | Lever | Hypothesis | Effort | Risk |
|---|---|---|---|---|
| 1 | Move design-md off critical path | Mark job complete after score-package; generate design-md async | S | Low |
| 2 | Merge voice + vibe + rules LLM calls | Single OpenRouter call instead of 2-3 sequential | M | Low |
| 3 | Static-site fast path | Detect SSR sites (server HTML has key content); skip Browser Rendering | M | Med |
| 4 | Waterfall LLM start | Kick off voice analysis on partial DOM mid-render | L | Med |
| 5 | Rust container parser | Replace JS DOM walk with lol-html / scraper in CF Container | XL | High |
| 6 | Reduce Browser Rendering work | Cap render time, skip full-page screenshot until Phase 5, use viewport screenshot only | S | Low |
| 7 | Parallelize LoadLogo + Serper | Move LoadLogo fetch to start of pipeline, run alongside fetch-render | S | Low |

Pick top 2-3 from audit findings.
