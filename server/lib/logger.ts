/**
 * Structured logger for extraction pipeline.
 * Outputs JSON lines to console (picked up by Cloudflare's log system).
 */

export type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  event: string;
  jobId?: string;
  domain?: string;
  step?: string;
  durationMs?: number;
  error?: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export function log(entry: Omit<LogEntry, "timestamp">) {
  const line: LogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  switch (entry.level) {
    case "error":
      console.error(JSON.stringify(line));
      break;
    case "warn":
      console.warn(JSON.stringify(line));
      break;
    default:
      console.log(JSON.stringify(line));
  }
}

/**
 * Timer utility for measuring step duration.
 */
export function startTimer() {
  const start = Date.now();
  return {
    elapsed: () => Date.now() - start,
  };
}
