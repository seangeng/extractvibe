/**
 * Shared LLM response parsing utilities.
 *
 * Used by analyze-voice, synthesize-vibe, and discover-brand-kit
 * to parse JSON from LLM responses.
 */

/**
 * Extract and parse a JSON object from an LLM response string.
 * Handles markdown code fences (```json ... ```) that LLMs often add.
 */
export function extractJsonFromResponse(raw: string): unknown {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned);
}

/**
 * Safely extract a string value, returning `fallback` if the value
 * is not a non-empty string.
 */
export function safeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

/**
 * Safely extract an array of non-empty strings from an unknown value.
 */
export function safeStringArray(
  value: unknown,
  fallback: string[] = []
): string[] {
  if (Array.isArray(value)) {
    const filtered = value.filter(
      (v): v is string => typeof v === "string" && v.length > 0
    );
    return filtered.length > 0 ? filtered : fallback;
  }
  return fallback;
}

/**
 * Clamp a numeric value to the range [1, 10], returning `fallback`
 * if the value is not a valid number in range.
 */
export function clampScore1to10(value: unknown, fallback: number): number {
  if (typeof value === "number" && value >= 1 && value <= 10) {
    return Math.round(value);
  }
  return fallback;
}

/**
 * Clamp a numeric value to [0, 1], rounded to 2 decimal places.
 */
export function clamp01(value: unknown, fallback: number): number {
  if (typeof value === "number" && value >= 0 && value <= 1) {
    return Math.round(value * 100) / 100;
  }
  return fallback;
}
