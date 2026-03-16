/**
 * Brand Voice Analysis
 *
 * Analyzes a brand's text content (headings, hero copy, CTAs, body text) to
 * determine tone, copywriting style, and content patterns.  Uses a combination
 * of deterministic code analysis (heading case, emoji detection, exclamation
 * frequency) and LLM-based analysis for subjective qualities.
 */

import { openRouterCompletion } from "../ai";
import type {
  BrandVoice,
  ToneSpectrum,
  CopywritingStyle,
  ContentPatterns,
  HeadingCase,
  EmojiUsage,
  ExclamationFrequency,
  VocabularyComplexity,
  JargonUsage,
} from "../../schema/v1";

// ─── Input / Output Types ────────────────────────────────────────────

export interface VoiceAnalysisInput {
  headings: Array<{ tag: string; text: string }>;
  heroText: string[];
  ctaTexts: string[];
  navLabels: string[];
  footerText: string;
  bodyText: string; // first ~2000 chars of visible body text
  brandName: string | null;
  description: string | null;
}

export interface VoiceAnalysisOutput {
  voice: BrandVoice;
  sampleCopy: string[];
}

// ─── Deterministic Analysis Helpers ──────────────────────────────────

/** Broad Unicode-aware emoji regex (covers most common emoji). */
const EMOJI_RE = new RegExp(
  "[\\u{1F600}-\\u{1F64F}\\u{1F300}-\\u{1F5FF}\\u{1F680}-\\u{1F6FF}\\u{1F1E0}-\\u{1F1FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}\\u{FE00}-\\u{FE0F}\\u{1F900}-\\u{1F9FF}\\u{1FA00}-\\u{1FA6F}\\u{1FA70}-\\u{1FAFF}\\u{200D}\\u{20E3}]",
  "gu"
);

function detectHeadingCase(headings: Array<{ text: string }>): HeadingCase {
  if (headings.length === 0) return "sentence-case";

  let titleCount = 0;
  let sentenceCount = 0;
  let lowerCount = 0;
  let upperCount = 0;

  for (const { text } of headings) {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 3) continue;

    if (trimmed === trimmed.toUpperCase() && trimmed !== trimmed.toLowerCase()) {
      upperCount++;
      continue;
    }

    if (trimmed === trimmed.toLowerCase()) {
      lowerCount++;
      continue;
    }

    // Title case: most words (>= 3 chars) start with uppercase
    const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
    const significantWords = words.filter((w) => w.length >= 3);
    const capitalizedSignificant = significantWords.filter(
      (w) => /^[A-Z]/.test(w)
    );

    if (
      significantWords.length > 0 &&
      capitalizedSignificant.length / significantWords.length >= 0.7
    ) {
      titleCount++;
    } else {
      sentenceCount++;
    }
  }

  const total = titleCount + sentenceCount + lowerCount + upperCount;
  if (total === 0) return "sentence-case";

  if (upperCount / total >= 0.5) return "uppercase";
  if (lowerCount / total >= 0.5) return "lowercase";
  if (titleCount >= sentenceCount) return "title-case";
  return "sentence-case";
}

function detectEmojiUsage(allText: string): EmojiUsage {
  const matches = allText.match(EMOJI_RE);
  if (!matches || matches.length === 0) return "none";
  if (matches.length <= 5) return "light";
  return "heavy";
}

function detectExclamationFrequency(allText: string): ExclamationFrequency {
  const count = (allText.match(/!/g) || []).length;
  const sentences = allText
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0).length;
  if (count === 0) return "none";
  const ratio = sentences > 0 ? count / sentences : 0;
  if (ratio < 0.1) return "rare";
  return "frequent";
}

function detectQuestionInHeadings(
  headings: Array<{ text: string }>
): boolean {
  return headings.some((h) => h.text.includes("?"));
}

// ─── Prompt Construction ─────────────────────────────────────────────

