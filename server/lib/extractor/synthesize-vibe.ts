/**
 * Vibe Synthesis
 *
 * Synthesizes the complete brand profile — visual identity, color system,
 * typography, and voice analysis — into a holistic "vibe" summary with
 * actionable brand rules and archetype classification.
 */

import { openRouterCompletion } from "../ai";
import type {
  BrandVibe,
  BrandRules,
  BrandIdentity,
  BrandColors,
  BrandTypography,
  BrandVoice,
  BrandArchetype,
  ColorValue,
  FontFamily,
} from "../../schema/v1";

// ─── Input / Output Types ────────────────────────────────────────────

export interface VibeSynthesisInput {
  identity: BrandIdentity;
  colors: BrandColors;
  typography: BrandTypography;
  voice: BrandVoice;
  domain: string;
  url: string;
}

export interface VibeSynthesisOutput {
  vibe: BrandVibe;
  rules: BrandRules;
  archetypes: Array<{ name: string; confidence: number }>;
}

// ─── Prompt Helpers ──────────────────────────────────────────────────

function describeColor(cv: ColorValue | undefined, label: string): string {
  if (!cv?.hex) return "";
  return `${label}: ${cv.hex}`;
}

function summarizeColors(colors: BrandColors): string {
  const parts: string[] = [];

  if (colors.lightMode) {
    const lm = colors.lightMode;
    const items = [
      describeColor(lm.primary, "Primary"),
      describeColor(lm.secondary, "Secondary"),
      describeColor(lm.accent, "Accent"),
      describeColor(lm.background, "Background"),
      describeColor(lm.text, "Text"),
    ].filter(Boolean);
    if (items.length > 0) {
      parts.push(`Light mode: ${items.join(", ")}`);
    }
  }

  if (colors.darkMode) {
    const dm = colors.darkMode;
    const items = [
      describeColor(dm.primary, "Primary"),
      describeColor(dm.background, "Background"),
      describeColor(dm.text, "Text"),
    ].filter(Boolean);
    if (items.length > 0) {
      parts.push(`Dark mode: ${items.join(", ")}`);
    }
  }

  return parts.join("\n") || "No color data available";
}

function summarizeTypography(typo: BrandTypography): string {
  const parts: string[] = [];

  if (typo.families && typo.families.length > 0) {
    const fontLines = typo.families.map((f: FontFamily) => {
      const weights = f.weights?.join(", ") || "unknown weights";
      return `  ${f.name || "Unknown"} (${f.role || "unknown role"}, weights: ${weights}, source: ${f.source || "unknown"})`;
    });
    parts.push(`Font families:\n${fontLines.join("\n")}`);
  }

  if (typo.conventions) {
    const conv = typo.conventions;
    const convParts: string[] = [];
    if (conv.headingCase) convParts.push(`Heading case: ${conv.headingCase}`);
    if (conv.bodyLineHeight)
      convParts.push(`Body line-height: ${conv.bodyLineHeight}`);
    if (conv.codeFont) convParts.push(`Code font: ${conv.codeFont}`);
    if (convParts.length > 0) {
      parts.push(`Conventions: ${convParts.join(", ")}`);
    }
  }

  return parts.join("\n") || "No typography data available";
}

function summarizeVoice(voice: BrandVoice): string {
  const parts: string[] = [];

  if (voice.toneSpectrum) {
    const ts = voice.toneSpectrum;
    const axes: string[] = [];
    if (ts.formalCasual != null) axes.push(`Formal/Casual: ${ts.formalCasual}/10`);
    if (ts.playfulSerious != null) axes.push(`Playful/Serious: ${ts.playfulSerious}/10`);
    if (ts.enthusiasticMatterOfFact != null)
      axes.push(`Enthusiastic/Matter-of-fact: ${ts.enthusiasticMatterOfFact}/10`);
    if (ts.technicalAccessible != null)
      axes.push(`Technical/Accessible: ${ts.technicalAccessible}/10`);
    if (axes.length > 0) parts.push(`Tone: ${axes.join(", ")}`);
  }

  if (voice.copywritingStyle) {
    const cs = voice.copywritingStyle;
    const styleParts: string[] = [];
    if (cs.vocabularyComplexity)
      styleParts.push(`Vocabulary: ${cs.vocabularyComplexity}`);
    if (cs.jargonUsage) styleParts.push(`Jargon: ${cs.jargonUsage}`);
    if (cs.ctaStyle) styleParts.push(`CTA style: ${cs.ctaStyle}`);
    if (cs.rhetoricalDevices && cs.rhetoricalDevices.length > 0)
      styleParts.push(`Devices: ${cs.rhetoricalDevices.join(", ")}`);
    if (styleParts.length > 0) parts.push(`Copy style: ${styleParts.join(", ")}`);
  }

  if (voice.contentPatterns) {
    const cp = voice.contentPatterns;
    const patParts: string[] = [];
    if (cp.headingCase) patParts.push(`Heading case: ${cp.headingCase}`);
    if (cp.emojiUsage) patParts.push(`Emoji: ${cp.emojiUsage}`);
    if (cp.exclamationFrequency)
      patParts.push(`Exclamations: ${cp.exclamationFrequency}`);
    if (patParts.length > 0)
      parts.push(`Content patterns: ${patParts.join(", ")}`);
  }

  if (voice.sampleCopy && voice.sampleCopy.length > 0) {
    parts.push(
      `Sample copy:\n${voice.sampleCopy.slice(0, 3).map((s) => `  "${s}"`).join("\n")}`
    );
  }

  return parts.join("\n") || "No voice data available";
}

