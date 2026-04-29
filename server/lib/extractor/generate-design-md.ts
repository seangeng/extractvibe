/**
 * DESIGN.md Generator
 *
 * Converts a fully-extracted ExtractVibeBrandKit into a single DESIGN.md file
 * that conforms to the Google spec at github.com/google-labs-code/design.md
 * (frontmatter + canonical sections) AND matches community conventions seen
 * across the awesome-design-md corpus (rich prose, type-scale tables,
 * Voice / Logos / Sources extension sections).
 *
 * The bulk of the file is templated deterministically from the JSON kit.
 * One OpenRouter call generates the Overview prose paragraphs; if it fails
 * we degrade gracefully to a deterministic prose paragraph from the kit's
 * vibe.summary.
 */

import { openRouterCompletion } from "../ai";
import { log } from "../logger";
import { lintDesignMd, type LintResult } from "../design-md-lint";
import type {
  ExtractVibeBrandKit,
  ColorValue,
  ColorMode,
  TypeScale,
  TypeScaleEntry,
} from "../../schema/v1";

export interface GenerateDesignMdOptions {
  /** OpenRouter API key — when omitted, prose falls back to deterministic copy. */
  openRouterApiKey?: string;
  /** Whether to actually call the LLM. Default true if key present. */
  useLlm?: boolean;
}

export interface GenerateDesignMdResult {
  content: string;
  lintResult: LintResult;
  /** True if the LLM prose call fell back to deterministic generation. */
  proseDegraded: boolean;
  /** Reason for degradation (when proseDegraded is true). */
  proseDegradationReason?: string;
}

// ─── Public entry point ──────────────────────────────────────────────

export async function generateDesignMd(
  kit: ExtractVibeBrandKit,
  opts: GenerateDesignMdOptions = {}
): Promise<GenerateDesignMdResult> {
  const useLlm = opts.useLlm !== false && !!opts.openRouterApiKey;

  let prose: ProseOutput;
  let proseDegraded = false;
  let proseDegradationReason: string | undefined;

  if (useLlm && opts.openRouterApiKey) {
    try {
      prose = await generateProseWithLlm(kit, opts.openRouterApiKey);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      proseDegraded = true;
      proseDegradationReason = reason;
      log({
        level: "warn",
        event: "llm.fallback",
        step: "design-md-generator",
        domain: kit.meta?.domain,
        error: reason,
      });
      prose = generateDeterministicProse(kit);
    }
  } else {
    prose = generateDeterministicProse(kit);
  }

  const content = renderDesignMd(kit, prose);
  const lintResult = lintDesignMd(content);

  return { content, lintResult, proseDegraded, proseDegradationReason };
}

// ─── Prose generation (LLM or deterministic fallback) ────────────────

interface ProseOutput {
  /** 1–3 paragraph atmosphere prose for the Overview section. */
  overview: string;
  /** Single rationale paragraph for the Colors section. */
  colorsRationale: string;
  /** Single rationale paragraph for the Typography section. */
  typographyRationale: string;
}

