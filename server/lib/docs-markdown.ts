// ---------------------------------------------------------------------------
// docs-markdown.ts — Generates markdown API documentation for ExtractVibe
//
// Each exported function returns a complete markdown document for one section
// of the API docs. These are served as raw .md files at /docs/*.md and
// concatenated into /llms-full.txt for LLM consumption.
// ---------------------------------------------------------------------------

// ─── Quickstart ──────────────────────────────────────────────────────────

export function getQuickstartMd(): string {
  return `# Quickstart

> Base URL: \`https://extractvibe.com/api\`

Get your first brand extraction in 30 seconds.

## 1. Get an API key

Sign up at [extractvibe.com/sign-up](https://extractvibe.com/sign-up) and create an API key from your [dashboard](https://extractvibe.com/dashboard/keys). Free accounts include 500 extractions per month.

Alternatively, if you are an AI agent, you can self-provision a key via the [Agent Bootstrap](https://extractvibe.com/docs/agent-bootstrap.md) endpoint -- no browser required.

## 2. Start an extraction

\`\`\`bash
curl -X POST https://extractvibe.com/api/extract \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ev_your_api_key_here" \\
  -d '{"url": "https://stripe.com"}'
\`\`\`

Response (\`202 Accepted\`):

\`\`\`json
{
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "domain": "stripe.com"
}
\`\`\`

## 3. Poll for completion

\`\`\`bash
curl https://extractvibe.com/api/extract/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \\
  -H "x-api-key: ev_your_api_key_here"
\`\`\`

Wait until \`status.status\` is \`"complete"\`. Typical extractions finish in 10--30 seconds.

## 4. Get the brand kit

\`\`\`bash
curl https://extractvibe.com/api/extract/a1b2c3d4-e5f6-7890-abcd-ef1234567890/result \\
  -H "x-api-key: ev_your_api_key_here"
\`\`\`

You now have a complete brand kit with colors, typography, voice, logos, and more. See the [Brand Kit Schema](https://extractvibe.com/docs/schema.md) for the full output reference.

## 5. Export in any format

\`\`\`bash
# CSS custom properties
curl -o brand.css \\
  https://extractvibe.com/api/extract/a1b2c3d4-e5f6-7890-abcd-ef1234567890/export/css \\
  -H "x-api-key: ev_your_api_key_here"

# Tailwind CSS theme
curl -o brand-tailwind.css \\
  https://extractvibe.com/api/extract/a1b2c3d4-e5f6-7890-abcd-ef1234567890/export/tailwind \\
  -H "x-api-key: ev_your_api_key_here"
\`\`\`

Available formats: \`json\`, \`css\`, \`tailwind\`, \`markdown\`, \`tokens\`.

## Complete example (JavaScript)

\`\`\`javascript
const API_KEY = process.env.EXTRACTVIBE_API_KEY;
const BASE = "https://extractvibe.com/api";

// Start extraction
const startRes = await fetch(\`\${BASE}/extract\`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  },
  body: JSON.stringify({ url: "https://stripe.com" }),
});
const { jobId } = await startRes.json();

// Poll until complete
let status = "queued";
while (status !== "complete" && status !== "errored") {
  await new Promise((r) => setTimeout(r, 2000));
  const pollRes = await fetch(\`\${BASE}/extract/\${jobId}\`, {
    headers: { "x-api-key": API_KEY },
  });
  const data = await pollRes.json();
  status = data.status.status;
}

// Get result
const resultRes = await fetch(\`\${BASE}/extract/\${jobId}/result\`, {
  headers: { "x-api-key": API_KEY },
});
const brandKit = await resultRes.json();
console.log(brandKit.colors.lightMode.primary.hex); // "#635BFF"
\`\`\`

## Complete example (Python)

\`\`\`python
import os
import time
import requests

API_KEY = os.environ["EXTRACTVIBE_API_KEY"]
BASE = "https://extractvibe.com/api"

# Start extraction
start = requests.post(
    f"{BASE}/extract",
    headers={"Content-Type": "application/json", "x-api-key": API_KEY},
    json={"url": "https://stripe.com"},
)
job_id = start.json()["jobId"]

# Poll until complete
status = "queued"
while status not in ("complete", "errored"):
    time.sleep(2)
    poll = requests.get(
        f"{BASE}/extract/{job_id}",
        headers={"x-api-key": API_KEY},
    )
    status = poll.json()["status"]["status"]

# Get result
result = requests.get(
    f"{BASE}/extract/{job_id}/result",
    headers={"x-api-key": API_KEY},
)
brand_kit = result.json()
print(brand_kit["colors"]["lightMode"]["primary"]["hex"])  # "#635BFF"
\`\`\`

## Next steps

- [Authentication](https://extractvibe.com/docs/authentication.md) -- API key management and session auth
- [Extract Brand](https://extractvibe.com/docs/extract.md) -- Full extraction endpoint reference
- [Export Formats](https://extractvibe.com/docs/export.md) -- All five export formats
- [Brand Kit Schema](https://extractvibe.com/docs/schema.md) -- Complete output schema reference
`;
}

// ─── Authentication ──────────────────────────────────────────────────────

export function getAuthenticationMd(): string {
  return `# Authentication

> Base URL: \`https://extractvibe.com/api\`

ExtractVibe supports three authentication methods: API keys, session cookies, and agent bootstrap.

## API keys (recommended for programmatic access)

Include your API key in the \`x-api-key\` header on every request.

\`\`\`bash
curl https://extractvibe.com/api/credits \\
  -H "x-api-key: ev_your_api_key_here"
\`\`\`

API keys use the \`ev_\` prefix followed by 48 hex characters. Create and manage keys from your [dashboard](https://extractvibe.com/dashboard/keys) or via the [API Keys](https://extractvibe.com/docs/keys.md) endpoints.

**Security guidelines:**

- Never expose API keys in client-side code or public repositories.
- Store keys in environment variables on your server.
- If you need to call the API from a browser, proxy requests through your backend.
- Rotate keys periodically. Old keys can be revoked without affecting other keys.

## Session cookies (web interface)

When you sign in through the web UI at [extractvibe.com/sign-in](https://extractvibe.com/sign-in), a session cookie is set automatically. All subsequent requests from that browser session are authenticated.

Session cookies are HttpOnly and Secure. They work automatically in browsers -- no additional headers needed.

\`\`\`javascript
// Browser-side fetch (session cookie sent automatically)
const res = await fetch("https://extractvibe.com/api/credits", {
  credentials: "include",
});
const { credits, plan } = await res.json();
\`\`\`

## Agent bootstrap (AI/LLM self-provisioning)

AI agents can self-provision an API key without browser access. Send a POST to \`/api/agent/bootstrap\` with a unique agent name:

\`\`\`bash
curl -X POST https://extractvibe.com/api/agent/bootstrap \\
  -H "Content-Type: application/json" \\
  -d '{"agent_name": "my-ai-agent"}'
\`\`\`

This creates a temporary account with 25 free credits and returns an API key. See the [Agent Bootstrap](https://extractvibe.com/docs/agent-bootstrap.md) reference for full details.

## Anonymous access

Some endpoints accept unauthenticated requests. Anonymous requests are subject to stricter rate limits:

| Access level | Read limit | Write limit |
|---|---|---|
| Anonymous | 30 req/min | 3 req/day |
| Authenticated (Free) | 60 req/min | 10 req/min |
| Authenticated (Starter) | 180 req/min | 30 req/min |
| Authenticated (Pro) | 600 req/min | 60 req/min |

## Authentication errors

If authentication fails, the API returns \`401 Unauthorized\`:

\`\`\`json
{
  "error": "Unauthorized"
}
\`\`\`

Common causes:

- Missing or malformed \`x-api-key\` header.
- Revoked or expired API key.
- Expired session cookie (sign in again).
`;
}

