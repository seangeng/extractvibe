# Bench: baseline

Run: 2026-05-03T13:52:46.606Z

URLs: 12

Successful: 12 / Failed: 0


## Latency

| Metric | Median | p90 | Min | Max |
|---|---|---|---|---|
| Wall clock | 32.5s | 35.0s | 27.4s | 41.8s |
| Workflow | 28.0s | 31.0s | 23.0s | 38.0s |

## Per-URL

| URL | Wall | WF | Q | Logos | Colors | Fonts | Voice | OffKit | Status |
|---|---|---|---|---|---|---|---|---|---|
| linear.app | 31.6s | 26.0s | 100 | 13 | 9 | 3 | 5 | Y | complete |
| vercel.com | 34.9s | 31.0s | 100 | 45 | 7 | 4 | 5 | Y | complete |
| stripe.com | 34.3s | 29.0s | 90 | 18 | 11 | 2 | 5 | N | complete |
| shopify.com | 32.0s | 26.0s | 100 | 7 | 5 | 3 | 5 | Y | complete |
| notion.so | 32.5s | 28.0s | 90 | 29 | 102 | 2 | 5 | N | complete |
| github.com | 32.6s | 29.0s | 100 | 21 | 13 | 3 | 5 | Y | running |
| figma.com | 31.2s | 27.0s | 100 | 17 | 6 | 3 | 5 | Y | complete |
| ramp.com | 27.7s | 24.0s | 65 | 0 | 2 | 2 | 4 | Y | complete |
| airbnb.com | 32.2s | 28.0s | 90 | 9 | 99 | 2 | 5 | N | complete |
| basecamp.com | 35.0s | 31.0s | 90 | 6 | 3 | 2 | 5 | N | complete |
| coca-cola.com | 27.4s | 23.0s | 100 | 11 | 5 | 2 | 3 | Y | complete |
| nytimes.com | 41.8s | 38.0s | 100 | 41 | 18 | 4 | 5 | Y | complete |

## Per-step durations (seconds)

| URL | fetch-render | parse-and-analyze | synthesize-vibe | score-package |
|---|---|---|---|---|
| linear.app | 12.0 | 2.0 | 6.0 | 5.0 |
| vercel.com | 10.0 | 9.0 | 6.0 | 5.0 |
| stripe.com | 15.0 | 3.0 | 6.0 | 4.0 |
| shopify.com | 11.0 | 2.0 | 9.0 | 4.0 |
| notion.so | 11.0 | 6.0 | 6.0 | 5.0 |
| github.com | 12.0 | 4.0 | 8.0 | 4.0 |
| figma.com | 12.0 | 4.0 | 5.0 | 5.0 |
| ramp.com | 8.0 | 2.0 | 4.0 | 9.0 |
| airbnb.com | 12.0 | 3.0 | 8.0 | 5.0 |
| basecamp.com | 12.0 | 2.0 | 5.0 | 9.0 |
| coca-cola.com | 11.0 | 2.0 | 5.0 | 5.0 |
| nytimes.com | 19.0 | 9.0 | 5.0 | 5.0 |

## Step aggregate (across 12 successful)

| Step | Median | p90 | Max | Sum |
|---|---|---|---|---|
| fetch-render | 12.0s | 15.0s | 19.0s | 145.0s |
| parse-and-analyze | 3.0s | 9.0s | 9.0s | 48.0s |
| synthesize-vibe | 6.0s | 8.0s | 9.0s | 73.0s |
| score-package | 5.0s | 9.0s | 9.0s | 65.0s |