async function generateProseWithLlm(
  kit: ExtractVibeBrandKit,
  apiKey: string
): Promise<ProseOutput> {
  const brandName = kit.identity?.brandName || kit.meta?.domain || "This brand";
  const fontFamilies = (kit.typography?.families || [])
    .map((f) => f.name)
    .filter(Boolean)
    .slice(0, 4)
    .join(", ");
  const primaryColor = kit.colors?.lightMode?.primary?.hex || "(none)";
  const surfaceColor = kit.colors?.lightMode?.background?.hex || "(none)";
  const vibeTags = (kit.vibe?.tags || []).slice(0, 6).join(", ");
  const vibeSummary = kit.vibe?.summary || "";
  const archetypes = (kit.identity?.archetypes || [])
    .map((a) => a.name)
    .join(", ");
  const comparable = (kit.vibe?.comparableBrands || []).slice(0, 4).join(", ");

  const prompt = `You are writing prose for a DESIGN.md file — an AI-readable design system spec that helps coding agents (Claude Code, Cursor, etc.) generate on-brand UI. Write in confident, declarative voice. No marketing fluff, no hedging.

Brand: ${brandName}
Vibe summary: ${vibeSummary}
Vibe tags: ${vibeTags}
Archetypes: ${archetypes}
Comparable brands: ${comparable}
Fonts: ${fontFamilies}
Primary color: ${primaryColor}
Surface color: ${surfaceColor}

Produce exactly three sections, each a separate JSON string field. Return ONLY valid JSON, no markdown fences.

{
  "overview": "<2 paragraphs (200-300 words total) describing the design atmosphere — archetype, comparable brands, emotional register, what the design IS NOT. Concrete and grounded in the data above.>",
  "colorsRationale": "<1 paragraph (60-100 words) explaining the color philosophy and how the palette signals the brand's character.>",
  "typographyRationale": "<1 paragraph (60-100 words) explaining the type system — font choices, hierarchy approach, and what they communicate.>"
}`;

  const raw = await openRouterCompletion(
    apiKey,
    [{ role: "user", content: prompt }],
    {
      model: "google/gemini-2.5-flash",
      temperature: 0.5,
      maxTokens: 2048,
    }
  );

  // Strip code fences if present, then parse
  const cleaned = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```\s*$/, "").trim();
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

  return {
    overview: typeof parsed.overview === "string" ? parsed.overview : generateDeterministicProse(kit).overview,
    colorsRationale: typeof parsed.colorsRationale === "string" ? parsed.colorsRationale : generateDeterministicProse(kit).colorsRationale,
    typographyRationale: typeof parsed.typographyRationale === "string" ? parsed.typographyRationale : generateDeterministicProse(kit).typographyRationale,
  };
}

function generateDeterministicProse(kit: ExtractVibeBrandKit): ProseOutput {
  const brandName = kit.identity?.brandName || kit.meta?.domain || "This brand";
  const vibeSummary = kit.vibe?.summary || `${brandName} maintains a clean, contemporary web presence.`;
  const tags = (kit.vibe?.tags || []).slice(0, 5).join(", ");
  const fonts = (kit.typography?.families || []).map((f) => f.name).filter(Boolean).slice(0, 3).join(", ");
  const colorCount = kit.colors?.rawPalette?.length || 0;

  const overview = [
    vibeSummary,
    tags
      ? `Key characteristics: ${tags}.`
      : `The design favors clarity and structural integrity over decorative ornament.`,
  ].join("\n\n");

  const colorsRationale = colorCount > 0
    ? `The palette draws on ${colorCount} distinct colors observed across the site, organized into semantic roles below.`
    : `A minimal palette anchors the design with role-based tokens for primary, surface, and text.`;

  const typographyRationale = fonts
    ? `Type is set in ${fonts}, with hierarchy expressed through size and weight contrast rather than family-switching.`
    : `Type relies on a single sans-serif family with hierarchy expressed through size and weight contrast.`;

  return { overview, colorsRationale, typographyRationale };
}

// ─── Renderer ────────────────────────────────────────────────────────

function renderDesignMd(kit: ExtractVibeBrandKit, prose: ProseOutput): string {
  const lines: string[] = [];
  const domain = kit.meta?.domain || "unknown";
  const brandName = kit.identity?.brandName || domain;
  const safeDescription = oneLine(kit.vibe?.summary || `Brand kit for ${domain}.`);
  const extractedAt = kit.meta?.extractedAt || new Date().toISOString();

  // ── Provenance header ──
  lines.push(`<!-- Generated by ExtractVibe — https://extractvibe.com/brand/${domain} -->`);
  lines.push(`<!-- Extracted: ${extractedAt} | Schema: ${kit.meta?.schemaVersion || "v1"} | Quality: ${kit.meta?.qualityScore ?? "n/a"}/100 -->`);

  // ── Frontmatter ──
  lines.push("---");
  lines.push(`version: alpha`);
  lines.push(`name: ${yamlString(brandName)}`);
  lines.push(`description: ${yamlString(safeDescription)}`);

  // colors
  const colorEntries = buildColorEntries(kit);
  if (colorEntries.length > 0) {
    lines.push(`colors:`);
    for (const [k, v] of colorEntries) {
      lines.push(`  ${k}: ${yamlString(v)}`);
    }
  }

  // typography
  const typographyEntries = buildTypographyEntries(kit);
  if (typographyEntries.length > 0) {
    lines.push(`typography:`);
    for (const [k, props] of typographyEntries) {
      lines.push(`  ${k}:`);
      for (const [pk, pv] of Object.entries(props)) {
        lines.push(`    ${pk}: ${yamlString(String(pv))}`);
      }
    }
  }

  // rounded
  const roundedEntries = buildRoundedEntries(kit);
  if (roundedEntries.length > 0) {
    lines.push(`rounded:`);
    for (const [k, v] of roundedEntries) {
      lines.push(`  ${k}: ${yamlString(v)}`);
    }
  }

  // spacing
  const spacingEntries = buildSpacingEntries(kit);
  if (spacingEntries.length > 0) {
    lines.push(`spacing:`);
    for (const [k, v] of spacingEntries) {
      lines.push(`  ${k}: ${yamlString(v)}`);
    }
  }

  // components
  const componentEntries = buildComponentEntries(kit);
  if (componentEntries.length > 0) {
    lines.push(`components:`);
    for (const [name, props] of componentEntries) {
      lines.push(`  ${name}:`);
      for (const [pk, pv] of Object.entries(props)) {
        lines.push(`    ${pk}: ${yamlString(String(pv))}`);
      }
    }
  }

  lines.push("---");
  lines.push("");
  lines.push(`# ${brandName} — Design System`);
  lines.push("");

  // ── Overview ──
  lines.push("## Overview");
  lines.push("");
  lines.push(prose.overview);
  lines.push("");
  const overviewBullets = buildOverviewBullets(kit);
  if (overviewBullets.length > 0) {
    lines.push("**Key characteristics:**");
    lines.push("");
    for (const b of overviewBullets) lines.push(`- ${b}`);
    lines.push("");
  }

  // ── Colors ──
  if (colorEntries.length > 0 || hasAnySemanticColor(kit)) {
    lines.push("## Colors");
    lines.push("");
    lines.push(prose.colorsRationale);
    lines.push("");
    renderColorsSection(lines, kit);
  }

  // ── Typography ──
  if ((kit.typography?.families?.length || 0) > 0 || kit.typography?.scale) {
    lines.push("## Typography");
    lines.push("");
    lines.push(prose.typographyRationale);
    lines.push("");
    renderTypographySection(lines, kit);
  }

  // ── Layout ──
  if (kit.spacing?.baseUnit || kit.spacing?.containerMaxWidth || kit.spacing?.grid) {
    lines.push("## Layout");
    lines.push("");
    renderLayoutSection(lines, kit);
  }

  // ── Elevation & Depth ──
  if ((kit.effects?.shadows?.length || 0) > 0 || (kit.effects?.gradients?.length || 0) > 0) {
    lines.push("## Elevation & Depth");
    lines.push("");
    renderEffectsSection(lines, kit);
  }

  // ── Shapes ──
  if (kit.spacing?.borderRadius) {
    lines.push("## Shapes");
    lines.push("");
    renderShapesSection(lines, kit);
  }

  // ── Components ──
  if ((kit.buttons?.styles?.length || 0) > 0) {
    lines.push("## Components");
    lines.push("");
    renderComponentsSection(lines, kit);
  }

  // ── Do's and Don'ts ──
  if ((kit.rules?.dos?.length || 0) > 0 || (kit.rules?.donts?.length || 0) > 0) {
    lines.push("## Do's and Don'ts");
    lines.push("");
    renderRulesSection(lines, kit);
  }

  // ── Voice (custom extension) ──
  if (kit.voice && (kit.voice.sampleCopy?.length || kit.voice.toneSpectrum)) {
    lines.push("## Voice");
    lines.push("");
    renderVoiceSection(lines, kit);
  }

  // ── Logos (custom extension) ──
  if ((kit.logos?.length || 0) > 0) {
    lines.push("## Logos");
    lines.push("");
    renderLogosSection(lines, kit);
  }

  // ── Sources (custom extension) ──
  lines.push("## Sources");
  lines.push("");
  renderSourcesSection(lines, kit);

  return lines.join("\n");
}

