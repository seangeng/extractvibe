import { Hono } from "hono";
import { cors } from "hono/cors";
import { createRequestHandler } from "react-router";
import type { Env } from "../server/env";
import { createAuth } from "../server/lib/auth";
import { apiRouter } from "../server/api";
import {
  getQuickstartMd,
  getAuthenticationMd,
  getExtractMd,
  getExportMd,
  getBrandMd,
  getCreditsMd,
  getKeysMd,
  getAgentBootstrapMd,
  getRateLimitsMd,
  getErrorsMd,
  getBrandKitSchemaMd,
  getFullDocsMd,
} from "../server/lib/docs-markdown";

export { ExtractBrandWorkflow } from "../server/workflows/extract-brand";
export { JobProgressDO } from "../server/durable-objects/job-progress";

const app = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
app.use("/api/*", async (c, next) => {
  // Build allowed origins from BETTER_AUTH_URL (supports dev/staging/prod)
  const origins = ["https://extractvibe.com"];
  if (c.env.BETTER_AUTH_URL) {
    origins.push(c.env.BETTER_AUTH_URL);
  }

  return cors({
    origin: origins,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })(c, next);
});

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
// robots.txt
// ---------------------------------------------------------------------------
app.get("/robots.txt", (c) => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /dashboard/",
    "Disallow: /api/auth/",
    "",
    "User-agent: GPTBot",
    "Allow: /",
    "User-agent: ChatGPT-User",
    "Allow: /",
    "User-agent: Claude-Web",
    "Allow: /",
    "User-agent: ClaudeBot",
    "Allow: /",
    "User-agent: Anthropic-AI",
    "Allow: /",
    "User-agent: PerplexityBot",
    "Allow: /",
    "User-agent: Google-Extended",
    "Allow: /",
    "User-agent: Applebot-Extended",
    "Allow: /",
    "User-agent: meta-externalagent",
    "Allow: /",
    "User-agent: Bytespider",
    "Allow: /",
    "User-agent: CCBot",
    "Allow: /",
    "User-agent: Amazonbot",
    "Allow: /",
    "",
    "Sitemap: https://extractvibe.com/sitemap.xml",
    "",
    "# AI/LLM content discovery",
    "# Site summary: https://extractvibe.com/llms.txt",
    "# Full documentation: https://extractvibe.com/llms-full.txt",
    "# OpenAPI spec: https://extractvibe.com/api/openapi.json",
  ].join("\n");
  return c.text(body, 200, { "Content-Type": "text/plain" });
});

// ---------------------------------------------------------------------------
// .well-known — OpenAPI discovery
// ---------------------------------------------------------------------------
app.get("/.well-known/openapi.json", (c) => {
  return c.redirect("/api/openapi.json", 301);
});

