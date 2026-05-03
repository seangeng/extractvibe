# Bench: iter-6

Run: 2026-05-03T15:25:23.873Z

URLs: 12

Successful: 12 / Failed: 0


## Latency

| Metric | Median | p90 | Min | Max |
|---|---|---|---|---|
| Wall clock | 23.2s | 26.7s | 19.7s | 31.0s |
| Workflow | 19.0s | 23.0s | 16.0s | 24.0s |

## Per-URL

| URL | Wall | WF | Q | Logos | Colors | Fonts | Voice | OffKit | Status |
|---|---|---|---|---|---|---|---|---|---|
| linear.app | 23.6s | 19.0s | 100 | 13 | 9 | 3 | 5 | Y | running |
| vercel.com | 25.1s | 21.0s | 100 | 23 | 7 | 4 | 5 | Y | complete |
| stripe.com | 23.2s | 18.0s | 90 | 19 | 11 | 2 | 5 | N | complete |
| shopify.com | 22.1s | 20.0s | 100 | 7 | 5 | 3 | 5 | Y | running |
| notion.so | 31.0s | 24.0s | 90 | 29 | 102 | 2 | 5 | N | complete |
| github.com | 24.7s | 19.0s | 100 | 21 | 13 | 3 | 5 | Y | complete |
| figma.com | 21.9s | 17.0s | 100 | 17 | 6 | 3 | 5 | Y | complete |
| ramp.com | 26.7s | 23.0s | 100 | 4 | 25 | 2 | 5 | Y | complete |
| airbnb.com | 22.3s | 18.0s | 90 | 9 | 99 | 2 | 4 | N | complete |
| basecamp.com | 19.7s | 16.0s | 90 | 6 | 3 | 2 | 5 | N | complete |
| coca-cola.com | 22.0s | 16.0s | 100 | 11 | 5 | 2 | 3 | Y | complete |
| nytimes.com | 22.0s | 18.0s | 100 | 8 | 18 | 4 | 5 | Y | complete |

## Per-step durations (seconds)

| URL | fetch-render | process-and-score |
|---|---|---|
| linear.app | 7.0 | 10.0 |
| vercel.com | 10.0 | 11.0 |
| stripe.com | 8.0 | 9.0 |
| shopify.com | 11.0 | 8.0 |
| notion.so | 11.0 | 13.0 |
| github.com | 9.0 | 10.0 |
| figma.com | 7.0 | 10.0 |
| ramp.com | 15.0 | 7.0 |
| airbnb.com | 8.0 | 10.0 |
| basecamp.com | 7.0 | 8.0 |
| coca-cola.com | 8.0 | 8.0 |
| nytimes.com | 11.0 | 8.0 |

## Step aggregate (across 12 successful)

| Step | Median | p90 | Max | Sum |
|---|---|---|---|---|
| fetch-render | 9.0s | 11.0s | 15.0s | 112.0s |
| process-and-score | 10.0s | 11.0s | 13.0s | 112.0s |
