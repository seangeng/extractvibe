export interface Env {
  // Cloudflare bindings
  DB: D1Database;
  CACHE: KVNamespace;
  R2_BUCKET: R2Bucket;
  BROWSER: Fetcher;

  // Durable Objects
  JOB_PROGRESS: DurableObjectNamespace;

  // Workflows
  EXTRACT_BRAND: Workflow;

  // Secrets (set via wrangler secret put)
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  OPENROUTER_API_KEY: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  FINGERPRINTIQ_SECRET_KEY?: string;

  // Optional integrations
  SERPER_API_KEY?: string;
  /** Sean's Andromeda LLM gateway key. When set, can route LLM calls
   * through Andromeda instead of OpenRouter — see LLM_PROVIDER. */
  ANDROMEDA_LLM_API_KEY?: string;

  // Vars (set in wrangler.jsonc)
  ADMIN_USER_IDS: string;
  /** "openrouter" (default), "andromeda", or "auto" (Andromeda first,
   * OpenRouter fallback on error). When unset behaves as "openrouter". */
  LLM_PROVIDER?: string;
}