// ─── Frontmatter builders ────────────────────────────────────────────

function buildColorEntries(kit: ExtractVibeBrandKit): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  const seen = new Set<string>();

  const push = (key: string, color: ColorValue | undefined) => {
    if (!color?.hex || seen.has(key)) return;
    if (!/^#[0-9a-fA-F]{3,8}$/.test(color.hex)) return;
    entries.push([key, color.hex.toLowerCase()]);
    seen.add(key);
  };

  // Light mode → canonical names
  const light = kit.colors?.lightMode;
  if (light) {
    push("primary", light.primary);
    push("secondary", light.secondary);
    push("tertiary", light.accent);
    push("neutral", light.muted);
    push("surface", light.surface || light.background);
    push("on-surface", light.text);
    push("on-surface-secondary", light.secondaryText);
    push("border", light.border);
    push("link", light.link);
  }

  // Semantic
  const sem = kit.colors?.semantic;
  if (sem) {
    push("error", sem.error);
    push("warning", sem.warning);
    push("success", sem.success);
    push("info", sem.info);
  }

  // Dark mode variants — append `-dark` suffix
  const dark = kit.colors?.darkMode;
  if (dark) {
    push("primary-dark", dark.primary);
    push("secondary-dark", dark.secondary);
    push("tertiary-dark", dark.accent);
    push("surface-dark", dark.surface || dark.background);
    push("on-surface-dark", dark.text);
  }

  return entries;
}

