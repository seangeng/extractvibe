/**
 * ExtractVibe MCP Server
 *
 * A stdio-based Model Context Protocol server that exposes ExtractVibe's
 * brand extraction API as tools for AI assistants like Claude and Cursor.
 *
 * Environment:
 *   EXTRACTVIBE_API_KEY — required, your ev_* API key
 *   EXTRACTVIBE_BASE_URL — optional, defaults to https://extractvibe.com
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ─── Configuration ───────────────────────────────────────────────────────────

const API_KEY = process.env.EXTRACTVIBE_API_KEY;
const BASE_URL = (process.env.EXTRACTVIBE_BASE_URL ?? "https://extractvibe.com").replace(
  /\/$/,
  "",
);

const POLL_INTERVAL_MS = 3_000;
const POLL_MAX_ATTEMPTS = 120; // 6 minutes max

// ─── HTTP Helpers ────────────────────────────────────────────────────────────

interface ApiError {
  error: string;
  status: number;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "extractvibe-mcp/0.1.0",
  };
  if (API_KEY) {
    h["Authorization"] = `Bearer ${API_KEY}`;
  }
  return h;
}

async function apiGet<T = unknown>(path: string): Promise<T | ApiError> {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) {
      const body = await res.text();
      let message: string;
      try {
        message = JSON.parse(body).error ?? body;
      } catch {
        message = body;
      }
      return { error: message, status: res.status };
    }
    return (await res.json()) as T;
  } catch (err: unknown) {
    return { error: `Network error: ${(err as Error).message}`, status: 0 };
  }
}

async function apiPost<T = unknown>(
  path: string,
  body: unknown,
): Promise<T | ApiError> {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      let message: string;
      try {
        message = JSON.parse(text).error ?? text;
      } catch {
        message = text;
      }
      return { error: message, status: res.status };
    }
    return (await res.json()) as T;
  } catch (err: unknown) {
    return { error: `Network error: ${(err as Error).message}`, status: 0 };
  }
}

function isApiError(v: unknown): v is ApiError {
  return typeof v === "object" && v !== null && "error" in v && "status" in v;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Brand Kit Types (lightweight subset of schema/v1) ───────────────────────

interface ColorValue {
  hex?: string;
  role?: string;
  source?: string;
  confidence?: number;
}

interface ColorMode {
  primary?: ColorValue;
  secondary?: ColorValue;
  accent?: ColorValue;
  background?: ColorValue;
  surface?: ColorValue;
  text?: ColorValue;
  border?: ColorValue;
  link?: ColorValue;
  muted?: ColorValue;
}

interface SemanticColors {
  success?: ColorValue;
  warning?: ColorValue;
  error?: ColorValue;
  info?: ColorValue;
}

interface BrandColors {
  lightMode?: ColorMode;
  darkMode?: ColorMode;
  semantic?: SemanticColors;
  rawPalette?: ColorValue[];
}

interface FontFamily {
  name?: string;
  role?: string;
  source?: string;
  weights?: number[];
  fallbackStack?: string;
  confidence?: number;
}

interface TypeScaleEntry {
  fontSize?: string;
  fontWeight?: number;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: string;
  fontFamily?: string;
}

interface TypeScale {
  h1?: TypeScaleEntry;
  h2?: TypeScaleEntry;
  h3?: TypeScaleEntry;
  h4?: TypeScaleEntry;
  h5?: TypeScaleEntry;
  h6?: TypeScaleEntry;
  body?: TypeScaleEntry;
  small?: TypeScaleEntry;
  caption?: TypeScaleEntry;
}

interface BrandTypography {
  families?: FontFamily[];
  scale?: TypeScale;
  conventions?: {
    headingCase?: string;
    bodyLineHeight?: string;
    codeFont?: string;
  };
}

interface ToneSpectrum {
  formalCasual?: number;
  playfulSerious?: number;
  enthusiasticMatterOfFact?: number;
  respectfulIrreverent?: number;
  technicalAccessible?: number;
}

interface CopywritingStyle {
  avgSentenceLength?: number;
  vocabularyComplexity?: string;
  jargonUsage?: string;
  rhetoricalDevices?: string[];
  ctaStyle?: string;
}

interface ContentPatterns {
  headingCase?: string;
  emojiUsage?: string;
  exclamationFrequency?: string;
  questionUsageInHeadings?: boolean;
  bulletPreference?: boolean;
}

interface BrandVoice {
  toneSpectrum?: ToneSpectrum;
  copywritingStyle?: CopywritingStyle;
  contentPatterns?: ContentPatterns;
  sampleCopy?: string[];
}

interface BrandRules {
  dos?: string[];
  donts?: string[];
  source?: string;
}

interface BrandArchetype {
  name: string;
  confidence?: number;
}

interface BrandIdentity {
  brandName?: string;
  tagline?: string;
  description?: string;
  archetypes?: BrandArchetype[];
}

interface BrandVibe {
  summary?: string;
  tags?: string[];
  visualEnergy?: number;
  designEra?: string;
  comparableBrands?: string[];
  emotionalTone?: string;
  targetAudienceInferred?: string;
  confidence?: number;
}

interface BrandKit {
  meta: {
    url?: string;
    domain?: string;
    extractedAt?: string;
    schemaVersion?: string;
    durationMs?: number;
    extractionDepth?: number;
  };
  identity?: BrandIdentity;
  colors?: BrandColors;
  typography?: BrandTypography;
  voice?: BrandVoice;
  rules?: BrandRules;
  vibe?: BrandVibe;
  spacing?: {
    baseUnit?: string;
    borderRadius?: { small?: string; medium?: string; large?: string };
    containerMaxWidth?: string;
    grid?: { columns?: number; gap?: string };
  };
  logos?: Array<{
    type?: string;
    url?: string;
    format?: string;
    variant?: string;
    dimensions?: { width: number; height: number };
  }>;
  assets?: Array<{
    type?: string;
    url?: string;
    format?: string;
    context?: string;
  }>;
  officialGuidelines?: {
    discoveredUrl?: string | null;
    hasOfficialKit?: boolean;
    guidelineRules?: string[];
  };
}

// ─── Formatting Helpers ──────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function hasValue(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string" && v.trim() === "") return false;
  return true;
}

function hasItems(arr: unknown[] | undefined | null): arr is unknown[] {
  return Array.isArray(arr) && arr.length > 0;
}

function hasAnyValue(obj: Record<string, unknown> | undefined | null): boolean {
  if (!obj) return false;
  return Object.values(obj).some((v) => hasValue(v));
}

function fontStack(font: FontFamily): string {
  const parts: string[] = [];
  if (font.name) parts.push(`"${font.name}"`);
  if (font.fallbackStack) parts.push(font.fallbackStack);
  return parts.join(", ") || "sans-serif";
}

function findFont(kit: BrandKit, role: string): FontFamily | undefined {
  return kit.typography?.families?.find((f) => f.role === role);
}

// ─── Response Formatters ─────────────────────────────────────────────────────

function formatColors(domain: string, colors: BrandColors): string {
  const lines: string[] = [];
  lines.push(`## ${domain} — Color Palette\n`);

  const lightMode = colors.lightMode;
  if (lightMode && hasAnyValue(lightMode as unknown as Record<string, unknown>)) {
    lines.push("### Light Mode");
    const roles: (keyof ColorMode)[] = [
      "primary", "secondary", "accent", "background", "surface",
      "text", "border", "link", "muted",
    ];
    for (const role of roles) {
      const color = lightMode[role];
      if (color?.hex) {
        const label = color.role ? ` (${color.role})` : "";
        lines.push(`- **${capitalize(role)}:** \`${color.hex}\`${label}`);
      }
    }
    lines.push("");
  }

  const darkMode = colors.darkMode;
  if (darkMode && hasAnyValue(darkMode as unknown as Record<string, unknown>)) {
    lines.push("### Dark Mode");
    const roles: (keyof ColorMode)[] = [
      "primary", "secondary", "accent", "background", "surface",
      "text", "border", "link", "muted",
    ];
    for (const role of roles) {
      const color = darkMode[role];
      if (color?.hex) {
        lines.push(`- **${capitalize(role)}:** \`${color.hex}\``);
      }
    }
    lines.push("");
  }

  const semantic = colors.semantic;
  if (semantic && hasAnyValue(semantic as unknown as Record<string, unknown>)) {
    lines.push("### Semantic");
    const roles: (keyof SemanticColors)[] = ["success", "warning", "error", "info"];
    for (const role of roles) {
      const color = semantic[role];
      if (color?.hex) {
        lines.push(`- **${capitalize(role)}:** \`${color.hex}\``);
      }
    }
    lines.push("");
  }

  const rawPalette = colors.rawPalette;
  if (hasItems(rawPalette)) {
    lines.push(`### Raw Palette\n${rawPalette.length} unique color${rawPalette.length !== 1 ? "s" : ""} detected`);
    lines.push("");
  }

  return lines.join("\n");
}

function formatTypography(domain: string, typography: BrandTypography): string {
  const lines: string[] = [];
  lines.push(`## ${domain} — Typography\n`);

  if (hasItems(typography.families)) {
    lines.push("### Font Families");
    for (const font of typography.families!) {
      if (!font.name) continue;
      const role = font.role ? capitalize(font.role) : "Unknown";
      const weights = hasItems(font.weights) ? font.weights!.join(", ") : "default";
      const source = font.source ? ` (${font.source})` : "";
      lines.push(`- **${role}:** ${font.name} — weights: ${weights}${source}`);
    }
    lines.push("");
  }

  const scale = typography.scale;
  if (scale && hasAnyValue(scale as unknown as Record<string, unknown>)) {
    lines.push("### Type Scale");
    const levels: (keyof TypeScale)[] = ["h1", "h2", "h3", "h4", "h5", "h6", "body", "small", "caption"];
    for (const level of levels) {
      const entry = scale[level];
      if (!entry) continue;
      const parts: string[] = [];
      if (entry.fontSize) parts.push(entry.fontSize);
      if (entry.fontWeight != null) parts.push(`weight ${entry.fontWeight}`);
      if (entry.lineHeight) parts.push(`line-height ${entry.lineHeight}`);
      if (entry.letterSpacing) parts.push(`letter-spacing ${entry.letterSpacing}`);
      if (entry.textTransform) parts.push(entry.textTransform);
      lines.push(`- **${level.toUpperCase()}:** ${parts.join(" / ")}`);
    }
    lines.push("");
  }

  const conventions = typography.conventions;
  if (conventions && hasAnyValue(conventions as unknown as Record<string, unknown>)) {
    lines.push("### Conventions");
    if (conventions.headingCase) lines.push(`- Heading case: ${conventions.headingCase}`);
    if (conventions.bodyLineHeight) lines.push(`- Body line height: ${conventions.bodyLineHeight}`);
    if (conventions.codeFont) lines.push(`- Code font: ${conventions.codeFont}`);
    lines.push("");
  }

  return lines.join("\n");
}

function formatVoice(domain: string, voice: BrandVoice): string {
  const lines: string[] = [];
  lines.push(`## ${domain} — Brand Voice\n`);

  const tone = voice.toneSpectrum;
  if (tone && hasAnyValue(tone as unknown as Record<string, unknown>)) {
    lines.push("### Tone Spectrum");
    const axes: Array<[string, string, number | undefined]> = [
      ["Formal", "Casual", tone.formalCasual],
      ["Playful", "Serious", tone.playfulSerious],
      ["Enthusiastic", "Matter-of-fact", tone.enthusiasticMatterOfFact],
      ["Respectful", "Irreverent", tone.respectfulIrreverent],
      ["Technical", "Accessible", tone.technicalAccessible],
    ];
    for (const [left, right, value] of axes) {
      if (value == null) continue;
      const barLen = 9;
      const pos = Math.max(0, Math.min(barLen, Math.round(((value - 1) / 9) * barLen)));
      const bar = "\u2014".repeat(pos) + "\u25CF" + "\u2014".repeat(barLen - pos);
      lines.push(`- ${left} <${bar}> ${right} (${value}/10)`);
    }
    lines.push("");
  }

  const copy = voice.copywritingStyle;
  if (copy && hasAnyValue(copy as unknown as Record<string, unknown>)) {
    lines.push("### Copywriting Style");
    if (copy.avgSentenceLength != null) lines.push(`- Average sentence length: ${copy.avgSentenceLength} words`);
    if (copy.vocabularyComplexity) lines.push(`- Vocabulary complexity: ${copy.vocabularyComplexity}`);
    if (copy.jargonUsage) lines.push(`- Jargon usage: ${copy.jargonUsage}`);
    if (hasItems(copy.rhetoricalDevices)) lines.push(`- Rhetorical devices: ${copy.rhetoricalDevices!.join(", ")}`);
    if (copy.ctaStyle) lines.push(`- CTA style: "${copy.ctaStyle}"`);
    lines.push("");
  }

  const patterns = voice.contentPatterns;
  if (patterns && hasAnyValue(patterns as unknown as Record<string, unknown>)) {
    lines.push("### Content Patterns");
    if (patterns.headingCase) lines.push(`- Heading case: ${patterns.headingCase}`);
    if (patterns.emojiUsage) lines.push(`- Emoji usage: ${patterns.emojiUsage}`);
    if (patterns.exclamationFrequency) lines.push(`- Exclamation frequency: ${patterns.exclamationFrequency}`);
    if (patterns.questionUsageInHeadings != null) lines.push(`- Questions in headings: ${patterns.questionUsageInHeadings ? "yes" : "no"}`);
    if (patterns.bulletPreference != null) lines.push(`- Bullet preference: ${patterns.bulletPreference ? "yes" : "no"}`);
    lines.push("");
  }

  if (hasItems(voice.sampleCopy)) {
    lines.push("### Sample Copy");
    for (const sample of voice.sampleCopy!) {
      lines.push(`> "${sample}"`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function formatRules(domain: string, rules: BrandRules, vibe?: BrandVibe): string {
  const lines: string[] = [];
  lines.push(`## ${domain} — Brand Rules\n`);

  if (rules.source) {
    lines.push(`*Source: ${rules.source}*\n`);
  }

  if (hasItems(rules.dos)) {
    lines.push("### DOs");
    for (const rule of rules.dos!) {
      lines.push(`- ${rule}`);
    }
    lines.push("");
  }

  if (hasItems(rules.donts)) {
    lines.push("### DON'Ts");
    for (const rule of rules.donts!) {
      lines.push(`- ${rule}`);
    }
    lines.push("");
  }

  if (vibe) {
    lines.push("### Vibe Context");
    if (vibe.summary) lines.push(`> ${vibe.summary}`);
    if (hasItems(vibe.tags)) lines.push(`- **Tags:** ${vibe.tags!.join(", ")}`);
    if (vibe.emotionalTone) lines.push(`- **Emotional tone:** ${vibe.emotionalTone}`);
    if (vibe.visualEnergy != null) {
      const label = vibe.visualEnergy <= 3 ? "calm/understated" : vibe.visualEnergy <= 6 ? "moderate" : "high-energy/bold";
      lines.push(`- **Visual energy:** ${vibe.visualEnergy}/10 (${label})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function formatVibe(domain: string, vibe: BrandVibe, identity?: BrandIdentity): string {
  const lines: string[] = [];
  lines.push(`## ${domain} — Brand Vibe\n`);

  if (vibe.summary) {
    lines.push(`> "${vibe.summary}"\n`);
  }

  if (hasItems(vibe.tags)) {
    lines.push(`**Tags:** ${vibe.tags!.join(", ")}`);
  }
  if (vibe.visualEnergy != null) {
    const label = vibe.visualEnergy <= 3 ? "calm/understated" : vibe.visualEnergy <= 6 ? "moderate" : "high-energy/bold";
    lines.push(`**Visual Energy:** ${vibe.visualEnergy}/10 (${label})`);
  }
  if (vibe.designEra) {
    lines.push(`**Design Era:** ${vibe.designEra}`);
  }
  if (hasItems(vibe.comparableBrands)) {
    lines.push(`**Comparable Brands:** ${vibe.comparableBrands!.join(", ")}`);
  }
  if (vibe.emotionalTone) {
    lines.push(`**Emotional Tone:** ${vibe.emotionalTone}`);
  }
  if (vibe.targetAudienceInferred) {
    lines.push(`**Target Audience:** ${vibe.targetAudienceInferred}`);
  }
  lines.push("");

  if (identity) {
    lines.push("### Brand Identity");
    if (identity.brandName) lines.push(`- **Name:** ${identity.brandName}`);
    if (identity.tagline) lines.push(`- **Tagline:** "${identity.tagline}"`);
    if (identity.description) lines.push(`- **Description:** ${identity.description}`);
    if (hasItems(identity.archetypes)) {
      const archetypeStrs = identity.archetypes!.map((a) => {
        if (a.confidence != null) return `${a.name} (${Math.round(a.confidence * 100)}%)`;
        return a.name;
      });
      lines.push(`- **Archetypes:** ${archetypeStrs.join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function formatFullBrandKit(kit: BrandKit): string {
  const domain = kit.meta.domain ?? "unknown";
  const lines: string[] = [];

  lines.push(`# Brand Kit: ${domain}\n`);
  lines.push(`*Extracted from ${kit.meta.url ?? domain}*`);
  if (kit.meta.extractedAt) {
    lines.push(`*Date: ${kit.meta.extractedAt}*`);
  }
  if (kit.meta.durationMs) {
    lines.push(`*Duration: ${(kit.meta.durationMs / 1000).toFixed(1)}s*`);
  }
  lines.push("");

  // Identity
  if (kit.identity && hasAnyValue(kit.identity as unknown as Record<string, unknown>)) {
    lines.push("## Identity\n");
    if (kit.identity.brandName) lines.push(`- **Name:** ${kit.identity.brandName}`);
    if (kit.identity.tagline) lines.push(`- **Tagline:** "${kit.identity.tagline}"`);
    if (kit.identity.description) lines.push(`- **Description:** ${kit.identity.description}`);
    if (hasItems(kit.identity.archetypes)) {
      const archetypeStrs = kit.identity.archetypes!.map((a) => {
        if (a.confidence != null) return `${a.name} (${Math.round(a.confidence * 100)}%)`;
        return a.name;
      });
      lines.push(`- **Archetypes:** ${archetypeStrs.join(", ")}`);
    }
    lines.push("");
  }

  // Vibe
  if (kit.vibe && hasAnyValue(kit.vibe as unknown as Record<string, unknown>)) {
    lines.push(formatVibe(domain, kit.vibe, undefined));
  }

  // Colors
  if (kit.colors && hasAnyValue(kit.colors as unknown as Record<string, unknown>)) {
    lines.push(formatColors(domain, kit.colors));
  }

  // Typography
  if (kit.typography && hasAnyValue(kit.typography as unknown as Record<string, unknown>)) {
    lines.push(formatTypography(domain, kit.typography));
  }

  // Voice
  if (kit.voice && hasAnyValue(kit.voice as unknown as Record<string, unknown>)) {
    lines.push(formatVoice(domain, kit.voice));
  }

  // Rules
  if (kit.rules && hasAnyValue(kit.rules as unknown as Record<string, unknown>)) {
    lines.push(formatRules(domain, kit.rules));
  }

  // Logos
  if (hasItems(kit.logos)) {
    lines.push(`## Logos\n`);
    lines.push(`${kit.logos!.length} logo variant(s) found.\n`);
    for (const logo of kit.logos!) {
      const parts: string[] = [];
      if (logo.type) parts.push(logo.type);
      if (logo.format) parts.push(logo.format);
      if (logo.variant) parts.push(logo.variant);
      if (logo.dimensions) parts.push(`${logo.dimensions.width}x${logo.dimensions.height}`);
      lines.push(`- ${parts.join(" / ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Export Format Generators ────────────────────────────────────────────────

function generateCssExport(kit: BrandKit): string {
  const domain = kit.meta.domain ?? "unknown";
  const lines: string[] = [];

  lines.push(`/* ExtractVibe Brand Kit — ${domain} */`);
  lines.push(`/* Generated by extractvibe-mcp */`);
  lines.push("");
  lines.push(":root {");

  // Light mode colors
  const lightMode = kit.colors?.lightMode;
  if (lightMode) {
    const roles: (keyof ColorMode)[] = [
      "primary", "secondary", "accent", "background", "surface",
      "text", "border", "link", "muted",
    ];
    lines.push("  /* Colors — Light Mode */");
    for (const role of roles) {
      const color = lightMode[role];
      if (color?.hex) {
        lines.push(`  --ev-color-${role}: ${color.hex};`);
      }
    }
    lines.push("");
  }

  // Semantic colors
  const semantic = kit.colors?.semantic;
  if (semantic) {
    const roles: (keyof SemanticColors)[] = ["success", "warning", "error", "info"];
    let hasAny = false;
    for (const role of roles) {
      if (semantic[role]?.hex) { hasAny = true; break; }
    }
    if (hasAny) {
      lines.push("  /* Colors — Semantic */");
      for (const role of roles) {
        const color = semantic[role];
        if (color?.hex) {
          lines.push(`  --ev-color-${role}: ${color.hex};`);
        }
      }
      lines.push("");
    }
  }

  // Typography
  const headingFont = findFont(kit, "heading");
  const bodyFont = findFont(kit, "body");
  const monoFont = findFont(kit, "mono");
  if (headingFont || bodyFont || monoFont) {
    lines.push("  /* Typography */");
    if (headingFont) lines.push(`  --ev-font-heading: ${fontStack(headingFont)};`);
    if (bodyFont) lines.push(`  --ev-font-body: ${fontStack(bodyFont)};`);
    if (monoFont) lines.push(`  --ev-font-mono: ${fontStack(monoFont)};`);
    lines.push("");
  }

  // Type scale
  const scale = kit.typography?.scale;
  if (scale) {
    const levels: (keyof TypeScale)[] = ["h1", "h2", "h3", "h4", "h5", "h6", "body", "small", "caption"];
    let hasAny = false;
    for (const level of levels) { if (scale[level]) { hasAny = true; break; } }
    if (hasAny) {
      lines.push("  /* Type Scale */");
      for (const level of levels) {
        const entry = scale[level];
        if (!entry) continue;
        if (entry.fontSize) lines.push(`  --ev-text-${level}: ${entry.fontSize};`);
        if (entry.fontWeight != null) lines.push(`  --ev-text-${level}-weight: ${entry.fontWeight};`);
        if (entry.lineHeight) lines.push(`  --ev-text-${level}-line-height: ${entry.lineHeight};`);
        if (entry.letterSpacing) lines.push(`  --ev-text-${level}-letter-spacing: ${entry.letterSpacing};`);
      }
      lines.push("");
    }
  }

  // Spacing
  if (kit.spacing?.baseUnit) lines.push(`  --ev-spacing-base: ${kit.spacing.baseUnit};`);
  if (kit.spacing?.borderRadius?.small) lines.push(`  --ev-radius-sm: ${kit.spacing.borderRadius.small};`);
  if (kit.spacing?.borderRadius?.medium) lines.push(`  --ev-radius-md: ${kit.spacing.borderRadius.medium};`);
  if (kit.spacing?.borderRadius?.large) lines.push(`  --ev-radius-lg: ${kit.spacing.borderRadius.large};`);
  if (kit.spacing?.containerMaxWidth) lines.push(`  --ev-container-max-width: ${kit.spacing.containerMaxWidth};`);

  // Remove trailing blank line
  if (lines[lines.length - 1] === "") lines.pop();
  lines.push("}");

  // Dark mode
  const darkMode = kit.colors?.darkMode;
  if (darkMode && hasAnyValue(darkMode as unknown as Record<string, unknown>)) {
    lines.push("");
    lines.push("@media (prefers-color-scheme: dark) {");
    lines.push("  :root {");
    const roles: (keyof ColorMode)[] = [
      "primary", "secondary", "accent", "background", "surface",
      "text", "border", "link", "muted",
    ];
    for (const role of roles) {
      const color = darkMode[role];
      if (color?.hex) {
        lines.push(`    --ev-color-${role}: ${color.hex};`);
      }
    }
    lines.push("  }");
    lines.push("}");
  }

  return lines.join("\n") + "\n";
}

function generateTailwindExport(kit: BrandKit): string {
  const domain = kit.meta.domain ?? "unknown";
  const lines: string[] = [];

  lines.push(`/* ExtractVibe Tailwind Theme — ${domain} */`);
  lines.push("");
  lines.push("@theme {");

  // Colors
  const lightMode = kit.colors?.lightMode;
  if (lightMode) {
    const roles: (keyof ColorMode)[] = [
      "primary", "secondary", "accent", "background", "surface",
      "text", "border", "link", "muted",
    ];
    for (const role of roles) {
      const color = lightMode[role];
      if (color?.hex) {
        lines.push(`  --color-brand-${role}: ${color.hex};`);
      }
    }
    lines.push("");
  }

  // Semantic
  const semantic = kit.colors?.semantic;
  if (semantic) {
    const roles: (keyof SemanticColors)[] = ["success", "warning", "error", "info"];
    for (const role of roles) {
      const color = semantic[role];
      if (color?.hex) {
        lines.push(`  --color-${role}: ${color.hex};`);
      }
    }
    lines.push("");
  }

  // Fonts
  const headingFont = findFont(kit, "heading");
  const bodyFont = findFont(kit, "body");
  const monoFont = findFont(kit, "mono");
  if (headingFont) lines.push(`  --font-heading: ${fontStack(headingFont)};`);
  if (bodyFont) lines.push(`  --font-body: ${fontStack(bodyFont)};`);
  if (monoFont) lines.push(`  --font-mono: ${fontStack(monoFont)};`);

  // Border radius
  const radius = kit.spacing?.borderRadius;
  if (radius) {
    if (radius.small) lines.push(`  --radius-sm: ${radius.small};`);
    if (radius.medium) lines.push(`  --radius-md: ${radius.medium};`);
    if (radius.large) lines.push(`  --radius-lg: ${radius.large};`);
  }

  // Remove trailing blank line
  if (lines[lines.length - 1] === "") lines.pop();
  lines.push("}");

  return lines.join("\n") + "\n";
}

function generateMarkdownExport(kit: BrandKit): string {
  // Re-use the full brand kit formatter — it already produces markdown
  return formatFullBrandKit(kit);
}

function generateTokensExport(kit: BrandKit): string {
  const domain = kit.meta.domain ?? "unknown";
  const tokens: Record<string, unknown> = {
    $name: `${domain} Brand Tokens`,
    $description: "Extracted by ExtractVibe",
  };

  // Color tokens
  const colorTokens: Record<string, unknown> = {};
  const lightMode = kit.colors?.lightMode;
  if (lightMode) {
    const roles: (keyof ColorMode)[] = [
      "primary", "secondary", "accent", "background", "surface",
      "text", "border", "link", "muted",
    ];
    for (const role of roles) {
      const color = lightMode[role];
      if (color?.hex) {
        colorTokens[role] = { $value: color.hex, $type: "color" };
      }
    }
  }
  const semantic = kit.colors?.semantic;
  if (semantic) {
    const roles: (keyof SemanticColors)[] = ["success", "warning", "error", "info"];
    for (const role of roles) {
      const color = semantic[role];
      if (color?.hex) {
        colorTokens[role] = { $value: color.hex, $type: "color" };
      }
    }
  }
  if (Object.keys(colorTokens).length > 0) tokens["color"] = colorTokens;

  // Font tokens
  const fontTokens: Record<string, unknown> = {};
  for (const role of ["heading", "body", "mono", "display"]) {
    const font = findFont(kit, role);
    if (font?.name) {
      fontTokens[role] = { $value: font.name, $type: "fontFamily" };
    }
  }
  if (Object.keys(fontTokens).length > 0) tokens["font"] = fontTokens;

  // Spacing tokens
  const spacingTokens: Record<string, unknown> = {};
  if (kit.spacing?.baseUnit) spacingTokens["base"] = { $value: kit.spacing.baseUnit, $type: "dimension" };
  if (kit.spacing?.containerMaxWidth) spacingTokens["containerMaxWidth"] = { $value: kit.spacing.containerMaxWidth, $type: "dimension" };
  if (Object.keys(spacingTokens).length > 0) tokens["spacing"] = spacingTokens;

  // Border radius tokens
  const radiusTokens: Record<string, unknown> = {};
  const radius = kit.spacing?.borderRadius;
  if (radius?.small) radiusTokens["sm"] = { $value: radius.small, $type: "dimension" };
  if (radius?.medium) radiusTokens["md"] = { $value: radius.medium, $type: "dimension" };
  if (radius?.large) radiusTokens["lg"] = { $value: radius.large, $type: "dimension" };
  if (Object.keys(radiusTokens).length > 0) tokens["borderRadius"] = radiusTokens;

  return JSON.stringify(tokens, null, 2) + "\n";
}

// ─── Brand API Helpers ───────────────────────────────────────────────────────

async function fetchBrandByDomain(domain: string): Promise<BrandKit | string> {
  const result = await apiGet<BrandKit>(`/api/brand/${encodeURIComponent(domain)}`);
  if (isApiError(result)) {
    if (result.status === 404) {
      return `Brand kit for "${domain}" not found. You need to extract it first using the extract_brand tool with the full URL (e.g., https://${domain}).`;
    }
    if (result.status === 401) {
      return "Authentication failed. Check that EXTRACTVIBE_API_KEY is set correctly.";
    }
    return `API error: ${result.error}`;
  }
  return result;
}

