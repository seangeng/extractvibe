import type { Context } from "hono";
import type { Env } from "../env";
import { createAuth } from "./auth";

interface AuthResult {
  authenticated: boolean;
  userId?: string;
}

/**
 * Resolve the current user from either a session cookie or an API key header.
 */
export async function resolveAuth(c: Context<{ Bindings: Env }>): Promise<AuthResult> {
  // 1. Try session cookie via Better Auth
  try {
    const auth = createAuth(c.env);
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (session?.user?.id) {
      return { authenticated: true, userId: session.user.id };
    }
  } catch {
    // Session resolution failed — continue to API key check
  }

  // 2. Try API key via x-api-key header
  const apiKey = c.req.header("x-api-key");
  if (apiKey) {
    const result = await lookupApiKey(c.env, apiKey);
    if (result) {
      return { authenticated: true, userId: result.userId };
    }
  }

  return { authenticated: false };
}

/**
 * Look up an API key by hashing it and checking against the database.
 */
async function lookupApiKey(
  env: Env,
  key: string
): Promise<{ userId: string } | null> {
  // Hash the provided key
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const keyHash = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const row = await env.DB.prepare(
    `SELECT "userId" FROM api_key WHERE "keyHash" = ?`
  ).bind(keyHash).first<{ userId: string }>();

  if (!row) return null;

  // Update last used timestamp (fire-and-forget)
  env.DB.prepare(
    `UPDATE api_key SET "lastUsedAt" = datetime('now') WHERE "keyHash" = ?`
  ).bind(keyHash).run().catch(() => {});

  return { userId: row.userId };
}

/**
 * Check whether a given userId is in the admin allow-list.
 */
export function isAdminUser(env: Env, userId: string): boolean {
  if (!env.ADMIN_USER_IDS) return false;
  const adminIds = env.ADMIN_USER_IDS.split(",").map((id) => id.trim());
  return adminIds.includes(userId);
}