function buildTypographyEntries(
  kit: ExtractVibeBrandKit
): Array<[string, Record<string, string>]> {
  const entries: Array<[string, Record<string, string>]> = [];
  const scale = kit.typography?.scale;
  if (!scale) return entries;

  const map: Array<[keyof TypeScale, string]> = [
    ["h1", "display-lg"],
    ["h2", "headline-lg"],
    ["h3", "headline-md"],
    ["h4", "headline-sm"],
    ["body", "body-md"],
    ["small", "body-sm"],
    ["caption", "label-sm"],
  ];

  for (const [src, dst] of map) {
    const e = scale[src];
    if (!e) continue;
    const props = typeScaleEntryToProps(e);
    if (Object.keys(props).length > 0) {
      entries.push([dst, props]);
    }
  }

  return entries;
}

function typeScaleEntryToProps(entry: TypeScaleEntry): Record<string, string> {
  const props: Record<string, string> = {};
  if (entry.fontFamily) props.fontFamily = entry.fontFamily;
  if (entry.fontSize) props.fontSize = entry.fontSize;
  if (entry.fontWeight !== undefined) props.fontWeight = String(entry.fontWeight);
  if (entry.lineHeight) props.lineHeight = entry.lineHeight;
  if (entry.letterSpacing) props.letterSpacing = entry.letterSpacing;
  return props;
}

function buildRoundedEntries(kit: ExtractVibeBrandKit): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  const br = kit.spacing?.borderRadius;
  if (!br) return entries;
  if (br.small) entries.push(["sm", br.small]);
  if (br.medium) entries.push(["md", br.medium]);
  if (br.large) entries.push(["lg", br.large]);
  entries.push(["full", "9999px"]);
  return entries;
}

