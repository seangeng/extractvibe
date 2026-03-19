/**
 * Shared frontend types used across multiple routes.
 */

/** Extraction job status from the API. */
export type ExtractionStatus = "queued" | "running" | "complete" | "failed";

/** An extraction record from the API. */
export interface Extraction {
  id: string;
  url: string;
  domain: string;
  status: ExtractionStatus;
  durationMs: number | null;
  createdAt: string;
  completedAt: string | null;
}

/** API key record from the API. */
export interface ApiKeyItem {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

/** WebSocket progress message from the extraction workflow. */
export interface ProgressMessage {
  type: "progress" | "complete" | "error" | "pong";
  stepId?: string;
  step?: string;
  status?: string;
  percent?: number;
  message?: string;
  details?: Record<string, unknown>;
  timestamp?: number;
}

/** Steps in the extraction pipeline (in order). */
export const EXTRACTION_STEPS = [
  "fetch",
  "visual",
  "voice",
  "vibe",
  "package",
] as const;

export type ExtractionStep = (typeof EXTRACTION_STEPS)[number];
