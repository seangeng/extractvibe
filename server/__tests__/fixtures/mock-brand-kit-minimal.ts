/**
 * Minimal mock brand kit — represents a sparse extraction result
 * from a simple site with limited brand data.
 * Many fields are missing or empty.
 */
import type { ExtractVibeBrandKit } from "../../schema/v1";

export const mockBrandKitMinimal: ExtractVibeBrandKit = {
  meta: {
    url: "https://example-minimal.com",
    domain: "example-minimal.com",
    extractedAt: "2026-03-24T12:00:00.000Z",
    schemaVersion: "v1",
    durationMs: 3200,
    extractionDepth: 1,
  },

  identity: {
    brandName: "Example Co",
    // No tagline, no description, no archetypes
  },

  logos: [],

  colors: {
    lightMode: {
      primary: { hex: "#333333", role: "primary", confidence: 0.60 },
      background: { hex: "#ffffff", role: "background", confidence: 0.70 },
    },
    // No dark mode
    semantic: {},
    rawPalette: [
      { hex: "#333333", role: "primary", confidence: 0.60 },
      { hex: "#ffffff", role: "background", confidence: 0.70 },
    ],
  },

  typography: {
    families: [
      {
        name: "Arial",
        role: "body",
        source: "system",
        weights: [400, 700],
        confidence: 0.65,
      },
    ],
    scale: {},
    conventions: {},
  },

  spacing: {
    baseUnit: undefined,
    borderRadius: {},
    containerMaxWidth: undefined,
  },

  assets: [],

  // Voice section present but empty — no AI analysis was possible
  voice: {
    toneSpectrum: {},
    copywritingStyle: {},
    contentPatterns: {},
    sampleCopy: [],
  },

  // Rules section present but empty
  rules: {
    dos: [],
    donts: [],
    source: "inferred",
  },

  // Vibe section present but sparse
  vibe: {
    summary: undefined,
    tags: [],
    visualEnergy: undefined,
    designEra: undefined,
    comparableBrands: [],
    emotionalTone: undefined,
    targetAudienceInferred: undefined,
    confidence: undefined,
  },

  officialGuidelines: {
    discoveredUrl: null,
    hasOfficialKit: false,
    guidelineRules: [],
  },

  buttons: { styles: [] },
  effects: { shadows: [], gradients: [] },
  designAssets: [],
  ogImage: undefined,
};

/**
 * Extremely sparse kit — only meta is populated.
 * Used for edge case testing of export functions.
 */
export const mockBrandKitEmpty: ExtractVibeBrandKit = {
  meta: {
    url: "https://empty-site.com",
    domain: "empty-site.com",
    extractedAt: "2026-03-24T12:00:00.000Z",
    schemaVersion: "v1",
    durationMs: 1000,
  },
  // Everything else is undefined
};
