# Bench: andromeda-20-fixed

Run: 2026-05-03T16:57:41.037Z

URLs: 20

Successful: 18 / Failed: 2


## Latency

| Metric | Median | p90 | Min | Max |
|---|---|---|---|---|
| Wall clock | 32.4s | 40.7s | 27.0s | 68.3s |
| Workflow | 28.0s | 36.0s | 22.0s | 60.0s |

## Per-URL

| URL | Wall | WF | Q | Logos | Colors | Fonts | Voice | OffKit | Status |
|---|---|---|---|---|---|---|---|---|---|
| anthropic.com | 35.3s | 30.0s | 100 | 6 | 21 | 4 | 5 | Y | complete |
| openai.com | 68.3s | 60.0s | 80 | 5 | 4 | 2 | 5 | Y | complete |
| perplexity.ai | 29.2s | 24.0s | 100 | 1 | 3 | 3 | 4 | Y | complete |
| cursor.sh | 35.0s | 31.0s | 100 | 6 | 11 | 5 | 5 | Y | complete |
| supabase.com | 30.4s | 25.0s | 100 | 24 | 9 | 2 | 5 | Y | complete |
| cloudflare.com | 32.2s | 28.0s | 90 | 19 | 4 | 3 | 5 | N | complete |
| mongodb.com | 29.6s | 26.0s | 100 | 19 | 17 | 5 | 5 | Y | complete |
| postman.com | 32.2s | 28.0s | 100 | 30 | 23 | 4 | 5 | Y | running |
| webflow.com | 33.1s | 30.0s | 90 | 32 | 23 | 2 | 5 | N | complete |
| framer.com | 36.8s | 31.0s | 100 | 7 | 5 | 5 | 5 | Y | complete |
| discord.com | 34.2s | 32.0s | 100 | 9 | 27 | 5 | 5 | Y | running |
| slack.com | 40.7s | 36.0s | 90 | 13 | 9 | 3 | 5 | N | complete |
| dropbox.com | 29.4s | 26.0s | 100 | 19 | 16 | 5 | 5 | Y | running |
| zoom.us | 32.4s | 29.0s | ? | 0 | 0 | 0 | 0 | N | complete |
| duolingo.com | 23.3s | ? | ? | ? | ? | ? | ? | N | ERR |
| headspace.com | 22.9s | ? | ? | ? | ? | ? | ? | N | ERR |
| patagonia.com | 27.0s | 22.0s | 80 | 1 | 2 | 5 | 5 | N | complete |
| nike.com | 31.2s | 28.0s | 90 | 9 | 93 | 5 | 5 | N | complete |
| apple.com | 34.6s | 25.0s | 90 | 9 | 25 | 3 | 5 | N | complete |
| tesla.com | 29.2s | 25.0s | 90 | 1 | 2 | 2 | 4 | Y | complete |

## Per-step durations (seconds)

| URL | fetch-render | process-and-score |
|---|---|---|
| anthropic.com | 8.0 | 22.0 |
| openai.com | 11.0 | 50.0 |
| perplexity.ai | 9.0 | 14.0 |
| cursor.sh | 6.0 | 24.0 |
| supabase.com | 7.0 | 17.0 |
| cloudflare.com | 9.0 | 19.0 |
| mongodb.com | 8.0 | 17.0 |
| postman.com | 8.0 | 19.0 |
| webflow.com | 10.0 | 20.0 |
| framer.com | 13.0 | 17.0 |
| discord.com | 12.0 | 20.0 |
| slack.com | 16.0 | 20.0 |
| dropbox.com | 7.0 | 19.0 |
| zoom.us | 10.0 | 19.0 |
| duolingo.com | - | - |
| headspace.com | - | - |
| patagonia.com | 6.0 | 16.0 |
| nike.com | 11.0 | 17.0 |
| apple.com | 7.0 | 18.0 |
| tesla.com | 9.0 | 15.0 |

## Step aggregate (across 18 successful)

| Step | Median | p90 | Max | Sum |
|---|---|---|---|---|
| fetch-render | 9.0s | 13.0s | 16.0s | 167.0s |
| process-and-score | 19.0s | 24.0s | 50.0s | 363.0s |

## Failures

- duolingo.com: poll 7ef84cf9-cfbb-40d7-9c93-41e843c3617e: 500
- headspace.com: poll a748f5c7-89e4-45f6-a3f0-97f0064947c5: 500
