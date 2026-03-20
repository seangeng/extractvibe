/**
 * Serper.dev API client — Google SERP results as structured JSON.
 *
 * Replaces Firecrawl search for brand kit discovery at ~$0.001/query
 * vs Firecrawl's ~$1.50/search.
 *
 * Docs: https://serper.dev/
 */

const SERPER_BASE = "https://google.serper.dev";
const REQUEST_TIMEOUT_MS = 10_000;

// ─── Types ───────────────────────────────────────────────────────────

export interface SerperOrganicResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

export interface SerperSearchResponse {
  organic: SerperOrganicResult[];
  searchParameters?: {
    q: string;
    num: number;
  };
}

// ─── Client ──────────────────────────────────────────────────────────

/**
 * Search Google via Serper.dev and return organic results.
 * Cost: ~$0.001 per query.
 */
export async function serperSearch(
  apiKey: string,
  query: string,
  options: { num?: number } = {}
): Promise<SerperOrganicResult[]> {
  const { num = 5 } = options;

  const response = await fetch(`${SERPER_BASE}/search`, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "unknown error");
    throw new Error(`Serper search failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as SerperSearchResponse;
  return data.organic || [];
}
