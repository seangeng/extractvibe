import { Hono } from "hono";
import type { Context } from "hono";
import type { Env } from "../env";
import type { ExtractVibeBrandKit } from "../schema/v1";
import { resolveAuth, isAdminUser, type AuthResult } from "../lib/auth-middleware";
import {
  checkRateLimit,
  setRateLimitHeaders,
  rateLimitResponse,
  getClientId,
  getTier,
} from "../lib/rate-limit";
import { sha256Hex, randomHex } from "../lib/crypto";
import { AgentBootstrapRequest } from "../schema/api";

export const apiRouter = new Hono<{ Bindings: Env }>();

/**
 * Block private, reserved, and loopback hostnames to prevent SSRF.
 */
function isPrivateHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, ""); // strip IPv6 brackets
  // Loopback & special names
  if (h === "localhost" || h.endsWith(".local") || h === "0.0.0.0" || h === "::1") return true;
  // IPv4 private/reserved ranges
  if (/^127\./.test(h)) return true;           // 127.0.0.0/8
  if (/^10\./.test(h)) return true;            // 10.0.0.0/8
  if (/^192\.168\./.test(h)) return true;      // 192.168.0.0/16
  if (/^169\.254\./.test(h)) return true;      // link-local
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h)) return true; // CGN 100.64.0.0/10
  // 172.16.0.0/12
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  // IPv6 private/reserved
  if (/^f[cd]/.test(h)) return true;           // fc00::/7 unique local
  if (/^fe80/.test(h)) return true;            // link-local
  if (/^ff/.test(h)) return true;              // multicast
  return false;
}