// ─── Extract ─────────────────────────────────────────────────────────────

export function getExtractMd(): string {
  return `# Extract Brand

> Base URL: \`https://extractvibe.com/api\`

The extraction API is a three-step process: start a job, poll for completion, and retrieve the result.

---

## POST /api/extract

Start a new brand extraction job.

### Authentication

Optional. Anonymous users get 3 extractions per day. Authenticated users consume 1 credit per extraction.

### Request body

| Field | Type | Required | Description |
|---|---|---|---|
| \`url\` | string | Yes | The website URL to extract. Protocol is optional -- \`https://\` is prepended if missing. Max 2048 characters. |

### Example request

**cURL:**

\`\`\`bash
curl -X POST https://extractvibe.com/api/extract \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ev_your_api_key_here" \\
  -d '{"url": "https://stripe.com"}'
\`\`\`

**JavaScript:**

\`\`\`javascript
const res = await fetch("https://extractvibe.com/api/extract", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.EXTRACTVIBE_API_KEY,
  },
  body: JSON.stringify({ url: "https://stripe.com" }),
});

const { jobId, domain } = await res.json();
console.log(\`Extraction started: \${jobId} (\${domain})\`);
\`\`\`

**Python:**

\`\`\`python
import requests
import os

res = requests.post(
    "https://extractvibe.com/api/extract",
    headers={
        "Content-Type": "application/json",
        "x-api-key": os.environ["EXTRACTVIBE_API_KEY"],
    },
    json={"url": "https://stripe.com"},
)

data = res.json()
print(f"Extraction started: {data['jobId']} ({data['domain']})")
\`\`\`

### Responses

**202 Accepted** -- Extraction job created:

\`\`\`json
{
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "domain": "stripe.com"
}
\`\`\`

**400 Bad Request** -- Invalid or missing URL:

\`\`\`json
{
  "error": "Missing required field: url"
}
\`\`\`

**402 Payment Required** -- No credits remaining:

\`\`\`json
{
  "error": "No credits remaining. Upgrade your plan or wait for monthly reset."
}
\`\`\`

**409 Conflict** -- Extraction already in progress for this domain:

\`\`\`json
{
  "error": "Extraction already in progress for this domain",
  "jobId": "existing-job-uuid"
}
\`\`\`

**429 Too Many Requests** -- Rate limit exceeded:

\`\`\`json
{
  "error": "Rate limit exceeded",
  "limit": 3,
  "retryAfter": 72000
}
\`\`\`

### Rate limits

| Tier | Limit |
|---|---|
| Anonymous | 3 req/day |
| Free | 10 req/min |
| Starter | 30 req/min |
| Pro | 60 req/min |

### Notes

- Private/internal URLs (localhost, 127.x.x.x, 10.x.x.x, etc.) are blocked.
- Duplicate extraction requests for the same domain by the same user return \`409\` with the existing job ID.

---

## GET /api/extract/:jobId

Poll the status of an extraction job.

### Authentication

Optional. Anyone with the job ID can poll status.

### Path parameters

| Parameter | Type | Description |
|---|---|---|
| \`jobId\` | string | The UUID returned from \`POST /api/extract\` |

### Example request

**cURL:**

\`\`\`bash
curl https://extractvibe.com/api/extract/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \\
  -H "x-api-key: ev_your_api_key_here"
\`\`\`

**JavaScript:**

\`\`\`javascript
const jobId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const res = await fetch(\`https://extractvibe.com/api/extract/\${jobId}\`, {
  headers: { "x-api-key": process.env.EXTRACTVIBE_API_KEY },
});

const { status } = await res.json();
console.log(status.status); // "queued" | "running" | "complete" | "errored"
\`\`\`

**Python:**

\`\`\`python
import requests
import os

job_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

res = requests.get(
    f"https://extractvibe.com/api/extract/{job_id}",
    headers={"x-api-key": os.environ["EXTRACTVIBE_API_KEY"]},
)

data = res.json()
print(data["status"]["status"])  # "queued" | "running" | "complete" | "errored"
\`\`\`

### Responses

**200 OK** -- Job is running:

\`\`\`json
{
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": {
    "status": "running",
    "error": null,
    "output": null
  }
}
\`\`\`

**200 OK** -- Job completed:

\`\`\`json
{
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": {
    "status": "complete",
    "error": null,
    "output": {
      "domain": "stripe.com",
      "cached": true
    }
  }
}
\`\`\`

**404 Not Found** -- Job does not exist:

\`\`\`json
{
  "error": "Job not found"
}
\`\`\`

### Status values

| Status | Description |
|---|---|
| \`queued\` | Job is waiting to start |
| \`running\` | Extraction is in progress |
| \`complete\` | Extraction finished successfully -- call \`/result\` to get the brand kit |
| \`errored\` | Extraction failed -- check \`status.error\` for details |

---

## GET /api/extract/:jobId/result

Retrieve the full brand kit for a completed extraction.

### Authentication

Optional. Anyone with the job ID can retrieve results.

### Path parameters

| Parameter | Type | Description |
|---|---|---|
| \`jobId\` | string | The UUID returned from \`POST /api/extract\` |

### Example request

**cURL:**

\`\`\`bash
curl https://extractvibe.com/api/extract/a1b2c3d4-e5f6-7890-abcd-ef1234567890/result \\
  -H "x-api-key: ev_your_api_key_here"
\`\`\`

**JavaScript:**

\`\`\`javascript
const jobId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const res = await fetch(
  \`https://extractvibe.com/api/extract/\${jobId}/result\`,
  { headers: { "x-api-key": process.env.EXTRACTVIBE_API_KEY } }
);

const brandKit = await res.json();
console.log(brandKit.colors.lightMode.primary.hex); // "#635BFF"
console.log(brandKit.voice.toneSpectrum);
\`\`\`

**Python:**

\`\`\`python
import requests
import os

job_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

res = requests.get(
    f"https://extractvibe.com/api/extract/{job_id}/result",
    headers={"x-api-key": os.environ["EXTRACTVIBE_API_KEY"]},
)

brand_kit = res.json()
print(brand_kit["colors"]["lightMode"]["primary"]["hex"])  # "#635BFF"
\`\`\`

### Responses

**200 OK** -- Full brand kit (see [Brand Kit Schema](https://extractvibe.com/docs/schema.md) for the complete structure):

\`\`\`json
{
  "meta": {
    "domain": "stripe.com",
    "url": "https://stripe.com",
    "extractedAt": "2026-03-18T12:00:00Z",
    "durationMs": 18420,
    "schemaVersion": "v1"
  },
  "identity": {
    "brandName": "Stripe",
    "tagline": "Financial infrastructure for the internet",
    "description": "Stripe builds economic infrastructure for the internet."
  },
  "colors": {
    "lightMode": {
      "primary": { "hex": "#635BFF", "role": "primary" },
      "secondary": { "hex": "#0A2540", "role": "secondary" },
      "accent": { "hex": "#00D4AA", "role": "accent" },
      "background": { "hex": "#FFFFFF", "role": "background" }
    }
  },
  "typography": {
    "families": [
      { "name": "Sohne", "role": "heading", "weights": [400, 500, 600] },
      { "name": "Sohne", "role": "body", "weights": [400, 500] },
      { "name": "Sohne Mono", "role": "mono", "weights": [400] }
    ]
  },
  "voice": {
    "toneSpectrum": {
      "formalCasual": 4,
      "technicalAccessible": 4
    },
    "sampleCopy": [
      "Financial infrastructure for the internet",
      "Payments built for developers"
    ]
  },
  "vibe": {
    "summary": "Polished and confident with a developer-first edge",
    "tags": ["premium", "developer-first", "polished", "enterprise"],
    "visualEnergy": 6,
    "designEra": "flat 2.0"
  }
}
\`\`\`

**404 Not Found** -- Result not ready or job does not exist:

\`\`\`json
{
  "error": "Result not found or still processing"
}
\`\`\`

### Notes

- Results are cached in KV storage for fast retrieval after the first fetch.
- The full brand kit schema is documented at [/docs/schema.md](https://extractvibe.com/docs/schema.md).
`;
}