// ---------------------------------------------------------------------------
// sitemap.xml
// ---------------------------------------------------------------------------
app.get("/sitemap.xml", async (c) => {
  // Serve from KV cache (1 hour TTL) to avoid DB queries on every request
  const cached = await c.env.CACHE.get("sitemap:xml", "text");
  if (cached) {
    return c.body(cached, 200, { "Content-Type": "application/xml" });
  }

  const baseUrl = "https://extractvibe.com";

  // Static pages
  const staticPages = [
    { loc: "/", changefreq: "weekly", priority: "1.0" },
    { loc: "/sign-in", changefreq: "monthly", priority: "0.3" },
    { loc: "/sign-up", changefreq: "monthly", priority: "0.5" },
    { loc: "/docs", changefreq: "weekly", priority: "0.8" },
    { loc: "/pricing", changefreq: "monthly", priority: "0.9" },
    { loc: "/about", changefreq: "monthly", priority: "0.6" },
    { loc: "/changelog", changefreq: "weekly", priority: "0.5" },
    { loc: "/cli", changefreq: "monthly", priority: "0.5" },
    { loc: "/open-source", changefreq: "monthly", priority: "0.7" },
    // Features
    { loc: "/features/colors", changefreq: "monthly", priority: "0.8" },
    { loc: "/features/typography", changefreq: "monthly", priority: "0.8" },
    { loc: "/features/voice", changefreq: "monthly", priority: "0.8" },
    { loc: "/features/buttons", changefreq: "monthly", priority: "0.7" },
    { loc: "/features/logos", changefreq: "monthly", priority: "0.7" },
    { loc: "/features/gradients", changefreq: "monthly", priority: "0.7" },
    { loc: "/features/design-system", changefreq: "monthly", priority: "0.8" },
    // Use Cases
    { loc: "/use-cases/design-agencies", changefreq: "monthly", priority: "0.7" },
    { loc: "/use-cases/developers", changefreq: "monthly", priority: "0.7" },
    { loc: "/use-cases/brand-monitoring", changefreq: "monthly", priority: "0.7" },
    { loc: "/use-cases/competitive-analysis", changefreq: "monthly", priority: "0.7" },
    { loc: "/use-cases/design-tokens", changefreq: "monthly", priority: "0.7" },
    // AI
    { loc: "/ai", changefreq: "monthly", priority: "0.8" },
    { loc: "/ai/brand-voice-analysis", changefreq: "monthly", priority: "0.7" },
    { loc: "/ai/vibe-synthesis", changefreq: "monthly", priority: "0.7" },
    // Documentation
    { loc: "/docs/quickstart.md", changefreq: "weekly", priority: "0.7" },
    { loc: "/docs/authentication.md", changefreq: "weekly", priority: "0.7" },
    { loc: "/docs/extract.md", changefreq: "weekly", priority: "0.7" },
    { loc: "/docs/export.md", changefreq: "weekly", priority: "0.7" },
    { loc: "/docs/brand.md", changefreq: "weekly", priority: "0.7" },
    { loc: "/docs/credits.md", changefreq: "weekly", priority: "0.7" },
    { loc: "/docs/keys.md", changefreq: "weekly", priority: "0.7" },
    { loc: "/docs/agent-bootstrap.md", changefreq: "weekly", priority: "0.7" },
    { loc: "/docs/rate-limits.md", changefreq: "weekly", priority: "0.7" },
    { loc: "/docs/errors.md", changefreq: "weekly", priority: "0.7" },
    { loc: "/docs/schema.md", changefreq: "weekly", priority: "0.7" },
  ];

  // Dynamic brand pages — get all unique domains with completed extractions
  let brandDomains: string[] = [];
  try {
    const result = await c.env.DB.prepare(
      `SELECT DISTINCT domain FROM extraction WHERE status = 'complete' ORDER BY domain ASC LIMIT 500`
    ).all();
    brandDomains = (result.results || []).map((r) => (r as { domain: string }).domain);
  } catch {
    // Non-fatal — serve static sitemap on error
  }

  const urls = [
    ...staticPages.map(p => `  <url>
    <loc>${baseUrl}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...brandDomains.map(domain => `  <url>
    <loc>${baseUrl}/brand/${domain}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  // Cache the generated sitemap for 1 hour
  await c.env.CACHE.put("sitemap:xml", xml, { expirationTtl: 3600 });

  return c.body(xml, 200, { "Content-Type": "application/xml" });
});

// ---------------------------------------------------------------------------
// Markdown API documentation — served as raw .md files
// ---------------------------------------------------------------------------
const docsRoutes: Record<string, () => string> = {
  "quickstart.md": getQuickstartMd,
  "authentication.md": getAuthenticationMd,
  "extract.md": getExtractMd,
  "export.md": getExportMd,
  "brand.md": getBrandMd,
  "credits.md": getCreditsMd,
  "keys.md": getKeysMd,
  "agent-bootstrap.md": getAgentBootstrapMd,
  "rate-limits.md": getRateLimitsMd,
  "errors.md": getErrorsMd,
  "schema.md": getBrandKitSchemaMd,
};

app.get("/docs/:file", (c) => {
  const file = c.req.param("file");
  const generator = docsRoutes[file];
  if (!generator) {
    return c.notFound();
  }
  return c.body(generator(), 200, {
    "Content-Type": "text/markdown; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  });
});

// llms-full.txt — complete API documentation in one file
app.get("/llms-full.txt", (c) => {
  return c.body(getFullDocsMd(), 200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  });
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
