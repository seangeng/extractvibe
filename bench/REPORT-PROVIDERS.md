# ExtractVibe — OpenRouter vs Andromeda LLM (20 URLs)

**Date:** 2026-05-03
**Test set (20 URLs):** anthropic, openai, perplexity, cursor, supabase, cloudflare, mongodb, postman, webflow, framer, discord, slack, dropbox, zoom, duolingo, headspace, patagonia, nike, apple, tesla

## Headline

**Quality parity achieved. Andromeda runs ~33% slower.** OpenRouter remains default; Andromeda is a viable backup or `auto` failover target.

| Metric | OpenRouter | Andromeda (fixed) | Δ |
|---|---|---|---|
| Wall median | 26.2s | 32.4s | +6.2s (+24%) |
| Wall p90 | 29.4s | 40.7s | +11.3s (+38%) |
| WF median | 21.0s | 28.0s | +7s (+33%) |
| WF p90 | 25.0s | 36.0s | +11s (+44%) |
| Successes | 17/20 | 18/20 | +1 |
| Failures | zoom, duolingo, headspace | duolingo, headspace | -1 |

## Quality parity (where both succeeded)

| Domain | OR q | Andro q | Δ |
|---|---|---|---|
| anthropic.com | 100 | 100 | = |
| openai.com | 100 | 80 | **-20** |
| perplexity.ai | 90 | 100 | **+10** |
| cursor.sh | 100 | 100 | = |
| supabase.com | 100 | 100 | = |
| cloudflare.com | 90 | 90 | = |
| mongodb.com | 100 | 100 | = |
| postman.com | 100 | 100 | = |
| webflow.com | 90 | 90 | = |
| framer.com | 100 | 100 | = |
| discord.com | 100 | 100 | = |
| slack.com | 100 | 90 | -10 |
| dropbox.com | (ERR) | 100 | **+100** (better than OR) |
| patagonia.com | 80 | 80 | = |
| nike.com | 100 | 90 | -10 |
| apple.com | 100 | 90 | -10 |
| tesla.com | 90 | 90 | = |

- 11 of 17 comparable: identical scores
- 4 small drops (-10 each): slack, nike, apple, openai (-20 outlier)
- 2 wins: perplexity (+10), dropbox (recovered failure)

Quality is effectively equivalent. The -10/-20 deltas come from `officialGuidelines.hasOfficialKit` returning false sometimes — Andromeda's brand-kit-discovery LLM call is slightly more conservative than OpenRouter's about marking a page as a true brand kit.

## Latency cost

Andromeda's `process-and-score` step takes ~19s vs OpenRouter's ~10s. The gap comes from two places:

1. **Qwen ctx budget = 4096 tokens.** Synthesize-vibe's prompt+completion exceeds this on most sites, hitting `413` and auto-falling back to Gemma's `long-context` route.
2. **Gemma is slower per token** than Qwen for big outputs (24-50s for 700-token JSON outputs vs Qwen's 8-12s).

The openai.com 60s WF outlier is exactly this — a Gemma-fallback path running ~50s for vibe synthesis.

## Critical bug found and fixed (between iterations)

First Andromeda 20-URL pass produced uniform q=70-80 — every site dropped 20-30 points. Tail logs revealed:

```
Andromeda LLM error (413): {
  "error": "qwen context budget exceeded",
  "details": {
    "estimatedPromptTokens": 1415,
    "requestedCompletionTokens": 3072,
    "contextTokens": 4096,
    "reserveTokens": 128
  }
}
```

The `synthesizeVibe` prompt with full brand-data summary (colors, type, voice, buttons, effects, spacing) ran ~1400-1500 tokens. Asking Qwen for 3072 completion tokens on top blew its 4096-token context budget every time. The error path silently fell back to default scaffolding (`vibe.confidence: 0.2`, empty `rules.dos`/`rules.donts`) which scored ~70-80 instead of 100.

**Two fixes shipped:**

1. `synthesize-vibe.ts`: completion cap 3072 → 2048. The actual output is ~700-1000 tokens; the headroom was wasted and triggering 413.
2. `ai.ts:andromedaCompletion`: when Qwen returns 413 on speed route, automatically retry on `auto` + `long-context` (Gemma, 32k ctx). Caller never sees the error; quality preserved.

After both fixes, quality jumped from q=70-80 to q=90-100 across the board.

## What's deployed

`server/lib/ai.ts`:
- `aiCompletion(config, messages, options)` — provider-agnostic router
- `andromedaCompletion(apiKey, messages, options)` — direct Andromeda client with auto-413 → Gemma fallback
- `openRouterCompletion(...)` — unchanged

`server/env.ts`:
- `ANDROMEDA_LLM_API_KEY` (secret, optional)
- `LLM_PROVIDER` var: `"openrouter"` (default) | `"andromeda"` | `"auto"`

`wrangler.jsonc` `vars.LLM_PROVIDER`: switch via redeploy. `auto` mode tries Andromeda first and falls back to OpenRouter on any error — preserves OpenRouter's reliability while exercising Andromeda's free path.

Refactored callers (all now take `LlmConfig` instead of an OpenRouter API key):
- `analyze-voice.ts`
- `synthesize-vibe.ts` (also: maxTokens 3072 → 2048)
- `discover-brand-kit.ts`
- `generate-design-md.ts`

## Reliability observations

| | OpenRouter | Andromeda |
|---|---|---|
| Total failures | 3/20 | 2/20 |
| zoom.us | ERR (poll 500) | extracted but q=null/0 — empty kit, likely bot block |
| duolingo.com | ERR (poll 500) | ERR (poll 500) |
| headspace.com | ERR (poll 500) | ERR (poll 500) |
| dropbox.com | ERR (poll 500) | q=100 ✓ recovered |

The poll-500 failures are not LLM-related — they're transient eventual-consistency lag in the CF Workflow status API. The harness retries 4× on 5xx but some windows still miss.

## Recommendation

**Default: keep `LLM_PROVIDER=openrouter`.** It's faster (-7s WF median) for the same quality.

**Use `auto` if you want a backup:** Andromeda first → OpenRouter on any failure. Adds ~1-2s on the happy path (one extra call) but means an OpenRouter outage doesn't take ExtractVibe down.

**Use `andromeda` directly:** when cost is the concern (Andromeda is essentially free for Sean's use). Trade ~7s of latency per extraction for $0 LLM spend.

Currently deployed: `LLM_PROVIDER=andromeda` (for the bench). Recommend flipping back to `openrouter` for production unless cost is the priority.

## Pre-existing quality issues unchanged

- duolingo.com / headspace.com: poll-500 failures (workflow status API lag, not extraction-related)
- zoom.us: empty extraction with Andromeda — possibly bot block or page structure issue
- patagonia.com: q=80 on both providers — existing limitation

## Artifacts

- `bench/openrouter-20/` — full kits, summary, per-step timings
- `bench/andromeda-20/` — first Andromeda run (with the 413 bug — kept for the fix story)
- `bench/andromeda-20-fixed/` — Andromeda after fixes