// ─── Export ──────────────────────────────────────────────────────────────

export function getExportMd(): string {
  return `# Export Formats

> Base URL: \`https://extractvibe.com/api\`

Download a completed brand kit in five developer-friendly formats.

---

## GET /api/extract/:jobId/export/:format

Export a brand kit as a downloadable file.

### Authentication

Required. API key or session cookie.

### Path parameters

| Parameter | Type | Description |
|---|---|---|
| \`jobId\` | string | The UUID of a completed extraction job |
| \`format\` | string | Export format: \`json\`, \`css\`, \`tailwind\`, \`markdown\`, \`tokens\` |

### Available formats

| Format | Content-Type | Description |
|---|---|---|
| \`json\` | \`application/json\` | Full brand kit JSON (same as \`/result\`) |
| \`css\` | \`text/css\` | CSS custom properties (\`:root\` variables with \`--ev-\` prefix) |
| \`tailwind\` | \`text/css\` | Tailwind CSS v4 \`@theme\` block |
| \`markdown\` | \`text/markdown\` | Human-readable brand report |
| \`tokens\` | \`application/json\` | W3C Design Tokens format |

### Example request

**cURL:**

\`\`\`bash
# Download as CSS custom properties
curl -o stripe-variables.css \\
  https://extractvibe.com/api/extract/a1b2c3d4-e5f6-7890-abcd-ef1234567890/export/css \\
  -H "x-api-key: ev_your_api_key_here"

# Download as Tailwind theme
curl -o stripe-tailwind.css \\
  https://extractvibe.com/api/extract/a1b2c3d4-e5f6-7890-abcd-ef1234567890/export/tailwind \\
  -H "x-api-key: ev_your_api_key_here"

# Download as W3C Design Tokens
curl -o stripe-tokens.json \\
  https://extractvibe.com/api/extract/a1b2c3d4-e5f6-7890-abcd-ef1234567890/export/tokens \\
  -H "x-api-key: ev_your_api_key_here"
\`\`\`

**JavaScript:**

\`\`\`javascript
const jobId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

// Get CSS variables
const res = await fetch(
  \`https://extractvibe.com/api/extract/\${jobId}/export/css\`,
  { headers: { "x-api-key": process.env.EXTRACTVIBE_API_KEY } }
);
const css = await res.text();
console.log(css);
// :root {
//   --ev-color-primary: #635BFF;
//   --ev-color-secondary: #0A2540;
//   ...
// }
\`\`\`

**Python:**

\`\`\`python
import requests
import os

job_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

# Get CSS variables
res = requests.get(
    f"https://extractvibe.com/api/extract/{job_id}/export/css",
    headers={"x-api-key": os.environ["EXTRACTVIBE_API_KEY"]},
)

with open("stripe-variables.css", "w") as f:
    f.write(res.text)

# Get Tailwind theme
res = requests.get(
    f"https://extractvibe.com/api/extract/{job_id}/export/tailwind",
    headers={"x-api-key": os.environ["EXTRACTVIBE_API_KEY"]},
)

with open("stripe-tailwind.css", "w") as f:
    f.write(res.text)
\`\`\`

### Example output: CSS custom properties

\`\`\`css
/* ExtractVibe Brand Kit -- stripe.com */
/* Generated: 2026-03-18 */
/* Schema: v1 */

:root {
  /* Colors -- Light Mode */
  --ev-color-primary: #635BFF;
  --ev-color-secondary: #0A2540;
  --ev-color-accent: #00D4AA;
  --ev-color-background: #FFFFFF;
  --ev-color-text: #425466;
  --ev-color-muted: #8898AA;

  /* Typography */
  --ev-font-heading: "Sohne", sans-serif;
  --ev-font-body: "Sohne", sans-serif;
  --ev-font-mono: "Sohne Mono", monospace;

  /* Spacing */
  --ev-radius-md: 8px;
  --ev-radius-lg: 12px;
}
\`\`\`

### Example output: Tailwind CSS v4 theme

\`\`\`css
/* ExtractVibe Tailwind Theme -- stripe.com */

@theme {
  --color-brand-primary: #635BFF;
  --color-brand-secondary: #0A2540;
  --color-brand-accent: #00D4AA;
  --color-brand-background: #FFFFFF;

  --font-heading: "Sohne", sans-serif;
  --font-body: "Sohne", sans-serif;
  --font-mono: "Sohne Mono", monospace;

  --radius-md: 8px;
  --radius-lg: 12px;
}
\`\`\`

### Example output: W3C Design Tokens

\`\`\`json
{
  "$name": "stripe.com Brand Tokens",
  "$description": "Extracted by ExtractVibe",
  "color": {
    "primary": { "$value": "#635BFF", "$type": "color" },
    "secondary": { "$value": "#0A2540", "$type": "color" },
    "accent": { "$value": "#00D4AA", "$type": "color" }
  },
  "font": {
    "heading": { "$value": "Sohne", "$type": "fontFamily" },
    "body": { "$value": "Sohne", "$type": "fontFamily" },
    "mono": { "$value": "Sohne Mono", "$type": "fontFamily" }
  }
}
\`\`\`

### Responses

**200 OK** -- File download with \`Content-Disposition: attachment\` header.

**400 Bad Request** -- Invalid format:

\`\`\`json
{
  "error": "Invalid format. Use: json, css, tailwind, markdown, tokens"
}
\`\`\`

**404 Not Found** -- Result not found:

\`\`\`json
{
  "error": "Result not found"
}
\`\`\`
`;
}

// ─── Brand ───────────────────────────────────────────────────────────────

export function getBrandMd(): string {
  return `# Brand Lookup

> Base URL: \`https://extractvibe.com/api\`

Retrieve a cached brand kit by domain name. This is a public, read-only endpoint that returns the most recent extraction result for a given domain.

---

## GET /api/brand/:domain

### Authentication

Optional. Anonymous requests are rate-limited to 30 req/min.

### Path parameters

| Parameter | Type | Description |
|---|---|---|
| \`domain\` | string | Domain name without protocol or \`www\` prefix (e.g., \`stripe.com\`) |

### Example request

**cURL:**

\`\`\`bash
curl https://extractvibe.com/api/brand/stripe.com
\`\`\`

**JavaScript:**

\`\`\`javascript
const res = await fetch("https://extractvibe.com/api/brand/stripe.com");
const brandKit = await res.json();

console.log(brandKit.meta.domain);                  // "stripe.com"
console.log(brandKit.colors.lightMode.primary.hex);  // "#635BFF"
console.log(brandKit.vibe.summary);                  // "Polished and confident..."
\`\`\`

**Python:**

\`\`\`python
import requests

res = requests.get("https://extractvibe.com/api/brand/stripe.com")
brand_kit = res.json()

print(brand_kit["meta"]["domain"])                    # "stripe.com"
print(brand_kit["colors"]["lightMode"]["primary"]["hex"])  # "#635BFF"
\`\`\`

### Responses

**200 OK** -- Cached brand kit (same schema as \`/api/extract/:jobId/result\`):

\`\`\`json
{
  "meta": {
    "domain": "stripe.com",
    "url": "https://stripe.com",
    "extractedAt": "2026-03-18T12:00:00Z",
    "durationMs": 18420,
    "schemaVersion": "v1"
  },
  "identity": {
    "brandName": "Stripe",
    "tagline": "Financial infrastructure for the internet"
  },
  "colors": {
    "lightMode": {
      "primary": { "hex": "#635BFF", "role": "primary" },
      "secondary": { "hex": "#0A2540", "role": "secondary" }
    }
  },
  "typography": {
    "families": [
      { "name": "Sohne", "role": "heading", "weights": [400, 500, 600] }
    ]
  },
  "vibe": {
    "summary": "Polished and confident with a developer-first edge",
    "tags": ["premium", "developer-first", "polished"],
    "visualEnergy": 6
  }
}
\`\`\`

**404 Not Found** -- Domain has not been extracted:

\`\`\`json
{
  "error": "Brand not found. Extract it first."
}
\`\`\`

### Notes

- This endpoint returns cached data. To force a fresh extraction, use \`POST /api/extract\`.
- The domain must match exactly (e.g., \`stripe.com\`, not \`www.stripe.com\` or \`https://stripe.com\`).
- Results are cached for the lifetime of the extraction. New extractions of the same domain overwrite the cache.
`;
}

