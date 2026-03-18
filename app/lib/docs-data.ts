// ---------------------------------------------------------------------------
// docs-data.ts — Static documentation content for ExtractVibe API docs
// ---------------------------------------------------------------------------

export interface CodeExample {
  language: "bash" | "javascript" | "python";
  label: string;
  code: string;
}

export interface ResponseExample {
  status: number;
  description: string;
  body: string;
}

export interface EndpointDoc {
  method: "GET" | "POST" | "DELETE";
  path: string;
  slug: string;
  title: string;
  description: string;
  auth: "none" | "optional" | "required";
  rateLimit: string;
  requestBody?: { description: string; example: string };
  pathParams?: { name: string; description: string }[];
  queryParams?: { name: string; description: string; required: boolean }[];
  responses: ResponseExample[];
  codeExamples: CodeExample[];
}

// ---------------------------------------------------------------------------
// Auth guide
// ---------------------------------------------------------------------------
export const authGuide = {
  title: "Authentication",
  paragraphs: [
    "ExtractVibe supports two authentication methods: session cookies and API keys. Session cookies are set automatically when you sign in through the web interface. API keys are designed for programmatic access and server-to-server integrations.",
    "To authenticate with an API key, include it in the `x-api-key` header of your request. API keys use the `ev_` prefix and can be created and managed from your dashboard or via the API keys endpoints.",
    "Some endpoints work without authentication (marked as \"optional\" or \"none\"). Anonymous requests are subject to stricter rate limits. Authenticated requests receive higher limits based on your plan tier.",
    "Never expose your API key in client-side code. Use environment variables on your server and proxy requests if you need to call the API from a browser.",
  ],
};