// ─── Tool: extract_brand ─────────────────────────────────────────────────────

async function handleExtractBrand(url: string): Promise<string> {
  if (!API_KEY) {
    return "Error: EXTRACTVIBE_API_KEY environment variable is not set. Please configure your API key.";
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return "Error: URL must use http:// or https:// protocol.";
    }
  } catch {
    // If the user passed a bare domain, try to fix it
    try {
      parsedUrl = new URL(`https://${url}`);
    } catch {
      return "Error: Invalid URL. Please provide a valid URL like https://example.com";
    }
  }

  const domain = parsedUrl.hostname.replace(/^www\./, "");

  // Start extraction
  const startResult = await apiPost<{ jobId: string; domain: string }>("/api/extract", {
    url: parsedUrl.toString(),
  });

  if (isApiError(startResult)) {
    if (startResult.status === 401) {
      return "Error: Authentication failed. Check that your EXTRACTVIBE_API_KEY is valid.";
    }
    if (startResult.status === 402) {
      return "Error: No extraction credits remaining. Visit https://extractvibe.com to add more credits.";
    }
    return `Error starting extraction: ${startResult.error}`;
  }

  const jobId = startResult.jobId;

  // Poll for completion
  let attempts = 0;
  let lastStatus = "queued";

  while (attempts < POLL_MAX_ATTEMPTS) {
    await sleep(POLL_INTERVAL_MS);
    attempts++;

    const statusResult = await apiGet<{ jobId: string; status: { status: string; output?: unknown; error?: string } }>(
      `/api/extract/${jobId}`,
    );

    if (isApiError(statusResult)) {
      // Transient error — keep polling
      if (attempts > 5) {
        return `Error: Lost connection to extraction job after ${attempts} attempts. Job ID: ${jobId}`;
      }
      continue;
    }

    const status = statusResult.status?.status ?? statusResult.status;
    lastStatus = typeof status === "string" ? status : "unknown";

    if (lastStatus === "complete" || lastStatus === "completed") {
      // Fetch the full result
      const resultData = await apiGet<BrandKit>(`/api/extract/${jobId}/result`);
      if (isApiError(resultData)) {
        // Fall back to fetching by domain
        const brandData = await apiGet<BrandKit>(`/api/brand/${encodeURIComponent(domain)}`);
        if (isApiError(brandData)) {
          return `Extraction completed but could not fetch result. Job ID: ${jobId}\nTry using get_brand_colors, get_brand_typography, etc. with domain "${domain}".`;
        }
        return formatFullBrandKit(brandData);
      }
      return formatFullBrandKit(resultData);
    }

    if (lastStatus === "failed" || lastStatus === "error") {
      const errorMsg = statusResult.status?.error ?? "Unknown error";
      return `Extraction failed for ${parsedUrl.toString()}: ${errorMsg}`;
    }
  }

  return `Extraction timed out after ${Math.round((POLL_MAX_ATTEMPTS * POLL_INTERVAL_MS) / 1000)}s. Last status: ${lastStatus}. Job ID: ${jobId}\nThe extraction may still complete — try checking with get_brand_colors for domain "${domain}" in a few minutes.`;
}

