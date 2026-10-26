import { afterEach, describe, expect, it, vi } from "vitest";
import { aiCompletion } from "../lib/ai";
import { analyzeVoice, type VoiceAnalysisInput } from "../lib/extractor/analyze-voice";
import { discoverBrandKit } from "../lib/extractor/discover-brand-kit";
import { generateDesignMd } from "../lib/extractor/generate-design-md";
import { synthesizeVibe } from "../lib/extractor/synthesize-vibe";
import { mockBrandKitFull as kit } from "./fixtures/mock-brand-kit-full";

const config = { openRouterApiKey: "test-key" };
const messages = [{ role: "user" as const, content: "Analyze this brand." }];
const response = (content: string) => Response.json({ choices: [{ message: { content } }] });
const voiceInput: VoiceAnalysisInput = {
  headings: [{ tag: "h1", text: "Build better" }], heroText: ["Build better"],
  ctaTexts: ["Start now"], navLabels: ["Products"], footerText: "Example",
  bodyText: "A useful product.", brandName: "Example", description: "A useful product.",
};
const vibeInput = {
  identity: kit.identity!, colors: kit.colors!, typography: kit.typography!, voice: kit.voice!,
  domain: "stripe.com", url: "https://stripe.com",
};

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("OpenRouter completions", () => {
  it("uses a valid default model and preserves request limits", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response("Useful analysis"));
    vi.stubGlobal("fetch", fetchMock);
    expect(await aiCompletion(config, messages, { maxTokens: 2048, temperature: 0.2 })).toBe("Useful analysis");
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(request.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(request.body)).toEqual({ model: "google/gemini-2.5-flash", messages, max_tokens: 2048, temperature: 0.2 });
    expect(request.signal).toBeInstanceOf(AbortSignal);
  });

  it("ignores stale legacy provider settings rather than calling B3IQ", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response("Useful analysis"));
    vi.stubGlobal("fetch", fetchMock);
    const staleConfig = { ...config, provider: "b3iq", b3iqApiKey: "old-key" };
    await aiCompletion(staleConfig, messages);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("https://openrouter.ai/api/v1/chat/completions");
  });

  it("requires the OpenRouter credential before making any request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(aiCompletion({}, messages)).rejects.toThrow("OPENROUTER_API_KEY is not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([401, 429, 503])("rejects HTTP %s without exposing upstream text", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private upstream text", { status })));
    await expect(aiCompletion(config, messages)).rejects.toThrow(`OpenRouter API error (${status})`);
  });

  it("rejects successful HTTP responses containing an API error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: { message: "private upstream text" } })));
    await expect(aiCompletion(config, messages)).rejects.toThrow("OpenRouter returned an API error");
  });

  it.each(["", "   "])("rejects an empty completion", async (content) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(content)));
    await expect(aiCompletion(config, messages)).rejects.toThrow("OpenRouter returned an empty response");
  });

  it("propagates request timeouts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Timed out", "TimeoutError")));
    await expect(aiCompletion(config, messages)).rejects.toMatchObject({ name: "TimeoutError" });
  });
});

describe("extractor provider integration", () => {
  it("uses OpenRouter model IDs for voice, vibe and DESIGN.md without degraded output", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(JSON.stringify({ sampleCopy: ["Build better"] })))
      .mockResolvedValueOnce(response(JSON.stringify({ vibe: { summary: "A calm product", confidence: 0.9 } })))
      .mockResolvedValueOnce(response(JSON.stringify({ overview: "A clear design language" })));
    vi.stubGlobal("fetch", fetchMock);
    const voice = await analyzeVoice(voiceInput, config);
    const vibe = await synthesizeVibe(vibeInput, config);
    const design = await generateDesignMd(kit, { llmConfig: config });
    expect(voice.degraded).not.toBe(true);
    expect(voice.sampleCopy).toEqual(["Build better"]);
    expect(vibe.degraded).not.toBe(true);
    expect(vibe.vibe.summary).toBe("A calm product");
    expect(design.proseDegraded).toBe(false);
    expect(design.content).toContain("A clear design language");
    for (const [url, request] of fetchMock.mock.calls) {
      expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
      expect(JSON.parse(request.body).model).toBe("google/gemini-2.5-flash");
    }
  });

  it("uses the same valid OpenRouter model for official guideline discovery", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === "https://openrouter.ai/api/v1/chat/completions") {
        return response(JSON.stringify({ isActualBrandKit: true, guidelineRules: ["Use the approved logo"] }));
      }
      return new Response("<html>Brand guidelines: use the approved logo and keep clear space around the logo at all sizes.</html>", { headers: { "Content-Type": "text/html" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await discoverBrandKit("example.com", config);
    expect(result.hasOfficialKit).toBe(true);
    expect(result.guidelineRules).toEqual(["Use the approved logo"]);
    const call = fetchMock.mock.calls.find(([url]) => url === "https://openrouter.ai/api/v1/chat/completions");
    expect(JSON.parse(call![1].body).model).toBe("google/gemini-2.5-flash");
  });

  it("surfaces provider failure through existing degradation flags", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("Unavailable", { status: 503 })));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const voice = await analyzeVoice(voiceInput, config);
    const vibe = await synthesizeVibe(vibeInput, config);
    const design = await generateDesignMd(kit, { llmConfig: config });
    expect(voice.degraded).toBe(true);
    expect(voice.degradationReason).toBe("OpenRouter API error (503)");
    expect(vibe.degraded).toBe(true);
    expect(design.proseDegraded).toBe(true);
  });
});
