import type { Context } from "hono";
import type { Env } from "../env";
import { createAuth } from "./auth";
import { sha256Hex } from "./crypto";

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  plan?: string;
  isAnonymous: boolean;
}

/**
 * Resolve the current user from session cookie, API key, or anonymous.
 * Always returns — never throws. Anonymous requests get { isAnonymous: true }.
 */
export async function resolveAuth(c: Context<{ Bindings: Env }>): Promise<AuthResult> {
  // 1. Try session cookie via Better Auth
  try {
    const auth = createAuth(c.env);
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (session?.user?.id) {
      const plan = await getUserPlan(c.env, session.user.id);
      return { authenticated: true, userId: session.user.id, plan, isAnonymous: false };
    }
  } catch {
    // Session resolution failed — continue
  }

  // 2. Try API key via x-api-key header
  const apiKey = c.req.header("x-api-key");
  if (apiKey) {
    const result = await lookupApiKey(c.env, apiKey);
    if (result) {
      const plan = await getUserPlan(c.env, result.userId);
      return { authenticated: true, userId: result.userId, plan, isAnonymous: false };
    }
  }

  // 3. Anonymous — not authenticated but allowed for some endpoints
  return { authenticated: false, isAnonymous: true };
}

/**
 * Require authentication — return 401 for anonymous requests.
 */
export async function requireAuth(c: Context<{ Bindings: Env }>): Promise<AuthResult> {
  const auth = await resolveAuth(c);
  if (!auth.authenticated) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return auth;
}

/**
 * Look up an API key by hashing it and checking against the database.
 */
async function lookupApiKey(
  env: Env,
  key: string
): Promise<{ userId: string } | null> {
  const keyHash = await sha256Hex(key);

  const row = await env.DB.prepare(
    `SELECT "userId" FROM api_key WHERE "keyHash" = ?`
  ).bind(keyHash).first<{ userId: string }>();

  if (!row) return null;

  // Update last used (fire-and-forget)
  env.DB.prepare(
    `UPDATE api_key SET "lastUsedAt" = datetime('now') WHERE "keyHash" = ?`
  ).bind(keyHash).run().catch(() => {});

  return { userId: row.userId };
}

/**
 * Get a user's plan from the credit table.
 */
async function getUserPlan(env: Env, userId: string): Promise<string> {
  const row = await env.DB.prepare(
    `SELECT plan FROM credit WHERE "userId" = ?`
  ).bind(userId).first<{ plan: string }>();
  return row?.plan || "free";
}

/**
 * Check whether a given userId is in the admin allow-list.
 */
export function isAdminUser(env: Env, userId: string): boolean {
  if (!env.ADMIN_USER_IDS) return false;
  const adminIds = env.ADMIN_USER_IDS.split(",").map((id) => id.trim());
  return adminIds.includes(userId);
}