// ─── Credits ─────────────────────────────────────────────────────────────

export function getCreditsMd(): string {
  return `# Credits

> Base URL: \`https://extractvibe.com/api\`

Check your current credit balance and plan tier.

---

## GET /api/credits

### Authentication

Required. API key or session cookie.

### Example request

**cURL:**

\`\`\`bash
curl https://extractvibe.com/api/credits \\
  -H "x-api-key: ev_your_api_key_here"
\`\`\`

**JavaScript:**

\`\`\`javascript
const res = await fetch("https://extractvibe.com/api/credits", {
  headers: { "x-api-key": process.env.EXTRACTVIBE_API_KEY },
});

const { credits, plan } = await res.json();
console.log(\`\${credits} credits remaining (\${plan} plan)\`);
\`\`\`

**Python:**

\`\`\`python
import requests
import os

res = requests.get(
    "https://extractvibe.com/api/credits",
    headers={"x-api-key": os.environ["EXTRACTVIBE_API_KEY"]},
)

data = res.json()
print(f"{data['credits']} credits remaining ({data['plan']} plan)")
\`\`\`

### Responses

**200 OK**:

\`\`\`json
{
  "credits": 497,
  "plan": "free"
}
\`\`\`

**401 Unauthorized**:

\`\`\`json
{
  "error": "Unauthorized"
}
\`\`\`

### Credit plans

| Plan | Monthly credits | Reset |
|---|---|---|
| Free | 500 | 1st of each month |
| Starter | 5,000 | 1st of each month |
| Pro | Unlimited | -- |

### Notes

- Each \`POST /api/extract\` call consumes 1 credit.
- Anonymous users do not have a credit balance -- they are limited to 3 extractions per day by IP.
- Credits reset automatically on the 1st of each month at 00:00 UTC.
`;
}

// ─── API Keys ────────────────────────────────────────────────────────────

export function getKeysMd(): string {
  return `# API Keys

> Base URL: \`https://extractvibe.com/api\`

Create, list, and revoke API keys for programmatic access.

---

## POST /api/keys

Create a new API key.

### Authentication

Required. API key or session cookie.

### Request body

| Field | Type | Required | Description |
|---|---|---|---|
| \`name\` | string | No | Human-readable name for the key. Defaults to \`"Default"\`. Max 100 characters. |

### Example request

**cURL:**

\`\`\`bash
curl -X POST https://extractvibe.com/api/keys \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ev_your_existing_key" \\
  -d '{"name": "Production server"}'
\`\`\`

**JavaScript:**

\`\`\`javascript
const res = await fetch("https://extractvibe.com/api/keys", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.EXTRACTVIBE_API_KEY,
  },
  body: JSON.stringify({ name: "Production server" }),
});

const { id, name, key } = await res.json();
console.log(\`Created key "\${name}": \${key}\`);
// Store this key securely -- it will not be shown again
\`\`\`

**Python:**

\`\`\`python
import requests
import os

res = requests.post(
    "https://extractvibe.com/api/keys",
    headers={
        "Content-Type": "application/json",
        "x-api-key": os.environ["EXTRACTVIBE_API_KEY"],
    },
    json={"name": "Production server"},
)

data = res.json()
print(f"Created key '{data['name']}': {data['key']}")
# Store this key securely -- it will not be shown again
\`\`\`

### Responses

**201 Created**:

\`\`\`json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-234567890123",
  "name": "Production server",
  "key": "ev_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4"
}
\`\`\`

The full key value is returned **only once** in this response. Store it securely.

**401 Unauthorized**:

\`\`\`json
{
  "error": "Unauthorized"
}
\`\`\`

---

## GET /api/keys

List all active API keys for your account.

### Authentication

Required. API key or session cookie.

### Example request

**cURL:**

\`\`\`bash
curl https://extractvibe.com/api/keys \\
  -H "x-api-key: ev_your_api_key_here"
\`\`\`

**JavaScript:**

\`\`\`javascript
const res = await fetch("https://extractvibe.com/api/keys", {
  headers: { "x-api-key": process.env.EXTRACTVIBE_API_KEY },
});

const { keys } = await res.json();
keys.forEach((k) => {
  console.log(\`\${k.name} -- created \${k.createdAt}\`);
});
\`\`\`

**Python:**

\`\`\`python
import requests
import os

res = requests.get(
    "https://extractvibe.com/api/keys",
    headers={"x-api-key": os.environ["EXTRACTVIBE_API_KEY"]},
)

for key in res.json()["keys"]:
    print(f"{key['name']} -- created {key['createdAt']}")
\`\`\`

### Responses

**200 OK**:

\`\`\`json
{
  "keys": [
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-234567890123",
      "name": "Production server",
      "createdAt": "2026-03-15T10:00:00Z",
      "lastUsedAt": "2026-03-18T14:30:00Z"
    },
    {
      "id": "d4e5f6a7-b8c9-0123-defa-345678901234",
      "name": "Development",
      "createdAt": "2026-03-10T08:00:00Z",
      "lastUsedAt": null
    }
  ]
}
\`\`\`

The full key value is never returned in list responses -- only metadata.

**401 Unauthorized**:

\`\`\`json
{
  "error": "Unauthorized"
}
\`\`\`

---

## DELETE /api/keys/:id

Permanently revoke an API key. The key stops working immediately. This action cannot be undone.

### Authentication

Required. API key or session cookie.

### Path parameters

| Parameter | Type | Description |
|---|---|---|
| \`id\` | string | The UUID of the API key to revoke |

### Example request

**cURL:**

\`\`\`bash
curl -X DELETE https://extractvibe.com/api/keys/c3d4e5f6-a7b8-9012-cdef-234567890123 \\
  -H "x-api-key: ev_your_api_key_here"
\`\`\`

**JavaScript:**

\`\`\`javascript
const keyId = "c3d4e5f6-a7b8-9012-cdef-234567890123";

const res = await fetch(\`https://extractvibe.com/api/keys/\${keyId}\`, {
  method: "DELETE",
  headers: { "x-api-key": process.env.EXTRACTVIBE_API_KEY },
});

const data = await res.json();
console.log(data.ok); // true
\`\`\`

**Python:**

\`\`\`python
import requests
import os

key_id = "c3d4e5f6-a7b8-9012-cdef-234567890123"

res = requests.delete(
    f"https://extractvibe.com/api/keys/{key_id}",
    headers={"x-api-key": os.environ["EXTRACTVIBE_API_KEY"]},
)

print(res.json()["ok"])  # True
\`\`\`

### Responses

**200 OK**:

\`\`\`json
{
  "ok": true
}
\`\`\`

**404 Not Found**:

\`\`\`json
{
  "error": "Key not found"
}
\`\`\`

**401 Unauthorized**:

\`\`\`json
{
  "error": "Unauthorized"
}
\`\`\`
`;
}

