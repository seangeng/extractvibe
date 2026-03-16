-- ExtractVibe initial migration
-- Cloudflare D1 (SQLite)
-- ==============================================

-- ==============================================
-- Better Auth core tables
-- ==============================================

CREATE TABLE IF NOT EXISTS "user" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "emailVerified" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "session" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "token" TEXT NOT NULL UNIQUE,
    "expiresAt" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "account" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TEXT,
    "refreshTokenExpiresAt" TEXT,
    "scope" TEXT,
    "idToken" TEXT,
    "password" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "verification" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ==============================================
-- App tables
-- ==============================================

-- API Keys
CREATE TABLE IF NOT EXISTS "api_key" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL UNIQUE,
    "prefix" TEXT,
    "lastUsedAt" TEXT,
    "expiresAt" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_api_key_user ON api_key(userId);
CREATE INDEX idx_api_key_hash ON api_key(keyHash);

-- Extractions
CREATE TABLE IF NOT EXISTS "extraction" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "domain" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "resultKey" TEXT,
    "schemaVersion" TEXT NOT NULL DEFAULT 'v1',
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "completedAt" TEXT
);
CREATE INDEX idx_extraction_user ON extraction(userId);
CREATE INDEX idx_extraction_domain ON extraction(domain);
CREATE INDEX idx_extraction_status ON extraction(status);

-- Credits
CREATE TABLE IF NOT EXISTS "credit" (
    "userId" TEXT PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "balance" INTEGER NOT NULL DEFAULT 50,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "monthlyAllowance" INTEGER NOT NULL DEFAULT 50,
    "resetAt" TEXT NOT NULL DEFAULT (datetime('now', '+1 month'))
);

-- Request logs
CREATE TABLE IF NOT EXISTS "request_log" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "userId" TEXT,
    "endpoint" TEXT NOT NULL,
    "domain" TEXT,
    "statusCode" INTEGER NOT NULL,
    "latencyMs" INTEGER,
    "creditsUsed" INTEGER DEFAULT 0,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_request_log_user ON request_log(userId);
CREATE INDEX idx_request_log_created ON request_log(createdAt);