// ─── MCP Server Setup ────────────────────────────────────────────────────────

const server = new McpServer({
  name: "extractvibe",
  version: "0.1.0",
});

// Tool: extract_brand
server.tool(
  "extract_brand",
  "Extract a comprehensive brand kit from a website URL. Returns colors, typography, voice analysis, brand rules, and vibe synthesis. Costs 1 credit per extraction.",
  {
    url: z.string().describe("The website URL to extract a brand kit from (e.g., https://stripe.com)"),
  },
  async ({ url }) => {
    const result = await handleExtractBrand(url);
    return {
      content: [{ type: "text", text: result }],
    };
  },
);

// Tool: get_brand_colors
server.tool(
  "get_brand_colors",
  "Get the color palette for a brand from a previously extracted domain. Returns light mode, dark mode, semantic, and raw palette colors.",
  {
    domain: z.string().describe("The domain to look up (e.g., stripe.com)"),
  },
  async ({ domain }) => {
    const kit = await fetchBrandByDomain(domain);
    if (typeof kit === "string") {
      return { content: [{ type: "text", text: kit }] };
    }
    if (!kit.colors || !hasAnyValue(kit.colors as unknown as Record<string, unknown>)) {
      return {
        content: [{ type: "text", text: `No color data found for ${domain}. The brand kit may have been extracted with limited data.` }],
      };
    }
    return {
      content: [{ type: "text", text: formatColors(domain, kit.colors) }],
    };
  },
);