// ---------------------------------------------------------------------------
// Rate limit tiers
// ---------------------------------------------------------------------------
export const rateLimitTiers = [
  {
    tier: "Anonymous",
    reads: "30 req/min",
    writes: "3 req/day",
    window: "60s / 24h",
  },
  {
    tier: "Free",
    reads: "60 req/min",
    writes: "10 req/min",
    window: "60s",
  },
  {
    tier: "Starter",
    reads: "180 req/min",
    writes: "30 req/min",
    window: "60s",
  },
  {
    tier: "Pro",
    reads: "600 req/min",
    writes: "60 req/min",
    window: "60s",
  },
];

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------
export const errorCodes = [
  {
    status: 400,
    name: "Bad Request",
    description:
      "The request body is malformed or missing required fields. Check the endpoint documentation for required parameters.",
  },
  {
    status: 401,
    name: "Unauthorized",
    description:
      "Authentication is required but was not provided, or the provided credentials are invalid.",
  },
  {
    status: 402,
    name: "Payment Required",
    description:
      "Your credit balance is zero. Upgrade your plan or wait for the monthly reset.",
  },
  {
    status: 404,
    name: "Not Found",
    description:
      "The requested resource does not exist. The job ID, API key, or brand domain was not found.",
  },
  {
    status: 429,
    name: "Too Many Requests",
    description:
      "You have exceeded the rate limit for your tier. Check the X-RateLimit-Reset header for when you can retry.",
  },
  {
    status: 500,
    name: "Internal Server Error",
    description:
      "An unexpected error occurred. If this persists, please open an issue on GitHub.",
  },
];

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
export const endpoints: EndpointDoc[] = [
  // 1. Health
  {
    method: "GET",
    path: "/api/health",
    slug: "health",
    title: "Health check",
    description:
      "Returns the API status, version, and current timestamp. Use this to verify connectivity before making other calls.",
    auth: "none",
    rateLimit: "None",
    responses: [
      {
        status: 200,
        description: "API is healthy",
        body: JSON.stringify(
          { ok: true, version: "0.1.0", timestamp: 1742342400000 },
          null,
          2
        ),
      },
    ],
    codeExamples: [
      {
        language: "bash",
        label: "cURL",
        code: `curl https://extractvibe.com/api/health`,
      },
      {
        language: "javascript",
        label: "JavaScript",
        code: `const res = await fetch("https://extractvibe.com/api/health");
const data = await res.json();
console.log(data.ok); // true`,
      },
      {
        language: "python",
        label: "Python",
        code: `import requests

res = requests.get("https://extractvibe.com/api/health")
data = res.json()
print(data["ok"])  # True`,
      },
    ],
  },

  // 2. Start extraction
  {
    method: "POST",
    path: "/api/extract",
    slug: "extract-start",
    title: "Start extraction",
    description:
      "Starts a brand extraction job for the given URL. Returns a job ID that you can use to poll for status and retrieve results. Each extraction costs 1 credit for authenticated users. Anonymous users get 3 free extractions per day.",
    auth: "optional",
    rateLimit: "Varies by tier (anon: 3/day, free: 10/min, starter: 30/min, pro: 60/min)",
    requestBody: {
      description:
        "JSON object with a `url` field. The URL can include or omit the protocol -- `https://` will be prepended automatically if missing.",
      example: JSON.stringify({ url: "https://stripe.com" }, null, 2),
    },
    responses: [
      {
        status: 202,
        description: "Extraction job created",
        body: JSON.stringify(
          {
            jobId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            domain: "stripe.com",
          },
          null,
          2
        ),
      },
      {
        status: 400,
        description: "Invalid or missing URL",
        body: JSON.stringify({ error: "Missing required field: url" }, null, 2),
      },
      {
        status: 402,
        description: "No credits remaining",
        body: JSON.stringify(
          {
            error:
              "No credits remaining. Upgrade your plan or wait for monthly reset.",
          },
          null,
          2
        ),
      },
      {
        status: 429,
        description: "Rate limit exceeded",
        body: JSON.stringify(
          { error: "Rate limit exceeded", limit: 3, retryAfter: 72000 },
          null,
          2
        ),
      },
    ],
    codeExamples: [
      {
        language: "bash",
        label: "cURL",
        code: `curl -X POST https://extractvibe.com/api/extract \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ev_your_api_key_here" \\
  -d '{"url": "https://stripe.com"}'`,
      },
      {
        language: "javascript",
        label: "JavaScript",
        code: `const res = await fetch("https://extractvibe.com/api/extract", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.EXTRACTVIBE_API_KEY,
  },
  body: JSON.stringify({ url: "https://stripe.com" }),
});

const { jobId, domain } = await res.json();
console.log(\`Extraction started: \${jobId} (\${domain})\`);`,
      },
      {
        language: "python",
        label: "Python",
        code: `import requests
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
print(f"Extraction started: {data['jobId']} ({data['domain']})")`,
      },
    ],
  },

  // 3. Poll job status
  {
    method: "GET",
    path: "/api/extract/:jobId",
    slug: "extract-status",
    title: "Poll job status",
    description:
      "Check the current status of an extraction job. The status field will be one of: `queued`, `running`, `complete`, or `errored`. Anyone with the job ID can poll status.",
    auth: "optional",
    rateLimit: "Read tier (anon: 30/min, free: 60/min, starter: 180/min, pro: 600/min)",
    pathParams: [
      { name: "jobId", description: "The UUID returned from POST /api/extract" },
    ],
    responses: [
      {
        status: 200,
        description: "Job status retrieved",
        body: JSON.stringify(
          {
            jobId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            status: {
              status: "running",
              error: null,
              output: null,
            },
          },
          null,
          2
        ),
      },
      {
        status: 200,
        description: "Job completed",
        body: JSON.stringify(
          {
            jobId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            status: {
              status: "complete",
              error: null,
              output: { domain: "stripe.com", cached: true },
            },
          },
          null,
          2
        ),
      },
      {
        status: 404,
        description: "Job not found",
        body: JSON.stringify({ error: "Job not found" }, null, 2),
      },
    ],
    codeExamples: [
      {
        language: "bash",
        label: "cURL",
        code: `curl https://extractvibe.com/api/extract/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \\
  -H "x-api-key: ev_your_api_key_here"`,
      },
      {
        language: "javascript",
        label: "JavaScript",
        code: `const jobId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const res = await fetch(\`https://extractvibe.com/api/extract/\${jobId}\`, {
  headers: { "x-api-key": process.env.EXTRACTVIBE_API_KEY },
});

const { status } = await res.json();
console.log(status.status); // "running" | "complete" | "errored"`,
      },
      {
        language: "python",
        label: "Python",
        code: `import requests
import os

job_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

res = requests.get(
    f"https://extractvibe.com/api/extract/{job_id}",
    headers={"x-api-key": os.environ["EXTRACTVIBE_API_KEY"]},
)

data = res.json()
print(data["status"]["status"])  # "running" | "complete" | "errored"`,
      },
    ],
  },

  // 4. Get extraction result
  {
    method: "GET",
    path: "/api/extract/:jobId/result",
    slug: "extract-result",
    title: "Get extraction result",
    description:
      "Retrieve the full brand kit result for a completed extraction job. Returns the complete brand analysis including colors, typography, voice, personality, and rules. Results are cached in KV for fast retrieval.",
    auth: "optional",
    rateLimit: "Read tier",
    pathParams: [
      { name: "jobId", description: "The UUID returned from POST /api/extract" },
    ],
    responses: [
      {
        status: 200,
        description: "Brand kit result",
        body: JSON.stringify(
          {
            meta: {
              domain: "stripe.com",
              url: "https://stripe.com",
              extractedAt: "2026-03-18T12:00:00Z",
              durationMs: 18420,
              schemaVersion: "v1",
            },
            colors: {
              primary: "#635BFF",
              secondary: "#0A2540",
              accent: "#00D4AA",
              background: "#FFFFFF",
              palette: [
                { hex: "#635BFF", role: "primary", name: "Stripe Purple" },
                { hex: "#0A2540", role: "secondary", name: "Ink" },
                { hex: "#00D4AA", role: "accent", name: "Cyan" },
                { hex: "#425466", role: "muted", name: "Slate" },
                { hex: "#F6F9FC", role: "background", name: "Off White" },
              ],
            },
            typography: {
              headings: {
                family: "Sohne",
                weight: "600",
                style: "normal",
              },
              body: {
                family: "Sohne",
                weight: "400",
                style: "normal",
              },
              mono: {
                family: "Sohne Mono",
                weight: "400",
                style: "normal",
              },
              scale: [14, 16, 20, 24, 32, 48, 64],
            },
            voice: {
              tone: "confident, technical, approachable",
              personality: ["innovative", "reliable", "developer-friendly"],
              writingStyle: "Clear and concise with technical precision. Uses active voice and addresses the reader directly.",
              samplePhrases: [
                "Financial infrastructure for the internet",
                "Start building with Stripe",
                "Payments built for developers",
              ],
            },
            logos: [
              {
                url: "https://extractvibe-assets.r2.dev/stripe.com/logo-primary.svg",
                type: "svg",
                variant: "primary",
                width: 120,
                height: 50,
              },
            ],
            vibeScore: 92,
            tags: ["premium", "developer-first", "polished", "enterprise"],
          },
          null,
          2
        ),
      },
      {
        status: 404,
        description: "Result not ready or not found",
        body: JSON.stringify(
          { error: "Result not found or still processing" },
          null,
          2
        ),
      },
    ],
    codeExamples: [
      {
        language: "bash",
        label: "cURL",
        code: `curl https://extractvibe.com/api/extract/a1b2c3d4-e5f6-7890-abcd-ef1234567890/result \\
  -H "x-api-key: ev_your_api_key_here"`,
      },
      {
        language: "javascript",
        label: "JavaScript",
        code: `const jobId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const res = await fetch(
  \`https://extractvibe.com/api/extract/\${jobId}/result\`,
  { headers: { "x-api-key": process.env.EXTRACTVIBE_API_KEY } }
);

const brandKit = await res.json();
console.log(brandKit.colors.primary); // "#635BFF"
console.log(brandKit.voice.tone);     // "confident, technical, approachable"`,
      },
      {
        language: "python",
        label: "Python",
        code: `import requests
import os

job_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

res = requests.get(
    f"https://extractvibe.com/api/extract/{job_id}/result",
    headers={"x-api-key": os.environ["EXTRACTVIBE_API_KEY"]},
)

brand_kit = res.json()
print(brand_kit["colors"]["primary"])  # "#635BFF"
print(brand_kit["voice"]["tone"])      # "confident, technical, approachable"`,
      },
    ],
  },

  // 5. Get brand by domain
  {
    method: "GET",
    path: "/api/brand/:domain",
    slug: "brand-domain",
    title: "Get brand by domain",
    description:
      "Retrieve a cached brand kit by domain name. This is a public endpoint that returns the most recent extraction result for a given domain. If the domain has not been extracted yet, returns 404.",
    auth: "optional",
    rateLimit: "Read tier",
    pathParams: [
      {
        name: "domain",
        description:
          "The domain name without protocol or www prefix (e.g., `stripe.com`)",
      },
    ],
    responses: [
      {
        status: 200,
        description: "Cached brand kit",
        body: JSON.stringify(
          {
            meta: {
              domain: "stripe.com",
              url: "https://stripe.com",
              extractedAt: "2026-03-18T12:00:00Z",
              durationMs: 18420,
              schemaVersion: "v1",
            },
            colors: {
              primary: "#635BFF",
              secondary: "#0A2540",
              accent: "#00D4AA",
              background: "#FFFFFF",
              palette: [
                { hex: "#635BFF", role: "primary", name: "Stripe Purple" },
              ],
            },
            typography: {
              headings: { family: "Sohne", weight: "600" },
              body: { family: "Sohne", weight: "400" },
            },
            voice: {
              tone: "confident, technical, approachable",
              personality: ["innovative", "reliable", "developer-friendly"],
            },
            vibeScore: 92,
            tags: ["premium", "developer-first", "polished"],
          },
          null,
          2
        ),
      },
      {
        status: 404,
        description: "Brand not found",
        body: JSON.stringify(
          { error: "Brand not found. Extract it first." },
          null,
          2
        ),
      },
    ],
    codeExamples: [
      {
        language: "bash",
        label: "cURL",
        code: `curl https://extractvibe.com/api/brand/stripe.com`,
      },
      {
        language: "javascript",
        label: "JavaScript",
        code: `const res = await fetch("https://extractvibe.com/api/brand/stripe.com");
const brandKit = await res.json();

console.log(brandKit.meta.domain);    // "stripe.com"
console.log(brandKit.colors.primary); // "#635BFF"`,
      },
      {
        language: "python",
        label: "Python",
        code: `import requests

res = requests.get("https://extractvibe.com/api/brand/stripe.com")
brand_kit = res.json()

print(brand_kit["meta"]["domain"])    # "stripe.com"
print(brand_kit["colors"]["primary"]) # "#635BFF"`,
      },
    ],
  },

  // 6. Extraction history
  {
    method: "GET",
    path: "/api/extract/history",
    slug: "extract-history",
    title: "List extraction history",
    description:
      "Returns the 50 most recent extraction jobs for the authenticated user, ordered by creation date descending. Each entry includes the job ID, domain, status, and timing information.",
    auth: "required",
    rateLimit: "Read tier",
    responses: [
      {
        status: 200,
        description: "List of extractions",
        body: JSON.stringify(
          {
            extractions: [
              {
                id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                domain: "stripe.com",
                url: "https://stripe.com",
                status: "complete",
                durationMs: 18420,
                createdAt: "2026-03-18T12:00:00Z",
                completedAt: "2026-03-18T12:00:18Z",
              },
              {
                id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
                domain: "linear.app",
                url: "https://linear.app",
                status: "complete",
                durationMs: 15230,
                createdAt: "2026-03-17T09:30:00Z",
                completedAt: "2026-03-17T09:30:15Z",
              },
            ],
          },
          null,
          2
        ),
      },
      {
        status: 401,
        description: "Not authenticated",
        body: JSON.stringify({ error: "Unauthorized" }, null, 2),
      },
    ],
    codeExamples: [
      {
        language: "bash",
        label: "cURL",
        code: `curl https://extractvibe.com/api/extract/history \\
  -H "x-api-key: ev_your_api_key_here"`,
      },
      {
        language: "javascript",
        label: "JavaScript",
        code: `const res = await fetch("https://extractvibe.com/api/extract/history", {
  headers: { "x-api-key": process.env.EXTRACTVIBE_API_KEY },
});

const { extractions } = await res.json();
extractions.forEach((e) => {
  console.log(\`\${e.domain} — \${e.status} (\${e.durationMs}ms)\`);
});`,
      },
      {
        language: "python",
        label: "Python",
        code: `import requests
import os

res = requests.get(
    "https://extractvibe.com/api/extract/history",
    headers={"x-api-key": os.environ["EXTRACTVIBE_API_KEY"]},
)

for extraction in res.json()["extractions"]:
    print(f"{extraction['domain']} — {extraction['status']}")`,
      },
    ],
  },

  // 7. Export brand kit
  {
    method: "GET",
    path: "/api/extract/:jobId/export/:format",
    slug: "extract-export",
    title: "Export brand kit",
    description:
      "Download a brand kit in various formats. Supported formats: `json` (full brand kit), `css` (CSS custom properties), `tailwind` (Tailwind CSS theme), `markdown` (human-readable report), and `tokens` (W3C design tokens). Returns the file as a download attachment.",
    auth: "required",
    rateLimit: "Read tier",
    pathParams: [
      { name: "jobId", description: "The UUID of a completed extraction job" },
      {
        name: "format",
        description:
          "Export format: `json`, `css`, `tailwind`, `markdown`, or `tokens`",
      },
    ],
    responses: [
      {
        status: 200,
        description: "File download (Content-Disposition: attachment)",
        body: `/* stripe.com — extracted by ExtractVibe */
:root {
  --brand-primary: #635BFF;
  --brand-secondary: #0A2540;
  --brand-accent: #00D4AA;
  --brand-background: #FFFFFF;
  --brand-muted: #425466;
  --font-heading: "Sohne", sans-serif;
  --font-body: "Sohne", sans-serif;
  --font-mono: "Sohne Mono", monospace;
}`,
      },
      {
        status: 400,
        description: "Invalid format",
        body: JSON.stringify(
          {
            error: "Invalid format. Use: json, css, tailwind, markdown, tokens",
          },
          null,
          2
        ),
      },
      {
        status: 404,
        description: "Result not found",
        body: JSON.stringify({ error: "Result not found" }, null, 2),
      },
    ],
    codeExamples: [
      {
        language: "bash",
        label: "cURL",
        code: `# Download as CSS variables
curl -o stripe-variables.css \\
  https://extractvibe.com/api/extract/a1b2c3d4-e5f6-7890-abcd-ef1234567890/export/css \\
  -H "x-api-key: ev_your_api_key_here"

# Download as Tailwind theme
curl -o stripe-tailwind.css \\
  https://extractvibe.com/api/extract/a1b2c3d4-e5f6-7890-abcd-ef1234567890/export/tailwind \\
  -H "x-api-key: ev_your_api_key_here"`,
      },
      {
        language: "javascript",
        label: "JavaScript",
        code: `const jobId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const res = await fetch(
  \`https://extractvibe.com/api/extract/\${jobId}/export/css\`,
  { headers: { "x-api-key": process.env.EXTRACTVIBE_API_KEY } }
);

const css = await res.text();
console.log(css); // :root { --brand-primary: #635BFF; ... }`,
      },
      {
        language: "python",
        label: "Python",
        code: `import requests
import os

job_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

res = requests.get(
    f"https://extractvibe.com/api/extract/{job_id}/export/css",
    headers={"x-api-key": os.environ["EXTRACTVIBE_API_KEY"]},
)

with open("stripe-variables.css", "w") as f:
    f.write(res.text)`,
      },
    ],
  },

  // 8. Credits
  {
    method: "GET",
    path: "/api/credits",
    slug: "credits",
    title: "Get credit balance",
    description:
      "Returns the current credit balance and plan for the authenticated user. Free accounts start with 50 credits that reset monthly.",
    auth: "required",
    rateLimit: "Read tier",
    responses: [
      {
        status: 200,
        description: "Credit balance",
        body: JSON.stringify({ credits: 47, plan: "free" }, null, 2),
      },
      {
        status: 401,
        description: "Not authenticated",
        body: JSON.stringify({ error: "Unauthorized" }, null, 2),
      },
    ],
    codeExamples: [
      {
        language: "bash",
        label: "cURL",
        code: `curl https://extractvibe.com/api/credits \\
  -H "x-api-key: ev_your_api_key_here"`,
      },
      {
        language: "javascript",
        label: "JavaScript",
        code: `const res = await fetch("https://extractvibe.com/api/credits", {
  headers: { "x-api-key": process.env.EXTRACTVIBE_API_KEY },
});

const { credits, plan } = await res.json();
console.log(\`\${credits} credits remaining (\${plan} plan)\`);`,
      },
      {
        language: "python",
        label: "Python",
        code: `import requests
import os

res = requests.get(
    "https://extractvibe.com/api/credits",
    headers={"x-api-key": os.environ["EXTRACTVIBE_API_KEY"]},
)

data = res.json()
print(f"{data['credits']} credits remaining ({data['plan']} plan)")`,
      },
    ],
  },

  // 9. Create API key
  {
    method: "POST",
    path: "/api/keys",
    slug: "keys-create",
    title: "Create API key",
    description:
      "Creates a new API key for the authenticated user. The full key is returned only once in the response -- store it securely. Keys use the `ev_` prefix followed by 48 hex characters.",
    auth: "required",
    rateLimit: "Write tier",
    requestBody: {
      description:
        "Optional JSON object with a `name` field for the key. Defaults to \"Default\" if omitted.",
      example: JSON.stringify({ name: "Production server" }, null, 2),
    },
    responses: [
      {
        status: 201,
        description: "API key created",
        body: JSON.stringify(
          {
            id: "c3d4e5f6-a7b8-9012-cdef-234567890123",
            name: "Production server",
            key: "ev_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
          },
          null,
          2
        ),
      },
      {
        status: 401,
        description: "Not authenticated",
        body: JSON.stringify({ error: "Unauthorized" }, null, 2),
      },
    ],
    codeExamples: [
      {
        language: "bash",
        label: "cURL",
        code: `curl -X POST https://extractvibe.com/api/keys \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ev_your_existing_key" \\
  -d '{"name": "Production server"}'`,
      },
      {
        language: "javascript",
        label: "JavaScript",
        code: `const res = await fetch("https://extractvibe.com/api/keys", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.EXTRACTVIBE_API_KEY,
  },
  body: JSON.stringify({ name: "Production server" }),
});

const { id, name, key } = await res.json();
console.log(\`Created key "\${name}": \${key}\`);
// Store this key securely — it won't be shown again`,
      },
      {
        language: "python",
        label: "Python",
        code: `import requests
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
# Store this key securely — it won't be shown again`,
      },
    ],
  },

  // 10. List API keys
  {
    method: "GET",
    path: "/api/keys",
    slug: "keys-list",
    title: "List API keys",
    description:
      "Returns all active API keys for the authenticated user. Keys are listed by creation date descending. The full key value is not returned -- only the ID, name, and timestamps.",
    auth: "required",
    rateLimit: "Read tier",
    responses: [
      {
        status: 200,
        description: "List of API keys",
        body: JSON.stringify(
          {
            keys: [
              {
                id: "c3d4e5f6-a7b8-9012-cdef-234567890123",
                name: "Production server",
                createdAt: "2026-03-15T10:00:00Z",
                lastUsedAt: "2026-03-18T14:30:00Z",
              },
              {
                id: "d4e5f6a7-b8c9-0123-defa-345678901234",
                name: "Development",
                createdAt: "2026-03-10T08:00:00Z",
                lastUsedAt: null,
              },
            ],
          },
          null,
          2
        ),
      },
      {
        status: 401,
        description: "Not authenticated",
        body: JSON.stringify({ error: "Unauthorized" }, null, 2),
      },
    ],
    codeExamples: [
      {
        language: "bash",
        label: "cURL",
        code: `curl https://extractvibe.com/api/keys \\
  -H "x-api-key: ev_your_api_key_here"`,
      },
      {
        language: "javascript",
        label: "JavaScript",
        code: `const res = await fetch("https://extractvibe.com/api/keys", {
  headers: { "x-api-key": process.env.EXTRACTVIBE_API_KEY },
});

const { keys } = await res.json();
keys.forEach((k) => {
  console.log(\`\${k.name} — created \${k.createdAt}\`);
});`,
      },
      {
        language: "python",
        label: "Python",
        code: `import requests
import os

res = requests.get(
    "https://extractvibe.com/api/keys",
    headers={"x-api-key": os.environ["EXTRACTVIBE_API_KEY"]},
)

for key in res.json()["keys"]:
    print(f"{key['name']} — created {key['createdAt']}")`,
      },
    ],
  },

  // 11. Revoke API key
  {
    method: "DELETE",
    path: "/api/keys/:id",
    slug: "keys-revoke",
    title: "Revoke API key",
    description:
      "Permanently deletes an API key. The key will immediately stop working for any requests. This action cannot be undone.",
    auth: "required",
    rateLimit: "Write tier",
    pathParams: [{ name: "id", description: "The UUID of the API key to revoke" }],
    responses: [
      {
        status: 200,
        description: "Key revoked",
        body: JSON.stringify({ ok: true }, null, 2),
      },
      {
        status: 404,
        description: "Key not found",
        body: JSON.stringify({ error: "Key not found" }, null, 2),
      },
      {
        status: 401,
        description: "Not authenticated",
        body: JSON.stringify({ error: "Unauthorized" }, null, 2),
      },
    ],
    codeExamples: [
      {
        language: "bash",
        label: "cURL",
        code: `curl -X DELETE https://extractvibe.com/api/keys/c3d4e5f6-a7b8-9012-cdef-234567890123 \\
  -H "x-api-key: ev_your_api_key_here"`,
      },
      {
        language: "javascript",
        label: "JavaScript",
        code: `const keyId = "c3d4e5f6-a7b8-9012-cdef-234567890123";

const res = await fetch(\`https://extractvibe.com/api/keys/\${keyId}\`, {
  method: "DELETE",
  headers: { "x-api-key": process.env.EXTRACTVIBE_API_KEY },
});

const data = await res.json();
console.log(data.ok); // true`,
      },
      {
        language: "python",
        label: "Python",
        code: `import requests
import os

key_id = "c3d4e5f6-a7b8-9012-cdef-234567890123"

res = requests.delete(
    f"https://extractvibe.com/api/keys/{key_id}",
    headers={"x-api-key": os.environ["EXTRACTVIBE_API_KEY"]},
)

print(res.json()["ok"])  # True`,
      },
    ],
  },

  // 12. OpenAPI spec
  {
    method: "GET",
    path: "/api/openapi.json",
    slug: "openapi",
    title: "OpenAPI specification",
    description:
      "Returns the OpenAPI 3.1 specification for the ExtractVibe API. Use this to generate client libraries, import into Postman, or integrate with any OpenAPI-compatible tooling.",
    auth: "none",
    rateLimit: "None",
    responses: [
      {
        status: 200,
        description: "OpenAPI 3.1 JSON spec",
        body: JSON.stringify(
          {
            openapi: "3.1.0",
            info: {
              title: "ExtractVibe API",
              version: "0.1.0",
              description: "Brand intelligence extraction API",
            },
            servers: [{ url: "https://extractvibe.com" }],
            paths: { "...": "Full endpoint definitions" },
          },
          null,
          2
        ),
      },
    ],
    codeExamples: [
      {
        language: "bash",
        label: "cURL",
        code: `# Download the OpenAPI spec
curl -o openapi.json https://extractvibe.com/api/openapi.json

# Import into Postman or generate a client
npx openapi-typescript openapi.json -o types.ts`,
      },
      {
        language: "javascript",
        label: "JavaScript",
        code: `const res = await fetch("https://extractvibe.com/api/openapi.json");
const spec = await res.json();

console.log(spec.info.title);   // "ExtractVibe API"
console.log(spec.info.version); // "0.1.0"`,
      },
      {
        language: "python",
        label: "Python",
        code: `import requests

res = requests.get("https://extractvibe.com/api/openapi.json")
spec = res.json()

print(spec["info"]["title"])   # "ExtractVibe API"
print(spec["info"]["version"]) # "0.1.0"`,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Sidebar nav structure
// ---------------------------------------------------------------------------
export const sidebarSections = [
  {
    title: "Getting Started",
    items: [
      { label: "Introduction", href: "#introduction" },
      { label: "Authentication", href: "#authentication" },
      { label: "Rate Limits", href: "#rate-limits" },
      { label: "Error Codes", href: "#error-codes" },
    ],
  },
  {
    title: "Extraction",
    items: [
      { label: "Start extraction", href: "#extract-start" },
      { label: "Poll job status", href: "#extract-status" },
      { label: "Get result", href: "#extract-result" },
      { label: "Get brand by domain", href: "#brand-domain" },
      { label: "Extraction history", href: "#extract-history" },
      { label: "Export brand kit", href: "#extract-export" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Health check", href: "#health" },
      { label: "Credit balance", href: "#credits" },
      { label: "Create API key", href: "#keys-create" },
      { label: "List API keys", href: "#keys-list" },
      { label: "Revoke API key", href: "#keys-revoke" },
      { label: "OpenAPI spec", href: "#openapi" },
    ],
  },
];