function buildVibePrompt(input: VibeSynthesisInput): string {
  const brandLine = input.identity.brandName
    ? `Brand: ${input.identity.brandName}`
    : `Domain: ${input.domain}`;
  const tagline = input.identity.tagline
    ? `Tagline: "${input.identity.tagline}"`
    : "";
  const description = input.identity.description
    ? `Description: ${input.identity.description}`
    : "";

  const identityBlock = [brandLine, tagline, description]
    .filter(Boolean)
    .join("\n");

  return `You are an expert brand strategist. Given the following extracted brand data, synthesize the brand's overall "vibe" and generate actionable brand rules.

<brand_data>
${identityBlock}
URL: ${input.url}

COLOR SYSTEM:
${summarizeColors(input.colors)}

TYPOGRAPHY:
${summarizeTypography(input.typography)}

VOICE ANALYSIS:
${summarizeVoice(input.voice)}
</brand_data>

Return ONLY a valid JSON object (no markdown fences, no explanation) with this exact structure:

{
  "vibe": {
    "summary": "<2-3 sentence natural language description of the brand's overall vibe and personality>",
    "tags": ["<5-8 descriptive single-word or hyphenated tags, e.g. 'minimal', 'developer-first', 'premium', 'bold'>"],
    "visualEnergy": <number 1-10, where 1=calm/understated, 10=high-energy/bold>,
    "designEra": "<classification of the design style, e.g. 'contemporary-minimal', 'bold-maximalist', 'neo-brutalism', 'flat-2.0', 'glassmorphism', 'classic-editorial'>",
    "comparableBrands": ["<3-5 well-known brands with a similar vibe>"],
    "emotionalTone": "<compound emotional descriptor, e.g. 'trustworthy-premium', 'friendly-approachable', 'bold-rebellious'>",
    "targetAudienceInferred": "<who this brand is targeting based on all signals>",
    "confidence": <number 0-1, your confidence in the overall vibe assessment>
  },
  "rules": {
    "dos": [
      "<5-8 SPECIFIC, ACTIONABLE rules the brand follows. Reference actual colors, fonts, weights, and patterns found.>",
      "<Example: 'Use Inter at 700 weight for headings in sentence case'>",
      "<Example: 'Primary CTA buttons should use #6366f1 background with white text'>",
      "<Example: 'Keep body copy under 18 words per sentence'>"
    ],
    "donts": [
      "<5-8 SPECIFIC things the brand avoids. Reference actual patterns and contrast with what was found.>",
      "<Example: 'Do not use title case for headings — the brand uses sentence case'>",
      "<Example: 'Avoid emoji in marketing copy — the brand uses none'>",
      "<Example: 'Do not use serif fonts — the brand is entirely sans-serif'>"
    ]
  },
  "archetypes": [
    {
      "name": "<brand archetype name, e.g. 'The Creator', 'The Explorer', 'The Sage', 'The Hero', 'The Magician', 'The Ruler', 'The Caregiver', 'The Innocent', 'The Jester', 'The Lover', 'The Outlaw', 'The Everyman'>",
      "confidence": <number 0-1>
    }
  ]
}

CRITICAL rules for the "dos" and "donts":
- Be EXTREMELY SPECIFIC. Reference actual hex colors, font names, font weights, casing conventions, and patterns.
- BAD example: "Use consistent typography" — this is vague and useless.
- GOOD example: "Use Inter 700 for headings and Inter 400 for body text, with 1.6 line-height."
- BAD example: "Use brand colors for CTAs"
- GOOD example: "Use #6366f1 as the primary CTA background color with white (#ffffff) text."
- Each rule should be immediately actionable by a designer or developer.
- Generate 5-8 rules for each list.

For archetypes, pick the 1-2 most fitting archetypes with confidence scores.

Return ONLY the JSON object.`;
}