// Tool: get_brand_typography
server.tool(
  "get_brand_typography",
  "Get the typography system for a brand, including font families, type scale, and conventions.",
  {
    domain: z.string().describe("The domain to look up (e.g., stripe.com)"),
  },
  async ({ domain }) => {
    const kit = await fetchBrandByDomain(domain);
    if (typeof kit === "string") {
      return { content: [{ type: "text", text: kit }] };
    }
    if (!kit.typography || !hasAnyValue(kit.typography as unknown as Record<string, unknown>)) {
      return {
        content: [{ type: "text", text: `No typography data found for ${domain}. The brand kit may have been extracted with limited data.` }],
      };
    }
    return {
      content: [{ type: "text", text: formatTypography(domain, kit.typography) }],
    };
  },
);

// Tool: get_brand_voice
server.tool(
  "get_brand_voice",
  "Get the brand voice analysis including tone spectrum, copywriting style, and content patterns.",
  {
    domain: z.string().describe("The domain to look up (e.g., stripe.com)"),
  },
  async ({ domain }) => {
    const kit = await fetchBrandByDomain(domain);
    if (typeof kit === "string") {
      return { content: [{ type: "text", text: kit }] };
    }
    if (!kit.voice || !hasAnyValue(kit.voice as unknown as Record<string, unknown>)) {
      return {
        content: [{ type: "text", text: `No voice data found for ${domain}. The brand kit may have been extracted with limited data.` }],
      };
    }
    return {
      content: [{ type: "text", text: formatVoice(domain, kit.voice) }],
    };
  },
);