// ─── Agent Bootstrap ─────────────────────────────────────────────────────

export function getAgentBootstrapMd(): string {
  return `# Agent Bootstrap

> Base URL: \`https://extractvibe.com/api\`

Self-provisioning endpoint for AI agents and LLMs. Creates a temporary account with an API key -- no browser or email required.

---

## POST /api/agent/bootstrap

Create a temporary agent account with 25 free credits and an API key.

### Authentication

None required. This is a public endpoint.

### Request body

| Field | Type | Required | Description |
|---|---|---|---|
| \`agent_name\` | string | Yes | Unique identifier for the agent. Alphanumeric and hyphens only, 1--64 characters. |
| \`contact_email\` | string | No | Optional email for account recovery and notifications. |

### Example request

**cURL:**

\`\`\`bash
curl -X POST https://extractvibe.com/api/agent/bootstrap \\
  -H "Content-Type: application/json" \\
  -d '{"agent_name": "my-ai-agent", "contact_email": "dev@example.com"}'
\`\`\`

**JavaScript:**

\`\`\`javascript
const res = await fetch("https://extractvibe.com/api/agent/bootstrap", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    agent_name: "my-ai-agent",
    contact_email: "dev@example.com",
  }),
});

const data = await res.json();
console.log(data.api_key);   // "ev_..."
console.log(data.credits);   // 25

// Use the key for subsequent requests
const brandRes = await fetch("https://extractvibe.com/api/extract", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": data.api_key,
  },
  body: JSON.stringify({ url: "https://example.com" }),
});
\`\`\`

**Python:**

\`\`\`python
import requests

res = requests.post(
    "https://extractvibe.com/api/agent/bootstrap",
    json={
        "agent_name": "my-ai-agent",
        "contact_email": "dev@example.com",
    },
)

data = res.json()
print(data["api_key"])   # "ev_..."
print(data["credits"])   # 25

# Use the key for subsequent requests
brand_res = requests.post(
    "https://extractvibe.com/api/extract",
    headers={
        "Content-Type": "application/json",
        "x-api-key": data["api_key"],
    },
    json={"url": "https://example.com"},
)
\`\`\`

### Responses

**201 Created**:

\`\`\`json
{
  "api_key": "ev_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
  "credits": 25,
  "claim_url": "https://extractvibe.com/claim/abc123",
  "claim_instructions": "Visit the claim URL to convert this agent account into a full account with 500 monthly credits.",
  "docs_url": "https://extractvibe.com/docs/quickstart.md",
  "expires_at": "2026-04-18T12:00:00Z"
}
\`\`\`

**400 Bad Request** -- Invalid agent name:

\`\`\`json
{
  "error": "agent_name must be alphanumeric with hyphens only"
}
\`\`\`

**409 Conflict** -- Agent name already taken:

\`\`\`json
{
  "error": "Agent name already registered"
}
\`\`\`

**429 Too Many Requests** -- Bootstrap rate limit exceeded:

\`\`\`json
{
  "error": "Rate limit exceeded",
  "limit": 3,
  "retryAfter": 86400
}
\`\`\`

### How it works

1. The agent sends a unique name (e.g., \`"cursor-plugin"\` or \`"my-chatbot"\`).
2. ExtractVibe creates a temporary user account with 25 credits.
3. The response includes an API key and a claim URL.
4. The agent can immediately use the API key for extractions.
5. A human can visit the \`claim_url\` to upgrade the account to a full account with 500 monthly credits.
6. Unclaimed agent accounts expire after 30 days.

### Rate limits

Agent bootstrap is limited to 3 requests per day per IP address.

### Notes

- Agent names must be globally unique. Choose a descriptive, namespaced name (e.g., \`"mycompany-research-bot"\`).
- The API key is returned only once. Store it securely.
- Agent accounts start with 25 credits. Claim the account for 500 monthly credits.
`;
}

// ─── Rate Limits ─────────────────────────────────────────────────────────

export function getRateLimitsMd(): string {
  return `# Rate Limits

> Base URL: \`https://extractvibe.com/api\`

All API endpoints are rate-limited to ensure fair usage. Limits vary by authentication tier and operation type.

## Rate limit tiers

| Tier | Read endpoints | Write endpoints | Window |
|---|---|---|---|
| Anonymous | 30 req/min | 3 req/day | 60s / 24h |
| Free | 60 req/min | 10 req/min | 60s |
| Starter | 180 req/min | 30 req/min | 60s |
| Pro | 600 req/min | 60 req/min | 60s |

**Read endpoints** include: \`GET /api/extract/:jobId\`, \`GET /api/extract/:jobId/result\`, \`GET /api/brand/:domain\`, \`GET /api/credits\`, \`GET /api/keys\`, \`GET /api/extract/history\`, \`GET /api/extract/:jobId/export/:format\`.

**Write endpoints** include: \`POST /api/extract\`, \`POST /api/keys\`, \`DELETE /api/keys/:id\`.

## Rate limit headers

Every API response includes rate limit headers:

\`\`\`
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1742342460
\`\`\`

| Header | Description |
|---|---|
| \`X-RateLimit-Limit\` | Maximum number of requests allowed in the current window |
| \`X-RateLimit-Remaining\` | Number of requests remaining in the current window |
| \`X-RateLimit-Reset\` | Unix timestamp (seconds) when the rate limit window resets |

## Handling rate limits

When you exceed the rate limit, the API returns \`429 Too Many Requests\`:

\`\`\`json
{
  "error": "Rate limit exceeded",
  "limit": 60,
  "retryAfter": 42
}
\`\`\`

Best practices:

- Check \`X-RateLimit-Remaining\` before making requests.
- If you receive a \`429\`, wait until \`X-RateLimit-Reset\` before retrying.
- Use exponential backoff for retry logic.
- Cache results locally to avoid redundant API calls.

### Retry example (JavaScript)

\`\`\`javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(url, options);

    if (res.status !== 429) return res;

    const retryAfter = parseInt(res.headers.get("X-RateLimit-Reset") || "0", 10);
    const waitMs = retryAfter > 0
      ? (retryAfter * 1000) - Date.now()
      : 1000 * Math.pow(2, attempt);

    await new Promise((r) => setTimeout(r, Math.max(waitMs, 1000)));
  }

  throw new Error("Rate limit exceeded after max retries");
}
\`\`\`

### Retry example (Python)

\`\`\`python
import time
import requests

def fetch_with_retry(url, headers, max_retries=3):
    for attempt in range(max_retries):
        res = requests.get(url, headers=headers)

        if res.status_code != 429:
            return res

        retry_after = int(res.headers.get("X-RateLimit-Reset", 0))
        wait = max(retry_after - time.time(), 2 ** attempt) if retry_after else 2 ** attempt
        time.sleep(max(wait, 1))

    raise Exception("Rate limit exceeded after max retries")
\`\`\`

## Anonymous rate limits

Anonymous (unauthenticated) requests use a stricter rate limit based on client IP address:

- **Read endpoints:** 30 requests per minute
- **Write endpoints:** 3 requests per day

To increase your limits, [sign up](https://extractvibe.com/sign-up) for a free account (60 read / 10 write per minute).
`;
}

// ─── Errors ──────────────────────────────────────────────────────────────

