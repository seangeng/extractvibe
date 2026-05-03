# Baseline Audit — 2026-05-03

**Run:** `bench/baseline/`  
**12 URLs, all extractions completed**

## Latency baseline

| Metric | Median | p90 | Min | Max |
|---|---|---|---|---|
| Wall clock | **32.5s** | 35.0s | 27.4s | 41.8s (nytimes) |
| Workflow only | **28.0s** | 31.0s | 23.0s | 38.0s |

Wall-clock = workflow + ~3-4s for queue/poll lag. Workflow timings used for analysis.

## Step bottleneck ranking (median, 12 sites)

| Rank | Step | Median | p90 | Sum (12) | % of total |
|---|---|---|---|---|---|
| 1 | **fetch-render** | 12.0s | 15.0s | 145s | 43% |
| 2 | synthesize-vibe | 6.0s | 8.0s | 73s | 22% |
| 3 | score-package | 5.0s | 9.0s | 65s | 19% |
| 4 | parse-and-analyze | 3.0s | 9.0s | 48s | 14% |

### Observations
- **fetch-render dominates** at 43% of total time. Browser Rendering API + Puppeteer DOM walk.
- **score-package p90 (9s)** is suspicious for what should be assembly. Cause: `generateDesignMd` LLM call runs synchronously inside this step (only when quality≥30, which is most). 7/12 above median 5s.
- **parse-and-analyze p90 9s** — large variance. vercel.com, nytimes.com both took 9s. Voice LLM call latency.
- **synthesize-vibe** runs `synthesizeVibe + discoverBrandKit` (Serper) in parallel inside step. 6s median is mostly the LLM call.

## Quality issues (bugs)

### 1. ramp.com — broken extraction (q=65)
```
brandName: "", logos: 0, colors: 2, fonts: 2
```
Ramp blocks bots / serves SPA shell. Fetch-render likely got nothing useful. Pipeline still passed quality gate (≥30) because voice LLM filled in defaults. Need bot-detection fallback or longer JS wait.

### 2. notion.so — 102 colors, corePalette=null
Color extraction over-detects (102 raw entries) but synthesis fails to pick `corePalette` and `primary`. Same issue on airbnb.com (99 colors, no corePalette).

### 3. github.com — Status="running" but kit retrieved q=100
Race between workflow completion and status API return. Harness reports "running" but kit was successfully retrieved. Cosmetic — just means our break-on-dbStatus logic exits before wfState transitions.

## Quality scores

| Score | Sites |
|---|---|
| 100 | linear, vercel, shopify, github, figma, coca-cola, nytimes (7) |
| 90 | stripe, notion, airbnb, basecamp (4) |
| 65 | ramp (1) |

7/12 perfect. 4/12 missing official guidelines kit. 1/12 broken (ramp).

## Top optimization candidates (ranked impact × effort)

| # | Lever | Est. saving | Effort | Risk |
|---|---|---|---|---|
| **1** | **Move `generateDesignMd` async** (out of score-package critical path) | ~4-5s baseline (-15%) | XS | Low |
| **2** | **Move `discoverBrandKit` (Serper) parallel to fetch-render** | ~2-3s | S | Low |
| **3** | **Move LoadLogo fetch parallel to fetch-render** (currently in score-package) | ~1-2s | XS | Low |
| **4** | **Merge voice + vibe + rules into one LLM call** | ~3-5s | M | Med |
| **5** | **Reduce fetch-render render-wait** (lower networkidle threshold, cap timeout) | ~3-6s | M | Med |
| **6** | **Static-site fast path** (skip Browser for SSR) | ~8-10s on detected sites | M | Med |
| **7** | **Rust container parser** | unclear | XL | High |

## Iteration 1 plan

Bundle low-risk rearrangements (#1, #2, #3) into a single iteration. All are no-functional-change, pure pipeline restructuring. Expected saving: 7-10s (-25-35%).

If quality holds → proceed to #4 / #5 in iter 2.

## Quality bugs to fix (parallel track, not perf)

- ramp.com bot-block detection
- color synthesis when raw count >50 (notion, airbnb)
- github.com status race (cosmetic only)
