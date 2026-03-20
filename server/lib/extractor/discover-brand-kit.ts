/**
 * Brand Kit Discovery
 *
 * Discovers official brand guidelines pages using two strategies:
 *
 * 1. **Enhanced URL probing** (free, always runs first): HEAD-requests ~30
 *    common brand kit paths plus subdomain checks. Catches ~60-70% of
 *    established brands at zero cost.
 *
 * 2. **Serper.dev Google search** (fallback, ~$0.001/query): If probing finds
 *    nothing and a SERPER_API_KEY is configured, performs a single Google SERP
 *    query to find brand guideline pages at non-standard paths, subdomains,
 *    or third-party brand portals.
 *
 * After finding a candidate page, its content is sent to an LLM to extract
 * official brand rules and guidelines.
 */

import { openRouterCompletion } from "../ai";
import { extractJsonFromResponse } from "../llm-utils";
import { serperSearch } from "../serper";

// ─── Output Type ─────────────────────────────────────────────────────

export interface BrandKitDiscoveryOutput {
  /** URL of the discovered brand kit page, or null if none found */
  discoveredUrl: string | null;
  /** Whether an official brand kit page was found */
  hasOfficialKit: boolean;
  /** Official guideline rules extracted from the brand kit page */
  guidelineRules: string[];
  /** How the brand kit was discovered */
  discoveryMethod?: "serper-search" | "url-probe";
}

// ─── Constants ───────────────────────────────────────────────────────

/** Expanded list of common paths where brands publish brand kits / press kits. */
const BRAND_KIT_PATHS = [
  "/brand",
  "/brand-assets",
  "/brand-guidelines",
  "/brand-kit",
  "/brand-resources",
  "/branding",
  "/press",
  "/press-kit",
  "/presskit",
  "/press-room",
  "/pressroom",
  "/media",
  "/media-kit",
  "/mediakit",
  "/media-resources",
  "/newsroom",
  "/news-room",
  "/about/brand",
  "/about/press",
  "/about/media",
  "/identity",
  "/style-guide",
  "/styleguide",
  "/design",
  "/design-system",
  "/logos",
  "/logo",
  "/assets",
  "/resources",
  "/guidelines",
] as const;

/** Subdomains to check for brand portals. */
const BRAND_SUBDOMAINS = [
  "brand",
  "press",
  "media",
  "design",
] as const;

/** Timeout for individual HTTP requests in ms. */
const REQUEST_TIMEOUT_MS = 8000;

/** Max body content to send to LLM (chars). */
const MAX_BODY_CONTENT = 5000;

/** Keywords that suggest a page is actually about brand guidelines. */
const BRAND_KIT_KEYWORDS = [
  "brand guidelines",
  "brand assets",
  "brand kit",
  "press kit",
  "media kit",
  "brand identity",
  "logo usage",
  "brand resources",
  "style guide",
  "design system",
  "visual identity",
  "logo guidelines",
  "brand standards",
];

const EMPTY_RESULT: BrandKitDiscoveryOutput = {
  discoveredUrl: null,
  hasOfficialKit: false,
  guidelineRules: [],
};

// ─── Strategy 1: Enhanced URL Probing (Free) ─────────────────────────

/**
 * Perform a HEAD request to check if a URL exists (returns 200).
 */
async function probeUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ExtractVibe/1.0; +https://extractvibe.com)",
      },
    });

    if (!response.ok) return false;

    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("text/html");
  } catch {
    return false;
  }
}

/**
 * Fetch the body text of a URL and strip HTML to approximate visible text.
 */
async function fetchPageText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ExtractVibe/1.0; +https://extractvibe.com)",
        Accept: "text/html",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length < 50) return null;
    return text.slice(0, MAX_BODY_CONTENT);
  } catch {
    return null;
  }
}

/**
 * Discover brand kit by probing common URL paths and subdomains.
 * Free — uses only fetch() HEAD requests.
 */
async function discoverViaUrlProbe(
  domain: string
): Promise<{ url: string; content: string } | null> {
  const baseDomain = domain.replace(/^www\./, "");
  const baseUrl = `https://${baseDomain}`;

  // Build probe list: paths on main domain + subdomain roots
  const probeTargets: string[] = [
    ...BRAND_KIT_PATHS.map((path) => `${baseUrl}${path}`),
    ...BRAND_SUBDOMAINS.map((sub) => `https://${sub}.${baseDomain}`),
  ];

  // Run all probes concurrently
  const results = await Promise.all(
    probeTargets.map(async (url) => {
      const exists = await probeUrl(url);
      return { url, exists };
    })
  );

  const found = results.find((r) => r.exists);
  if (!found) return null;

  const content = await fetchPageText(found.url);
  return { url: found.url, content: content || "" };
}