function buildTextContext(input: VoiceAnalysisInput): string {
  const parts: string[] = [];

  if (input.brandName) {
    parts.push(`Brand name: ${input.brandName}`);
  }
  if (input.description) {
    parts.push(`Description: ${input.description}`);
  }

  if (input.headings.length > 0) {
    const headingLines = input.headings
      .slice(0, 15)
      .map((h) => `  [${h.tag}] ${h.text}`)
      .join("\n");
    parts.push(`Headings:\n${headingLines}`);
  }

  if (input.heroText.length > 0) {
    parts.push(`Hero text:\n  ${input.heroText.slice(0, 5).join("\n  ")}`);
  }

  if (input.ctaTexts.length > 0) {
    parts.push(`CTA buttons: ${input.ctaTexts.slice(0, 10).join(" | ")}`);
  }

  if (input.navLabels.length > 0) {
    parts.push(`Nav labels: ${input.navLabels.slice(0, 12).join(" | ")}`);
  }

  if (input.footerText) {
    parts.push(
      `Footer text: ${input.footerText.slice(0, 300)}`
    );
  }

  if (input.bodyText) {
    parts.push(
      `Body text (excerpt):\n${input.bodyText.slice(0, 1500)}`
    );
  }

  // Truncate the combined context to ~3000 chars
  const combined = parts.join("\n\n");
  return combined.length > 3000 ? combined.slice(0, 3000) + "\n..." : combined;
}

function buildVoicePrompt(textContext: string): string {
  return `You are an expert brand analyst. Analyze the following website text content and return a JSON object describing the brand's voice, copywriting style, and content patterns.

<website_content>
${textContext}
</website_content>

Return ONLY a valid JSON object (no markdown fences, no explanation) with this exact structure:

{
  "toneSpectrum": {
    "formalCasual": <number 1-10, where 1=very formal, 10=very casual>,
    "playfulSerious": <number 1-10, where 1=very playful, 10=very serious>,
    "enthusiasticMatterOfFact": <number 1-10, where 1=very enthusiastic, 10=very matter-of-fact>,
    "respectfulIrreverent": <number 1-10, where 1=very respectful, 10=very irreverent>,
    "technicalAccessible": <number 1-10, where 1=very technical, 10=very accessible>
  },
  "copywritingStyle": {
    "avgSentenceLength": <number, estimated average words per sentence>,
    "vocabularyComplexity": <"simple" | "moderate" | "advanced">,
    "jargonUsage": <"none" | "some" | "heavy">,
    "rhetoricalDevices": [<list of detected rhetorical devices, e.g. "alliteration", "tricolon", "metaphor", "repetition">],
    "ctaStyle": <string describing the CTA pattern, e.g. "action-oriented imperative verbs" or "benefit-focused phrases">
  },
  "contentPatterns": {
    "bulletPreference": <boolean, true if brand prefers bullet lists over prose>
  },
  "sampleCopy": [
    <3 to 5 representative, distinctive copy excerpts from the content that capture the brand voice>
  ]
}

Guidelines:
- Score each tone axis carefully based on evidence in the text.
- For avgSentenceLength, estimate from the body text and headings.
- For rhetoricalDevices, only list devices you actually observe.
- For sampleCopy, pick the most distinctive and characteristic phrases/sentences.
- For ctaStyle, describe the pattern you see in the CTA button texts.
- Return ONLY the JSON object, nothing else.`;
}

// ─── JSON Parsing ────────────────────────────────────────────────────

function extractJsonFromResponse(raw: string): unknown {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  return JSON.parse(cleaned);
}

function clampScore(value: unknown, fallback: number): number {
  if (typeof value === "number" && value >= 1 && value <= 10) {
    return Math.round(value);
  }
  return fallback;
}

function safeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0
    ? value
    : fallback;
}

function safeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string" && v.length > 0);
  }
  return [];
}

// ─── Main Export ─────────────────────────────────────────────────────

