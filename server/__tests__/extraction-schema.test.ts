/**
 * ExtractVibe — Extraction Schema & Export Format Tests
 *
 * Validates that extraction outputs conform to the brand kit schema
 * and that export functions produce correct output for various data shapes.
 */
import { describe, it, expect } from "vitest";

import type {
  ExtractVibeBrandKit,
  ColorValue,
  FontFamily,
  TypeScaleEntry,
  BrandVoice,
  BrandVibe,
  BrandRules,
} from "../schema/v1";
import { SCHEMA_VERSION, createEmptyBrandKit } from "../schema/v1";
import {
  exportCssVariables,
  exportTailwindConfig,
  exportDesignTokens,
  exportMarkdownReport,
} from "../lib/export-formats";

import { mockBrandKitFull } from "./fixtures/mock-brand-kit-full";
import { mockBrandKitMinimal, mockBrandKitEmpty } from "./fixtures/mock-brand-kit-minimal";

// ─── Helpers ─────────────────────────────────────────────────────────────

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

const VALID_COLOR_ROLES = [
  "primary",
  "secondary",
  "accent",
  "background",
  "text",
  "border",
  "link",
  "success",
  "warning",
  "error",
  "info",
  // Extended roles that appear in the schema
  "surface",
  "secondaryText",
  "muted",
] as const;

function isValidConfidence(value: number | undefined): boolean {
  if (value === undefined) return true; // optional field
  return typeof value === "number" && value >= 0 && value <= 1;
}

function isValidCssWeight(value: number): boolean {
  return value >= 100 && value <= 900 && value % 100 === 0;
}

// ─── Test 1: Schema completeness for a well-structured SaaS site ─────────

