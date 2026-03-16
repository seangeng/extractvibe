#!/usr/bin/env node

// index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
var API_KEY = process.env.EXTRACTVIBE_API_KEY;
var BASE_URL = (process.env.EXTRACTVIBE_BASE_URL ?? "https://extractvibe.com").replace(
  /\/$/,
  ""
);
var POLL_INTERVAL_MS = 3e3;
var POLL_MAX_ATTEMPTS = 120;
function headers() {
  const h = {
    "Content-Type": "application/json",
    "User-Agent": "extractvibe-mcp/0.1.0"
  };
  if (API_KEY) {
    h["Authorization"] = `Bearer ${API_KEY}`;
  }
  return h;
}
async function apiGet(path) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) {
      const body = await res.text();
      let message;
      try {
        message = JSON.parse(body).error ?? body;
      } catch {
        message = body;
      }
      return { error: message, status: res.status };
    }
    return await res.json();
  } catch (err) {
    return { error: `Network error: ${err.message}`, status: 0 };
  }
}
async function apiPost(path, body) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const text = await res.text();
      let message;
      try {
        message = JSON.parse(text).error ?? text;
      } catch {
        message = text;
      }
      return { error: message, status: res.status };
    }
    return await res.json();
  } catch (err) {
    return { error: `Network error: ${err.message}`, status: 0 };
  }
}
function isApiError(v) {
  return typeof v === "object" && v !== null && "error" in v && "status" in v;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function hasValue(v) {
  if (v == null) return false;
  if (typeof v === "string" && v.trim() === "") return false;
  return true;
}
function hasItems(arr) {
  return Array.isArray(arr) && arr.length > 0;
}
function hasAnyValue(obj) {
  if (!obj) return false;
  return Object.values(obj).some((v) => hasValue(v));
}
function fontStack(font) {
  const parts = [];
  if (font.name) parts.push(`"${font.name}"`);
  if (font.fallbackStack) parts.push(font.fallbackStack);
  return parts.join(", ") || "sans-serif";
}
function findFont(kit, role) {
  return kit.typography?.families?.find((f) => f.role === role);
}
function formatColors(domain, colors) {
  const lines = [];
  lines.push(`## ${domain} \u2014 Color Palette
`);
  const lightMode = colors.lightMode;
  if (lightMode && hasAnyValue(lightMode)) {
    lines.push("### Light Mode");
    const roles = [
      "primary",
      "secondary",
      "accent",
      "background",
      "surface",
      "text",
      "border",
      "link",
      "muted"
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
  if (darkMode && hasAnyValue(darkMode)) {
    lines.push("### Dark Mode");
    const roles = [
      "primary",
      "secondary",
      "accent",
      "background",
      "surface",
      "text",
      "border",
      "link",
      "muted"
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
  if (semantic && hasAnyValue(semantic)) {
    lines.push("### Semantic");
    const roles = ["success", "warning", "error", "info"];
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
    lines.push(`### Raw Palette
${rawPalette.length} unique color${rawPalette.length !== 1 ? "s" : ""} detected`);
    lines.push("");
  }
  return lines.join("\n");
}
function formatTypography(domain, typography) {
  const lines = [];
  lines.push(`## ${domain} \u2014 Typography
`);
  if (hasItems(typography.families)) {
    lines.push("### Font Families");
    for (const font of typography.families) {
      if (!font.name) continue;
      const role = font.role ? capitalize(font.role) : "Unknown";
      const weights = hasItems(font.weights) ? font.weights.join(", ") : "default";
      const source = font.source ? ` (${font.source})` : "";
      lines.push(`- **${role}:** ${font.name} \u2014 weights: ${weights}${source}`);
    }
    lines.push("");
  }
  const scale = typography.scale;
  if (scale && hasAnyValue(scale)) {
    lines.push("### Type Scale");
    const levels = ["h1", "h2", "h3", "h4", "h5", "h6", "body", "small", "caption"];
    for (const level of levels) {
      const entry = scale[level];
      if (!entry) continue;
      const parts = [];
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
  if (conventions && hasAnyValue(conventions)) {
    lines.push("### Conventions");
    if (conventions.headingCase) lines.push(`- Heading case: ${conventions.headingCase}`);
    if (conventions.bodyLineHeight) lines.push(`- Body line height: ${conventions.bodyLineHeight}`);
    if (conventions.codeFont) lines.push(`- Code font: ${conventions.codeFont}`);
    lines.push("");
  }
  return lines.join("\n");
}
function formatVoice(domain, voice) {
  const lines = [];
  lines.push(`## ${domain} \u2014 Brand Voice
`);
  const tone = voice.toneSpectrum;
  if (tone && hasAnyValue(tone)) {
    lines.push("### Tone Spectrum");
    const axes = [
      ["Formal", "Casual", tone.formalCasual],
      ["Playful", "Serious", tone.playfulSerious],
      ["Enthusiastic", "Matter-of-fact", tone.enthusiasticMatterOfFact],
      ["Respectful", "Irreverent", tone.respectfulIrreverent],
      ["Technical", "Accessible", tone.technicalAccessible]
    ];
    for (const [left, right, value] of axes) {
      if (value == null) continue;
      const barLen = 9;
      const pos = Math.max(0, Math.min(barLen, Math.round((value - 1) / 9 * barLen)));
      const bar = "\u2014".repeat(pos) + "\u25CF" + "\u2014".repeat(barLen - pos);
      lines.push(`- ${left} <${bar}> ${right} (${value}/10)`);
    }
    lines.push("");
  }
  const copy = voice.copywritingStyle;
  if (copy && hasAnyValue(copy)) {
    lines.push("### Copywriting Style");
    if (copy.avgSentenceLength != null) lines.push(`- Average sentence length: ${copy.avgSentenceLength} words`);
    if (copy.vocabularyComplexity) lines.push(`- Vocabulary complexity: ${copy.vocabularyComplexity}`);
    if (copy.jargonUsage) lines.push(`- Jargon usage: ${copy.jargonUsage}`);
    if (hasItems(copy.rhetoricalDevices)) lines.push(`- Rhetorical devices: ${copy.rhetoricalDevices.join(", ")}`);
    if (copy.ctaStyle) lines.push(`- CTA style: "${copy.ctaStyle}"`);
    lines.push("");
  }
  const patterns = voice.contentPatterns;
  if (patterns && hasAnyValue(patterns)) {
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
    for (const sample of voice.sampleCopy) {
      lines.push(`> "${sample}"`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
function formatRules(domain, rules, vibe) {
  const lines = [];
  lines.push(`## ${domain} \u2014 Brand Rules
`);
  if (rules.source) {
    lines.push(`*Source: ${rules.source}*
`);
  }
  if (hasItems(rules.dos)) {
    lines.push("### DOs");
    for (const rule of rules.dos) {
      lines.push(`- ${rule}`);
    }
    lines.push("");
  }
  if (hasItems(rules.donts)) {
    lines.push("### DON'Ts");
    for (const rule of rules.donts) {
      lines.push(`- ${rule}`);
    }
    lines.push("");
  }
  if (vibe) {
    lines.push("### Vibe Context");
    if (vibe.summary) lines.push(`> ${vibe.summary}`);
    if (hasItems(vibe.tags)) lines.push(`- **Tags:** ${vibe.tags.join(", ")}`);
    if (vibe.emotionalTone) lines.push(`- **Emotional tone:** ${vibe.emotionalTone}`);
    if (vibe.visualEnergy != null) {
      const label = vibe.visualEnergy <= 3 ? "calm/understated" : vibe.visualEnergy <= 6 ? "moderate" : "high-energy/bold";
      lines.push(`- **Visual energy:** ${vibe.visualEnergy}/10 (${label})`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
function formatVibe(domain, vibe, identity) {
  const lines = [];
  lines.push(`## ${domain} \u2014 Brand Vibe
`);
  if (vibe.summary) {
    lines.push(`> "${vibe.summary}"
`);
  }
  if (hasItems(vibe.tags)) {
    lines.push(`**Tags:** ${vibe.tags.join(", ")}`);
  }
  if (vibe.visualEnergy != null) {
    const label = vibe.visualEnergy <= 3 ? "calm/understated" : vibe.visualEnergy <= 6 ? "moderate" : "high-energy/bold";
    lines.push(`**Visual Energy:** ${vibe.visualEnergy}/10 (${label})`);
  }
  if (vibe.designEra) {
    lines.push(`**Design Era:** ${vibe.designEra}`);
  }
  if (hasItems(vibe.comparableBrands)) {
    lines.push(`**Comparable Brands:** ${vibe.comparableBrands.join(", ")}`);
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
      const archetypeStrs = identity.archetypes.map((a) => {
        if (a.confidence != null) return `${a.name} (${Math.round(a.confidence * 100)}%)`;
        return a.name;
      });
      lines.push(`- **Archetypes:** ${archetypeStrs.join(", ")}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
function formatFullBrandKit(kit) {
  const domain = kit.meta.domain ?? "unknown";
  const lines = [];
  lines.push(`# Brand Kit: ${domain}
`);
  lines.push(`*Extracted from ${kit.meta.url ?? domain}*`);
  if (kit.meta.extractedAt) {
    lines.push(`*Date: ${kit.meta.extractedAt}*`);
  }
  if (kit.meta.durationMs) {
    lines.push(`*Duration: ${(kit.meta.durationMs / 1e3).toFixed(1)}s*`);
  }
  lines.push("");
  if (kit.identity && hasAnyValue(kit.identity)) {
    lines.push("## Identity\n");
    if (kit.identity.brandName) lines.push(`- **Name:** ${kit.identity.brandName}`);
    if (kit.identity.tagline) lines.push(`- **Tagline:** "${kit.identity.tagline}"`);
    if (kit.identity.description) lines.push(`- **Description:** ${kit.identity.description}`);
    if (hasItems(kit.identity.archetypes)) {
      const archetypeStrs = kit.identity.archetypes.map((a) => {
        if (a.confidence != null) return `${a.name} (${Math.round(a.confidence * 100)}%)`;
        return a.name;
      });
      lines.push(`- **Archetypes:** ${archetypeStrs.join(", ")}`);
    }
    lines.push("");
  }
  if (kit.vibe && hasAnyValue(kit.vibe)) {
    lines.push(formatVibe(domain, kit.vibe, void 0));
  }
  if (kit.colors && hasAnyValue(kit.colors)) {
    lines.push(formatColors(domain, kit.colors));
  }
  if (kit.typography && hasAnyValue(kit.typography)) {
    lines.push(formatTypography(domain, kit.typography));
  }
  if (kit.voice && hasAnyValue(kit.voice)) {
    lines.push(formatVoice(domain, kit.voice));
  }
  if (kit.rules && hasAnyValue(kit.rules)) {
    lines.push(formatRules(domain, kit.rules));
  }
  if (hasItems(kit.logos)) {
    lines.push(`## Logos
`);
    lines.push(`${kit.logos.length} logo variant(s) found.
`);
    for (const logo of kit.logos) {
      const parts = [];
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
function generateCssExport(kit) {
  const domain = kit.meta.domain ?? "unknown";
  const lines = [];
  lines.push(`/* ExtractVibe Brand Kit \u2014 ${domain} */`);
  lines.push(`/* Generated by extractvibe-mcp */`);
  lines.push("");
  lines.push(":root {");
  const lightMode = kit.colors?.lightMode;
  if (lightMode) {
    const roles = [
      "primary",
      "secondary",
      "accent",
      "background",
      "surface",
      "text",
      "border",
      "link",
      "muted"
    ];
    lines.push("  /* Colors \u2014 Light Mode */");
    for (const role of roles) {
      const color = lightMode[role];
      if (color?.hex) {
        lines.push(`  --ev-color-${role}: ${color.hex};`);
      }
    }
    lines.push("");
  }
  const semantic = kit.colors?.semantic;
  if (semantic) {
    const roles = ["success", "warning", "error", "info"];
    let hasAny = false;
    for (const role of roles) {
      if (semantic[role]?.hex) {
        hasAny = true;
        break;
      }
    }
    if (hasAny) {
      lines.push("  /* Colors \u2014 Semantic */");
      for (const role of roles) {
        const color = semantic[role];
        if (color?.hex) {
          lines.push(`  --ev-color-${role}: ${color.hex};`);
        }
      }
      lines.push("");
    }
  }
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
  const scale = kit.typography?.scale;
  if (scale) {
    const levels = ["h1", "h2", "h3", "h4", "h5", "h6", "body", "small", "caption"];
    let hasAny = false;
    for (const level of levels) {
      if (scale[level]) {
        hasAny = true;
        break;
      }
    }
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
  if (kit.spacing?.baseUnit) lines.push(`  --ev-spacing-base: ${kit.spacing.baseUnit};`);
  if (kit.spacing?.borderRadius?.small) lines.push(`  --ev-radius-sm: ${kit.spacing.borderRadius.small};`);
  if (kit.spacing?.borderRadius?.medium) lines.push(`  --ev-radius-md: ${kit.spacing.borderRadius.medium};`);
  if (kit.spacing?.borderRadius?.large) lines.push(`  --ev-radius-lg: ${kit.spacing.borderRadius.large};`);
  if (kit.spacing?.containerMaxWidth) lines.push(`  --ev-container-max-width: ${kit.spacing.containerMaxWidth};`);
  if (lines[lines.length - 1] === "") lines.pop();
  lines.push("}");
  const darkMode = kit.colors?.darkMode;
  if (darkMode && hasAnyValue(darkMode)) {
    lines.push("");
    lines.push("@media (prefers-color-scheme: dark) {");
    lines.push("  :root {");
    const roles = [
      "primary",
      "secondary",
      "accent",
      "background",
      "surface",
      "text",
      "border",
      "link",
      "muted"
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
function generateTailwindExport(kit) {
  const domain = kit.meta.domain ?? "unknown";
  const lines = [];
  lines.push(`/* ExtractVibe Tailwind Theme \u2014 ${domain} */`);
  lines.push("");
  lines.push("@theme {");
  const lightMode = kit.colors?.lightMode;
  if (lightMode) {
    const roles = [
      "primary",
      "secondary",
      "accent",
      "background",
      "surface",
      "text",
      "border",
      "link",
      "muted"
    ];
    for (const role of roles) {
      const color = lightMode[role];
      if (color?.hex) {
        lines.push(`  --color-brand-${role}: ${color.hex};`);
      }
    }
    lines.push("");
  }
  const semantic = kit.colors?.semantic;
  if (semantic) {
    const roles = ["success", "warning", "error", "info"];
    for (const role of roles) {
      const color = semantic[role];
      if (color?.hex) {
        lines.push(`  --color-${role}: ${color.hex};`);
      }
    }
    lines.push("");
  }
  const headingFont = findFont(kit, "heading");
  const bodyFont = findFont(kit, "body");
  const monoFont = findFont(kit, "mono");
  if (headingFont) lines.push(`  --font-heading: ${fontStack(headingFont)};`);
  if (bodyFont) lines.push(`  --font-body: ${fontStack(bodyFont)};`);
  if (monoFont) lines.push(`  --font-mono: ${fontStack(monoFont)};`);
  const radius = kit.spacing?.borderRadius;
  if (radius) {
    if (radius.small) lines.push(`  --radius-sm: ${radius.small};`);
    if (radius.medium) lines.push(`  --radius-md: ${radius.medium};`);
    if (radius.large) lines.push(`  --radius-lg: ${radius.large};`);
  }
  if (lines[lines.length - 1] === "") lines.pop();
  lines.push("}");
  return lines.join("\n") + "\n";
}
function generateMarkdownExport(kit) {
  return formatFullBrandKit(kit);
}
function generateTokensExport(kit) {
  const domain = kit.meta.domain ?? "unknown";
  const tokens = {
    $name: `${domain} Brand Tokens`,
    $description: "Extracted by ExtractVibe"
  };
  const colorTokens = {};
  const lightMode = kit.colors?.lightMode;
  if (lightMode) {
    const roles = [
      "primary",
      "secondary",
      "accent",
      "background",
      "surface",
      "text",
      "border",
      "link",
      "muted"
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
    const roles = ["success", "warning", "error", "info"];
    for (const role of roles) {
      const color = semantic[role];
      if (color?.hex) {
        colorTokens[role] = { $value: color.hex, $type: "color" };
      }
    }
  }
  if (Object.keys(colorTokens).length > 0) tokens["color"] = colorTokens;
  const fontTokens = {};
  for (const role of ["heading", "body", "mono", "display"]) {
    const font = findFont(kit, role);
    if (font?.name) {
      fontTokens[role] = { $value: font.name, $type: "fontFamily" };
    }
  }
  if (Object.keys(fontTokens).length > 0) tokens["font"] = fontTokens;
  const spacingTokens = {};
  if (kit.spacing?.baseUnit) spacingTokens["base"] = { $value: kit.spacing.baseUnit, $type: "dimension" };
  if (kit.spacing?.containerMaxWidth) spacingTokens["containerMaxWidth"] = { $value: kit.spacing.containerMaxWidth, $type: "dimension" };
  if (Object.keys(spacingTokens).length > 0) tokens["spacing"] = spacingTokens;
  const radiusTokens = {};
  const radius = kit.spacing?.borderRadius;
  if (radius?.small) radiusTokens["sm"] = { $value: radius.small, $type: "dimension" };
  if (radius?.medium) radiusTokens["md"] = { $value: radius.medium, $type: "dimension" };
  if (radius?.large) radiusTokens["lg"] = { $value: radius.large, $type: "dimension" };
  if (Object.keys(radiusTokens).length > 0) tokens["borderRadius"] = radiusTokens;
  return JSON.stringify(tokens, null, 2) + "\n";
}
async function fetchBrandByDomain(domain) {
  const result = await apiGet(`/api/brand/${encodeURIComponent(domain)}`);
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
async function handleExtractBrand(url) {
  if (!API_KEY) {
    return "Error: EXTRACTVIBE_API_KEY environment variable is not set. Please configure your API key.";
  }
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return "Error: URL must use http:// or https:// protocol.";
    }
  } catch {
    try {
      parsedUrl = new URL(`https://${url}`);
    } catch {
      return "Error: Invalid URL. Please provide a valid URL like https://example.com";
    }
  }
  const domain = parsedUrl.hostname.replace(/^www\./, "");
  const startResult = await apiPost("/api/extract", {
    url: parsedUrl.toString()
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
  let attempts = 0;
  let lastStatus = "queued";
  while (attempts < POLL_MAX_ATTEMPTS) {
    await sleep(POLL_INTERVAL_MS);
    attempts++;
    const statusResult = await apiGet(
      `/api/extract/${jobId}`
    );
    if (isApiError(statusResult)) {
      if (attempts > 5) {
        return `Error: Lost connection to extraction job after ${attempts} attempts. Job ID: ${jobId}`;
      }
      continue;
    }
    const status = statusResult.status?.status ?? statusResult.status;
    lastStatus = typeof status === "string" ? status : "unknown";
    if (lastStatus === "complete" || lastStatus === "completed") {
      const resultData = await apiGet(`/api/extract/${jobId}/result`);
      if (isApiError(resultData)) {
        const brandData = await apiGet(`/api/brand/${encodeURIComponent(domain)}`);
        if (isApiError(brandData)) {
          return `Extraction completed but could not fetch result. Job ID: ${jobId}
Try using get_brand_colors, get_brand_typography, etc. with domain "${domain}".`;
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
  return `Extraction timed out after ${Math.round(POLL_MAX_ATTEMPTS * POLL_INTERVAL_MS / 1e3)}s. Last status: ${lastStatus}. Job ID: ${jobId}
The extraction may still complete \u2014 try checking with get_brand_colors for domain "${domain}" in a few minutes.`;
}
var server = new McpServer({
  name: "extractvibe",
  version: "0.1.0"
});
server.tool(
  "extract_brand",
  "Extract a comprehensive brand kit from a website URL. Returns colors, typography, voice analysis, brand rules, and vibe synthesis. Costs 1 credit per extraction.",
  {
    url: z.string().describe("The website URL to extract a brand kit from (e.g., https://stripe.com)")
  },
  async ({ url }) => {
    const result = await handleExtractBrand(url);
    return {
      content: [{ type: "text", text: result }]
    };
  }
);
server.tool(
  "get_brand_colors",
  "Get the color palette for a brand from a previously extracted domain. Returns light mode, dark mode, semantic, and raw palette colors.",
  {
    domain: z.string().describe("The domain to look up (e.g., stripe.com)")
  },
  async ({ domain }) => {
    const kit = await fetchBrandByDomain(domain);
    if (typeof kit === "string") {
      return { content: [{ type: "text", text: kit }] };
    }
    if (!kit.colors || !hasAnyValue(kit.colors)) {
      return {
        content: [{ type: "text", text: `No color data found for ${domain}. The brand kit may have been extracted with limited data.` }]
      };
    }
    return {
      content: [{ type: "text", text: formatColors(domain, kit.colors) }]
    };
  }
);
server.tool(
  "get_brand_typography",
  "Get the typography system for a brand, including font families, type scale, and conventions.",
  {
    domain: z.string().describe("The domain to look up (e.g., stripe.com)")
  },
  async ({ domain }) => {
    const kit = await fetchBrandByDomain(domain);
    if (typeof kit === "string") {
      return { content: [{ type: "text", text: kit }] };
    }
    if (!kit.typography || !hasAnyValue(kit.typography)) {
      return {
        content: [{ type: "text", text: `No typography data found for ${domain}. The brand kit may have been extracted with limited data.` }]
      };
    }
    return {
      content: [{ type: "text", text: formatTypography(domain, kit.typography) }]
    };
  }
);
server.tool(
  "get_brand_voice",
  "Get the brand voice analysis including tone spectrum, copywriting style, and content patterns.",
  {
    domain: z.string().describe("The domain to look up (e.g., stripe.com)")
  },
  async ({ domain }) => {
    const kit = await fetchBrandByDomain(domain);
    if (typeof kit === "string") {
      return { content: [{ type: "text", text: kit }] };
    }
    if (!kit.voice || !hasAnyValue(kit.voice)) {
      return {
        content: [{ type: "text", text: `No voice data found for ${domain}. The brand kit may have been extracted with limited data.` }]
      };
    }
    return {
      content: [{ type: "text", text: formatVoice(domain, kit.voice) }]
    };
  }
);
server.tool(
  "get_brand_rules",
  "Get the brand's DOs and DON'Ts -- AI-inferred rules about visual and verbal brand usage, plus vibe context.",
  {
    domain: z.string().describe("The domain to look up (e.g., stripe.com)")
  },
  async ({ domain }) => {
    const kit = await fetchBrandByDomain(domain);
    if (typeof kit === "string") {
      return { content: [{ type: "text", text: kit }] };
    }
    if (!kit.rules || !hasAnyValue(kit.rules)) {
      return {
        content: [{ type: "text", text: `No brand rules found for ${domain}. The brand kit may have been extracted with limited data.` }]
      };
    }
    return {
      content: [{ type: "text", text: formatRules(domain, kit.rules, kit.vibe) }]
    };
  }
);
server.tool(
  "get_brand_vibe",
  "Get the holistic brand vibe -- summary, tags, visual energy, comparable brands, personality archetypes, and identity.",
  {
    domain: z.string().describe("The domain to look up (e.g., stripe.com)")
  },
  async ({ domain }) => {
    const kit = await fetchBrandByDomain(domain);
    if (typeof kit === "string") {
      return { content: [{ type: "text", text: kit }] };
    }
    if (!kit.vibe || !hasAnyValue(kit.vibe)) {
      return {
        content: [{ type: "text", text: `No vibe data found for ${domain}. The brand kit may have been extracted with limited data.` }]
      };
    }
    return {
      content: [{ type: "text", text: formatVibe(domain, kit.vibe, kit.identity) }]
    };
  }
);
server.tool(
  "export_brand",
  "Export a brand kit in a specific format: css (CSS custom properties), tailwind (Tailwind CSS v4 @theme block), markdown (full report), or tokens (W3C design tokens JSON).",
  {
    domain: z.string().describe("The domain to export (e.g., stripe.com)"),
    format: z.enum(["css", "tailwind", "markdown", "tokens"]).describe("Export format: css, tailwind, markdown, or tokens")
  },
  async ({ domain, format }) => {
    const kit = await fetchBrandByDomain(domain);
    if (typeof kit === "string") {
      return { content: [{ type: "text", text: kit }] };
    }
    let output;
    let label;
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
          text: `## ${domain} \u2014 ${label}

\`\`\`${format === "tokens" ? "json" : format === "markdown" ? "markdown" : "css"}
${output}\`\`\``
        }
      ]
    };
  }
);
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main().catch((err) => {
  console.error("Fatal error starting ExtractVibe MCP server:", err);
  process.exit(1);
});
