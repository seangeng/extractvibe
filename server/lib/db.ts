import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import type { Env } from "../env";

/**
 * Database schema types for Kysely.
 * These mirror the D1 tables created by 0001_initial.sql.
 */
export interface Database {
  api_key: ApiKeyTable;
  credit: CreditTable;
  extraction: ExtractionTable;
}

export interface ApiKeyTable {
  id: string;
  userId: string;
  name: string;
  keyHash: string;
  prefix: string | null;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreditTable {
  userId: string;
  balance: number;
  plan: string;
  monthlyAllowance: number;
  resetAt: string;
}

export interface ExtractionTable {
  id: string;
  userId: string;
  domain: string;
  url: string;
  status: string;
  resultKey: string | null;
  schemaVersion: string;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * Create a typed Kysely instance for the D1 database.
 */
export function createDb(env: Env): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new D1Dialect({ database: env.DB }),
  });
}