// Tool: get_brand_rules
server.tool(
  "get_brand_rules",
  "Get the brand's DOs and DON'Ts -- AI-inferred rules about visual and verbal brand usage, plus vibe context.",
  {
    domain: z.string().describe("The domain to look up (e.g., stripe.com)"),
  },
  async ({ domain }) => {
    const kit = await fetchBrandByDomain(domain);
    if (typeof kit === "string") {
      return { content: [{ type: "text", text: kit }] };
    }
    if (!kit.rules || !hasAnyValue(kit.rules as unknown as Record<string, unknown>)) {
      return {
        content: [{ type: "text", text: `No brand rules found for ${domain}. The brand kit may have been extracted with limited data.` }],
      };
    }
    return {
      content: [{ type: "text", text: formatRules(domain, kit.rules, kit.vibe) }],
    };
  },
);

// Tool: get_brand_vibe
server.tool(
  "get_brand_vibe",
  "Get the holistic brand vibe -- summary, tags, visual energy, comparable brands, personality archetypes, and identity.",
  {
    domain: z.string().describe("The domain to look up (e.g., stripe.com)"),
  },
  async ({ domain }) => {
    const kit = await fetchBrandByDomain(domain);
    if (typeof kit === "string") {
      return { content: [{ type: "text", text: kit }] };
    }
    if (!kit.vibe || !hasAnyValue(kit.vibe as unknown as Record<string, unknown>)) {
      return {
        content: [{ type: "text", text: `No vibe data found for ${domain}. The brand kit may have been extracted with limited data.` }],
      };
    }
    return {
      content: [{ type: "text", text: formatVibe(domain, kit.vibe, kit.identity) }],
    };
  },
);

