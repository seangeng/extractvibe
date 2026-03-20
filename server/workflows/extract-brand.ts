import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import type { Env } from "../env";
import { createEmptyBrandKit } from "../schema/v1";
import type { ParseVisualOutput } from "../lib/extractor/parse-visual";
import type { VoiceAnalysisOutput } from "../lib/extractor/analyze-voice";
import type { VibeSynthesisOutput } from "../lib/extractor/synthesize-vibe";
import type { BrandKitDiscoveryOutput } from "../lib/extractor/discover-brand-kit";

interface ExtractBrandParams {
  url: string;
  jobId: string;
  userId: string;
}

export class ExtractBrandWorkflow extends WorkflowEntrypoint<
  Env,
  ExtractBrandParams
> {
  async run(event: WorkflowEvent<ExtractBrandParams>, step: WorkflowStep) {
    const { url, jobId, userId } = event.payload;
    const startTime = Date.now();
    const domain = new URL(url).hostname.replace(/^www\./, "");
    const kvKey = `wf:${jobId}`;

    // -----------------------------------------------------------------------
    // Step 1: Fetch, render, and store the heavy data in KV
    // -----------------------------------------------------------------------
    await step.do(
      "fetch-render",
      { retries: { limit: 2, delay: "5 seconds", backoff: "linear" }, timeout: "90 seconds" },
      async () => {
        await this.reportProgress(jobId, "fetch-render", "running", 0);
        const { fetchAndRender } = await import("../lib/extractor/fetch-render");
        const result = await fetchAndRender(this.env, url);

        // Store screenshot in R2 separately
        if (result.screenshot) {
          try {
            await this.env.R2_BUCKET.put(
              `brands/${domain}/screenshot.png`,
              result.screenshot,
              { httpMetadata: { contentType: "image/png" } }
            );
          } catch { /* non-fatal */ }
        }

        // Store the fetch result in KV (without screenshot and truncated HTML)
        const lightweight = {
          ...result,
          screenshot: null,
          html: result.html?.substring(0, 50000) || "", // cap HTML at 50KB
        };
        await this.env.CACHE.put(`${kvKey}:fetch`, JSON.stringify(lightweight), {
          expirationTtl: 3600,
        });

        await this.reportProgress(jobId, "fetch-render", "complete", 20);
        return { stored: true };
      }
    );

    // -----------------------------------------------------------------------
    // Step 2: Parse visual identity + Analyze voice (parallel)
    // These two steps are independent — both read from the fetch KV data.
    // Running them in parallel saves ~3-10s of LLM latency.
    // -----------------------------------------------------------------------
    await step.do(
      "parse-and-analyze",
      { retries: { limit: 2, delay: "5 seconds", backoff: "linear" }, timeout: "90 seconds" },
      async () => {
        await this.reportProgress(jobId, "parse-assets", "running", 20);
        await this.reportProgress(jobId, "analyze-voice", "running", 20);

        // Load fetch result from KV (once, shared by both tasks)
        const fetchData = await this.env.CACHE.get(`${kvKey}:fetch`, "json") as Record<string, unknown> | null;
        if (!fetchData) throw new Error("Fetch result not found in KV");

        // --- Task A: Parse visual identity ---
        const parseVisualTask = async () => {
          const adapted = this.adaptFetchDataForVisual(fetchData, url, domain);

          const { parseVisualIdentity } = await import("../lib/extractor/parse-visual");
          const result = await parseVisualIdentity(adapted, this.env, domain);

          await this.env.CACHE.put(`${kvKey}:visual`, JSON.stringify(result), {
            expirationTtl: 3600,
          });

          await this.reportProgress(jobId, "parse-assets", "complete", 40);
        };

        // --- Task B: Analyze voice ---
        const analyzeVoiceTask = async () => {
          const fd = fetchData as Record<string, unknown>;
          const { analyzeVoice } = await import("../lib/extractor/analyze-voice");
          const result = await analyzeVoice(
            {
              headings: (fd.headings as Array<{ tag: string; text: string }>) || [],
              heroText: (fd.heroText as string[]) || [],
              ctaTexts: (fd.ctaTexts as string[]) || [],
              navLabels: (fd.navLabels as string[]) || [],
              footerText: (fd.footerText as string) || "",
              bodyText: (fd.bodyText as string) || "",
              brandName: (fd.brandName as string) || null,
              description: (fd.description as string) || null,
            },
            this.env.OPENROUTER_API_KEY
          );

          await this.env.CACHE.put(`${kvKey}:voice`, JSON.stringify(result), {
            expirationTtl: 3600,
          });

          await this.reportProgress(jobId, "analyze-voice", "complete", 60);
        };

        // Run both in parallel
        await Promise.all([parseVisualTask(), analyzeVoiceTask()]);

        return { stored: true };
      }
    );

    // -----------------------------------------------------------------------
    // Step 4: Synthesize vibe + discover brand kit
    // -----------------------------------------------------------------------
    await step.do(
      "synthesize-vibe",
      { retries: { limit: 2, delay: "5 seconds", backoff: "linear" }, timeout: "60 seconds" },
      async () => {
        await this.reportProgress(jobId, "synthesize-vibe", "running", 60);

        const visualData = await this.env.CACHE.get(`${kvKey}:visual`, "json") as ParseVisualOutput | null;
        const voiceData = await this.env.CACHE.get(`${kvKey}:voice`, "json") as VoiceAnalysisOutput | null;
        if (!visualData || !voiceData) throw new Error("Prior step data not found in KV");

        const { synthesizeVibe } = await import("../lib/extractor/synthesize-vibe");
        const { discoverBrandKit } = await import("../lib/extractor/discover-brand-kit");

        const [vibeOutput, brandKitOutput] = await Promise.all([
          synthesizeVibe(
            {
              identity: visualData.identity,
              colors: visualData.colors,
              typography: visualData.typography,
              voice: voiceData.voice,
              buttons: visualData.buttons,
              effects: visualData.effects,
              spacing: visualData.spacing,
              domain,
              url,
            },
            this.env.OPENROUTER_API_KEY
          ),
          discoverBrandKit(domain, this.env.OPENROUTER_API_KEY, this.env.SERPER_API_KEY),
        ]);

        await this.env.CACHE.put(`${kvKey}:vibe`, JSON.stringify({ vibe: vibeOutput, brandKit: brandKitOutput }), {
          expirationTtl: 3600,
        });

        await this.reportProgress(jobId, "synthesize-vibe", "complete", 80);
        return { stored: true };
      }
    );

    // -----------------------------------------------------------------------
    // Step 5: Assemble final result
    // -----------------------------------------------------------------------
    const finalResult = await step.do(
      "score-package",
      { timeout: "15 seconds" },
      async () => {
        await this.reportProgress(jobId, "score-package", "running", 80);

        const visualData = await this.env.CACHE.get(`${kvKey}:visual`, "json") as ParseVisualOutput | null;
        const voiceData = await this.env.CACHE.get(`${kvKey}:voice`, "json") as VoiceAnalysisOutput | null;
        const vibeData = await this.env.CACHE.get(`${kvKey}:vibe`, "json") as {
          vibe: VibeSynthesisOutput;
          brandKit: BrandKitDiscoveryOutput;
        } | null;

        // Fetch enrichment data (LoadLogo: clean logo + brand name)
        const loadLogoData = await (async (): Promise<{ logo?: string; favicon?: string; name?: string } | null> => {
          try {
            const llRes = await fetch(`https://api.loadlogo.com/describe/${domain}`, {
              headers: { "Accept": "application/json" },
              signal: AbortSignal.timeout(5000),
            });
            if (!llRes.ok) return null;
            const llJson = (await llRes.json()) as Record<string, unknown>;
            return {
              logo: (llJson.logo as string) || undefined,
              favicon: (llJson.favicon as string) || undefined,
              name: (llJson.name as string) || undefined,
            };
          } catch { return null; }
        })();

        const kit = createEmptyBrandKit(url);
        kit.meta.durationMs = Date.now() - startTime;
        kit.meta.extractionDepth = 1;

        if (visualData) {
          kit.identity = { ...visualData.identity, archetypes: vibeData?.vibe?.archetypes || [] };
          kit.logos = visualData.logos;
          kit.colors = visualData.colors;
          kit.typography = visualData.typography;
          kit.spacing = visualData.spacing;
          kit.assets = visualData.assets;
          if (visualData.buttons) kit.buttons = visualData.buttons;
          if (visualData.effects) kit.effects = visualData.effects;
          if (visualData.ogImage) kit.ogImage = visualData.ogImage;
        }

        // Add LoadLogo data
        if (loadLogoData?.logo) {
          // Add as the first logo entry with highest confidence
          kit.logos = [
            {
              type: "primary" as const,
              url: loadLogoData.logo,
              originalUrl: loadLogoData.logo,
              format: "svg" as const,
              confidence: 1.0,
              source: "loadlogo" as const,
            },
            ...(kit.logos || []),
          ];
        }
        // Use LoadLogo name if better than what we extracted
        // Prefer short, clean names over long page titles with separators
        if (loadLogoData?.name) {
          const current = kit.identity?.brandName || "";
          const isTitleLike = current.includes("|") || current.includes("—") || current.includes(" - ") || current.length > 60;
          if (!current || isTitleLike) {
            kit.identity = { ...kit.identity, brandName: loadLogoData.name };
          }
        }

        // Add design assets (top 10 most interesting)
        if (visualData?.designAssets) {
          kit.designAssets = visualData.designAssets;
        }

        if (voiceData) {
          kit.voice = voiceData.voice;
        }

        if (vibeData) {
          kit.rules = vibeData.vibe?.rules;
          kit.vibe = vibeData.vibe?.vibe;
          kit.officialGuidelines = {
            discoveredUrl: vibeData.brandKit?.discoveredUrl || null,
            hasOfficialKit: vibeData.brandKit?.hasOfficialKit || false,
            guidelineRules: vibeData.brandKit?.guidelineRules || [],
          };

          if (vibeData.brandKit?.hasOfficialKit && vibeData.brandKit?.guidelineRules?.length > 0) {
            kit.rules = { ...kit.rules, source: "merged" };
          }
        }

        // Cache result (72 hours)
        const resultJson = JSON.stringify(kit);
        await this.env.CACHE.put(`result:${jobId}`, resultJson, { expirationTtl: 60 * 60 * 72 });
        await this.env.CACHE.put(`brand:${domain}`, resultJson, { expirationTtl: 60 * 60 * 72 });

        // Update D1 extraction record
        try {
          await this.env.DB.prepare(
            `UPDATE extraction SET status = 'complete', "resultKey" = ?, "durationMs" = ?, "completedAt" = datetime('now') WHERE id = ?`
          ).bind(`result:${jobId}`, kit.meta.durationMs, jobId).run();
        } catch { /* non-fatal */ }

        // Clean up intermediate KV keys
        await Promise.allSettled([
          this.env.CACHE.delete(`${kvKey}:fetch`),
          this.env.CACHE.delete(`${kvKey}:visual`),
          this.env.CACHE.delete(`${kvKey}:voice`),
          this.env.CACHE.delete(`${kvKey}:vibe`),
        ]);

        await this.reportProgress(jobId, "score-package", "complete", 100);

        // Return a small summary (not the full kit — avoid step output limit)
        return {
          success: true,
          domain,
          jobId,
          durationMs: kit.meta.durationMs,
          logosFound: kit.logos?.length || 0,
          colorsFound: kit.colors?.rawPalette?.length || 0,
          fontsFound: kit.typography?.families?.length || 0,
        };
      }
    );

    return finalResult;
  }

  /**
   * Transform fetchAndRender KV data into the shape parseVisualIdentity expects.
   * fetch-render.ts produces: elementStyles, cssCustomProperties (object), inlineSvgs[].svg, headings[].tag
   * parse-visual.ts expects: computedStyles, cssCustomProperties (array), inlineSvgs[].content, headings[].level
   */
  private adaptFetchDataForVisual(
    fetchData: Record<string, unknown>,
    url: string,
    domain: string
  ): Record<string, unknown> {
    const fd = fetchData as Record<string, unknown>;
    const meta = fd.meta as Record<string, string> | undefined;
    const manifestData = fd.manifestData as Record<string, string> | undefined;

    return {
      url: meta?.["og:url"] || url,
      domain,
      title: fd.title,
      metaDescription: fd.description || meta?.description,
      metaThemeColor: meta?.["theme-color"] || manifestData?.theme_color,
      manifestThemeColor: manifestData?.theme_color,
      manifestBackgroundColor: manifestData?.background_color,
      icons: fd.icons || [],
      logoImages: ((fd.logoImages as Array<Record<string, unknown>>) || []).map((img) => ({
        src: img.src,
        alt: img.alt,
        context: img.context,
        width: img.width,
        height: img.height,
      })),
      inlineSvgs: ((fd.inlineSvgs as Array<Record<string, unknown>>) || []).map((s) => ({
        content: s.svg || s.content,
        context: s.context,
        purpose: s.purpose,
      })),
      computedStyles: ((fd.elementStyles as Array<Record<string, unknown>>) || []).map((e) => ({
        selector: e.selector || e.tag,
        styles: e.styles,
      })),
      cssCustomProperties:
        typeof fd.cssCustomProperties === "object" &&
        !Array.isArray(fd.cssCustomProperties)
          ? Object.entries(fd.cssCustomProperties as Record<string, unknown>).map(
              ([name, value]) => ({
                name,
                value: String(value),
                context: ":root",
              })
            )
          : fd.cssCustomProperties || [],
      stylesheetUrls: fd.stylesheetUrls || [],
      headings: ((fd.headings as Array<Record<string, unknown>>) || []).map((h) => ({
        level:
          typeof h.level === "number"
            ? h.level
            : parseInt((h.tag as string)?.replace("h", "") || "1", 10),
        text: h.text,
      })),
      shadows: fd.shadows || [],
      gradients: fd.gradients || [],
      ogImage: fd.ogImage || null,
      designAssets: fd.designAssets || [],
    };
  }

  private async reportProgress(
    jobId: string,
    stepName: string,
    status: string,
    percent: number,
    message?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      const doId = this.env.JOB_PROGRESS.idFromName(jobId);
      const stub = this.env.JOB_PROGRESS.get(doId);
      await stub.fetch("https://do/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepName, status, percent, message, details }),
      });
    } catch {
      // Non-fatal
    }
  }
}
