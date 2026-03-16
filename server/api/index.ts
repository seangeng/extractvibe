import { Hono } from "hono";
import type { Env } from "../env";
import { resolveAuth, isAdminUser } from "../lib/auth-middleware";
import {
  checkRateLimit,
  setRateLimitHeaders,
  rateLimitResponse,
  getClientId,
  getTier,
} from "../lib/rate-limit";

export const apiRouter = new Hono<{ Bindings: Env }>();

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
      await deductCredit(c.env, auth.userId);
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
    if (!inputUrl.startsWith("http")) inputUrl = `https://${inputUrl}`;
    parsedUrl = new URL(inputUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return c.json({ error: "Invalid URL" }, 400);
  }

  const jobId = crypto.randomUUID();
  const domain = parsedUrl.hostname.replace(/^www\./, "");
  const userId = auth.userId || `anon:${clientId}`;

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
  const auth = await resolveAuth(c);
  if (!auth.authenticated || !auth.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const rl = await checkRateLimit(c.env, getClientId(c, auth.userId), `${getTier(auth.plan || null, true)}:read`);
  if (!rl.allowed) return rateLimitResponse(c, rl);
  setRateLimitHeaders(c, rl);

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
  const auth = await resolveAuth(c);
  const clientId = getClientId(c, auth.userId);
  const tier = getTier(auth.plan || null, auth.authenticated);

  const rl = await checkRateLimit(c.env, clientId, `${tier}:read`);
  if (!rl.allowed) return rateLimitResponse(c, rl);
  setRateLimitHeaders(c, rl);

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
  const auth = await resolveAuth(c);
  const clientId = getClientId(c, auth.userId);
  const tier = getTier(auth.plan || null, auth.authenticated);

  const rl = await checkRateLimit(c.env, clientId, `${tier}:read`);
  if (!rl.allowed) return rateLimitResponse(c, rl);
  setRateLimitHeaders(c, rl);

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
  const auth = await resolveAuth(c);
  const clientId = getClientId(c, auth.userId);
  const tier = getTier(auth.plan || null, auth.authenticated);

  const rl = await checkRateLimit(c.env, clientId, `${tier}:read`);
  if (!rl.allowed) return rateLimitResponse(c, rl);
  setRateLimitHeaders(c, rl);

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
  const auth = await resolveAuth(c);
  if (!auth.authenticated) return c.json({ error: "Unauthorized" }, 401);

  const rl = await checkRateLimit(c.env, getClientId(c, auth.userId), `${getTier(auth.plan || null, true)}:read`);
  if (!rl.allowed) return rateLimitResponse(c, rl);
  setRateLimitHeaders(c, rl);

  const jobId = c.req.param("jobId");
  const format = c.req.param("format");
  const cached = await c.env.CACHE.get(`result:${jobId}`, "json");
  if (!cached) return c.json({ error: "Result not found" }, 404);

  const { exportCssVariables, exportTailwindConfig, exportMarkdownReport, exportDesignTokens } =
    await import("../lib/export-formats");

  const kit = cached as any;
  const domain = kit.meta?.domain || "brand";

  switch (format) {
    case "json":
      return new Response(JSON.stringify(kit, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${domain}-brand-kit.json"`,
        },
      });
    case "css":
      return new Response(exportCssVariables(kit), {
        headers: {
          "Content-Type": "text/css",
          "Content-Disposition": `attachment; filename="${domain}-variables.css"`,
        },
      });
    case "tailwind":
      return new Response(exportTailwindConfig(kit), {
        headers: {
          "Content-Type": "text/css",
          "Content-Disposition": `attachment; filename="${domain}-tailwind-theme.css"`,
        },
      });
    case "markdown":
      return new Response(exportMarkdownReport(kit), {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="${domain}-brand-report.md"`,
        },
      });
    case "tokens":
      return new Response(exportDesignTokens(kit), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${domain}-design-tokens.json"`,
        },
      });
    default:
      return c.json({ error: "Invalid format. Use: json, css, tailwind, markdown, tokens" }, 400);
  }
});

// ---------------------------------------------------------------------------
// Credits (authenticated only)
// ---------------------------------------------------------------------------
apiRouter.get("/credits", async (c) => {
  const auth = await resolveAuth(c);
  if (!auth.authenticated || !auth.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const credits = await getUserCredits(c.env, auth.userId);
  const plan = auth.plan || "free";
  return c.json({ credits, plan });
});

// ---------------------------------------------------------------------------
// API Keys — CRUD (authenticated only)
// ---------------------------------------------------------------------------
apiRouter.post("/keys", async (c) => {
  const auth = await resolveAuth(c);
  if (!auth.authenticated || !auth.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<{ name?: string }>();
  const name = body.name || "Default";
  const rawKey = `ev_${generateApiKey()}`;
  const keyHash = await hashApiKey(rawKey);
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO api_key (id, "userId", name, "keyHash", prefix, "createdAt")
     VALUES (?, ?, ?, ?, 'ev', datetime('now'))`
  ).bind(id, auth.userId, name, keyHash).run();

  return c.json({ id, name, key: rawKey }, 201);
});

apiRouter.get("/keys", async (c) => {
  const auth = await resolveAuth(c);
  if (!auth.authenticated || !auth.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const result = await c.env.DB.prepare(
    `SELECT id, name, "createdAt", "lastUsedAt" FROM api_key WHERE "userId" = ? ORDER BY "createdAt" DESC`
  ).bind(auth.userId).all();

  return c.json({ keys: result.results || [] });
});

apiRouter.delete("/keys/:id", async (c) => {
  const auth = await resolveAuth(c);
  if (!auth.authenticated || !auth.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

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
// Helpers
// ---------------------------------------------------------------------------

async function getUserCredits(env: Env, userId: string): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT balance FROM credit WHERE "userId" = ?`
  ).bind(userId).first<{ balance: number }>();

  if (!row) {
    await env.DB.prepare(
      `INSERT INTO credit ("userId", balance, plan, "monthlyAllowance", "resetAt")
       VALUES (?, 50, 'free', 50, datetime('now', '+1 month'))`
    ).bind(userId).run();
    return 50;
  }

  return row.balance;
}

async function deductCredit(env: Env, userId: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE credit SET balance = balance - 1 WHERE "userId" = ? AND balance > 0`
  ).bind(userId).run();
}

function generateApiKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