// ─── Strategy 2: Serper.dev Google Search (Fallback) ─────────────────

/**
 * Use Serper.dev to search Google for brand guidelines pages.
 * Cost: ~$0.001 per query.
 */
async function discoverViaSerperSearch(
  domain: string,
  serperApiKey: string
): Promise<{ url: string; content: string } | null> {
  try {
    const results = await serperSearch(
      serperApiKey,
      `${domain} brand guidelines OR brand kit OR press kit OR media kit OR style guide`,
      { num: 5 }
    );

    if (results.length === 0) return null;

    // Score and rank results by relevance
    const scored = results
      .map((r) => {
        const urlLower = r.link.toLowerCase();
        const titleLower = (r.title || "").toLowerCase();
        const snippetLower = (r.snippet || "").toLowerCase();
        const combined = `${urlLower} ${titleLower} ${snippetLower}`;

        let score = 0;

        // Must be from the target domain (or a closely related subdomain)
        const domainLower = domain.toLowerCase();
        if (!urlLower.includes(domainLower)) {
          // Third-party brand pages (brandfetch, etc.) get a small score
          score += 1;
        } else {
          score += 10;
        }

        // Score based on keyword matches
        for (const keyword of BRAND_KIT_KEYWORDS) {
          if (combined.includes(keyword)) score += 5;
        }

        // URL path hints
        for (const path of BRAND_KIT_PATHS) {
          if (urlLower.includes(path)) score += 3;
        }

        return { ...r, score };
      })
      .filter((r) => r.score > 5)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return null;

    const best = scored[0];

    // Fetch the page content directly (no Firecrawl scrape needed)
    const content = await fetchPageText(best.link);

    return {
      url: best.link,
      content: content || "",
    };
  } catch (err) {
    console.warn(
      "[discover-brand-kit] Serper search failed, returning empty:",
      err instanceof Error ? err.message : err
    );
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

/**
 * Send page content to LLM for guideline extraction.
 */
async function extractGuidelines(
  pageContent: string,
  pageUrl: string,
  openRouterApiKey: string
): Promise<{ isActualBrandKit: boolean; guidelineRules: string[] }> {
  try {
    const prompt = buildGuidelinePrompt(pageContent, pageUrl);
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

    const isActualBrandKit =
      typeof parsed.isActualBrandKit === "boolean"
        ? parsed.isActualBrandKit
        : true;

    const guidelineRules = Array.isArray(parsed.guidelineRules)
      ? parsed.guidelineRules.filter(
          (r): r is string => typeof r === "string" && r.length > 0
        )
      : [];

    return { isActualBrandKit, guidelineRules };
  } catch (err) {
    console.warn(
      "[discover-brand-kit] LLM guideline extraction failed:",
      err instanceof Error ? err.message : err
    );
    return { isActualBrandKit: true, guidelineRules: [] };
  }
}

// ─── Main Export ─────────────────────────────────────────────────────

export async function discoverBrandKit(
  domain: string,
  openRouterApiKey: string,
  serperApiKey?: string
): Promise<BrandKitDiscoveryOutput> {
  // ── Strategy 1: Enhanced URL probing (free, always first) ──
  const probeResult = await discoverViaUrlProbe(domain);

  if (probeResult) {
    if (probeResult.content.length > 50) {
      const { isActualBrandKit, guidelineRules } = await extractGuidelines(
        probeResult.content,
        probeResult.url,
        openRouterApiKey
      );

      if (isActualBrandKit) {
        return {
          discoveredUrl: probeResult.url,
          hasOfficialKit: true,
          guidelineRules,
          discoveryMethod: "url-probe",
        };
      }
      // LLM says it's not a real brand kit — fall through to search
    } else {
      // Found a URL but couldn't get content
      return {
        discoveredUrl: probeResult.url,
        hasOfficialKit: true,
        guidelineRules: [],
        discoveryMethod: "url-probe",
      };
    }
  }

  // ── Strategy 2: Serper.dev Google search (fallback) ──
  if (serperApiKey) {
    const searchResult = await discoverViaSerperSearch(domain, serperApiKey);

    if (searchResult) {
      if (searchResult.content.length > 50) {
        const { isActualBrandKit, guidelineRules } = await extractGuidelines(
          searchResult.content,
          searchResult.url,
          openRouterApiKey
        );

        if (isActualBrandKit) {
          return {
            discoveredUrl: searchResult.url,
            hasOfficialKit: true,
            guidelineRules,
            discoveryMethod: "serper-search",
          };
        }
      } else {
        return {
          discoveredUrl: searchResult.url,
          hasOfficialKit: true,
          guidelineRules: [],
          discoveryMethod: "serper-search",
        };
      }
    }
  }

  return EMPTY_RESULT;
}
