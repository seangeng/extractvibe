# Bench: iter-5

Run: 2026-05-03T15:01:57.823Z

URLs: 12

Successful: 12 / Failed: 0


## Latency

| Metric | Median | p90 | Min | Max |
|---|---|---|---|---|
| Wall clock | 22.6s | 25.5s | 18.7s | 31.5s |
| Workflow | 18.0s | 22.0s | 15.0s | 27.0s |

## Per-URL

| URL | Wall | WF | Q | Logos | Colors | Fonts | Voice | OffKit | Status |
|---|---|---|---|---|---|---|---|---|---|
| linear.app | 23.4s | 18.0s | 100 | 13 | 9 | 3 | 5 | Y | complete |
| vercel.com | 25.0s | 20.0s | 100 | 23 | 7 | 4 | 5 | Y | complete |
| stripe.com | 31.5s | 27.0s | 90 | 18 | 11 | 2 | 5 | N | complete |
| shopify.com | 22.4s | 18.0s | 100 | 7 | 5 | 3 | 5 | Y | running |
| notion.so | 25.5s | 22.0s | 90 | 29 | 102 | 2 | 5 | N | running |
| github.com | 22.2s | 18.0s | 100 | 21 | 13 | 3 | 5 | Y | complete |
| figma.com | 22.6s | 18.0s | 100 | 17 | 6 | 3 | 5 | Y | complete |
| ramp.com | 18.7s | 16.0s | 65 | 0 | 2 | 2 | 4 | Y | complete |
| airbnb.com | 22.6s | 19.0s | 90 | 9 | 99 | 2 | 4 | N | running |
| basecamp.com | 20.0s | 15.0s | 100 | 6 | 3 | 2 | 5 | Y | complete |
| coca-cola.com | 19.9s | 15.0s | 100 | 11 | 5 | 2 | 4 | Y | complete |
| nytimes.com | 23.0s | 17.0s | 100 | 7 | 18 | 4 | 5 | Y | complete |

## Per-step durations (seconds)

| URL | fetch-render | parse-and-analyze | synthesize-vibe | score-package |
|---|---|---|---|---|
| linear.app | 8.0 | ? | ? | ? |
| vercel.com | 8.0 | ? | ? | ? |
| stripe.com | 17.0 | ? | ? | ? |
| shopify.com | 6.0 | ? | ? | ? |
| notion.so | 8.0 | ? | ? | ? |
| github.com | 9.0 | ? | ? | ? |
| figma.com | 9.0 | ? | ? | ? |
| ramp.com | 6.0 | ? | ? | ? |
| airbnb.com | 11.0 | ? | ? | ? |
| basecamp.com | 6.0 | ? | ? | ? |
| coca-cola.com | 7.0 | ? | ? | ? |
| nytimes.com | 10.0 | ? | ? | ? |

## Step aggregate (across 12 successful)

| Step | Median | p90 | Max | Sum |
|---|---|---|---|---|
| fetch-render | 8.0s | 11.0s | 17.0s | 105.0s |
