/**
 * Firecrawl API client — thin wrapper for search + map endpoints.
 *
 * Used when FIRECRAWL_API_KEY is provided to enhance brand kit discovery
 * with actual web search instead of blind URL probing.
 *
 * Credit costs:
 * - Search: 2 credits per 10 results
 * - Map:    1 credit per call
 * - Scrape: 1 credit per page
 */

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";
const REQUEST_TIMEOUT_MS = 15_000;

// ─── Types ───────────────────────────────────────────────────────────

export interface FirecrawlSearchResult {
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
}

export interface FirecrawlSearchResponse {
  success: boolean;
  data: FirecrawlSearchResult[];
}

export interface FirecrawlMapResponse {
  success: boolean;
  links: string[];
}

export interface FirecrawlScrapeResult {
  markdown?: string;
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    keywords?: string;
    ogImage?: string;
    [key: string]: unknown;
  };
  links?: string[];
}

export interface FirecrawlScrapeResponse {
  success: boolean;
  data: FirecrawlScrapeResult;
}

// ─── Client ──────────────────────────────────────────────────────────

async function firecrawlRequest<T>(
  apiKey: string,
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${FIRECRAWL_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "unknown error");
    throw new Error(`Firecrawl ${endpoint} failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Search the web using Firecrawl's search endpoint.
 * Cost: 2 credits per 10 results.
 *
 * Returns search results with optional scraped markdown content.
 */
export async function firecrawlSearch(
  apiKey: string,
  query: string,
  options: {
    limit?: number;
    scrapeOptions?: {
      formats?: string[];
      onlyMainContent?: boolean;
    };
  } = {}
): Promise<FirecrawlSearchResult[]> {
  const { limit = 5, scrapeOptions } = options;

  const result = await firecrawlRequest<FirecrawlSearchResponse>(
    apiKey,
    "/search",
    {
      query,
      limit,
      ...(scrapeOptions ? { scrapeOptions } : {}),
    }
  );

  if (!result.success || !result.data) {
    return [];
  }

  return result.data;
}

/**
 * Map a website to get all discovered URLs without scraping content.
 * Cost: 1 credit.
 *
 * Useful for discovering site structure (brand pages, about pages, etc.).
 */
export async function firecrawlMap(
  apiKey: string,
  url: string,
  options: {
    search?: string;
    limit?: number;
    ignoreSitemap?: boolean;
    includeSubdomains?: boolean;
  } = {}
): Promise<string[]> {
  const { search, limit = 100, ignoreSitemap = false, includeSubdomains = false } = options;

  const result = await firecrawlRequest<FirecrawlMapResponse>(
    apiKey,
    "/map",
    {
      url,
      ...(search ? { search } : {}),
      limit,
      ignoreSitemap,
      includeSubdomains,
    }
  );

  if (!result.success || !result.links) {
    return [];
  }

  return result.links;
}

/**
 * Scrape a single page and return clean markdown + metadata.
 * Cost: 1 credit.
 */
export async function firecrawlScrape(
  apiKey: string,
  url: string,
  options: {
    formats?: string[];
    onlyMainContent?: boolean;
    timeout?: number;
  } = {}
): Promise<FirecrawlScrapeResult | null> {
  const { formats = ["markdown"], onlyMainContent = true, timeout = 30000 } = options;

  try {
    const result = await firecrawlRequest<FirecrawlScrapeResponse>(
      apiKey,
      "/scrape",
      { url, formats, onlyMainContent, timeout }
    );

    if (!result.success || !result.data) {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}