export function getErrorsMd(): string {
  return `# Error Codes

> Base URL: \`https://extractvibe.com/api\`

All errors return a JSON object with an \`error\` field describing the problem.

## Error response format

\`\`\`json
{
  "error": "Human-readable error description"
}
\`\`\`

Some errors include additional fields:

\`\`\`json
{
  "error": "Rate limit exceeded",
  "limit": 60,
  "retryAfter": 42
}
\`\`\`

## HTTP status codes

| Status | Name | Description |
|---|---|---|
| \`400\` | Bad Request | The request body is malformed or missing required fields. Check the endpoint documentation for required parameters. |
| \`401\` | Unauthorized | Authentication is required but was not provided, or the provided credentials are invalid. |
| \`402\` | Payment Required | Your credit balance is zero. Upgrade your plan or wait for the monthly reset. |
| \`404\` | Not Found | The requested resource does not exist. The job ID, API key, or brand domain was not found. |
| \`409\` | Conflict | A duplicate operation was attempted (e.g., extraction already in progress for the same domain). |
| \`426\` | Upgrade Required | WebSocket upgrade header expected but not present (WebSocket endpoint only). |
| \`429\` | Too Many Requests | You have exceeded the rate limit for your tier. Check the \`X-RateLimit-Reset\` header for when you can retry. |
| \`500\` | Internal Server Error | An unexpected error occurred. If this persists, please open an issue on [GitHub](https://github.com/seangeng/extractvibe). |

## Common error scenarios

### Missing API key

\`\`\`bash
curl https://extractvibe.com/api/credits
\`\`\`

\`\`\`json
{
  "error": "Unauthorized"
}
\`\`\`

**Fix:** Add the \`x-api-key\` header to your request.

### Invalid URL in extraction

\`\`\`bash
curl -X POST https://extractvibe.com/api/extract \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ev_your_api_key_here" \\
  -d '{"url": "not-a-valid-url"}'
\`\`\`

\`\`\`json
{
  "error": "Invalid URL"
}
\`\`\`

**Fix:** Provide a valid URL with a public domain.

### Out of credits

\`\`\`bash
curl -X POST https://extractvibe.com/api/extract \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ev_your_api_key_here" \\
  -d '{"url": "https://example.com"}'
\`\`\`

\`\`\`json
{
  "error": "No credits remaining. Upgrade your plan or wait for monthly reset."
}
\`\`\`

**Fix:** Check your balance with \`GET /api/credits\`. Credits reset on the 1st of each month.

### Rate limited

\`\`\`json
{
  "error": "Rate limit exceeded",
  "limit": 60,
  "retryAfter": 42
}
\`\`\`

**Fix:** Wait for the \`retryAfter\` period (in seconds) before retrying. See [Rate Limits](https://extractvibe.com/docs/rate-limits.md) for details.

### Result not ready

\`\`\`bash
curl https://extractvibe.com/api/extract/a1b2c3d4-e5f6-7890-abcd-ef1234567890/result \\
  -H "x-api-key: ev_your_api_key_here"
\`\`\`

\`\`\`json
{
  "error": "Result not found or still processing"
}
\`\`\`

**Fix:** Poll \`GET /api/extract/:jobId\` until \`status.status\` is \`"complete"\`, then fetch the result.

## Error handling best practices

1. Always check the HTTP status code before parsing the response body.
2. Use the \`error\` field for user-facing messages.
3. Implement retry logic with exponential backoff for \`429\` and \`500\` errors.
4. Log the full error response for debugging.
5. Never retry \`400\`, \`401\`, \`402\`, or \`404\` errors -- they indicate a client-side issue.
`;
}

// ─── Brand Kit Schema ────────────────────────────────────────────────────

