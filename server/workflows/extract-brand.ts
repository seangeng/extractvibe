import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import type { Env } from "../env";
import {
  createEmptyBrandKit,
  type ExtractVibeBrandKit,
} from "../schema/v1";

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
    // Step 2: Parse visual identity
    // -----------------------------------------------------------------------
    const visualResult = await step.do(
      "parse-assets",
      { retries: { limit: 1, delay: "3 seconds" }, timeout: "30 seconds" },
      async () => {
        await this.reportProgress(jobId, "parse-assets", "running", 20);

        // Load fetch result from KV
        const fetchData = await this.env.CACHE.get(`${kvKey}:fetch`, "json") as any;
        if (!fetchData) throw new Error("Fetch result not found in KV");

        const { parseVisualIdentity } = await import("../lib/extractor/parse-visual");
        const result = await parseVisualIdentity(fetchData, this.env, domain);

        // Store visual result in KV
        await this.env.CACHE.put(`${kvKey}:visual`, JSON.stringify(result), {
          expirationTtl: 3600,
        });

        await this.reportProgress(jobId, "parse-assets", "complete", 40);
        return { stored: true };
      }
    );

    // -----------------------------------------------------------------------
    // Step 3: Analyze brand voice
    // -----------------------------------------------------------------------
    await step.do(
      "analyze-voice",
      { retries: { limit: 2, delay: "5 seconds", backoff: "linear" }, timeout: "60 seconds" },
      async () => {
        await this.reportProgress(jobId, "analyze-voice", "running", 40);

        const fetchData = await this.env.CACHE.get(`${kvKey}:fetch`, "json") as any;
        if (!fetchData) throw new Error("Fetch result not found in KV");

        const { analyzeVoice } = await import("../lib/extractor/analyze-voice");
        const result = await analyzeVoice(
          {
            headings: fetchData.headings || [],
            heroText: fetchData.heroText || [],
            ctaTexts: fetchData.ctaTexts || [],
            navLabels: fetchData.navLabels || [],
            footerText: fetchData.footerText || "",
            bodyText: fetchData.bodyText || "",
            brandName: fetchData.brandName || null,
            description: fetchData.description || null,
          },
          this.env.OPENROUTER_API_KEY
        );

        await this.env.CACHE.put(`${kvKey}:voice`, JSON.stringify(result), {
          expirationTtl: 3600,
        });

        await this.reportProgress(jobId, "analyze-voice", "complete", 60);
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

        const visualData = await this.env.CACHE.get(`${kvKey}:visual`, "json") as any;
        const voiceData = await this.env.CACHE.get(`${kvKey}:voice`, "json") as any;
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
              domain,
              url,
            },
            this.env.OPENROUTER_API_KEY
          ),
          discoverBrandKit(domain, this.env.OPENROUTER_API_KEY),
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

        const visualData = await this.env.CACHE.get(`${kvKey}:visual`, "json") as any;
        const voiceData = await this.env.CACHE.get(`${kvKey}:voice`, "json") as any;
        const vibeData = await this.env.CACHE.get(`${kvKey}:vibe`, "json") as any;

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