// ---------------------------------------------------------------------------
// Request logging middleware — logs every API request to the request_log table.
// Runs AFTER the handler completes so we can capture the status code and latency.
// The userId is set by route handlers via c.set("authUserId", ...) if available.
// ---------------------------------------------------------------------------
apiRouter.use("*", async (c, next) => {
  const start = Date.now();
  await next();

  // Fire-and-forget — don't block the response
  const latencyMs = Date.now() - start;
  const userId = (c.get("authUserId" as never) as string | undefined) || null;

  c.executionCtx.waitUntil(
    c.env.DB.prepare(
      `INSERT INTO request_log (id, "userId", endpoint, domain, "statusCode", "latencyMs", "createdAt")
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(
        crypto.randomUUID(),
        userId,
        `${c.req.method} ${c.req.path}`,
        null,
        c.res.status,
        latencyMs
      )
      .run()
      .catch(() => {}) // Non-fatal
  )
});

// OpenAPI spec (static, hand-maintained)
apiRouter.get("/openapi.json", async (c) => {
  const cached = await c.env.CACHE.get("openapi:spec", "json");
  if (cached) return c.json(cached);

  // Inline minimal spec — the full spec is at /docs
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "ExtractVibe API",
      version: "0.1.0",
      description: "Open-source brand intelligence API. Extract colors, typography, voice, personality, and design system from any website.",
      contact: { url: "https://extractvibe.com" },
    },
    servers: [{ url: "https://extractvibe.com", description: "Production" }],
    paths: {
      "/api/health": { get: { summary: "Health check", responses: { "200": { description: "OK" } } } },
      "/api/extract": { post: { summary: "Start brand extraction", description: "Anonymous: 3/day. Authenticated: uses 1 credit.", requestBody: { content: { "application/json": { schema: { type: "object", properties: { url: { type: "string" } }, required: ["url"] } } } }, responses: { "202": { description: "Extraction started" }, "429": { description: "Rate limited" } } } },
      "/api/extract/{jobId}": { get: { summary: "Poll job status", parameters: [{ name: "jobId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Job status" } } } },
      "/api/extract/{jobId}/result": { get: { summary: "Get extraction result", responses: { "200": { description: "Full brand kit" } } } },
      "/api/extract/{jobId}/export/{format}": { get: { summary: "Export brand kit", parameters: [{ name: "format", in: "path", required: true, schema: { type: "string", enum: ["json", "css", "tailwind", "markdown", "tokens"] } }], responses: { "200": { description: "Exported file" } } } },
      "/api/brand/{domain}": { get: { summary: "Get cached brand kit by domain", responses: { "200": { description: "Brand kit" }, "404": { description: "Not found" } } } },
      "/api/extract/history": { get: { summary: "List extraction history", security: [{ cookieAuth: [] }, { apiKeyAuth: [] }], responses: { "200": { description: "Extraction list" } } } },
      "/api/credits": { get: { summary: "Get credit balance", security: [{ cookieAuth: [] }, { apiKeyAuth: [] }], responses: { "200": { description: "Credits" } } } },
      "/api/keys": { get: { summary: "List API keys", security: [{ cookieAuth: [] }], responses: { "200": { description: "Key list" } } }, post: { summary: "Create API key", security: [{ cookieAuth: [] }], responses: { "201": { description: "Key created" } } } },
      "/api/keys/{id}": { delete: { summary: "Revoke API key", security: [{ cookieAuth: [] }], responses: { "200": { description: "Key revoked" } } } },
      "/api/agent/bootstrap": { post: { summary: "Self-provision an API key for AI agents", description: "No auth required. Rate limited to 3 per IP per 24h. Creates a pseudo-user with 5 credits and returns an API key with a 30-day claim URL.", requestBody: { content: { "application/json": { schema: { type: "object", properties: { agent_name: { type: "string", minLength: 1, maxLength: 64, pattern: "^[a-zA-Z0-9-]+$" }, contact_email: { type: "string", format: "email" } }, required: ["agent_name"] } } } }, responses: { "201": { description: "Agent bootstrapped successfully" }, "400": { description: "Invalid request" }, "429": { description: "Rate limited" } } } },
    },
    components: {
      securitySchemes: {
        cookieAuth: { type: "apiKey", in: "cookie", name: "__Secure-better-auth.session_token" },
        apiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" },
      },
    },
  };

  await c.env.CACHE.put("openapi:spec", JSON.stringify(spec), { expirationTtl: 86400 });
  return c.json(spec);
});

// ---------------------------------------------------------------------------
// API Index
// ---------------------------------------------------------------------------
apiRouter.get("/", (c) => {
  return c.json({
    name: "ExtractVibe API",
    version: "0.1.0",
    docs: "https://extractvibe.com",
    endpoints: {
      health: "GET /api/health",
      extract: "POST /api/extract",
      status: "GET /api/extract/:jobId",
      result: "GET /api/extract/:jobId/result",
      export: "GET /api/extract/:jobId/export/:format",
      brand: "GET /api/brand/:domain",
      history: "GET /api/extract/history",
      credits: "GET /api/credits",
      keys: "GET /api/keys",
      agentBootstrap: "POST /api/agent/bootstrap",
    },
  });
});

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
apiRouter.get("/health", (c) => {
  return c.json({ ok: true, version: "0.1.0" });
});

// ---------------------------------------------------------------------------
// Agent Bootstrap — self-provision an API key for AI agents (no auth required)
// Rate limited to 3 per IP per 24 hours via KV.
// ---------------------------------------------------------------------------
apiRouter.post("/agent/bootstrap", async (c) => {
  // 1. Parse & validate request body
  const raw = await c.req.json().catch(() => ({}));
  const parsed = AgentBootstrapRequest.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return c.json({ error: firstError?.message || "Invalid request body" }, 400);
  }
  const { agent_name, contact_email } = parsed.data;

  // 2. Rate limit: max 3 per IP per 24h using KV
  const ip = c.req.header("cf-connecting-ip") || "unknown";
  const rlKey = `agent-bootstrap:${ip}`;
  const rlRaw = await c.env.CACHE.get(rlKey);
  const rlCount = rlRaw ? parseInt(rlRaw, 10) : 0;

  if (rlCount >= 3) {
    return c.json(
      { error: "Rate limit exceeded. Maximum 3 agent bootstraps per IP per 24 hours." },
      429
    );
  }

  // Increment rate limit counter (24h TTL)
  await c.env.CACHE.put(rlKey, String(rlCount + 1), { expirationTtl: 86400 });

  // 3. Create a pseudo-user in the user table
  const userId = crypto.randomUUID();
  const shortId = randomHex(4); // 8 hex chars for uniqueness
  const syntheticEmail = `${agent_name}-${shortId}@agent.extractvibe.com`;

  await c.env.DB.prepare(
    `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 0, datetime('now'), datetime('now'))`
  )
    .bind(userId, agent_name, syntheticEmail)
    .run();

  // 4. Initialize credits for agent free tier
  const agentCredits = 25;
  await c.env.DB.prepare(
    `INSERT INTO credit ("userId", balance, plan, "monthlyAllowance", "resetAt")
     VALUES (?, ?, 'free', ?, datetime('now', '+1 month'))`
  )
    .bind(userId, agentCredits, agentCredits)
    .run();

  // 5. Generate API key (same logic as POST /api/keys)
  const rawKey = `ev_${randomHex()}`;
  const keyHash = await sha256Hex(rawKey);
  const keyId = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO api_key (id, "userId", name, "keyHash", prefix, "createdAt")
     VALUES (?, ?, ?, ?, 'ev', datetime('now'))`
  )
    .bind(keyId, userId, `${agent_name} (agent bootstrap)`, keyHash)
    .run();

  // 6. Generate claim token and store in KV (30-day TTL)
  const claimToken = randomHex(16); // 32 hex chars
  const claimTtl = 30 * 24 * 60 * 60; // 30 days in seconds
  const claimPayload = JSON.stringify({
    userId,
    agentName: agent_name,
    contactEmail: contact_email || null,
    createdAt: new Date().toISOString(),
  });
  await c.env.CACHE.put(`claim:${claimToken}`, claimPayload, { expirationTtl: claimTtl });

  // 7. Build expiration date (30 days from now)
  const expiresAt = new Date(Date.now() + claimTtl * 1000).toISOString();

  return c.json(
    {
      api_key: rawKey,
      credits: agentCredits,
      claim_url: `https://extractvibe.com/claim/${claimToken}`,
      claim_instructions:
        "Give this URL to a human to link this API key to their account. The key works immediately but expires in 30 days unless claimed.",
      docs_url: "https://extractvibe.com/docs",
      expires_at: expiresAt,
    },
    201
  );
});

