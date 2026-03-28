import type { Context } from "hono";
import type { Env } from "../env";

/**
 * Rate limit tiers — requests per window.
 * Window is always 60 seconds for per-second style limits,
 * or 86400 seconds (24h) for daily limits.
 */
interface RateLimitConfig {
  /** Max requests in the window */
  limit: number;
  /** Window duration in seconds */
  window: number;
  /** KV key prefix */
  prefix: string;
}

const TIERS: Record<string, RateLimitConfig> = {
  // Anonymous users — tight limits (sign up to get more)
  "anon:read": { limit: 30, window: 60, prefix: "rl:anon:read" },
  "anon:extract": { limit: 3, window: 86400, prefix: "rl:anon:extract" },

  // Authenticated free tier — generous, attribution is the abuse guard
  "free:read": { limit: 120, window: 60, prefix: "rl:free:read" },
  "free:extract": { limit: 20, window: 60, prefix: "rl:free:extract" },

  // Authenticated paid tiers
  "starter:read": { limit: 300, window: 60, prefix: "rl:starter:read" },
  "starter:extract": { limit: 60, window: 60, prefix: "rl:starter:extract" },
  "pro:read": { limit: 600, window: 60, prefix: "rl:pro:read" },
  "pro:extract": { limit: 120, window: 60, prefix: "rl:pro:extract" },
};

/**
 * Get the client identifier for rate limiting.
 * Uses userId if authenticated, otherwise falls back to IP.
 */
function getClientId(c: Context<{ Bindings: Env }>, userId?: string): string {
  if (userId) return `user:${userId}`;
  // CF-Connecting-IP is the real client IP on Cloudflare
  const ip = c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return `ip:${ip}`;
}

/**
 * Check rate limit against KV. Returns { allowed, remaining, resetAt }.
 */
export async function checkRateLimit(
  env: Env,
  clientId: string,
  tier: string
): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}> {
  const config = TIERS[tier];
  if (!config) {
    // Unknown tier — allow (fail open)
    return { allowed: true, remaining: 999, limit: 999, resetAt: 0 };
  }

  const key = `${config.prefix}:${clientId}`;

  // Get current count from KV
  const current = await env.CACHE.get(key, "text");
  const count = current ? parseInt(current, 10) : 0;

  if (count >= config.limit) {
    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      limit: config.limit,
      resetAt: Math.floor(Date.now() / 1000) + config.window,
    };
  }

  // Increment count with TTL
  await env.CACHE.put(key, String(count + 1), {
    expirationTtl: config.window,
  });

  return {
    allowed: true,
    remaining: config.limit - count - 1,
    limit: config.limit,
    resetAt: Math.floor(Date.now() / 1000) + config.window,
  };
}

/**
 * Set rate limit headers on the response.
 */
export function setRateLimitHeaders(
  c: Context,
  result: { remaining: number; limit: number; resetAt: number }
) {
  c.header("X-RateLimit-Limit", String(result.limit));
  c.header("X-RateLimit-Remaining", String(result.remaining));
  c.header("X-RateLimit-Reset", String(result.resetAt));
}

/**
 * Return a 429 Too Many Requests response.
 */
export function rateLimitResponse(
  c: Context,
  result: { remaining: number; limit: number; resetAt: number }
) {
  setRateLimitHeaders(c, result);
  c.header("Retry-After", String(result.resetAt - Math.floor(Date.now() / 1000)));
  return c.json(
    {
      error: "Rate limit exceeded",
      limit: result.limit,
      retryAfter: result.resetAt - Math.floor(Date.now() / 1000),
    },
    429
  );
}

/**
 * Determine the rate limit tier for a user.
 */
export function getTier(plan: string | null, isAuthenticated: boolean): string {
  if (!isAuthenticated) return "anon";
  switch (plan) {
    case "starter": return "starter";
    case "pro": return "pro";
    case "scale": return "pro"; // scale gets pro limits (or higher, customize later)
    default: return "free";
  }
}

/**
 * Helper: get client IP from request context.
 */
export { getClientId };
