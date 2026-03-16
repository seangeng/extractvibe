import { Hono } from "hono";
import { cors } from "hono/cors";
import { createRequestHandler } from "react-router";
import type { Env } from "../server/env";
import { createAuth } from "../server/lib/auth";
import { apiRouter } from "../server/api";

export { ExtractBrandWorkflow } from "../server/workflows/extract-brand";
export { JobProgressDO } from "../server/durable-objects/job-progress";

const app = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173", "https://extractvibe.com"],
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// ---------------------------------------------------------------------------
// www redirect — redirect www.extractvibe.com to extractvibe.com
// ---------------------------------------------------------------------------
app.use("*", async (c, next) => {
  const url = new URL(c.req.url);
  if (url.hostname.startsWith("www.")) {
    url.hostname = url.hostname.replace("www.", "");
    return c.redirect(url.toString(), 301);
  }
  return next();
});

// ---------------------------------------------------------------------------
// Auth routes — Better Auth handles its own routing under /api/auth
// ---------------------------------------------------------------------------
app.all("/api/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// ---------------------------------------------------------------------------
// WebSocket — real-time extraction progress via Durable Object
// ---------------------------------------------------------------------------
app.get("/api/ws/:jobId", async (c) => {
  const upgradeHeader = c.req.header("Upgrade");
  if (upgradeHeader !== "websocket") {
    return c.json({ error: "Expected WebSocket upgrade" }, 426);
  }
  const jobId = c.req.param("jobId");
  const doId = c.env.JOB_PROGRESS.idFromName(jobId);
  const stub = c.env.JOB_PROGRESS.get(doId);
  // Forward the request to the DO — it handles the WebSocket upgrade
  return stub.fetch(new Request("https://do/ws", {
    headers: c.req.raw.headers,
  }));
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.route("/api", apiRouter);

// ---------------------------------------------------------------------------
// Health check (top-level, outside the sub-router for simple probes)
// ---------------------------------------------------------------------------
app.get("/api/health", (c) => {
  return c.json({ ok: true, version: "0.1.0", timestamp: Date.now() });
});

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------
app.get("/robots.txt", (c) => {
  const body = [
    "User-agent: *",
    "Disallow: /api/",
    "Disallow: /dashboard/",
    "",
    "Sitemap: https://extractvibe.com/sitemap.xml",
  ].join("\n");
  return c.text(body, 200, { "Content-Type": "text/plain" });
});

// ---------------------------------------------------------------------------
// sitemap.xml
// ---------------------------------------------------------------------------
app.get("/sitemap.xml", (c) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://extractvibe.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://extractvibe.com/pricing</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
  return c.body(xml, 200, { "Content-Type": "application/xml" });
});

// ---------------------------------------------------------------------------
// React Router SSR catch-all
// ---------------------------------------------------------------------------
app.all("*", async (c) => {
  const handler = createRequestHandler(
    // @ts-expect-error - virtual module resolved by Vite at build time
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE
  );
  return handler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

// ---------------------------------------------------------------------------
// Scheduled handler — monthly credit reset
// ---------------------------------------------------------------------------
async function handleScheduled(env: Env): Promise<void> {
  await env.DB.prepare(
    `UPDATE credit SET balance = "monthlyAllowance", "resetAt" = datetime('now', '+1 month')
     WHERE "resetAt" <= datetime('now')`
  ).run();
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
export default {
  fetch: app.fetch,
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext
  ) {
    await handleScheduled(env);
  },
};