// ---------------------------------------------------------------------------
// Extract — start a new extraction job
// Supports both authenticated users (credit-based) and anonymous (3/day by IP)
// ---------------------------------------------------------------------------
apiRouter.post("/extract", async (c) => {
  const auth = await resolveAuth(c);
  const clientId = getClientId(c, auth.userId);
  const tier = getTier(auth.plan || null, auth.authenticated);

  // Admin bypass
  if (auth.authenticated && auth.userId && isAdminUser(c.env, auth.userId)) {
    // Skip rate limit and credit checks
  } else {
    // Rate limit check
    const rl = await checkRateLimit(c.env, clientId, `${tier}:extract`);
    if (!rl.allowed) return rateLimitResponse(c, rl);
    setRateLimitHeaders(c, rl);

    // Credit check for authenticated users
    if (auth.authenticated && auth.userId) {
      const credits = await getUserCredits(c.env, auth.userId);
      if (credits <= 0) {
        return c.json({ error: "No credits remaining. Upgrade your plan or wait for monthly reset." }, 402);
      }
      const deducted = await deductCredit(c.env, auth.userId);
      if (!deducted) {
        return c.json({ error: "No credits remaining. Upgrade your plan or wait for monthly reset." }, 402);
      }
    }
  }

  // Validate input
  const body = await c.req.json<{ url?: string }>();
  if (!body.url) {
    return c.json({ error: "Missing required field: url" }, 400);
  }

  let parsedUrl: URL;
  try {
    let inputUrl = body.url.trim();
    if (inputUrl.length > 2048) {
      return c.json({ error: "URL too long (max 2048 characters)" }, 400);
    }
    if (!inputUrl.startsWith("http")) inputUrl = `https://${inputUrl}`;
    parsedUrl = new URL(inputUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
    // Block private/reserved hostnames to prevent SSRF
    if (isPrivateHostname(parsedUrl.hostname)) {
      return c.json({ error: "Private/internal URLs are not allowed" }, 400);
    }
  } catch {
    return c.json({ error: "Invalid URL" }, 400);
  }

  const domain = parsedUrl.hostname.replace(/^www\./, "");
  const userId = auth.userId || `anon:${clientId}`;

  // Deduplication: reject if the same user already has a queued/running extraction for this domain
  const existing = await c.env.DB.prepare(
    `SELECT id FROM extraction WHERE "userId" = ? AND domain = ? AND status IN ('queued', 'running') LIMIT 1`
  ).bind(userId, domain).first<{ id: string }>();

  if (existing) {
    return c.json({ error: "Extraction already in progress for this domain", jobId: existing.id }, 409);
  }

  const jobId = crypto.randomUUID();

  // Write extraction record
  await c.env.DB.prepare(
    `INSERT INTO extraction (id, "userId", domain, url, status, "schemaVersion", "createdAt")
     VALUES (?, ?, ?, ?, 'queued', 'v1', datetime('now'))`
  )
    .bind(jobId, userId, domain, parsedUrl.toString())
    .run();

  // Start workflow
  const instance = await c.env.EXTRACT_BRAND.create({
    id: jobId,
    params: {
      url: parsedUrl.toString(),
      jobId,
      userId,
    },
  });

  return c.json({ jobId: instance.id, domain }, 202);
});

// ---------------------------------------------------------------------------
// Extract — history (authenticated only)
// ---------------------------------------------------------------------------
apiRouter.get("/extract/history", async (c) => {
  const auth = await withAuthAndRateLimit(c, "read");

  const result = await c.env.DB.prepare(
    `SELECT id, domain, url, status, "durationMs", "createdAt", "completedAt"
     FROM extraction
     WHERE "userId" = ?
     ORDER BY "createdAt" DESC
     LIMIT 50`
  )
    .bind(auth.userId)
    .all();

  return c.json({ extractions: result.results || [] });
});

// ---------------------------------------------------------------------------
// Extract — poll job status (open — anyone with the jobId can poll)
// ---------------------------------------------------------------------------
apiRouter.get("/extract/:jobId", async (c) => {
  await withRateLimit(c, "read");
  const jobId = c.req.param("jobId");

  try {
    const instance = await c.env.EXTRACT_BRAND.get(jobId);
    const status = await instance.status();
    return c.json({ jobId, status });
  } catch {
    return c.json({ error: "Job not found" }, 404);
  }
});

// ---------------------------------------------------------------------------
// Extract — get cached result (open — anyone with the jobId can read)
// ---------------------------------------------------------------------------
apiRouter.get("/extract/:jobId/result", async (c) => {
  await withRateLimit(c, "read");
  const jobId = c.req.param("jobId");
  const cached = await c.env.CACHE.get(`result:${jobId}`, "json");

  if (!cached) {
    return c.json({ error: "Result not found or still processing" }, 404);
  }

  return c.json(cached);
});

// ---------------------------------------------------------------------------
// Brand — get result by domain (public, rate-limited)
// ---------------------------------------------------------------------------
apiRouter.get("/brand/:domain", async (c) => {
  await withRateLimit(c, "read");
  const domain = c.req.param("domain");
  const cached = await c.env.CACHE.get(`brand:${domain}`, "json");

  if (!cached) {
    return c.json({ error: "Brand not found. Extract it first." }, 404);
  }

  return c.json(cached);
});

// ---------------------------------------------------------------------------
// Export — download brand kit in various formats (authenticated only)
// ---------------------------------------------------------------------------
apiRouter.get("/extract/:jobId/export/:format", async (c) => {
  const auth = await withAuthAndRateLimit(c, "read");

  const jobId = c.req.param("jobId");
  const format = c.req.param("format");

  // Verify the authenticated user owns this extraction
  const extraction = await c.env.DB.prepare(
    `SELECT "userId" FROM extraction WHERE id = ?`
  ).bind(jobId).first<{ userId: string }>();

  if (!extraction || extraction.userId !== auth.userId) {
    return c.json({ error: "Result not found" }, 404);
  }

  const cached = await c.env.CACHE.get(`result:${jobId}`, "json");
  if (!cached) return c.json({ error: "Result not found" }, 404);

  const kit = cached as ExtractVibeBrandKit;
  const domain = kit.meta?.domain || "brand";

  if (format === "json") {
    return new Response(JSON.stringify(kit, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${domain}-brand-kit.json"`,
      },
    });
  }

  const { exportCssVariables, exportTailwindConfig, exportMarkdownReport, exportDesignTokens } =
    await import("../lib/export-formats");

  const exporters: Record<string, { fn: (k: ExtractVibeBrandKit) => string; contentType: string; ext: string }> = {
    css:      { fn: exportCssVariables,    contentType: "text/css",           ext: "variables.css" },
    tailwind: { fn: exportTailwindConfig,  contentType: "text/css",           ext: "tailwind-theme.css" },
    markdown: { fn: exportMarkdownReport,  contentType: "text/markdown",      ext: "brand-report.md" },
    tokens:   { fn: exportDesignTokens,    contentType: "application/json",   ext: "design-tokens.json" },
  };

  const exporter = exporters[format];
  if (!exporter) {
    return c.json({ error: "Invalid format. Use: json, css, tailwind, markdown, tokens" }, 400);
  }

  return new Response(exporter.fn(kit), {
    headers: {
      "Content-Type": exporter.contentType,
      "Content-Disposition": `attachment; filename="${domain}-${exporter.ext}"`,
    },
  });
});