function buildSpacingEntries(kit: ExtractVibeBrandKit): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  const base = kit.spacing?.baseUnit;
  if (!base) return entries;

  // Try to parse base as a number+unit so we can build a 4-step scale
  const m = base.match(/^([\d.]+)(px|rem|em)?$/);
  if (m) {
    const n = parseFloat(m[1]);
    const unit = m[2] || "px";
    entries.push(["base", `${n}${unit}`]);
    entries.push(["xs", `${n / 2}${unit}`]);
    entries.push(["sm", `${n}${unit}`]);
    entries.push(["md", `${n * 2}${unit}`]);
    entries.push(["lg", `${n * 3}${unit}`]);
    entries.push(["xl", `${n * 4}${unit}`]);
  } else {
    entries.push(["base", base]);
  }
  return entries;
}

function buildComponentEntries(
  kit: ExtractVibeBrandKit
): Array<[string, Record<string, string>]> {
  const entries: Array<[string, Record<string, string>]> = [];
  const styles = kit.buttons?.styles || [];
  if (styles.length === 0) return entries;

  for (const s of styles) {
    if (!s.variant) continue;
    const props: Record<string, string> = {};
    if (s.backgroundColor) props.backgroundColor = s.backgroundColor;
    if (s.textColor) props.textColor = s.textColor;
    if (s.borderRadius) props.rounded = s.borderRadius;
    if (s.padding) props.padding = s.padding;
    if (s.fontSize) props.fontSize = s.fontSize;
    if (s.fontWeight !== undefined) props.fontWeight = String(s.fontWeight);
    if (s.borderColor) props.borderColor = s.borderColor;
    if (s.borderWidth) props.borderWidth = s.borderWidth;
    if (s.boxShadow) props.boxShadow = s.boxShadow;

    if (Object.keys(props).length > 0) {
      entries.push([`button-${s.variant}`, props]);
    }
  }

  return entries;
}

// ─── Section renderers ───────────────────────────────────────────────

function buildOverviewBullets(kit: ExtractVibeBrandKit): string[] {
  const out: string[] = [];
  const tags = kit.vibe?.tags?.slice(0, 6);
  if (tags?.length) out.push(`Vibe — ${tags.join(", ")}`);
  const archetypes = kit.identity?.archetypes?.slice(0, 3).map((a) => a.name);
  if (archetypes?.length) out.push(`Archetypes — ${archetypes.join(", ")}`);
  const comp = kit.vibe?.comparableBrands?.slice(0, 4);
  if (comp?.length) out.push(`Comparable to — ${comp.join(", ")}`);
  if (kit.vibe?.designEra) out.push(`Design era — ${kit.vibe.designEra}`);
  if (kit.vibe?.emotionalTone) out.push(`Emotional tone — ${kit.vibe.emotionalTone}`);
  if (kit.vibe?.targetAudienceInferred) out.push(`Target audience — ${kit.vibe.targetAudienceInferred}`);
  if (kit.vibe?.visualEnergy != null) {
    const energy = kit.vibe.visualEnergy <= 3 ? "calm/understated" : kit.vibe.visualEnergy <= 6 ? "moderate" : "high-energy/bold";
    out.push(`Visual energy — ${kit.vibe.visualEnergy}/10 (${energy})`);
  }
  return out;
}

function hasAnySemanticColor(kit: ExtractVibeBrandKit): boolean {
  const s = kit.colors?.semantic;
  if (!s) return false;
  return !!(s.success?.hex || s.warning?.hex || s.error?.hex || s.info?.hex);
}

function renderColorsSection(lines: string[], kit: ExtractVibeBrandKit): void {
  const light = kit.colors?.lightMode;
  const dark = kit.colors?.darkMode;
  const semantic = kit.colors?.semantic;

  if (light && hasAnyColor(light)) {
    lines.push("### Light mode");
    lines.push("");
    renderColorTable(lines, light);
    lines.push("");
  }

  if (dark && hasAnyColor(dark)) {
    lines.push("### Dark mode");
    lines.push("");
    renderColorTable(lines, dark);
    lines.push("");
  }

  if (semantic && hasAnySemanticColor(kit)) {
    lines.push("### Semantic");
    lines.push("");
    lines.push("| Role | Hex | Use |");
    lines.push("|------|-----|-----|");
    const rows: Array<[string, ColorValue | undefined, string]> = [
      ["success", semantic.success, "Confirmations, positive states"],
      ["warning", semantic.warning, "Caution, intermediate states"],
      ["error", semantic.error, "Failures, destructive actions"],
      ["info", semantic.info, "Neutral information, tips"],
    ];
    for (const [role, c, use] of rows) {
      if (c?.hex) lines.push(`| ${role} | \`${c.hex}\` | ${use} |`);
    }
    lines.push("");
  }
}

