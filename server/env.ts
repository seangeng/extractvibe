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

  // Vars (set in wrangler.jsonc)
  ADMIN_USER_IDS: string;
}