// ---------------------------------------------------------------------------
// Credits (authenticated only)
// ---------------------------------------------------------------------------
apiRouter.get("/credits", async (c) => {
  const auth = await withAuthAndRateLimit(c, "read");
  const credits = await getUserCredits(c.env, auth.userId);
  const plan = auth.plan || "free";
  return c.json({ credits, plan });
});

// ---------------------------------------------------------------------------
// API Keys — CRUD (authenticated only)
// ---------------------------------------------------------------------------
apiRouter.post("/keys", async (c) => {
  const auth = await withAuthAndRateLimit(c, "read");
  const body = await c.req.json<{ name?: string }>();
  const name = (body.name || "Default").slice(0, 100);
  const rawKey = `ev_${randomHex()}`;
  const keyHash = await sha256Hex(rawKey);
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO api_key (id, "userId", name, "keyHash", prefix, "createdAt")
     VALUES (?, ?, ?, ?, 'ev', datetime('now'))`
  ).bind(id, auth.userId, name, keyHash).run();

  return c.json({ id, name, key: rawKey }, 201);
});

apiRouter.get("/keys", async (c) => {
  const auth = await withAuthAndRateLimit(c, "read");
  const result = await c.env.DB.prepare(
    `SELECT id, name, "createdAt", "lastUsedAt" FROM api_key WHERE "userId" = ? ORDER BY "createdAt" DESC`
  ).bind(auth.userId).all();

  return c.json({ keys: result.results || [] });
});

apiRouter.delete("/keys/:id", async (c) => {
  const auth = await withAuthAndRateLimit(c, "read");
  const keyId = c.req.param("id");
  const result = await c.env.DB.prepare(
    `DELETE FROM api_key WHERE id = ? AND "userId" = ?`
  ).bind(keyId, auth.userId).run();

  if (!result.meta.changes) {
    return c.json({ error: "Key not found" }, 404);
  }

  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Claim — link an agent-bootstrapped account to a real user
// ---------------------------------------------------------------------------
apiRouter.post("/claim/:token", async (c) => {
  // 1. Require authentication (session cookie — user must be signed in)
  const auth = await withAuthAndRateLimit(c, "read");
  const realUserId = auth.userId;

  // 2. Look up claim token in KV
  const token = c.req.param("token");
  const claimRaw = await c.env.CACHE.get(`claim:${token}`);

  if (!claimRaw) {
    return c.json({ error: "Claim token not found or expired" }, 404);
  }

  // 3. Parse the claim payload
  const claim = JSON.parse(claimRaw) as {
    userId: string;
    agentName: string;
    contactEmail: string | null;
    createdAt: string;
  };

  const agentUserId = claim.userId;

  // Prevent claiming your own account
  if (agentUserId === realUserId) {
    return c.json({ error: "Cannot claim your own account" }, 400);
  }

  // 4. Transfer API keys from agent to real user
  const keysResult = await c.env.DB.prepare(
    `UPDATE api_key SET "userId" = ? WHERE "userId" = ?`
  )
    .bind(realUserId, agentUserId)
    .run();
  const keysTransferred = keysResult.meta.changes ?? 0;

  // 5. Transfer credits from agent to real user
  const agentCredit = await c.env.DB.prepare(
    `SELECT balance FROM credit WHERE "userId" = ?`
  )
    .bind(agentUserId)
    .first<{ balance: number }>();

  const creditsTransferred = agentCredit?.balance ?? 0;

  if (creditsTransferred > 0) {
    // Ensure the real user has a credit row
    await getUserCredits(c.env, realUserId);
    // Add agent's credits to the real user
    await c.env.DB.prepare(
      `UPDATE credit SET balance = balance + ? WHERE "userId" = ?`
    )
      .bind(creditsTransferred, realUserId)
      .run();
  }

  // Delete the agent's credit row
  await c.env.DB.prepare(`DELETE FROM credit WHERE "userId" = ?`)
    .bind(agentUserId)
    .run();

  // 6. Transfer extraction history
  await c.env.DB.prepare(
    `UPDATE extraction SET "userId" = ? WHERE "userId" = ?`
  )
    .bind(realUserId, agentUserId)
    .run();

  // 7. Delete the agent pseudo-user
  await c.env.DB.prepare(`DELETE FROM "user" WHERE id = ?`)
    .bind(agentUserId)
    .run();

  // 8. Delete the claim token from KV
  await c.env.CACHE.delete(`claim:${token}`);

  // 9. Return success
  return c.json({ ok: true, keysTransferred, creditsTransferred });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve auth and apply rate limiting in one call.
 * Returns the auth result and sets rate limit headers.
 * Throws a Response if rate limited.
 */
async function withRateLimit(
  c: Context<{ Bindings: Env }>,
  action: "read" | "extract"
): Promise<AuthResult> {
  const auth = await resolveAuth(c);
  // Store userId for the request logging middleware
  if (auth.userId) c.set("authUserId" as never, auth.userId as never);
  const clientId = getClientId(c, auth.userId);
  const tier = getTier(auth.plan || null, auth.authenticated);
  const rl = await checkRateLimit(c.env, clientId, `${tier}:${action}`);
  if (!rl.allowed) throw rateLimitResponse(c, rl);
  setRateLimitHeaders(c, rl);
  return auth;
}

/**
 * Like `withRateLimit` but also requires authentication.
 * Returns the auth result or throws 401.
 */
async function withAuthAndRateLimit(
  c: Context<{ Bindings: Env }>,
  action: "read" | "extract"
): Promise<AuthResult & { authenticated: true; userId: string }> {
  const auth = await withRateLimit(c, action);
  if (!auth.authenticated || !auth.userId) {
    throw c.json({ error: "Unauthorized" }, 401);
  }
  return auth as AuthResult & { authenticated: true; userId: string };
}

async function getUserCredits(env: Env, userId: string): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT balance FROM credit WHERE "userId" = ?`
  ).bind(userId).first<{ balance: number }>();

  if (!row) {
    await env.DB.prepare(
      `INSERT INTO credit ("userId", balance, plan, "monthlyAllowance", "resetAt")
       VALUES (?, 500, 'free', 500, datetime('now', '+1 month'))`
    ).bind(userId).run();
    return 500;
  }

  return row.balance;
}

async function deductCredit(env: Env, userId: string): Promise<boolean> {
  const result = await env.DB.prepare(
    `UPDATE credit SET balance = balance - 1 WHERE "userId" = ? AND balance > 0`
  ).bind(userId).run();
  return (result.meta.changes ?? 0) > 0;
}