function renderColorTable(lines: string[], mode: ColorMode): void {
  lines.push("| Role | Hex | Name |");
  lines.push("|------|-----|------|");
  const rows: Array<[string, ColorValue | undefined]> = [
    ["primary", mode.primary],
    ["secondary", mode.secondary],
    ["accent / tertiary", mode.accent],
    ["surface", mode.surface],
    ["background", mode.background],
    ["text", mode.text],
    ["secondary text", mode.secondaryText],
    ["border", mode.border],
    ["link", mode.link],
    ["muted", mode.muted],
  ];
  for (const [role, c] of rows) {
    if (c?.hex) {
      lines.push(`| ${role} | \`${c.hex}\` | ${c.name || "—"} |`);
    }
  }
}

function hasAnyColor(mode: ColorMode): boolean {
  return !!(mode.primary?.hex || mode.secondary?.hex || mode.accent?.hex || mode.surface?.hex || mode.background?.hex || mode.text?.hex);
}

function renderTypographySection(lines: string[], kit: ExtractVibeBrandKit): void {
  const families = kit.typography?.families || [];
  if (families.length > 0) {
    lines.push("### Font families");
    lines.push("");
    lines.push("| Family | Role | Source | Weights |");
    lines.push("|--------|------|--------|---------|");
    for (const f of families) {
      const role = f.role || "—";
      const source = f.source || "—";
      const weights = (f.weights || []).join(", ") || "—";
      lines.push(`| ${f.name || "—"} | ${role} | ${source} | ${weights} |`);
    }
    lines.push("");
  }

  const scale = kit.typography?.scale;
  if (scale) {
    lines.push("### Type scale");
    lines.push("");
    lines.push("| Role | Family | Size | Weight | Line height | Letter spacing |");
    lines.push("|------|--------|------|--------|-------------|----------------|");
    const order: Array<[keyof TypeScale, string]> = [
      ["h1", "Display"],
      ["h2", "Heading 2"],
      ["h3", "Heading 3"],
      ["h4", "Heading 4"],
      ["body", "Body"],
      ["small", "Small"],
      ["caption", "Caption"],
    ];
    for (const [k, label] of order) {
      const e = scale[k];
      if (!e) continue;
      lines.push(
        `| ${label} | ${e.fontFamily || "—"} | ${e.fontSize || "—"} | ${e.fontWeight ?? "—"} | ${e.lineHeight || "—"} | ${e.letterSpacing || "—"} |`
      );
    }
    lines.push("");
  }

  const conv = kit.typography?.conventions;
  if (conv?.headingCase || conv?.bodyLineHeight || conv?.codeFont) {
    lines.push("### Conventions");
    lines.push("");
    if (conv.headingCase) lines.push(`- Heading case — ${conv.headingCase}`);
    if (conv.bodyLineHeight) lines.push(`- Body line-height — ${conv.bodyLineHeight}`);
    if (conv.codeFont) lines.push(`- Monospace — ${conv.codeFont}`);
    lines.push("");
  }
}

function renderLayoutSection(lines: string[], kit: ExtractVibeBrandKit): void {
  const sp = kit.spacing!;
  if (sp.baseUnit) lines.push(`- Base spacing unit — \`${sp.baseUnit}\``);
  if (sp.containerMaxWidth) lines.push(`- Container max-width — \`${sp.containerMaxWidth}\``);
  if (sp.grid) {
    if (sp.grid.columns) lines.push(`- Grid columns — ${sp.grid.columns}`);
    if (sp.grid.gap) lines.push(`- Grid gap — \`${sp.grid.gap}\``);
  }
  lines.push("");
}