// ─── JSON Parsing ────────────────────────────────────────────────────

function extractJsonFromResponse(raw: string): unknown {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned);
}

function clamp01(value: unknown, fallback: number): number {
  if (typeof value === "number" && value >= 0 && value <= 1) {
    return Math.round(value * 100) / 100;
  }
  return fallback;
}

function clamp110(value: unknown, fallback: number): number {
  if (typeof value === "number" && value >= 1 && value <= 10) {
    return Math.round(value);
  }
  return fallback;
}

function safeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function safeStringArray(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) {
    const filtered = value.filter(
      (v): v is string => typeof v === "string" && v.length > 0
    );
    return filtered.length > 0 ? filtered : fallback;
  }
  return fallback;
}

// ─── Fallback Defaults ───────────────────────────────────────────────

function buildFallbackOutput(input: VibeSynthesisInput): VibeSynthesisOutput {
  const brandName = input.identity.brandName || input.domain;
  return {
    vibe: {
      summary: `${brandName} presents a professional web presence.`,
      tags: ["professional"],
      visualEnergy: 5,
      designEra: "contemporary",
      comparableBrands: [],
      emotionalTone: "professional",
      targetAudienceInferred: "general audience",
      confidence: 0.2,
    },
    rules: {
      dos: [],
      donts: [],
      source: "inferred",
    },
    archetypes: [],
  };
}

// ─── Main Export ─────────────────────────────────────────────────────

export async function synthesizeVibe(
  input: VibeSynthesisInput,
  openRouterApiKey: string
): Promise<VibeSynthesisOutput> {
  const prompt = buildVibePrompt(input);

  let raw: string;
  try {
    raw = await openRouterCompletion(
      openRouterApiKey,
      [{ role: "user", content: prompt }],
      {
        model: "google/gemini-2.5-flash",
        temperature: 0.4,
        maxTokens: 3072,
      }
    );
  } catch (err) {
    console.warn(
      "[synthesize-vibe] LLM call failed, returning fallback:",
      err instanceof Error ? err.message : err
    );
    return buildFallbackOutput(input);
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = extractJsonFromResponse(raw) as Record<string, unknown>;
  } catch (err) {
    console.warn(
      "[synthesize-vibe] JSON parse failed, returning fallback:",
      err instanceof Error ? err.message : err
    );
    return buildFallbackOutput(input);
  }

  // ── Parse vibe ──

  const vibeRaw =
    parsed.vibe && typeof parsed.vibe === "object"
      ? (parsed.vibe as Record<string, unknown>)
      : {};

  const vibe: BrandVibe = {
    summary: safeString(
      vibeRaw.summary,
      `${input.identity.brandName || input.domain} presents a professional web presence.`
    ),
    tags: safeStringArray(vibeRaw.tags, ["professional"]),
    visualEnergy: clamp110(vibeRaw.visualEnergy, 5),
    designEra: safeString(vibeRaw.designEra, "contemporary"),
    comparableBrands: safeStringArray(vibeRaw.comparableBrands),
    emotionalTone: safeString(vibeRaw.emotionalTone, "professional"),
    targetAudienceInferred: safeString(
      vibeRaw.targetAudienceInferred,
      "general audience"
    ),
    confidence: clamp01(vibeRaw.confidence, 0.5),
  };

  // ── Parse rules ──

  const rulesRaw =
    parsed.rules && typeof parsed.rules === "object"
      ? (parsed.rules as Record<string, unknown>)
      : {};

  const rules: BrandRules = {
    dos: safeStringArray(rulesRaw.dos),
    donts: safeStringArray(rulesRaw.donts),
    source: "inferred",
  };

  // ── Parse archetypes ──

  let archetypes: Array<{ name: string; confidence: number }> = [];
  if (Array.isArray(parsed.archetypes)) {
    archetypes = parsed.archetypes
      .filter(
        (a): a is Record<string, unknown> =>
          typeof a === "object" && a !== null
      )
      .map((a) => ({
        name: safeString(a.name, "Unknown"),
        confidence: clamp01(a.confidence, 0.5),
      }))
      .filter((a) => a.name !== "Unknown");
  }

  return { vibe, rules, archetypes };
}
