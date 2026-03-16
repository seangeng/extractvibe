/**
 * Brand Kit Discovery
 *
 * Probes common paths on a domain to find official brand kit, press kit, or
 * brand guidelines pages.  If one is found, its content is sent to an LLM to
 * extract official brand rules and guidelines.
 */

import { openRouterCompletion } from "../ai";

// ─── Output Type ─────────────────────────────────────────────────────

export interface BrandKitDiscoveryOutput {
  /** URL of the discovered brand kit page, or null if none found */
  discoveredUrl: string | null;
  /** Whether an official brand kit page was found */
  hasOfficialKit: boolean;
  /** Official guideline rules extracted from the brand kit page */
  guidelineRules: string[];
}

// ─── Constants ───────────────────────────────────────────────────────

/** Common paths where brands publish brand kits / press kits. */
const BRAND_KIT_PATHS = [
  "/brand",
  "/brand-assets",
  "/press",
  "/media-kit",
  "/press-kit",
  "/about/brand",
  "/identity",
  "/brand-guidelines",
  "/logos",
  "/about/press",
  "/newsroom",
  "/media",
  "/assets",
] as const;

/** Timeout for individual HTTP requests in ms. */
const REQUEST_TIMEOUT_MS = 8000;

/** Max body content to send to LLM (chars). */
const MAX_BODY_CONTENT = 5000;

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Perform a HEAD request to check if a URL exists (returns 200).
 * Returns true if the URL responds with a 200 status and an HTML content type.
 */
async function probeUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ExtractVibe/1.0; +https://extractvibe.com)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return false;

    // Only accept HTML responses (not images, PDFs, etc.)
    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("text/html");
  } catch {
    return false;
  }
}

/**
 * Fetch the body text of a URL and extract visible text content.
 * Returns the first MAX_BODY_CONTENT chars of the text content, or null on failure.
 */
async function fetchPageText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ExtractVibe/1.0; +https://extractvibe.com)",
        Accept: "text/html",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const html = await response.text();

    // Strip HTML tags to get approximate visible text
    const text = html
      // Remove script and style blocks
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      // Remove HTML tags
      .replace(/<[^>]+>/g, " ")
      // Decode common entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim();

    if (text.length < 50) return null; // Too short to be meaningful

    return text.slice(0, MAX_BODY_CONTENT);
  } catch {
    return null;
  }
}

// ─── LLM Guideline Extraction ────────────────────────────────────────

function buildGuidelinePrompt(pageText: string, url: string): string {
  return `You are analyzing a brand guidelines / press kit page to extract official brand rules.

<page_url>${url}</page_url>

<page_content>
${pageText}
</page_content>

Extract any official brand guidelines, rules, or usage instructions from this page.

Return ONLY a valid JSON object (no markdown fences, no explanation) with this structure:

{
  "isActualBrandKit": <boolean, true if this page genuinely contains brand guidelines or press/media assets>,
  "guidelineRules": [
    "<each rule as a specific, actionable statement>",
    "<e.g. 'Logo must have 24px minimum clear space on all sides'>",
    "<e.g. 'Primary brand color is #1a73e8 (Google Blue)'>",
    "<e.g. 'Do not stretch, rotate, or alter the logo'>",
    "<e.g. 'Approved fonts are Product Sans for headings, Roboto for body'>"
  ]
}

Guidelines:
- Only extract actual rules/guidelines stated on the page — do not invent them.
- If the page is not actually a brand kit (e.g., it's an unrelated page that happens to return 200), set isActualBrandKit to false and return an empty guidelineRules array.
- Each rule should be specific and actionable.
- Include color values, font names, spacing values, and other concrete details when present.
- Return ONLY the JSON object.`;
}

function extractJsonFromResponse(raw: string): unknown {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned);
}

// ─── Main Export ─────────────────────────────────────────────────────

export async function discoverBrandKit(
  domain: string,
  openRouterApiKey: string
): Promise<BrandKitDiscoveryOutput> {
  const emptyResult: BrandKitDiscoveryOutput = {
    discoveredUrl: null,
    hasOfficialKit: false,
    guidelineRules: [],
  };

  // Normalize domain to base URL
  const baseUrl = domain.startsWith("http")
    ? domain.replace(/\/+$/, "")
    : `https://${domain}`;

  // ── Phase 1: Probe all paths concurrently ──

  const probeResults = await Promise.all(
    BRAND_KIT_PATHS.map(async (path) => {
      const url = `${baseUrl}${path}`;
      const exists = await probeUrl(url);
      return { url, exists };
    })
  );

  // Find the first path that returned 200
  const foundPage = probeResults.find((r) => r.exists);
  if (!foundPage) {
    return emptyResult;
  }

  // ── Phase 2: Fetch the page content ──

  const pageText = await fetchPageText(foundPage.url);
  if (!pageText) {
    // Page exists but we could not extract text — still note the URL
    return {
      discoveredUrl: foundPage.url,
      hasOfficialKit: true,
      guidelineRules: [],
    };
  }

  // ── Phase 3: Send to LLM for guideline extraction ──

  let guidelineRules: string[] = [];
  let isActualBrandKit = true;

  try {
    const prompt = buildGuidelinePrompt(pageText, foundPage.url);
    const raw = await openRouterCompletion(
      openRouterApiKey,
      [{ role: "user", content: prompt }],
      {
        model: "google/gemini-2.5-flash",
        temperature: 0.1,
        maxTokens: 2048,
      }
    );

    const parsed = extractJsonFromResponse(raw) as Record<string, unknown>;

    if (typeof parsed.isActualBrandKit === "boolean") {
      isActualBrandKit = parsed.isActualBrandKit;
    }

    if (Array.isArray(parsed.guidelineRules)) {
      guidelineRules = parsed.guidelineRules.filter(
        (r): r is string => typeof r === "string" && r.length > 0
      );
    }
  } catch (err) {
    console.warn(
      "[discover-brand-kit] LLM guideline extraction failed:",
      err instanceof Error ? err.message : err
    );
    // Still return the discovered URL even if LLM fails
  }

  if (!isActualBrandKit) {
    // LLM determined this page is not actually a brand kit
    return emptyResult;
  }

  return {
    discoveredUrl: foundPage.url,
    hasOfficialKit: true,
    guidelineRules,
  };
}