function renderEffectsSection(lines: string[], kit: ExtractVibeBrandKit): void {
  const shadows = kit.effects?.shadows || [];
  const gradients = kit.effects?.gradients || [];

  if (shadows.length > 0) {
    lines.push("### Shadows");
    lines.push("");
    lines.push("| Context | Value |");
    lines.push("|---------|-------|");
    const seen = new Set<string>();
    for (const s of shadows.slice(0, 12)) {
      if (seen.has(s.value)) continue;
      seen.add(s.value);
      const ctx = s.context || s.source || "element";
      lines.push(`| ${ctx} | \`${escapePipe(s.value)}\` |`);
    }
    lines.push("");
  }

  if (gradients.length > 0) {
    lines.push("### Gradients");
    lines.push("");
    const seen = new Set<string>();
    for (const g of gradients.slice(0, 8)) {
      if (seen.has(g.value)) continue;
      seen.add(g.value);
      lines.push(`- \`${escapePipe(g.value)}\``);
    }
    lines.push("");
  }
}

function renderShapesSection(lines: string[], kit: ExtractVibeBrandKit): void {
  const br = kit.spacing!.borderRadius!;
  lines.push("Border-radius scale:");
  lines.push("");
  if (br.small) lines.push(`- \`sm\` — ${br.small}`);
  if (br.medium) lines.push(`- \`md\` — ${br.medium}`);
  if (br.large) lines.push(`- \`lg\` — ${br.large}`);
  lines.push(`- \`full\` — 9999px (pill / circular)`);
  lines.push("");
}

function renderComponentsSection(lines: string[], kit: ExtractVibeBrandKit): void {
  lines.push("### Buttons");
  lines.push("");
  for (const s of kit.buttons!.styles) {
    lines.push(`**${capitalize(s.variant)}**`);
    lines.push("");
    const bullets: string[] = [];
    if (s.backgroundColor) bullets.push(`Background — \`${s.backgroundColor}\``);
    if (s.textColor) bullets.push(`Text — \`${s.textColor}\``);
    if (s.borderRadius) bullets.push(`Radius — \`${s.borderRadius}\``);
    if (s.padding) bullets.push(`Padding — \`${s.padding}\``);
    if (s.fontSize) bullets.push(`Font size — \`${s.fontSize}\``);
    if (s.fontWeight !== undefined) bullets.push(`Font weight — \`${s.fontWeight}\``);
    if (s.borderColor && s.borderColor !== "rgba(0, 0, 0, 0)") bullets.push(`Border — \`${s.borderWidth || ""} solid ${s.borderColor}\``);
    if (s.boxShadow && s.boxShadow !== "none") bullets.push(`Shadow — \`${escapePipe(s.boxShadow)}\``);
    if (s.sampleText) bullets.push(`Sample copy — "${s.sampleText}"`);
    for (const b of bullets) lines.push(`- ${b}`);
    lines.push("");
  }
}

function renderRulesSection(lines: string[], kit: ExtractVibeBrandKit): void {
  const dos = kit.rules?.dos || [];
  const donts = kit.rules?.donts || [];
  if (dos.length > 0) {
    lines.push("### Do");
    lines.push("");
    for (const d of dos) lines.push(`- ${d}`);
    lines.push("");
  }
  if (donts.length > 0) {
    lines.push("### Don't");
    lines.push("");
    for (const d of donts) lines.push(`- ${d}`);
    lines.push("");
  }
  if (kit.rules?.source) {
    lines.push(`*Source — ${kit.rules.source}*`);
    lines.push("");
  }
}

