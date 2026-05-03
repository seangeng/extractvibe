# Bench: openrouter-20

Run: 2026-05-03T16:20:29.818Z

URLs: 20

Successful: 17 / Failed: 3


## Latency

| Metric | Median | p90 | Min | Max |
|---|---|---|---|---|
| Wall clock | 26.2s | 29.4s | 18.9s | 34.1s |
| Workflow | 21.0s | 25.0s | 16.0s | 28.0s |

## Per-URL

| URL | Wall | WF | Q | Logos | Colors | Fonts | Voice | OffKit | Status |
|---|---|---|---|---|---|---|---|---|---|
| anthropic.com | 26.1s | 21.0s | 100 | 6 | 21 | 4 | 5 | Y | complete |
| openai.com | 27.3s | 21.0s | 100 | 5 | 4 | 2 | 5 | Y | complete |
| perplexity.ai | 27.2s | 23.0s | 90 | 1 | 3 | 3 | 4 | N | running |
| cursor.sh | 18.9s | 18.0s | 100 | 6 | 12 | 5 | 5 | Y | running |
| supabase.com | 24.7s | 20.0s | 100 | 24 | 9 | 2 | 5 | Y | complete |
| cloudflare.com | 34.1s | 28.0s | 90 | 19 | 4 | 3 | 5 | N | complete |
| mongodb.com | 27.1s | 21.0s | 100 | 19 | 17 | 5 | 5 | Y | complete |
| postman.com | 27.9s | 24.0s | 100 | 30 | 23 | 4 | 5 | Y | running |
| webflow.com | 29.4s | 25.0s | 90 | 32 | 23 | 2 | 5 | N | complete |
| framer.com | 20.6s | 17.0s | 100 | 7 | 5 | 5 | 5 | Y | complete |
| discord.com | 27.2s | 21.0s | 100 | 9 | 27 | 5 | 5 | Y | running |
| slack.com | 22.2s | 18.0s | 100 | 13 | 9 | 3 | 5 | Y | complete |
| dropbox.com | 26.2s | 17.0s | 100 | 19 | 16 | 5 | 5 | Y | complete |
| zoom.us | 37.4s | ? | ? | ? | ? | ? | ? | N | ERR |
| duolingo.com | 23.4s | ? | ? | ? | ? | ? | ? | N | ERR |
| headspace.com | 24.1s | ? | ? | ? | ? | ? | ? | N | ERR |
| patagonia.com | 26.5s | 21.0s | 80 | 1 | 2 | 5 | 5 | N | complete |
| nike.com | 25.7s | 23.0s | 100 | 9 | 93 | 5 | 5 | Y | complete |
| apple.com | 21.8s | 16.0s | 100 | 9 | 25 | 3 | 5 | Y | complete |
| tesla.com | 20.5s | 16.0s | 90 | 1 | 2 | 2 | 3 | Y | complete |

## Per-step durations (seconds)

| URL | fetch-render | process-and-score |
|---|---|---|
| anthropic.com | 7.0 | 13.0 |
| openai.com | 8.0 | 13.0 |
| perplexity.ai | 16.0 | 7.0 |
| cursor.sh | 7.0 | 10.0 |
| supabase.com | 7.0 | 13.0 |
| cloudflare.com | 10.0 | 14.0 |
| mongodb.com | 9.0 | 12.0 |
| postman.com | 8.0 | 16.0 |
| webflow.com | 12.0 | 12.0 |
| framer.com | 9.0 | 8.0 |
| discord.com | 11.0 | 10.0 |
| slack.com | 8.0 | 9.0 |
| dropbox.com | 8.0 | 9.0 |
| zoom.us | - | - |
| duolingo.com | - | - |
| headspace.com | - | - |
| patagonia.com | 14.0 | 7.0 |
| nike.com | 10.0 | 13.0 |
| apple.com | 8.0 | 8.0 |
| tesla.com | 8.0 | 7.0 |

## Step aggregate (across 17 successful)

| Step | Median | p90 | Max | Sum |
|---|---|---|---|---|
| fetch-render | 8.0s | 14.0s | 16.0s | 160.0s |
| process-and-score | 10.0s | 14.0s | 16.0s | 181.0s |

## Failures

- zoom.us: poll 40ced476-9e46-4707-aad1-dc60bb45c072: 500
- duolingo.com: poll 82b55e18-462b-4e87-ac1f-d684c2b665be: 500
- headspace.com: poll 52d7da57-1e7b-4e1c-b684-1ca6558be31c: 500