export function getBrandKitSchemaMd(): string {
  return `# Brand Kit Schema

> Base URL: \`https://extractvibe.com/api\`

The complete schema reference for the \`ExtractVibeBrandKit\` object returned by extraction endpoints.

Schema version: **v1**

---

## Top-level structure

| Field | Type | Required | Description |
|---|---|---|---|
| \`meta\` | \`BrandKitMeta\` | Yes | Metadata about the extraction |
| \`identity\` | \`BrandIdentity\` | No | Brand name, tagline, description, archetypes |
| \`logos\` | \`BrandLogo[]\` | No | Extracted logo assets |
| \`colors\` | \`BrandColors\` | No | Color system (light mode, dark mode, semantic) |
| \`typography\` | \`BrandTypography\` | No | Font families, type scale, conventions |
| \`spacing\` | \`BrandSpacing\` | No | Spacing units, border radius, grid |
| \`assets\` | \`BrandAsset[]\` | No | Non-logo visual assets (illustrations, heroes, icons) |
| \`voice\` | \`BrandVoice\` | No | Tone, copywriting style, content patterns |
| \`rules\` | \`BrandRules\` | No | Brand dos and don'ts |
| \`vibe\` | \`BrandVibe\` | No | AI-generated brand personality summary |
| \`officialGuidelines\` | \`OfficialGuidelines\` | No | Discovered official brand guidelines |
| \`buttons\` | \`BrandButtons\` | No | Button variant styles |
| \`effects\` | \`BrandEffects\` | No | Shadows and gradients |
| \`designAssets\` | \`BrandDesignAsset[]\` | No | Design assets (illustrations, hero images) |
| \`ogImage\` | \`string\` | No | Open Graph image URL |

Almost every field is optional. Brands vary widely in what they expose, so the extraction engine fills in whatever it can detect with confidence.

---

## BrandKitMeta

| Field | Type | Description |
|---|---|---|
| \`url\` | string | The URL that was submitted for extraction |
| \`domain\` | string | Normalized domain (e.g., \`"stripe.com"\`) |
| \`extractedAt\` | string | ISO-8601 timestamp of extraction completion |
| \`schemaVersion\` | string | Schema version (\`"v1"\`) |
| \`durationMs\` | number | Total extraction wall-clock time in milliseconds |
| \`extractionDepth\` | number | Number of pages/resources crawled |

---

## BrandIdentity

| Field | Type | Description |
|---|---|---|
| \`brandName\` | string | Primary brand name as displayed on the site |
| \`tagline\` | string | Tagline or slogan |
| \`description\` | string | Short brand description (from meta description or hero copy) |
| \`archetypes\` | \`BrandArchetype[]\` | Brand archetypes with confidence scores |

### BrandArchetype

| Field | Type | Description |
|---|---|---|
| \`name\` | string | Archetype name (e.g., \`"The Creator"\`, \`"The Explorer"\`) |
| \`confidence\` | number | Confidence score 0--1 |

---

## BrandLogo

| Field | Type | Description |
|---|---|---|
| \`type\` | string | Logo classification: \`primary\`, \`secondary\`, \`wordmark\`, \`logomark\`, \`monochrome\`, \`favicon\`, \`social\` |
| \`url\` | string | URL to the extracted/stored copy (R2 URL) |
| \`originalUrl\` | string | Original URL on the source site |
| \`format\` | string | Image format: \`svg\`, \`png\`, \`ico\`, \`webp\`, \`jpg\` |
| \`variant\` | string | Visual variant: \`light\`, \`dark\`, \`color\`, \`mono\` |
| \`dimensions\` | \`{width, height}\` | Pixel dimensions (not applicable for SVG) |
| \`confidence\` | number | Extraction confidence 0--1 |
| \`source\` | string | Source: \`extracted\`, \`loadlogo\`, \`favicon\` |

---

## BrandColors

| Field | Type | Description |
|---|---|---|
| \`lightMode\` | \`ColorMode\` | Light mode color palette |
| \`darkMode\` | \`ColorMode\` | Dark mode color palette (null if no dark mode detected) |
| \`semantic\` | \`SemanticColors\` | Semantic/status colors |
| \`rawPalette\` | \`ColorValue[]\` | Every unique color detected before role assignment |

### ColorMode

| Field | Type | Description |
|---|---|---|
| \`primary\` | \`ColorValue\` | Primary brand color |
| \`secondary\` | \`ColorValue\` | Secondary brand color |
| \`accent\` | \`ColorValue\` | Accent/highlight color |
| \`background\` | \`ColorValue\` | Page background |
| \`surface\` | \`ColorValue\` | Card/surface background |
| \`text\` | \`ColorValue\` | Primary text color |
| \`secondaryText\` | \`ColorValue\` | Secondary/muted text |
| \`border\` | \`ColorValue\` | Border color |
| \`link\` | \`ColorValue\` | Link color |
| \`muted\` | \`ColorValue\` | Muted/subtle color |

### ColorValue

| Field | Type | Description |
|---|---|---|
| \`hex\` | string | Hex value (e.g., \`"#1a73e8"\`) |
| \`rgb\` | \`{r, g, b}\` | RGB breakdown |
| \`role\` | string | Semantic role (e.g., \`"primary"\`, \`"CTA background"\`) |
| \`source\` | string | Where found (CSS variable name, selector, meta tag) |
| \`confidence\` | number | Extraction confidence 0--1 |

### SemanticColors

| Field | Type | Description |
|---|---|---|
| \`success\` | \`ColorValue\` | Success/positive color |
| \`warning\` | \`ColorValue\` | Warning/caution color |
| \`error\` | \`ColorValue\` | Error/danger color |
| \`info\` | \`ColorValue\` | Informational color |

---

## BrandTypography

| Field | Type | Description |
|---|---|---|
| \`families\` | \`FontFamily[]\` | All detected font families |
| \`scale\` | \`TypeScale\` | Heading/body type scale |
| \`conventions\` | \`TypographyConventions\` | Typographic patterns |

### FontFamily

| Field | Type | Description |
|---|---|---|
| \`name\` | string | Font family name (e.g., \`"Inter"\`, \`"Playfair Display"\`) |
| \`role\` | string | Role: \`heading\`, \`body\`, \`mono\`, \`display\` |
| \`source\` | string | Source: \`google-fonts\`, \`adobe-fonts\`, \`self-hosted\`, \`system\` |
| \`weights\` | number[] | Detected font weights (e.g., \`[400, 500, 700]\`) |
| \`fallbackStack\` | string | CSS fallback stack (e.g., \`"system-ui, sans-serif"\`) |
| \`confidence\` | number | Extraction confidence 0--1 |

### TypeScale

Object with optional entries for each heading level plus body text:

| Field | Type | Description |
|---|---|---|
| \`h1\` through \`h6\` | \`TypeScaleEntry\` | Heading levels |
| \`body\` | \`TypeScaleEntry\` | Body text |
| \`small\` | \`TypeScaleEntry\` | Small/fine print |
| \`caption\` | \`TypeScaleEntry\` | Caption text |

### TypeScaleEntry

| Field | Type | Description |
|---|---|---|
| \`fontSize\` | string | e.g., \`"2.5rem"\`, \`"40px"\` |
| \`fontWeight\` | number | e.g., \`700\` |
| \`lineHeight\` | string | e.g., \`"1.2"\`, \`"1.5"\` |
| \`letterSpacing\` | string | e.g., \`"-0.02em"\` |
| \`textTransform\` | string | e.g., \`"uppercase"\`, \`"capitalize"\` |
| \`fontFamily\` | string | Font family name this level uses |

### TypographyConventions

| Field | Type | Description |
|---|---|---|
| \`headingCase\` | string | \`title-case\`, \`sentence-case\`, \`lowercase\`, \`uppercase\` |
| \`bodyLineHeight\` | string | Typical body line-height (e.g., \`"1.6"\`) |
| \`codeFont\` | string | Monospace/code font name |

---

## BrandSpacing

| Field | Type | Description |
|---|---|---|
| \`baseUnit\` | string | Base spacing unit (e.g., \`"8px"\`, \`"0.5rem"\`) |
| \`borderRadius\` | \`{small, medium, large}\` | Border radius scale (each a CSS value string) |
| \`containerMaxWidth\` | string | Max-width of main content container (e.g., \`"1280px"\`) |
| \`grid\` | \`{columns, gap}\` | Grid system (columns as number, gap as CSS value) |

---

## BrandVoice

| Field | Type | Description |
|---|---|---|
| \`toneSpectrum\` | \`ToneSpectrum\` | Multi-axis tone positioning |
| \`copywritingStyle\` | \`CopywritingStyle\` | Copywriting analysis |
| \`contentPatterns\` | \`ContentPatterns\` | Content structure patterns |
| \`sampleCopy\` | string[] | Representative copy samples from the site |

### ToneSpectrum

Each axis is a 1--10 scale. Lower values lean toward the left label; higher values lean toward the right.

| Field | Scale | Description |
|---|---|---|
| \`formalCasual\` | 1 (formal) -- 10 (casual) | How formal or casual the tone is |
| \`playfulSerious\` | 1 (playful) -- 10 (serious) | Playfulness vs. seriousness |
| \`enthusiasticMatterOfFact\` | 1 (enthusiastic) -- 10 (matter-of-fact) | Energy level of the copy |
| \`respectfulIrreverent\` | 1 (respectful) -- 10 (irreverent) | Deference vs. boldness |
| \`technicalAccessible\` | 1 (technical) -- 10 (accessible) | Technical depth vs. simplicity |

### CopywritingStyle

| Field | Type | Description |
|---|---|---|
| \`avgSentenceLength\` | number | Average sentence length in words |
| \`vocabularyComplexity\` | string | \`simple\`, \`moderate\`, or \`advanced\` |
| \`jargonUsage\` | string | \`none\`, \`some\`, or \`heavy\` |
| \`rhetoricalDevices\` | string[] | Detected devices (e.g., \`"alliteration"\`, \`"tricolon"\`) |
| \`ctaStyle\` | string | Call-to-action style (e.g., \`"Start free trial"\`) |

### ContentPatterns

| Field | Type | Description |
|---|---|---|
| \`headingCase\` | string | Heading case convention |
| \`emojiUsage\` | string | \`none\`, \`light\`, or \`heavy\` |
| \`exclamationFrequency\` | string | \`none\`, \`rare\`, or \`frequent\` |
| \`questionUsageInHeadings\` | boolean | Whether questions appear in headings |
| \`bulletPreference\` | boolean | Whether the brand prefers bullet lists over prose |

---

## BrandRules

| Field | Type | Description |
|---|---|---|
| \`dos\` | string[] | Things the brand consistently does/recommends |
| \`donts\` | string[] | Things the brand avoids/discourages |
| \`source\` | string | \`inferred\`, \`official\`, or \`merged\` |

---

## BrandVibe

| Field | Type | Description |
|---|---|---|
| \`summary\` | string | One-sentence vibe summary (e.g., \`"Polished and confident with a developer-first edge"\`) |
| \`tags\` | string[] | Vibe tags (e.g., \`["minimal", "techy", "premium"]\`) |
| \`visualEnergy\` | number | 1 (calm/understated) -- 10 (high-energy/bold) |
| \`designEra\` | string | Design era (e.g., \`"neo-brutalism"\`, \`"flat 2.0"\`, \`"glassmorphism"\`) |
| \`comparableBrands\` | string[] | Brands with a similar look and feel |
| \`emotionalTone\` | string | Dominant emotional tone (e.g., \`"trustworthy"\`, \`"playful"\`) |
| \`targetAudienceInferred\` | string | Inferred target audience |
| \`confidence\` | number | Overall vibe confidence 0--1 |

---

## BrandButtons

| Field | Type | Description |
|---|---|---|
| \`styles\` | \`ButtonStyle[]\` | Extracted button variant styles |

### ButtonStyle

| Field | Type | Description |
|---|---|---|
| \`variant\` | string | \`primary\`, \`secondary\`, \`outline\`, \`ghost\`, \`text\` |
| \`backgroundColor\` | string | Background color (hex) |
| \`textColor\` | string | Text color (hex) |
| \`borderRadius\` | string | Border radius (CSS value) |
| \`borderColor\` | string | Border color (hex) |
| \`borderWidth\` | string | Border width (CSS value) |
| \`padding\` | string | Padding (CSS value) |
| \`fontSize\` | string | Font size (CSS value) |
| \`fontWeight\` | number | Font weight |
| \`fontFamily\` | string | Font family name |
| \`boxShadow\` | string | Box shadow (CSS value) |
| \`sampleText\` | string | Sample button text found on the site |
| \`confidence\` | number | Extraction confidence 0--1 |

---

## BrandEffects

| Field | Type | Description |
|---|---|---|
| \`shadows\` | \`ShadowValue[]\` | Box shadow values |
| \`gradients\` | \`GradientValue[]\` | Gradient values |

### ShadowValue

| Field | Type | Description |
|---|---|---|
| \`value\` | string | CSS box-shadow value |
| \`source\` | string | CSS selector or source |
| \`context\` | string | \`card\`, \`button\`, \`navigation\`, \`dropdown\`, \`modal\`, \`element\` |

### GradientValue

| Field | Type | Description |
|---|---|---|
| \`value\` | string | CSS gradient value |
| \`source\` | string | CSS selector or source |
| \`context\` | string | Where the gradient was found |

---

## OfficialGuidelines

| Field | Type | Description |
|---|---|---|
| \`discoveredUrl\` | string or null | URL of the official brand guidelines page |
| \`hasOfficialKit\` | boolean | Whether the brand has a public brand kit |
| \`guidelineRules\` | string[] | Rules extracted from official guidelines |

---

## Example: minimal response

\`\`\`json
{
  "meta": {
    "domain": "example.com",
    "url": "https://example.com",
    "extractedAt": "2026-03-18T12:00:00Z",
    "schemaVersion": "v1",
    "durationMs": 8200
  },
  "colors": {
    "lightMode": {
      "primary": { "hex": "#1a73e8" },
      "background": { "hex": "#ffffff" }
    }
  }
}
\`\`\`

## Example: comprehensive response

\`\`\`json
{
  "meta": {
    "domain": "stripe.com",
    "url": "https://stripe.com",
    "extractedAt": "2026-03-18T12:00:00Z",
    "schemaVersion": "v1",
    "durationMs": 18420,
    "extractionDepth": 3
  },
  "identity": {
    "brandName": "Stripe",
    "tagline": "Financial infrastructure for the internet",
    "description": "Stripe builds economic infrastructure for the internet.",
    "archetypes": [
      { "name": "The Creator", "confidence": 0.85 },
      { "name": "The Sage", "confidence": 0.72 }
    ]
  },
  "logos": [
    {
      "type": "primary",
      "url": "https://extractvibe-assets.r2.dev/stripe.com/logo-primary.svg",
      "format": "svg",
      "variant": "color",
      "confidence": 0.95,
      "source": "extracted"
    }
  ],
  "colors": {
    "lightMode": {
      "primary": { "hex": "#635BFF", "role": "primary", "confidence": 0.95 },
      "secondary": { "hex": "#0A2540", "role": "secondary", "confidence": 0.90 },
      "accent": { "hex": "#00D4AA", "role": "accent", "confidence": 0.85 },
      "background": { "hex": "#FFFFFF", "role": "background" },
      "text": { "hex": "#425466", "role": "text" },
      "muted": { "hex": "#8898AA", "role": "muted" }
    },
    "semantic": {
      "success": { "hex": "#28A745" },
      "error": { "hex": "#DC3545" }
    }
  },
  "typography": {
    "families": [
      { "name": "Sohne", "role": "heading", "source": "self-hosted", "weights": [400, 500, 600] },
      { "name": "Sohne", "role": "body", "source": "self-hosted", "weights": [400, 500] },
      { "name": "Sohne Mono", "role": "mono", "source": "self-hosted", "weights": [400] }
    ],
    "scale": {
      "h1": { "fontSize": "3.5rem", "fontWeight": 600, "lineHeight": "1.1" },
      "h2": { "fontSize": "2.5rem", "fontWeight": 600, "lineHeight": "1.2" },
      "body": { "fontSize": "1rem", "fontWeight": 400, "lineHeight": "1.6" }
    },
    "conventions": {
      "headingCase": "sentence-case",
      "bodyLineHeight": "1.6"
    }
  },
  "voice": {
    "toneSpectrum": {
      "formalCasual": 4,
      "playfulSerious": 6,
      "enthusiasticMatterOfFact": 5,
      "respectfulIrreverent": 3,
      "technicalAccessible": 4
    },
    "copywritingStyle": {
      "avgSentenceLength": 14,
      "vocabularyComplexity": "moderate",
      "jargonUsage": "some",
      "ctaStyle": "Start now"
    },
    "sampleCopy": [
      "Financial infrastructure for the internet",
      "Payments built for developers"
    ]
  },
  "rules": {
    "dos": [
      "Use active voice",
      "Address the reader directly",
      "Lead with benefits, not features"
    ],
    "donts": [
      "Avoid exclamation marks",
      "Never use casual slang",
      "Do not use more than two font weights per element"
    ],
    "source": "inferred"
  },
  "vibe": {
    "summary": "Polished and confident with a developer-first edge",
    "tags": ["premium", "developer-first", "polished", "enterprise"],
    "visualEnergy": 6,
    "designEra": "flat 2.0",
    "comparableBrands": ["Linear", "Vercel", "Figma"],
    "emotionalTone": "trustworthy",
    "targetAudienceInferred": "Developers and technical founders",
    "confidence": 0.88
  },
  "buttons": {
    "styles": [
      {
        "variant": "primary",
        "backgroundColor": "#635BFF",
        "textColor": "#FFFFFF",
        "borderRadius": "8px",
        "padding": "12px 24px",
        "fontWeight": 500,
        "sampleText": "Start now"
      }
    ]
  },
  "effects": {
    "shadows": [
      { "value": "0 2px 4px rgba(0,0,0,0.08)", "context": "card" }
    ],
    "gradients": [
      { "value": "linear-gradient(135deg, #635BFF, #00D4AA)", "context": "hero background" }
    ]
  }
}
\`\`\`
`;
}