function renderVoiceSection(lines: string[], kit: ExtractVibeBrandKit): void {
  const v = kit.voice!;
  if (v.toneSpectrum) {
    lines.push("### Tone (1–10 scale)");
    lines.push("");
    const ts = v.toneSpectrum;
    const rows: Array<[string, number | undefined, string, string]> = [
      ["Formal ↔ Casual", ts.formalCasual, "formal", "casual"],
      ["Playful ↔ Serious", ts.playfulSerious, "playful", "serious"],
      ["Enthusiastic ↔ Matter-of-fact", ts.enthusiasticMatterOfFact, "enthusiastic", "matter-of-fact"],
      ["Respectful ↔ Irreverent", ts.respectfulIrreverent, "respectful", "irreverent"],
      ["Technical ↔ Accessible", ts.technicalAccessible, "technical", "accessible"],
    ];
    lines.push("| Axis | Score | Lean |");
    lines.push("|------|-------|------|");
    for (const [label, score, lo, hi] of rows) {
      if (score === undefined) continue;
      const lean = score <= 4 ? lo : score >= 7 ? hi : "balanced";
      lines.push(`| ${label} | ${score}/10 | ${lean} |`);
    }
    lines.push("");
  }

  if (v.copywritingStyle) {
    const cs = v.copywritingStyle;
    lines.push("### Copywriting style");
    lines.push("");
    if (cs.avgSentenceLength) lines.push(`- Avg. sentence length — ${cs.avgSentenceLength} words`);
    if (cs.vocabularyComplexity) lines.push(`- Vocabulary — ${cs.vocabularyComplexity}`);
    if (cs.jargonUsage) lines.push(`- Jargon — ${cs.jargonUsage}`);
    if (cs.ctaStyle) lines.push(`- CTA style — ${cs.ctaStyle}`);
    if (cs.rhetoricalDevices?.length) lines.push(`- Rhetorical devices — ${cs.rhetoricalDevices.join(", ")}`);
    lines.push("");
  }

  if (v.sampleCopy && v.sampleCopy.length > 0) {
    lines.push("### Sample copy");
    lines.push("");
    for (const s of v.sampleCopy.slice(0, 6)) {
      lines.push(`> ${s.replace(/\n+/g, " ").trim()}`);
      lines.push("");
    }
  }
}

function renderLogosSection(lines: string[], kit: ExtractVibeBrandKit): void {
  lines.push("| Type | Variant | Format | URL | Confidence |");
  lines.push("|------|---------|--------|-----|------------|");
  for (const l of kit.logos!.slice(0, 12)) {
    const conf = l.confidence !== undefined ? `${Math.round(l.confidence * 100)}%` : "—";
    lines.push(
      `| ${l.type || "—"} | ${l.variant || "—"} | ${l.format || "—"} | [link](${l.url || "#"}) | ${conf} |`
    );
  }
  lines.push("");
}

function renderSourcesSection(lines: string[], kit: ExtractVibeBrandKit): void {
  const domain = kit.meta?.domain || "unknown";
  if (kit.officialGuidelines?.discoveredUrl) {
    lines.push(`- Official brand guidelines — ${kit.officialGuidelines.discoveredUrl}`);
  }
  lines.push(`- Live brand page — https://extractvibe.com/brand/${domain}`);
  lines.push(`- Raw JSON — https://extractvibe.com/api/brand/${domain}`);
  lines.push(`- DESIGN.md (this file) — https://extractvibe.com/api/brand/${domain}/design.md`);
  if (kit.meta?.extractedAt) {
    lines.push(`- Extracted — ${kit.meta.extractedAt}`);
  }
  lines.push(`- Generator — ExtractVibe v${kit.meta?.schemaVersion || "v1"}`);
  if (kit.meta?.qualityScore !== undefined) {
    lines.push(`- Quality score — ${kit.meta.qualityScore}/100`);
  }
  lines.push("");
}

// ─── Tiny helpers ────────────────────────────────────────────────────

function yamlString(s: string): string {
  // Always quote — safest with hex codes, em dashes, colons, brackets, etc.
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function oneLine(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapePipe(s: string): string {
  // Markdown table cells need pipes escaped
  return s.replace(/\|/g, "\\|");
}