export async function analyzeVoice(
  input: VoiceAnalysisInput,
  openRouterApiKey: string
): Promise<VoiceAnalysisOutput> {
  // ── Deterministic analysis (no LLM needed) ──
  const allText = [
    ...input.headings.map((h) => h.text),
    ...input.heroText,
    ...input.ctaTexts,
    input.footerText,
    input.bodyText,
  ].join(" ");

  const codeHeadingCase = detectHeadingCase(input.headings);
  const codeEmojiUsage = detectEmojiUsage(allText);
  const codeExclamationFreq = detectExclamationFrequency(allText);
  const codeQuestionInHeadings = detectQuestionInHeadings(input.headings);

  // ── LLM analysis ──
  const textContext = buildTextContext(input);
  const prompt = buildVoicePrompt(textContext);

  let llmToneSpectrum: Partial<ToneSpectrum> = {};
  let llmCopywritingStyle: Partial<CopywritingStyle> = {};
  let llmBulletPreference = false;
  let llmSampleCopy: string[] = [];

  try {
    const raw = await openRouterCompletion(
      openRouterApiKey,
      [{ role: "user", content: prompt }],
      {
        model: "google/gemini-2.5-flash",
        temperature: 0.2,
        maxTokens: 2048,
      }
    );

    const parsed = extractJsonFromResponse(raw) as Record<string, unknown>;

    // Parse toneSpectrum
    if (parsed.toneSpectrum && typeof parsed.toneSpectrum === "object") {
      const ts = parsed.toneSpectrum as Record<string, unknown>;
      llmToneSpectrum = {
        formalCasual: clampScore(ts.formalCasual, 5),
        playfulSerious: clampScore(ts.playfulSerious, 5),
        enthusiasticMatterOfFact: clampScore(ts.enthusiasticMatterOfFact, 5),
        respectfulIrreverent: clampScore(ts.respectfulIrreverent, 3),
        technicalAccessible: clampScore(ts.technicalAccessible, 5),
      };
    }

    // Parse copywritingStyle
    if (parsed.copywritingStyle && typeof parsed.copywritingStyle === "object") {
      const cs = parsed.copywritingStyle as Record<string, unknown>;
      const validComplexity: VocabularyComplexity[] = ["simple", "moderate", "advanced"];
      const validJargon: JargonUsage[] = ["none", "some", "heavy"];

      llmCopywritingStyle = {
        avgSentenceLength:
          typeof cs.avgSentenceLength === "number"
            ? Math.round(cs.avgSentenceLength)
            : 12,
        vocabularyComplexity: validComplexity.includes(
          cs.vocabularyComplexity as VocabularyComplexity
        )
          ? (cs.vocabularyComplexity as VocabularyComplexity)
          : "moderate",
        jargonUsage: validJargon.includes(cs.jargonUsage as JargonUsage)
          ? (cs.jargonUsage as JargonUsage)
          : "some",
        rhetoricalDevices: safeStringArray(cs.rhetoricalDevices),
        ctaStyle: safeString(cs.ctaStyle, "direct"),
      };
    }

    // Parse contentPatterns (only bulletPreference from LLM)
    if (parsed.contentPatterns && typeof parsed.contentPatterns === "object") {
      const cp = parsed.contentPatterns as Record<string, unknown>;
      llmBulletPreference =
        typeof cp.bulletPreference === "boolean" ? cp.bulletPreference : false;
    }

    // Parse sampleCopy
    llmSampleCopy = safeStringArray(
      (parsed as Record<string, unknown>).sampleCopy
    );
  } catch (err) {
    // LLM failed — proceed with defaults + deterministic analysis only
    console.warn(
      "[analyze-voice] LLM analysis failed, using defaults:",
      err instanceof Error ? err.message : err
    );

    llmToneSpectrum = {
      formalCasual: 5,
      playfulSerious: 5,
      enthusiasticMatterOfFact: 5,
      respectfulIrreverent: 3,
      technicalAccessible: 5,
    };

    llmCopywritingStyle = {
      avgSentenceLength: 12,
      vocabularyComplexity: "moderate",
      jargonUsage: "some",
      rhetoricalDevices: [],
      ctaStyle: "direct",
    };
  }

  // ── Merge: code-based analysis overrides LLM for factual things ──

  const voice: BrandVoice = {
    toneSpectrum: llmToneSpectrum as ToneSpectrum,
    copywritingStyle: llmCopywritingStyle as CopywritingStyle,
    contentPatterns: {
      headingCase: codeHeadingCase,
      emojiUsage: codeEmojiUsage,
      exclamationFrequency: codeExclamationFreq,
      questionUsageInHeadings: codeQuestionInHeadings,
      bulletPreference: llmBulletPreference,
    },
    sampleCopy: llmSampleCopy,
  };

  return {
    voice,
    sampleCopy: llmSampleCopy,
  };
}