// ─── Full docs (concatenation of all sections) ──────────────────────────

export function getFullDocsMd(): string {
  const separator = "\n\n---\n\n";
  const sections = [
    getQuickstartMd(),
    getAuthenticationMd(),
    getExtractMd(),
    getExportMd(),
    getBrandMd(),
    getCreditsMd(),
    getKeysMd(),
    getAgentBootstrapMd(),
    getRateLimitsMd(),
    getErrorsMd(),
    getBrandKitSchemaMd(),
  ];

  const header = `# ExtractVibe API Documentation

> Complete API reference for ExtractVibe -- the open-source brand intelligence API.
>
> Base URL: \`https://extractvibe.com/api\`
>
> This document contains all API documentation in a single file for LLM consumption.
> Individual sections are available at \`https://extractvibe.com/docs/*.md\`.

## Table of Contents

1. [Quickstart](#quickstart)
2. [Authentication](#authentication)
3. [Extract Brand](#extract-brand)
4. [Export Formats](#export-formats)
5. [Brand Lookup](#brand-lookup)
6. [Credits](#credits)
7. [API Keys](#api-keys)
8. [Agent Bootstrap](#agent-bootstrap)
9. [Rate Limits](#rate-limits)
10. [Error Codes](#error-codes)
11. [Brand Kit Schema](#brand-kit-schema)

`;

  return header + sections.join(separator);
}