// Tool: export_brand
server.tool(
  "export_brand",
  "Export a brand kit in a specific format: css (CSS custom properties), tailwind (Tailwind CSS v4 @theme block), markdown (full report), or tokens (W3C design tokens JSON).",
  {
    domain: z.string().describe("The domain to export (e.g., stripe.com)"),
    format: z
      .enum(["css", "tailwind", "markdown", "tokens"])
      .describe("Export format: css, tailwind, markdown, or tokens"),
  },
  async ({ domain, format }) => {
    const kit = await fetchBrandByDomain(domain);
    if (typeof kit === "string") {
      return { content: [{ type: "text", text: kit }] };
    }

    let output: string;
    let label: string;

    switch (format) {
      case "css":
        output = generateCssExport(kit);
        label = "CSS Custom Properties";
        break;
      case "tailwind":
        output = generateTailwindExport(kit);
        label = "Tailwind CSS v4 Theme";
        break;
      case "markdown":
        output = generateMarkdownExport(kit);
        label = "Markdown Report";
        break;
      case "tokens":
        output = generateTokensExport(kit);
        label = "W3C Design Tokens";
        break;
    }

    return {
      content: [
        {
          type: "text",
          text: `## ${domain} — ${label}\n\n\`\`\`${format === "tokens" ? "json" : format === "markdown" ? "markdown" : "css"}\n${output}\`\`\``,
        },
      ],
    };
  },
);

// ─── Start Server ────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error starting ExtractVibe MCP server:", err);
  process.exit(1);
});