describe("Schema completeness — full SaaS site (Stripe-like)", () => {
  const kit = mockBrandKitFull;

  it("has valid meta with all required fields", () => {
    expect(kit.meta).toBeDefined();
    expect(kit.meta.url).toBe("https://stripe.com");
    expect(kit.meta.domain).toBe("stripe.com");
    expect(kit.meta.schemaVersion).toBe(SCHEMA_VERSION);
    expect(kit.meta.extractedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(kit.meta.durationMs).toBeGreaterThan(0);
  });

  it("has identity with brandName", () => {
    expect(kit.identity).toBeDefined();
    expect(kit.identity!.brandName).toBeTruthy();
    expect(typeof kit.identity!.brandName).toBe("string");
    expect(kit.identity!.brandName!.length).toBeGreaterThan(0);
  });

  it("has identity with tagline and description", () => {
    expect(kit.identity!.tagline).toBeTruthy();
    expect(kit.identity!.description).toBeTruthy();
  });

  it("has archetypes with confidence scores", () => {
    expect(kit.identity!.archetypes).toBeDefined();
    expect(kit.identity!.archetypes!.length).toBeGreaterThanOrEqual(1);
    for (const archetype of kit.identity!.archetypes!) {
      expect(archetype.name).toBeTruthy();
      expect(isValidConfidence(archetype.confidence)).toBe(true);
    }
  });

  it("has rawPalette with 3+ colors", () => {
    expect(kit.colors).toBeDefined();
    expect(kit.colors!.rawPalette).toBeDefined();
    expect(kit.colors!.rawPalette!.length).toBeGreaterThanOrEqual(3);
  });

  it("has typography with 1+ font family", () => {
    expect(kit.typography).toBeDefined();
    expect(kit.typography!.families).toBeDefined();
    expect(kit.typography!.families!.length).toBeGreaterThanOrEqual(1);
  });

  it("has voice data", () => {
    expect(kit.voice).toBeDefined();
    expect(kit.voice!.toneSpectrum).toBeDefined();
  });

  it("has vibe data", () => {
    expect(kit.vibe).toBeDefined();
    expect(kit.vibe!.summary).toBeTruthy();
    expect(kit.vibe!.tags).toBeDefined();
  });

  it("has rules with 3+ dos", () => {
    expect(kit.rules).toBeDefined();
    expect(kit.rules!.dos).toBeDefined();
    expect(kit.rules!.dos!.length).toBeGreaterThanOrEqual(3);
  });

  it("has logos array", () => {
    expect(kit.logos).toBeDefined();
    expect(kit.logos!.length).toBeGreaterThanOrEqual(1);
  });

  it("has buttons with at least one style", () => {
    expect(kit.buttons).toBeDefined();
    expect(kit.buttons!.styles.length).toBeGreaterThanOrEqual(1);
  });

  it("has effects with shadows and/or gradients", () => {
    expect(kit.effects).toBeDefined();
    const totalEffects = kit.effects!.shadows.length + kit.effects!.gradients.length;
    expect(totalEffects).toBeGreaterThanOrEqual(1);
  });
});

// ─── Test 2: Schema completeness for a minimal site ──────────────────────

describe("Schema completeness — minimal site", () => {
  const kit = mockBrandKitMinimal;

  it("has valid meta even with sparse data", () => {
    expect(kit.meta).toBeDefined();
    expect(kit.meta.url).toBeTruthy();
    expect(kit.meta.domain).toBeTruthy();
    expect(kit.meta.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("has identity with at least brandName", () => {
    expect(kit.identity).toBeDefined();
    expect(kit.identity!.brandName).toBeTruthy();
  });

  it("gracefully handles missing tagline and description", () => {
    // These should be undefined, not throw
    expect(kit.identity!.tagline).toBeUndefined();
    expect(kit.identity!.description).toBeUndefined();
  });

  it("gracefully handles missing archetypes", () => {
    expect(kit.identity!.archetypes).toBeUndefined();
  });

  it("has colors even if sparse", () => {
    expect(kit.colors).toBeDefined();
    expect(kit.colors!.lightMode).toBeDefined();
    // Should have at least primary
    expect(kit.colors!.lightMode!.primary).toBeDefined();
  });

  it("gracefully handles missing dark mode", () => {
    expect(kit.colors!.darkMode).toBeUndefined();
  });

  it("has empty voice data without crashing", () => {
    expect(kit.voice).toBeDefined();
    expect(kit.voice!.toneSpectrum).toBeDefined();
    expect(kit.voice!.sampleCopy).toEqual([]);
  });

  it("has empty rules arrays", () => {
    expect(kit.rules).toBeDefined();
    expect(kit.rules!.dos).toEqual([]);
    expect(kit.rules!.donts).toEqual([]);
  });

  it("has empty vibe tags", () => {
    expect(kit.vibe).toBeDefined();
    expect(kit.vibe!.tags).toEqual([]);
    expect(kit.vibe!.summary).toBeUndefined();
  });

  it("handles empty logos and assets arrays", () => {
    expect(kit.logos).toEqual([]);
    expect(kit.assets).toEqual([]);
  });
});

// ─── Test 3: Color parsing validation ────────────────────────────────────

describe("Color parsing validation", () => {
  const kit = mockBrandKitFull;

  it("all hex colors in lightMode are valid 6-digit hex format", () => {
    const lightMode = kit.colors!.lightMode!;
    const roles = Object.keys(lightMode) as (keyof typeof lightMode)[];
    for (const role of roles) {
      const color = lightMode[role] as ColorValue | undefined;
      if (color?.hex) {
        expect(color.hex, `lightMode.${role}.hex should be valid hex`).toMatch(HEX_REGEX);
      }
    }
  });

  it("all hex colors in darkMode are valid 6-digit hex format", () => {
    const darkMode = kit.colors!.darkMode!;
    const roles = Object.keys(darkMode) as (keyof typeof darkMode)[];
    for (const role of roles) {
      const color = darkMode[role] as ColorValue | undefined;
      if (color?.hex) {
        expect(color.hex, `darkMode.${role}.hex should be valid hex`).toMatch(HEX_REGEX);
      }
    }
  });

  it("all hex colors in semantic are valid 6-digit hex format", () => {
    const semantic = kit.colors!.semantic!;
    const roles = Object.keys(semantic) as (keyof typeof semantic)[];
    for (const role of roles) {
      const color = semantic[role] as ColorValue | undefined;
      if (color?.hex) {
        expect(color.hex, `semantic.${role}.hex should be valid hex`).toMatch(HEX_REGEX);
      }
    }
  });

  it("all hex colors in rawPalette are valid 6-digit hex format", () => {
    for (const color of kit.colors!.rawPalette!) {
      if (color.hex) {
        expect(color.hex, `rawPalette hex ${color.hex}`).toMatch(HEX_REGEX);
      }
    }
  });

  it("all confidence scores are between 0 and 1", () => {
    const allColors: ColorValue[] = [
      ...Object.values(kit.colors!.lightMode!).filter(Boolean),
      ...Object.values(kit.colors!.darkMode!).filter(Boolean),
      ...Object.values(kit.colors!.semantic!).filter(Boolean),
      ...(kit.colors!.rawPalette ?? []),
    ] as ColorValue[];

    for (const color of allColors) {
      if (color.confidence !== undefined) {
        expect(color.confidence, `confidence for ${color.hex}`).toBeGreaterThanOrEqual(0);
        expect(color.confidence, `confidence for ${color.hex}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("role assignments are from the valid set", () => {
    const validRoleStrings = VALID_COLOR_ROLES as readonly string[];

    // Check lightMode roles
    const lightMode = kit.colors!.lightMode!;
    for (const key of Object.keys(lightMode)) {
      const color = lightMode[key as keyof typeof lightMode] as ColorValue | undefined;
      if (color?.role) {
        expect(
          validRoleStrings.includes(color.role),
          `Role "${color.role}" should be a valid color role`
        ).toBe(true);
      }
    }

    // Check semantic roles
    const semantic = kit.colors!.semantic!;
    for (const key of Object.keys(semantic)) {
      const color = semantic[key as keyof typeof semantic] as ColorValue | undefined;
      if (color?.role) {
        expect(
          validRoleStrings.includes(color.role),
          `Semantic role "${color.role}" should be a valid color role`
        ).toBe(true);
      }
    }
  });

  it("RGB values are valid (0-255)", () => {
    const lightMode = kit.colors!.lightMode!;
    for (const key of Object.keys(lightMode)) {
      const color = lightMode[key as keyof typeof lightMode] as ColorValue | undefined;
      if (color?.rgb) {
        expect(color.rgb.r).toBeGreaterThanOrEqual(0);
        expect(color.rgb.r).toBeLessThanOrEqual(255);
        expect(color.rgb.g).toBeGreaterThanOrEqual(0);
        expect(color.rgb.g).toBeLessThanOrEqual(255);
        expect(color.rgb.b).toBeGreaterThanOrEqual(0);
        expect(color.rgb.b).toBeLessThanOrEqual(255);
      }
    }
  });
});

// ─── Test 4: Typography validation ───────────────────────────────────────

describe("Typography validation", () => {
  const kit = mockBrandKitFull;

  it("font families have non-empty name", () => {
    for (const family of kit.typography!.families!) {
      expect(family.name, "Font family name should be non-empty").toBeTruthy();
      expect(family.name!.length).toBeGreaterThan(0);
    }
  });

  it("font families have valid role", () => {
    const validRoles = ["heading", "body", "mono", "display"];
    for (const family of kit.typography!.families!) {
      if (family.role) {
        expect(
          validRoles.includes(family.role),
          `Font role "${family.role}" should be valid`
        ).toBe(true);
      }
    }
  });

  it("font families have valid source", () => {
    const validSources = ["google-fonts", "adobe-fonts", "self-hosted", "system"];
    for (const family of kit.typography!.families!) {
      if (family.source) {
        expect(
          validSources.includes(family.source),
          `Font source "${family.source}" should be valid`
        ).toBe(true);
      }
    }
  });

  it("font weights are valid CSS weights (100-900, multiples of 100)", () => {
    for (const family of kit.typography!.families!) {
      if (family.weights) {
        for (const weight of family.weights) {
          expect(
            isValidCssWeight(weight),
            `Weight ${weight} for ${family.name} should be a valid CSS weight`
          ).toBe(true);
        }
      }
    }
  });

  it("font confidence scores are between 0 and 1", () => {
    for (const family of kit.typography!.families!) {
      expect(isValidConfidence(family.confidence)).toBe(true);
    }
  });

  it("type scale entries have valid font sizes (parseable as CSS values)", () => {
    const scale = kit.typography!.scale!;
    const levels = Object.keys(scale) as (keyof typeof scale)[];
    for (const level of levels) {
      const entry = scale[level] as TypeScaleEntry | undefined;
      if (entry?.fontSize) {
        // Should be a string like "3rem", "40px", "1em" etc.
        expect(entry.fontSize).toMatch(/^\d+(\.\d+)?(rem|px|em|%)$/);
      }
    }
  });

  it("type scale entries have valid font weights", () => {
    const scale = kit.typography!.scale!;
    const levels = Object.keys(scale) as (keyof typeof scale)[];
    for (const level of levels) {
      const entry = scale[level] as TypeScaleEntry | undefined;
      if (entry?.fontWeight !== undefined) {
        expect(
          isValidCssWeight(entry.fontWeight),
          `Type scale ${level} weight ${entry.fontWeight} should be valid`
        ).toBe(true);
      }
    }
  });

  it("type scale entries have valid line heights", () => {
    const scale = kit.typography!.scale!;
    const levels = Object.keys(scale) as (keyof typeof scale)[];
    for (const level of levels) {
      const entry = scale[level] as TypeScaleEntry | undefined;
      if (entry?.lineHeight) {
        const parsed = parseFloat(entry.lineHeight);
        expect(parsed).toBeGreaterThan(0);
      }
    }
  });
});

// ─── Test 5: Voice analysis validation ───────────────────────────────────

describe("Voice analysis validation", () => {
  const voice = mockBrandKitFull.voice!;

  it("tone spectrum values are between 1 and 10", () => {
    const spectrum = voice.toneSpectrum!;
    const axes: (keyof typeof spectrum)[] = [
      "formalCasual",
      "playfulSerious",
      "enthusiasticMatterOfFact",
      "respectfulIrreverent",
      "technicalAccessible",
    ];
    for (const axis of axes) {
      const value = spectrum[axis];
      if (value !== undefined) {
        expect(value, `${axis} should be >= 1`).toBeGreaterThanOrEqual(1);
        expect(value, `${axis} should be <= 10`).toBeLessThanOrEqual(10);
      }
    }
  });

  it("vocabulary complexity is a valid value", () => {
    const validValues = ["simple", "moderate", "advanced"];
    const complexity = voice.copywritingStyle!.vocabularyComplexity;
    if (complexity) {
      expect(validValues.includes(complexity)).toBe(true);
    }
  });

  it("jargon usage is a valid value", () => {
    const validValues = ["none", "some", "heavy"];
    const jargon = voice.copywritingStyle!.jargonUsage;
    if (jargon) {
      expect(validValues.includes(jargon)).toBe(true);
    }
  });

  it("emoji usage is a valid value", () => {
    const validValues = ["none", "light", "heavy"];
    const emoji = voice.contentPatterns!.emojiUsage;
    if (emoji) {
      expect(validValues.includes(emoji)).toBe(true);
    }
  });

  it("exclamation frequency is a valid value", () => {
    const validValues = ["none", "rare", "frequent"];
    const freq = voice.contentPatterns!.exclamationFrequency;
    if (freq) {
      expect(validValues.includes(freq)).toBe(true);
    }
  });

  it("sample copy is an array of strings", () => {
    expect(Array.isArray(voice.sampleCopy)).toBe(true);
    for (const sample of voice.sampleCopy!) {
      expect(typeof sample).toBe("string");
      expect(sample.length).toBeGreaterThan(0);
    }
  });

  it("average sentence length is a positive number", () => {
    const avg = voice.copywritingStyle!.avgSentenceLength;
    if (avg !== undefined) {
      expect(avg).toBeGreaterThan(0);
    }
  });

  it("rhetorical devices is an array of non-empty strings", () => {
    const devices = voice.copywritingStyle!.rhetoricalDevices;
    if (devices) {
      expect(Array.isArray(devices)).toBe(true);
      for (const device of devices) {
        expect(typeof device).toBe("string");
        expect(device.length).toBeGreaterThan(0);
      }
    }
  });
});

// ─── Test 6: Export format validation ────────────────────────────────────

describe("Export format validation — CSS Variables", () => {
  it("produces valid CSS with :root block for full kit", () => {
    const css = exportCssVariables(mockBrandKitFull);
    expect(css).toContain(":root {");
    expect(css).toContain("}");
    expect(css).toContain("/* ExtractVibe Brand Kit");
  });

  it("contains color variables for light mode", () => {
    const css = exportCssVariables(mockBrandKitFull);
    expect(css).toContain("--ev-color-primary:");
    expect(css).toContain("#635bff");
  });

  it("contains dark mode media query when dark mode exists", () => {
    const css = exportCssVariables(mockBrandKitFull);
    expect(css).toContain("@media (prefers-color-scheme: dark)");
  });

  it("contains typography variables", () => {
    const css = exportCssVariables(mockBrandKitFull);
    expect(css).toContain("--ev-font-heading:");
    expect(css).toContain("--ev-font-body:");
  });

  it("contains type scale variables", () => {
    const css = exportCssVariables(mockBrandKitFull);
    expect(css).toContain("--ev-text-h1:");
    expect(css).toContain("--ev-text-body:");
  });

  it("contains spacing variables", () => {
    const css = exportCssVariables(mockBrandKitFull);
    expect(css).toContain("--ev-spacing-base:");
    expect(css).toContain("--ev-radius-sm:");
  });

  it("handles minimal kit without crashing", () => {
    const css = exportCssVariables(mockBrandKitMinimal);
    expect(typeof css).toBe("string");
    expect(css.length).toBeGreaterThan(0);
    expect(css).toContain(":root {");
  });

  it("all CSS variables follow --ev- naming convention", () => {
    const css = exportCssVariables(mockBrandKitFull);
    // Extract all variable declarations
    const varMatches = css.match(/--[\w-]+:/g) ?? [];
    for (const varDecl of varMatches) {
      expect(
        varDecl.startsWith("--ev-"),
        `Variable "${varDecl}" should start with --ev-`
      ).toBe(true);
    }
  });
});

describe("Export format validation — Tailwind Config", () => {
  it("produces @theme block for full kit", () => {
    const tw = exportTailwindConfig(mockBrandKitFull);
    expect(tw).toContain("@theme {");
    expect(tw).toContain("}");
  });

  it("contains brand color tokens", () => {
    const tw = exportTailwindConfig(mockBrandKitFull);
    expect(tw).toContain("--color-brand-primary:");
    expect(tw).toContain("#635bff");
  });

  it("contains semantic color tokens", () => {
    const tw = exportTailwindConfig(mockBrandKitFull);
    expect(tw).toContain("--color-success:");
    expect(tw).toContain("--color-error:");
  });

  it("contains font family tokens", () => {
    const tw = exportTailwindConfig(mockBrandKitFull);
    expect(tw).toContain("--font-heading:");
    expect(tw).toContain("--font-body:");
  });

  it("contains border radius tokens", () => {
    const tw = exportTailwindConfig(mockBrandKitFull);
    expect(tw).toContain("--radius-sm:");
    expect(tw).toContain("--radius-md:");
  });

  it("handles minimal kit without crashing", () => {
    const tw = exportTailwindConfig(mockBrandKitMinimal);
    expect(typeof tw).toBe("string");
    expect(tw.length).toBeGreaterThan(0);
  });
});

describe("Export format validation — Design Tokens (W3C JSON)", () => {
  it("produces valid JSON", () => {
    const json = exportDesignTokens(mockBrandKitFull);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("has $name and $description at root", () => {
    const tokens = JSON.parse(exportDesignTokens(mockBrandKitFull));
    expect(tokens.$name).toContain("stripe.com");
    expect(tokens.$description).toContain("ExtractVibe");
  });

  it("color tokens have $type: color", () => {
    const tokens = JSON.parse(exportDesignTokens(mockBrandKitFull));
    expect(tokens.color).toBeDefined();
    expect(tokens.color.primary.$type).toBe("color");
    expect(tokens.color.primary.$value).toBe("#635bff");
  });

  it("font tokens have $type: fontFamily", () => {
    const tokens = JSON.parse(exportDesignTokens(mockBrandKitFull));
    expect(tokens.font).toBeDefined();
    expect(tokens.font.heading.$type).toBe("fontFamily");
    expect(tokens.font.body.$type).toBe("fontFamily");
  });

  it("type scale tokens have $type fields", () => {
    const tokens = JSON.parse(exportDesignTokens(mockBrandKitFull));
    expect(tokens.typeScale).toBeDefined();
    expect(tokens.typeScale.h1).toBeDefined();
    expect(tokens.typeScale.h1.fontSize.$type).toBe("dimension");
    expect(tokens.typeScale.h1.fontWeight.$type).toBe("fontWeight");
  });

  it("spacing tokens have $type: dimension", () => {
    const tokens = JSON.parse(exportDesignTokens(mockBrandKitFull));
    expect(tokens.spacing).toBeDefined();
    expect(tokens.spacing.base.$type).toBe("dimension");
  });

  it("border radius tokens have $type: dimension", () => {
    const tokens = JSON.parse(exportDesignTokens(mockBrandKitFull));
    expect(tokens.borderRadius).toBeDefined();
    expect(tokens.borderRadius.sm.$type).toBe("dimension");
    expect(tokens.borderRadius.md.$type).toBe("dimension");
  });

  it("dark mode colors are nested under color.dark", () => {
    const tokens = JSON.parse(exportDesignTokens(mockBrandKitFull));
    expect(tokens.color.dark).toBeDefined();
    expect(tokens.color.dark.primary.$type).toBe("color");
    expect(tokens.color.dark.primary.$value).toBe("#7a73ff");
  });

  it("handles minimal kit — produces valid JSON with fewer tokens", () => {
    const json = exportDesignTokens(mockBrandKitMinimal);
    expect(() => JSON.parse(json)).not.toThrow();
    const tokens = JSON.parse(json);
    expect(tokens.$name).toBeDefined();
    // Minimal kit should still have at least primary color
    expect(tokens.color).toBeDefined();
    expect(tokens.color.primary.$value).toBe("#333333");
  });
});

describe("Export format validation — Markdown Report", () => {
  it("contains key sections for full kit", () => {
    const md = exportMarkdownReport(mockBrandKitFull);
    expect(md).toContain("# Brand Kit:");
    expect(md).toContain("## Colors");
    expect(md).toContain("## Typography");
    expect(md).toContain("## Voice & Personality");
    expect(md).toContain("## Brand Rules");
    expect(md).toContain("## Vibe");
  });

  it("contains brand identity info", () => {
    const md = exportMarkdownReport(mockBrandKitFull);
    expect(md).toContain("## Brand Identity");
    expect(md).toContain("Stripe");
    expect(md).toContain("Financial infrastructure");
  });

  it("contains color tables", () => {
    const md = exportMarkdownReport(mockBrandKitFull);
    expect(md).toContain("### Light Mode");
    expect(md).toContain("`#635bff`");
    expect(md).toContain("### Dark Mode");
  });

  it("contains typography table", () => {
    const md = exportMarkdownReport(mockBrandKitFull);
    expect(md).toContain("| Role | Font | Weights |");
    expect(md).toContain("Inter");
    expect(md).toContain("Sohne");
  });

  it("contains type scale table", () => {
    const md = exportMarkdownReport(mockBrandKitFull);
    expect(md).toContain("### Type Scale");
    expect(md).toContain("| Level | Size | Weight | Line Height |");
  });

  it("contains tone spectrum visualization", () => {
    const md = exportMarkdownReport(mockBrandKitFull);
    expect(md).toContain("### Tone Spectrum");
    expect(md).toContain("Formal");
    expect(md).toContain("Casual");
  });

  it("contains brand rules", () => {
    const md = exportMarkdownReport(mockBrandKitFull);
    expect(md).toContain("### DOs");
    expect(md).toContain("### DON'Ts");
  });

  it("contains logos section", () => {
    const md = exportMarkdownReport(mockBrandKitFull);
    expect(md).toContain("## Logos");
    expect(md).toContain("primary");
    expect(md).toContain("favicon");
  });

  it("contains official guidelines section", () => {
    const md = exportMarkdownReport(mockBrandKitFull);
    expect(md).toContain("## Official Guidelines");
    expect(md).toContain("brand-assets");
  });

  it("contains footer", () => {
    const md = exportMarkdownReport(mockBrandKitFull);
    expect(md).toContain("Generated by [ExtractVibe]");
  });

  it("handles minimal kit without crashing", () => {
    const md = exportMarkdownReport(mockBrandKitMinimal);
    expect(typeof md).toBe("string");
    expect(md.length).toBeGreaterThan(0);
    expect(md).toContain("# Brand Kit:");
  });
});

// ─── Test 7: Vibe synthesis validation ───────────────────────────────────

describe("Vibe synthesis validation", () => {
  const vibe = mockBrandKitFull.vibe!;
  const rules = mockBrandKitFull.rules!;
  const identity = mockBrandKitFull.identity!;

  it("vibe.tags is an array of 3+ strings", () => {
    expect(Array.isArray(vibe.tags)).toBe(true);
    expect(vibe.tags!.length).toBeGreaterThanOrEqual(3);
    for (const tag of vibe.tags!) {
      expect(typeof tag).toBe("string");
      expect(tag.length).toBeGreaterThan(0);
    }
  });

  it("vibe.visualEnergy is between 1 and 10", () => {
    expect(vibe.visualEnergy).toBeDefined();
    expect(vibe.visualEnergy).toBeGreaterThanOrEqual(1);
    expect(vibe.visualEnergy).toBeLessThanOrEqual(10);
  });

  it("vibe.summary is a non-empty string", () => {
    expect(vibe.summary).toBeTruthy();
    expect(typeof vibe.summary).toBe("string");
    expect(vibe.summary!.length).toBeGreaterThan(10);
  });

  it("vibe.confidence is between 0 and 1", () => {
    expect(isValidConfidence(vibe.confidence)).toBe(true);
  });

  it("vibe.comparableBrands is an array of strings", () => {
    expect(Array.isArray(vibe.comparableBrands)).toBe(true);
    for (const brand of vibe.comparableBrands!) {
      expect(typeof brand).toBe("string");
      expect(brand.length).toBeGreaterThan(0);
    }
  });

  it("rules.dos and rules.donts are arrays of strings", () => {
    expect(Array.isArray(rules.dos)).toBe(true);
    expect(Array.isArray(rules.donts)).toBe(true);
    for (const rule of rules.dos!) {
      expect(typeof rule).toBe("string");
      expect(rule.length).toBeGreaterThan(0);
    }
    for (const rule of rules.donts!) {
      expect(typeof rule).toBe("string");
      expect(rule.length).toBeGreaterThan(0);
    }
  });

  it("rules.source is a valid value", () => {
    const validSources = ["inferred", "official", "merged"];
    if (rules.source) {
      expect(validSources.includes(rules.source)).toBe(true);
    }
  });

  it("archetypes is an array with name + confidence", () => {
    expect(Array.isArray(identity.archetypes)).toBe(true);
    expect(identity.archetypes!.length).toBeGreaterThanOrEqual(1);
    for (const archetype of identity.archetypes!) {
      expect(typeof archetype.name).toBe("string");
      expect(archetype.name.length).toBeGreaterThan(0);
      expect(isValidConfidence(archetype.confidence)).toBe(true);
    }
  });

  it("vibe.designEra is a non-empty string", () => {
    expect(vibe.designEra).toBeTruthy();
    expect(typeof vibe.designEra).toBe("string");
  });

  it("vibe.emotionalTone is a non-empty string", () => {
    expect(vibe.emotionalTone).toBeTruthy();
    expect(typeof vibe.emotionalTone).toBe("string");
  });

  it("vibe.targetAudienceInferred is a non-empty string", () => {
    expect(vibe.targetAudienceInferred).toBeTruthy();
    expect(typeof vibe.targetAudienceInferred).toBe("string");
  });
});

// ─── Test 8: Edge cases ──────────────────────────────────────────────────

describe("Edge cases — empty/null data", () => {
  it("CSS export handles empty kit (only meta)", () => {
    const css = exportCssVariables(mockBrandKitEmpty);
    expect(typeof css).toBe("string");
    expect(css.length).toBeGreaterThan(0);
    // Should have a fallback message or an empty :root
    expect(css).toContain("ExtractVibe");
  });

  it("Tailwind export handles empty kit", () => {
    const tw = exportTailwindConfig(mockBrandKitEmpty);
    expect(typeof tw).toBe("string");
    expect(tw.length).toBeGreaterThan(0);
  });

  it("Design Tokens export handles empty kit — produces valid JSON", () => {
    const json = exportDesignTokens(mockBrandKitEmpty);
    expect(() => JSON.parse(json)).not.toThrow();
    const tokens = JSON.parse(json);
    expect(tokens.$name).toBeDefined();
  });

  it("Markdown export handles empty kit", () => {
    const md = exportMarkdownReport(mockBrandKitEmpty);
    expect(typeof md).toBe("string");
    expect(md.length).toBeGreaterThan(0);
    expect(md).toContain("# Brand Kit:");
  });

  it("CSS export handles kit with undefined colors", () => {
    const kit: ExtractVibeBrandKit = {
      meta: { url: "https://test.com", domain: "test.com", schemaVersion: "v1" },
      colors: undefined,
    };
    const css = exportCssVariables(kit);
    expect(typeof css).toBe("string");
    expect(css).toContain("ExtractVibe");
  });

  it("CSS export handles kit with empty lightMode", () => {
    const kit: ExtractVibeBrandKit = {
      meta: { url: "https://test.com", domain: "test.com", schemaVersion: "v1" },
      colors: { lightMode: {}, rawPalette: [] },
    };
    const css = exportCssVariables(kit);
    expect(typeof css).toBe("string");
  });

  it("Tailwind export handles kit with undefined typography", () => {
    const kit: ExtractVibeBrandKit = {
      meta: { url: "https://test.com", domain: "test.com", schemaVersion: "v1" },
      typography: undefined,
    };
    const tw = exportTailwindConfig(kit);
    expect(typeof tw).toBe("string");
  });

  it("Markdown export handles kit with missing voice data", () => {
    const kit: ExtractVibeBrandKit = {
      meta: { url: "https://test.com", domain: "test.com", schemaVersion: "v1" },
      voice: undefined,
    };
    const md = exportMarkdownReport(kit);
    expect(typeof md).toBe("string");
    expect(md).not.toContain("## Voice & Personality");
  });

  it("Markdown export handles kit with missing rules", () => {
    const kit: ExtractVibeBrandKit = {
      meta: { url: "https://test.com", domain: "test.com", schemaVersion: "v1" },
      rules: undefined,
    };
    const md = exportMarkdownReport(kit);
    expect(typeof md).toBe("string");
    expect(md).not.toContain("## Brand Rules");
  });

  it("Design Tokens export handles kit with no colors, no fonts", () => {
    const kit: ExtractVibeBrandKit = {
      meta: { url: "https://test.com", domain: "test.com", schemaVersion: "v1" },
      colors: undefined,
      typography: undefined,
      spacing: undefined,
    };
    const json = exportDesignTokens(kit);
    const tokens = JSON.parse(json);
    expect(tokens.$name).toBeDefined();
    // Should not have color, font, or spacing keys
    expect(tokens.color).toBeUndefined();
    expect(tokens.font).toBeUndefined();
    expect(tokens.spacing).toBeUndefined();
  });

  it("all exports handle empty rawPalette without crashing", () => {
    const kit: ExtractVibeBrandKit = {
      meta: { url: "https://test.com", domain: "test.com", schemaVersion: "v1" },
      colors: { rawPalette: [] },
    };
    expect(() => exportCssVariables(kit)).not.toThrow();
    expect(() => exportTailwindConfig(kit)).not.toThrow();
    expect(() => exportDesignTokens(kit)).not.toThrow();
    expect(() => exportMarkdownReport(kit)).not.toThrow();
  });
});

// ─── Additional: createEmptyBrandKit factory ─────────────────────────────

describe("createEmptyBrandKit factory", () => {
  it("creates a kit with correct domain extraction", () => {
    const kit = createEmptyBrandKit("https://www.example.com/page");
    expect(kit.meta.domain).toBe("example.com");
    expect(kit.meta.url).toBe("https://www.example.com/page");
    expect(kit.meta.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("strips www. from domain", () => {
    const kit = createEmptyBrandKit("https://www.stripe.com");
    expect(kit.meta.domain).toBe("stripe.com");
  });

  it("handles invalid URL gracefully", () => {
    const kit = createEmptyBrandKit("not-a-url");
    expect(kit.meta.domain).toBe("not-a-url");
  });

  it("initializes all top-level sections", () => {
    const kit = createEmptyBrandKit("https://test.com");
    expect(kit.identity).toBeDefined();
    expect(kit.logos).toBeDefined();
    expect(kit.colors).toBeDefined();
    expect(kit.typography).toBeDefined();
    expect(kit.spacing).toBeDefined();
    expect(kit.assets).toBeDefined();
    expect(kit.voice).toBeDefined();
    expect(kit.rules).toBeDefined();
    expect(kit.vibe).toBeDefined();
    expect(kit.officialGuidelines).toBeDefined();
    expect(kit.buttons).toBeDefined();
    expect(kit.effects).toBeDefined();
  });

  it("initializes arrays as empty", () => {
    const kit = createEmptyBrandKit("https://test.com");
    expect(kit.logos).toEqual([]);
    expect(kit.assets).toEqual([]);
    expect(kit.colors!.rawPalette).toEqual([]);
    expect(kit.typography!.families).toEqual([]);
    expect(kit.voice!.sampleCopy).toEqual([]);
    expect(kit.rules!.dos).toEqual([]);
    expect(kit.rules!.donts).toEqual([]);
    expect(kit.vibe!.tags).toEqual([]);
    expect(kit.vibe!.comparableBrands).toEqual([]);
    expect(kit.buttons!.styles).toEqual([]);
    expect(kit.effects!.shadows).toEqual([]);
    expect(kit.effects!.gradients).toEqual([]);
  });

  it("sets extractedAt to a valid ISO-8601 timestamp", () => {
    const kit = createEmptyBrandKit("https://test.com");
    expect(kit.meta.extractedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(() => new Date(kit.meta.extractedAt!)).not.toThrow();
  });
});
