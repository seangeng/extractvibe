/**
 * ExtractVibe Export Format Generators
 *
 * Takes an ExtractVibeBrandKit and converts it to various developer-friendly formats:
 * - CSS Variables
 * - Tailwind CSS v4 @theme block
 * - Markdown report
 * - W3C Design Tokens (JSON)
 */

import type {
  ExtractVibeBrandKit,
  ColorMode,
  SemanticColors,
  FontFamily,
  TypeScale,
} from "../schema/v1";
import { SCHEMA_VERSION } from "../schema/v1";

// ─── Helpers ────────────────────────────────────────────────────────────

/** Returns the domain string from the kit, falling back to the URL or "unknown". */
function getDomain(kit: ExtractVibeBrandKit): string {
  return kit.meta.domain ?? kit.meta.url ?? "unknown";
}

/** Returns today's date as YYYY-MM-DD. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns today's date in a human-readable format like "March 16, 2026". */
function todayHuman(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Checks if a value is non-null, non-undefined, and (for strings) non-empty. */
function hasValue(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string" && v.trim() === "") return false;
  return true;
}

/** Checks if an array has any elements. */
function hasItems(arr: unknown[] | undefined | null): arr is unknown[] & { length: number } {
  return Array.isArray(arr) && arr.length > 0;
}

/** Checks if an object has at least one defined value. */
function hasAnyValue(obj: Record<string, unknown> | undefined | null): boolean {
  if (!obj) return false;
  return Object.values(obj).some((v) => hasValue(v));
}

/** Build a CSS font-family string from a FontFamily object. */
function fontStack(font: FontFamily): string {
  const parts: string[] = [];
  if (font.name) {
    parts.push(`"${font.name}"`);
  }
  if (font.fallbackStack) {
    parts.push(font.fallbackStack);
  }
  return parts.join(", ") || "sans-serif";
}

/** Find a font family by role. */
function findFont(kit: ExtractVibeBrandKit, role: string): FontFamily | undefined {
  return kit.typography?.families?.find((f) => f.role === role);
}

// ─── 1. CSS Variables Export ────────────────────────────────────────────

export function exportCssVariables(kit: ExtractVibeBrandKit): string {
  const lines: string[] = [];
  const domain = getDomain(kit);

  lines.push(`/* ExtractVibe Brand Kit — ${domain} */`);
  lines.push(`/* Generated: ${today()} */`);
  lines.push(`/* Schema: ${SCHEMA_VERSION} */`);
  lines.push("");
  lines.push(":root {");

  let hasContent = false;

  // Colors — Light Mode
  const lightMode = kit.colors?.lightMode;
  if (lightMode && hasAnyValue(lightMode as unknown as Record<string, unknown>)) {
    hasContent = true;
    lines.push("  /* Colors — Light Mode */");
    appendColorModeVars(lines, lightMode, "ev-color");
    lines.push("");
  }

  // Colors — Semantic
  const semantic = kit.colors?.semantic;
  if (semantic && hasAnyValue(semantic as unknown as Record<string, unknown>)) {
    hasContent = true;
    lines.push("  /* Colors — Semantic */");
    const roles: (keyof SemanticColors)[] = ["success", "warning", "error", "info"];
    for (const role of roles) {
      const color = semantic[role];
      if (color?.hex) {
        lines.push(`  --ev-color-${role}: ${color.hex};`);
      }
    }
    lines.push("");
  }

  // Typography
  const headingFont = findFont(kit, "heading");
  const bodyFont = findFont(kit, "body");
  const monoFont = findFont(kit, "mono");
  const displayFont = findFont(kit, "display");

  if (headingFont || bodyFont || monoFont || displayFont) {
    hasContent = true;
    lines.push("  /* Typography */");
    if (headingFont) lines.push(`  --ev-font-heading: ${fontStack(headingFont)};`);
    if (bodyFont) lines.push(`  --ev-font-body: ${fontStack(bodyFont)};`);
    if (monoFont) lines.push(`  --ev-font-mono: ${fontStack(monoFont)};`);
    if (displayFont) lines.push(`  --ev-font-display: ${fontStack(displayFont)};`);
    lines.push("");
  }

  // Type Scale
  const scale = kit.typography?.scale;
  if (scale && hasAnyValue(scale as unknown as Record<string, unknown>)) {
    hasContent = true;
    lines.push("  /* Type Scale */");
    const levels: (keyof TypeScale)[] = ["h1", "h2", "h3", "h4", "h5", "h6", "body", "small", "caption"];
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

  // Spacing
  const spacing = kit.spacing;
  if (spacing) {
    const spacingLines: string[] = [];
    if (spacing.baseUnit) spacingLines.push(`  --ev-spacing-base: ${spacing.baseUnit};`);
    if (spacing.borderRadius?.small) spacingLines.push(`  --ev-radius-sm: ${spacing.borderRadius.small};`);
    if (spacing.borderRadius?.medium) spacingLines.push(`  --ev-radius-md: ${spacing.borderRadius.medium};`);
    if (spacing.borderRadius?.large) spacingLines.push(`  --ev-radius-lg: ${spacing.borderRadius.large};`);
    if (spacing.containerMaxWidth) spacingLines.push(`  --ev-container-max-width: ${spacing.containerMaxWidth};`);

    if (spacingLines.length > 0) {
      hasContent = true;
      lines.push("  /* Spacing */");
      lines.push(...spacingLines);
      lines.push("");
    }
  }

  // Remove trailing blank line before closing brace
  if (lines[lines.length - 1] === "") {
    lines.pop();
  }

  lines.push("}");

  // Dark Mode
  const darkMode = kit.colors?.darkMode;
  if (darkMode && hasAnyValue(darkMode as unknown as Record<string, unknown>)) {
    lines.push("");
    lines.push("/* Dark Mode */");
    lines.push("@media (prefers-color-scheme: dark) {");
    lines.push("  :root {");
    appendColorModeVars(lines, darkMode, "ev-color", "    ");
    lines.push("  }");
    lines.push("}");
  }

  if (!hasContent) {
    return `/* ExtractVibe Brand Kit — ${domain} */\n/* No data available for CSS export */\n`;
  }

  return lines.join("\n") + "\n";
}

function appendColorModeVars(
  lines: string[],
  mode: ColorMode,
  prefix: string,
  indent: string = "  "
): void {
  const roles: (keyof ColorMode)[] = [
    "primary",
    "secondary",
    "accent",
    "background",
    "surface",
    "text",
    "border",
    "link",
    "muted",
  ];
  for (const role of roles) {
    const color = mode[role];
    if (color?.hex) {
      lines.push(`${indent}--${prefix}-${role}: ${color.hex};`);
    }
  }
}

// ─── 2. Tailwind Config Export ──────────────────────────────────────────

export function exportTailwindConfig(kit: ExtractVibeBrandKit): string {
  const lines: string[] = [];
  const domain = getDomain(kit);

  lines.push(`/* ExtractVibe Tailwind Theme — ${domain} */`);
  lines.push("");
  lines.push("@theme {");

  let hasContent = false;

  // Colors
  const lightMode = kit.colors?.lightMode;
  if (lightMode && hasAnyValue(lightMode as unknown as Record<string, unknown>)) {
    const roles: (keyof ColorMode)[] = [
      "primary",
      "secondary",
      "accent",
      "background",
      "surface",
      "text",
      "border",
      "link",
      "muted",
    ];
    for (const role of roles) {
      const color = lightMode[role];
      if (color?.hex) {
        hasContent = true;
        lines.push(`  --color-brand-${role}: ${color.hex};`);
      }
    }
    lines.push("");
  }

  // Semantic colors
  const semantic = kit.colors?.semantic;
  if (semantic && hasAnyValue(semantic as unknown as Record<string, unknown>)) {
    const roles: (keyof SemanticColors)[] = ["success", "warning", "error", "info"];
    for (const role of roles) {
      const color = semantic[role];
      if (color?.hex) {
        hasContent = true;
        lines.push(`  --color-${role}: ${color.hex};`);
      }
    }
    lines.push("");
  }

  // Fonts
  const headingFont = findFont(kit, "heading");
  const bodyFont = findFont(kit, "body");
  const monoFont = findFont(kit, "mono");
  const displayFont = findFont(kit, "display");

  if (headingFont || bodyFont || monoFont || displayFont) {
    if (headingFont) {
      hasContent = true;
      lines.push(`  --font-heading: ${fontStack(headingFont)};`);
    }
    if (bodyFont) {
      hasContent = true;
      lines.push(`  --font-body: ${fontStack(bodyFont)};`);
    }
    if (monoFont) {
      hasContent = true;
      lines.push(`  --font-mono: ${fontStack(monoFont)};`);
    }
    if (displayFont) {
      hasContent = true;
      lines.push(`  --font-display: ${fontStack(displayFont)};`);
    }
    lines.push("");
  }

  // Border radius
  const radius = kit.spacing?.borderRadius;
  if (radius && hasAnyValue(radius as unknown as Record<string, unknown>)) {
    if (radius.small) {
      hasContent = true;
      lines.push(`  --radius-sm: ${radius.small};`);
    }
    if (radius.medium) {
      hasContent = true;
      lines.push(`  --radius-md: ${radius.medium};`);
    }
    if (radius.large) {
      hasContent = true;
      lines.push(`  --radius-lg: ${radius.large};`);
    }
    lines.push("");
  }

  // Spacing base
  if (kit.spacing?.baseUnit) {
    hasContent = true;
    lines.push(`  --spacing-base: ${kit.spacing.baseUnit};`);
    lines.push("");
  }

  // Remove trailing blank line before closing brace
  if (lines[lines.length - 1] === "") {
    lines.pop();
  }

  lines.push("}");

  if (!hasContent) {
    return `/* ExtractVibe Tailwind Theme — ${domain} */\n/* No data available for Tailwind export */\n`;
  }

  return lines.join("\n") + "\n";
}

// ─── 3. Markdown Report Export ──────────────────────────────────────────

export function exportMarkdownReport(kit: ExtractVibeBrandKit): string {
  const lines: string[] = [];
  const domain = getDomain(kit);

  lines.push(`# Brand Kit: ${domain}`);
  lines.push("");
  lines.push(`> Extracted by [ExtractVibe](https://extractvibe.com) on ${todayHuman()}`);
  lines.push("");

  // ── Vibe Section ──
  if (kit.vibe && hasAnyValue(kit.vibe as unknown as Record<string, unknown>)) {
    lines.push("## Vibe");
    if (kit.vibe.summary) {
      lines.push(`> "${kit.vibe.summary}"`);
      lines.push("");
    }
    const vibeParts: string[] = [];
    if (hasItems(kit.vibe.tags)) {
      vibeParts.push(`**Tags:** ${kit.vibe.tags.join(", ")}`);
    }
    if (kit.vibe.visualEnergy != null) {
      vibeParts.push(`**Visual Energy:** ${kit.vibe.visualEnergy}/10 (${kit.vibe.visualEnergy <= 3 ? "calm/understated" : kit.vibe.visualEnergy <= 6 ? "moderate" : "high-energy/bold"})`);
    }
    if (kit.vibe.designEra) {
      vibeParts.push(`**Design Era:** ${kit.vibe.designEra}`);
    }
    if (hasItems(kit.vibe.comparableBrands)) {
      vibeParts.push(`**Comparable Brands:** ${kit.vibe.comparableBrands.join(", ")}`);
    }
    if (kit.vibe.emotionalTone) {
      vibeParts.push(`**Emotional Tone:** ${kit.vibe.emotionalTone}`);
    }
    if (kit.vibe.targetAudienceInferred) {
      vibeParts.push(`**Target Audience:** ${kit.vibe.targetAudienceInferred}`);
    }
    for (const part of vibeParts) {
      lines.push(part);
    }
    lines.push("");
  }

  // ── Brand Identity Section ──
  if (kit.identity && hasAnyValue(kit.identity as unknown as Record<string, unknown>)) {
    lines.push("## Brand Identity");
    if (kit.identity.brandName) lines.push(`- **Name:** ${kit.identity.brandName}`);
    if (kit.identity.tagline) lines.push(`- **Tagline:** ${kit.identity.tagline}`);
    if (kit.identity.description) lines.push(`- **Description:** ${kit.identity.description}`);
    if (hasItems(kit.identity.archetypes)) {
      const archetypeStrs = kit.identity.archetypes.map((a) => {
        if (a.confidence != null) {
          return `${a.name} (${Math.round(a.confidence * 100)}%)`;
        }
        return a.name;
      });
      lines.push(`- **Archetypes:** ${archetypeStrs.join(", ")}`);
    }
    lines.push("");
  }

  // ── Colors Section ──
  const hasLightMode = kit.colors?.lightMode && hasAnyValue(kit.colors.lightMode as unknown as Record<string, unknown>);
  const hasDarkMode = kit.colors?.darkMode && hasAnyValue(kit.colors.darkMode as unknown as Record<string, unknown>);
  const hasSemantic = kit.colors?.semantic && hasAnyValue(kit.colors.semantic as unknown as Record<string, unknown>);

  if (hasLightMode || hasDarkMode || hasSemantic) {
    lines.push("## Colors");
    lines.push("");

    if (hasLightMode) {
      lines.push("### Light Mode");
      lines.push("| Role | Color | Hex |");
      lines.push("|------|-------|-----|");
      appendColorTableRows(lines, kit.colors!.lightMode!);
      lines.push("");
    }

    if (hasDarkMode) {
      lines.push("### Dark Mode");
      lines.push("| Role | Color | Hex |");
      lines.push("|------|-------|-----|");
      appendColorTableRows(lines, kit.colors!.darkMode!);
      lines.push("");
    }

    if (hasSemantic) {
      lines.push("### Semantic");
      lines.push("| Role | Color | Hex |");
      lines.push("|------|-------|-----|");
      const semanticRoles: (keyof SemanticColors)[] = ["success", "warning", "error", "info"];
      for (const role of semanticRoles) {
        const color = kit.colors!.semantic![role];
        if (color?.hex) {
          lines.push(`| ${capitalize(role)} | ${colorSwatch(color.hex)} | \`${color.hex}\` |`);
        }
      }
      lines.push("");
    }
  }

  // ── Typography Section ──
  const hasFamilies = hasItems(kit.typography?.families);
  const hasScale = kit.typography?.scale && hasAnyValue(kit.typography.scale as unknown as Record<string, unknown>);

  if (hasFamilies || hasScale) {
    lines.push("## Typography");
    lines.push("");

    if (hasFamilies) {
      lines.push("| Role | Font | Weights |");
      lines.push("|------|------|---------|");
      for (const font of kit.typography!.families!) {
        if (!font.name) continue;
        const role = font.role ? capitalize(font.role) : "Unknown";
        const weights = hasItems(font.weights) ? font.weights.join(", ") : "—";
        lines.push(`| ${role} | ${font.name} | ${weights} |`);
      }
      lines.push("");
    }

    if (hasScale) {
      lines.push("### Type Scale");
      lines.push("| Level | Size | Weight | Line Height |");
      lines.push("|-------|------|--------|-------------|");
      const levels: (keyof TypeScale)[] = ["h1", "h2", "h3", "h4", "h5", "h6", "body", "small", "caption"];
      for (const level of levels) {
        const entry = kit.typography!.scale![level];
        if (!entry) continue;
        const size = entry.fontSize ?? "—";
        const weight = entry.fontWeight != null ? String(entry.fontWeight) : "—";
        const lh = entry.lineHeight ?? "—";
        lines.push(`| ${level.toUpperCase()} | ${size} | ${weight} | ${lh} |`);
      }
      lines.push("");
    }

    if (kit.typography?.conventions) {
      const conv = kit.typography.conventions;
      if (hasAnyValue(conv as unknown as Record<string, unknown>)) {
        lines.push("### Conventions");
        if (conv.headingCase) lines.push(`- **Heading Case:** ${conv.headingCase}`);
        if (conv.bodyLineHeight) lines.push(`- **Body Line Height:** ${conv.bodyLineHeight}`);
        if (conv.codeFont) lines.push(`- **Code Font:** ${conv.codeFont}`);
        lines.push("");
      }
    }
  }

  // ── Spacing Section ──
  if (kit.spacing && hasAnyValue(kit.spacing as unknown as Record<string, unknown>)) {
    const sp = kit.spacing;
    const spacingParts: string[] = [];
    if (sp.baseUnit) spacingParts.push(`- **Base Unit:** ${sp.baseUnit}`);
    if (sp.containerMaxWidth) spacingParts.push(`- **Container Max Width:** ${sp.containerMaxWidth}`);
    if (sp.borderRadius?.small) spacingParts.push(`- **Border Radius (sm):** ${sp.borderRadius.small}`);
    if (sp.borderRadius?.medium) spacingParts.push(`- **Border Radius (md):** ${sp.borderRadius.medium}`);
    if (sp.borderRadius?.large) spacingParts.push(`- **Border Radius (lg):** ${sp.borderRadius.large}`);
    if (sp.grid) {
      if (sp.grid.columns != null) spacingParts.push(`- **Grid Columns:** ${sp.grid.columns}`);
      if (sp.grid.gap) spacingParts.push(`- **Grid Gap:** ${sp.grid.gap}`);
    }
    if (spacingParts.length > 0) {
      lines.push("## Spacing & Layout");
      lines.push(...spacingParts);
      lines.push("");
    }
  }

  // ── Voice & Personality Section ──
  if (kit.voice && hasAnyValue(kit.voice as unknown as Record<string, unknown>)) {
    lines.push("## Voice & Personality");
    lines.push("");

    // Tone Spectrum
    const tone = kit.voice.toneSpectrum;
    if (tone && hasAnyValue(tone as unknown as Record<string, unknown>)) {
      lines.push("### Tone Spectrum");
      appendToneAxis(lines, "Formal", "Casual", tone.formalCasual);
      appendToneAxis(lines, "Playful", "Serious", tone.playfulSerious);
      appendToneAxis(lines, "Enthusiastic", "Matter-of-fact", tone.enthusiasticMatterOfFact);
      appendToneAxis(lines, "Respectful", "Irreverent", tone.respectfulIrreverent);
      appendToneAxis(lines, "Technical", "Accessible", tone.technicalAccessible);
      lines.push("");
    }

    // Copywriting Style
    const copy = kit.voice.copywritingStyle;
    if (copy && hasAnyValue(copy as unknown as Record<string, unknown>)) {
      lines.push("### Copywriting Style");
      if (copy.avgSentenceLength != null) lines.push(`- **Average sentence length:** ${copy.avgSentenceLength} words`);
      if (copy.vocabularyComplexity) lines.push(`- **Vocabulary:** ${copy.vocabularyComplexity}`);
      if (copy.jargonUsage) lines.push(`- **Jargon:** ${copy.jargonUsage}`);
      if (hasItems(copy.rhetoricalDevices)) lines.push(`- **Rhetorical devices:** ${copy.rhetoricalDevices.join(", ")}`);
      if (copy.ctaStyle) lines.push(`- **CTA style:** "${copy.ctaStyle}"`);
      lines.push("");
    }

    // Content Patterns
    const patterns = kit.voice.contentPatterns;
    if (patterns && hasAnyValue(patterns as unknown as Record<string, unknown>)) {
      lines.push("### Content Patterns");
      if (patterns.headingCase) lines.push(`- **Heading case:** ${patterns.headingCase}`);
      if (patterns.emojiUsage) lines.push(`- **Emoji usage:** ${patterns.emojiUsage}`);
      if (patterns.exclamationFrequency) lines.push(`- **Exclamation frequency:** ${patterns.exclamationFrequency}`);
      if (patterns.questionUsageInHeadings != null) lines.push(`- **Questions in headings:** ${patterns.questionUsageInHeadings ? "yes" : "no"}`);
      if (patterns.bulletPreference != null) lines.push(`- **Bullet preference:** ${patterns.bulletPreference ? "yes" : "no"}`);
      lines.push("");
    }

    // Sample Copy
    if (hasItems(kit.voice.sampleCopy)) {
      lines.push("### Sample Copy");
      for (const sample of kit.voice.sampleCopy) {
        lines.push(`> "${sample}"`);
        lines.push("");
      }
    }
  }

  // ── Brand Rules Section ──
  const hasDos = hasItems(kit.rules?.dos);
  const hasDonts = hasItems(kit.rules?.donts);

  if (hasDos || hasDonts) {
    lines.push("## Brand Rules");
    lines.push("");

    if (hasDos) {
      lines.push("### DOs");
      for (const rule of kit.rules!.dos!) {
        lines.push(`- ${rule}`);
      }
      lines.push("");
    }

    if (hasDonts) {
      lines.push("### DON'Ts");
      for (const rule of kit.rules!.donts!) {
        lines.push(`- ${rule}`);
      }
      lines.push("");
    }
  }

  // ── Logos Section ──
  if (hasItems(kit.logos)) {
    const logoCount = kit.logos.length;
    const types = [...new Set(kit.logos.map((l) => l.type).filter(Boolean))];
    lines.push("## Logos");
    lines.push(`Found ${logoCount} logo variant${logoCount !== 1 ? "s" : ""}${types.length > 0 ? ` (${types.join(", ")})` : ""}`);
    lines.push("");

    lines.push("| Type | Format | Variant | Dimensions |");
    lines.push("|------|--------|---------|------------|");
    for (const logo of kit.logos) {
      const type = logo.type ?? "—";
      const format = logo.format ?? "—";
      const variant = logo.variant ?? "—";
      const dims = logo.dimensions ? `${logo.dimensions.width}x${logo.dimensions.height}` : "—";
      lines.push(`| ${type} | ${format} | ${variant} | ${dims} |`);
    }
    lines.push("");
  }

  // ── Assets Section ──
  if (hasItems(kit.assets)) {
    lines.push("## Assets");
    lines.push(`Found ${kit.assets.length} visual asset${kit.assets.length !== 1 ? "s" : ""}`);
    lines.push("");

    lines.push("| Type | Format | Context |");
    lines.push("|------|--------|---------|");
    for (const asset of kit.assets) {
      const type = asset.type ?? "—";
      const format = asset.format ?? "—";
      const context = asset.context ?? "—";
      lines.push(`| ${type} | ${format} | ${context} |`);
    }
    lines.push("");
  }

  // ── Official Guidelines Section ──
  if (kit.officialGuidelines) {
    const og = kit.officialGuidelines;
    if (og.hasOfficialKit || og.discoveredUrl || hasItems(og.guidelineRules)) {
      lines.push("## Official Guidelines");
      if (og.hasOfficialKit) lines.push("- This brand has an official brand kit.");
      if (og.discoveredUrl) lines.push(`- **URL:** ${og.discoveredUrl}`);
      if (hasItems(og.guidelineRules)) {
        lines.push("- **Official rules:**");
        for (const rule of og.guidelineRules) {
          lines.push(`  - ${rule}`);
        }
      }
      lines.push("");
    }
  }

  // ── Footer ──
  lines.push("---");
  lines.push("*Generated by [ExtractVibe](https://extractvibe.com) — The brand kit your website already has.*");
  lines.push("");

  return lines.join("\n");
}

// Markdown helpers

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function colorSwatch(hex: string): string {
  // Use simple colored square emoji based on rough hue
  // This is a best-effort visual indicator for markdown
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return "?";

  const brightness = (r + g + b) / 3;

  if (brightness > 240) return "\u2B1C"; // white square
  if (brightness < 30) return "\u2B1B";  // black square

  if (r > g && r > b) return "\uD83D\uDFE5"; // red square
  if (g > r && g > b) return "\uD83D\uDFE9"; // green square
  if (b > r && b > g) return "\uD83D\uDFE6"; // blue square

  if (r > 200 && g > 150 && b < 100) return "\uD83D\uDFE7"; // orange square
  if (r > 200 && g > 200 && b < 100) return "\uD83D\uDFE8"; // yellow square
  if (r > 100 && b > 100 && g < 100) return "\uD83D\uDFEA"; // purple square

  return "\uD83D\uDFEB"; // brown square fallback
}

function appendColorTableRows(lines: string[], mode: ColorMode): void {
  const roles: (keyof ColorMode)[] = [
    "primary",
    "secondary",
    "accent",
    "background",
    "surface",
    "text",
    "border",
    "link",
    "muted",
  ];
  for (const role of roles) {
    const color = mode[role];
    if (color?.hex) {
      lines.push(`| ${capitalize(role)} | ${colorSwatch(color.hex)} | \`${color.hex}\` |`);
    }
  }
}

function appendToneAxis(
  lines: string[],
  leftLabel: string,
  rightLabel: string,
  value: number | undefined
): void {
  if (value == null) return;
  // Build a visual scale: e.g. "Formal <---*-------> Casual (3/10)"
  const barLength = 9;
  const position = Math.max(0, Math.min(barLength, Math.round(((value - 1) / 9) * barLength)));
  const bar = "\u2014".repeat(position) + "\u25CF" + "\u2014".repeat(barLength - position);
  lines.push(`- ${leftLabel} <${bar}> ${rightLabel} (${value}/10)`);
}

// ─── 4. Design Tokens Export (W3C format) ───────────────────────────────

export function exportDesignTokens(kit: ExtractVibeBrandKit): string {
  const domain = getDomain(kit);

  const tokens: Record<string, unknown> = {
    $name: `${domain} Brand Tokens`,
    $description: "Extracted by ExtractVibe",
  };

  // Color tokens
  const colorTokens: Record<string, unknown> = {};
  let hasColors = false;

  // Light mode colors
  const lightMode = kit.colors?.lightMode;
  if (lightMode) {
    const roles: (keyof ColorMode)[] = [
      "primary",
      "secondary",
      "accent",
      "background",
      "surface",
      "text",
      "border",
      "link",
      "muted",
    ];
    for (const role of roles) {
      const color = lightMode[role];
      if (color?.hex) {
        colorTokens[role] = { $value: color.hex, $type: "color" };
        hasColors = true;
      }
    }
  }

  // Semantic colors
  const semantic = kit.colors?.semantic;
  if (semantic) {
    const semanticRoles: (keyof SemanticColors)[] = ["success", "warning", "error", "info"];
    for (const role of semanticRoles) {
      const color = semantic[role];
      if (color?.hex) {
        colorTokens[role] = { $value: color.hex, $type: "color" };
        hasColors = true;
      }
    }
  }

  // Dark mode colors (nested under "dark" group)
  const darkMode = kit.colors?.darkMode;
  if (darkMode && hasAnyValue(darkMode as unknown as Record<string, unknown>)) {
    const darkTokens: Record<string, unknown> = {};
    const roles: (keyof ColorMode)[] = [
      "primary",
      "secondary",
      "accent",
      "background",
      "surface",
      "text",
      "border",
      "link",
      "muted",
    ];
    for (const role of roles) {
      const color = darkMode[role];
      if (color?.hex) {
        darkTokens[role] = { $value: color.hex, $type: "color" };
        hasColors = true;
      }
    }
    if (Object.keys(darkTokens).length > 0) {
      colorTokens["dark"] = darkTokens;
    }
  }

  if (hasColors) {
    tokens["color"] = colorTokens;
  }

  // Font tokens
  const fontTokens: Record<string, unknown> = {};
  let hasFonts = false;

  const fontRoles: string[] = ["heading", "body", "mono", "display"];
  for (const role of fontRoles) {
    const font = findFont(kit, role);
    if (font?.name) {
      fontTokens[role] = { $value: font.name, $type: "fontFamily" };
      hasFonts = true;
    }
  }

  if (hasFonts) {
    tokens["font"] = fontTokens;
  }

  // Type scale tokens
  const typeScaleTokens: Record<string, unknown> = {};
  let hasTypeScale = false;

  const scale = kit.typography?.scale;
  if (scale) {
    const levels: (keyof TypeScale)[] = ["h1", "h2", "h3", "h4", "h5", "h6", "body", "small", "caption"];
    for (const level of levels) {
      const entry = scale[level];
      if (!entry) continue;

      const levelTokens: Record<string, unknown> = {};
      let hasLevelData = false;

      if (entry.fontSize) {
        levelTokens["fontSize"] = { $value: entry.fontSize, $type: "dimension" };
        hasLevelData = true;
      }
      if (entry.fontWeight != null) {
        levelTokens["fontWeight"] = { $value: entry.fontWeight, $type: "fontWeight" };
        hasLevelData = true;
      }
      if (entry.lineHeight) {
        levelTokens["lineHeight"] = { $value: entry.lineHeight, $type: "dimension" };
        hasLevelData = true;
      }
      if (entry.letterSpacing) {
        levelTokens["letterSpacing"] = { $value: entry.letterSpacing, $type: "dimension" };
        hasLevelData = true;
      }

      if (hasLevelData) {
        typeScaleTokens[level] = levelTokens;
        hasTypeScale = true;
      }
    }
  }

  if (hasTypeScale) {
    tokens["typeScale"] = typeScaleTokens;
  }

  // Spacing tokens
  const spacingTokens: Record<string, unknown> = {};
  let hasSpacing = false;

  if (kit.spacing?.baseUnit) {
    spacingTokens["base"] = { $value: kit.spacing.baseUnit, $type: "dimension" };
    hasSpacing = true;
  }
  if (kit.spacing?.containerMaxWidth) {
    spacingTokens["containerMaxWidth"] = { $value: kit.spacing.containerMaxWidth, $type: "dimension" };
    hasSpacing = true;
  }

  if (hasSpacing) {
    tokens["spacing"] = spacingTokens;
  }

  // Border radius tokens
  const radiusTokens: Record<string, unknown> = {};
  let hasRadius = false;

  const radius = kit.spacing?.borderRadius;
  if (radius) {
    if (radius.small) {
      radiusTokens["sm"] = { $value: radius.small, $type: "dimension" };
      hasRadius = true;
    }
    if (radius.medium) {
      radiusTokens["md"] = { $value: radius.medium, $type: "dimension" };
      hasRadius = true;
    }
    if (radius.large) {
      radiusTokens["lg"] = { $value: radius.large, $type: "dimension" };
      hasRadius = true;
    }
  }

  if (hasRadius) {
    tokens["borderRadius"] = radiusTokens;
  }

  return JSON.stringify(tokens, null, 2) + "\n";
}
