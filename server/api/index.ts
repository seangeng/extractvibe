import { Hono } from "hono";
import type { Env } from "../env";
import { resolveAuth } from "../lib/auth-middleware";

export const apiRouter = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
apiRouter.get("/health", (c) => {
  return c.json({ ok: true, version: "0.1.0" });
});

// ---------------------------------------------------------------------------
// Extract — start a new extraction job
// ---------------------------------------------------------------------------
apiRouter.post("/extract", async (c) => {
  const auth = await resolveAuth(c);
  if (!auth.authenticated || !auth.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<{ url?: string }>();
  if (!body.url) {
    return c.json({ error: "Missing required field: url" }, 400);
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(body.url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return c.json({ error: "Invalid URL" }, 400);
  }

  // Check credits
  const credits = await getUserCredits(c.env, auth.userId);
  if (credits <= 0) {
    return c.json({ error: "No credits remaining" }, 402);
  }

  // Deduct a credit
  await deductCredit(c.env, auth.userId);

  // Create extraction record in D1
  const jobId = crypto.randomUUID();
  const domain = parsedUrl.hostname.replace(/^www\./, "");

  await c.env.DB.prepare(
    `INSERT INTO extraction (id, "userId", domain, url, status, "schemaVersion", "createdAt")
     VALUES (?, ?, ?, ?, 'queued', 'v1', datetime('now'))`
  )
    .bind(jobId, auth.userId, domain, parsedUrl.toString())
    .run();

  // Start the workflow
  const instance = await c.env.EXTRACT_BRAND.create({
    id: jobId,
    params: {
      url: parsedUrl.toString(),
      jobId,
      userId: auth.userId,
    },
  });

  return c.json({ jobId: instance.id, domain }, 202);
});

// ---------------------------------------------------------------------------
// Extract — history for current user (MUST be before :jobId route)
// ---------------------------------------------------------------------------
apiRouter.get("/extract/history", async (c) => {
  const auth = await resolveAuth(c);
  if (!auth.authenticated || !auth.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

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
// Extract — poll job status
// ---------------------------------------------------------------------------
apiRouter.get("/extract/:jobId", async (c) => {
  const auth = await resolveAuth(c);
  if (!auth.authenticated) {
    return c.json({ error: "Unauthorized" }, 401);
  }

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
// Extract — get cached result
// ---------------------------------------------------------------------------
apiRouter.get("/extract/:jobId/result", async (c) => {
  const auth = await resolveAuth(c);
  if (!auth.authenticated) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const jobId = c.req.param("jobId");
  const cached = await c.env.CACHE.get(`result:${jobId}`, "json");

  if (!cached) {
    return c.json({ error: "Result not found or still processing" }, 404);
  }

  return c.json(cached);
});

// ---------------------------------------------------------------------------
// Extract — get result by domain (cached, no credit cost)
// ---------------------------------------------------------------------------
apiRouter.get("/brand/:domain", async (c) => {
  const domain = c.req.param("domain");
  const cached = await c.env.CACHE.get(`brand:${domain}`, "json");

  if (!cached) {
    return c.json({ error: "Brand not found. Extract it first." }, 404);
  }

  return c.json(cached);
});

// ---------------------------------------------------------------------------
// Export — download brand kit in various formats
// ---------------------------------------------------------------------------
apiRouter.get("/extract/:jobId/export/:format", async (c) => {
  const auth = await resolveAuth(c);
  if (!auth.authenticated) return c.json({ error: "Unauthorized" }, 401);

  const jobId = c.req.param("jobId");
  const format = c.req.param("format");
  const cached = await c.env.CACHE.get(`result:${jobId}`, "json");
  if (!cached) return c.json({ error: "Result not found" }, 404);

  // Dynamic import to keep the main bundle small
  const { exportCssVariables, exportTailwindConfig, exportMarkdownReport, exportDesignTokens } =
    await import("../lib/export-formats");

  const kit = cached as any; // ExtractVibeBrandKit
  const domain = kit.meta?.domain || "brand";

  switch (format) {
    case "json": {
      return new Response(JSON.stringify(kit, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${domain}-brand-kit.json"`,
        },
      });
    }
    case "css": {
      const css = exportCssVariables(kit);
      return new Response(css, {
        headers: {
          "Content-Type": "text/css",
          "Content-Disposition": `attachment; filename="${domain}-variables.css"`,
        },
      });
    }
    case "tailwind": {
      const tw = exportTailwindConfig(kit);
      return new Response(tw, {
        headers: {
          "Content-Type": "text/css",
          "Content-Disposition": `attachment; filename="${domain}-tailwind-theme.css"`,
        },
      });
    }
    case "markdown": {
      const md = exportMarkdownReport(kit);
      return new Response(md, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="${domain}-brand-report.md"`,
        },
      });
    }
    case "tokens": {
      const tokens = exportDesignTokens(kit);
      return new Response(tokens, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${domain}-design-tokens.json"`,
        },
      });
    }
    default:
      return c.json({ error: "Invalid format. Use: json, css, tailwind, markdown, tokens" }, 400);
  }
});

// ---------------------------------------------------------------------------
// Credits
// ---------------------------------------------------------------------------
apiRouter.get("/credits", async (c) => {
  const auth = await resolveAuth(c);
  if (!auth.authenticated || !auth.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const credits = await getUserCredits(c.env, auth.userId);
  return c.json({ credits });
});

// ---------------------------------------------------------------------------
// API Keys — CRUD
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
    // First-time user: create a credit row with 50 free credits
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
