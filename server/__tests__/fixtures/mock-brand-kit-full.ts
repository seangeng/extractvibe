/**
 * Full mock brand kit — modeled after a well-structured SaaS site like Stripe.
 * Every section is populated with realistic data.
 */
import type { ExtractVibeBrandKit } from "../../schema/v1";

export const mockBrandKitFull: ExtractVibeBrandKit = {
  meta: {
    url: "https://stripe.com",
    domain: "stripe.com",
    extractedAt: "2026-03-24T12:00:00.000Z",
    schemaVersion: "v1",
    durationMs: 14320,
    extractionDepth: 3,
    sitePageCount: 247,
  },

  identity: {
    brandName: "Stripe",
    tagline: "Financial infrastructure for the internet",
    description:
      "Stripe is a suite of APIs powering online payment processing and commerce solutions for internet businesses of all sizes.",
    archetypes: [
      { name: "The Creator", confidence: 0.85 },
      { name: "The Sage", confidence: 0.72 },
    ],
  },

  logos: [
    {
      type: "primary",
      url: "https://r2.extractvibe.com/stripe.com/logo-primary.svg",
      originalUrl: "https://stripe.com/img/v3/home/social.png",
      format: "svg",
      variant: "color",
      dimensions: { width: 120, height: 40 },
      confidence: 0.95,
      source: "extracted",
    },
    {
      type: "favicon",
      url: "https://r2.extractvibe.com/stripe.com/favicon.ico",
      originalUrl: "https://stripe.com/favicon.ico",
      format: "ico",
      variant: "color",
      dimensions: { width: 32, height: 32 },
      confidence: 1.0,
      source: "favicon",
    },
    {
      type: "logomark",
      url: "https://r2.extractvibe.com/stripe.com/logomark.svg",
      originalUrl: "https://stripe.com/img/v3/logomark.svg",
      format: "svg",
      variant: "color",
      confidence: 0.88,
      source: "extracted",
    },
  ],

  colors: {
    lightMode: {
      primary: { hex: "#635bff", rgb: { r: 99, g: 91, b: 255 }, role: "primary", source: "--color-primary", confidence: 0.95 },
      secondary: { hex: "#0a2540", rgb: { r: 10, g: 37, b: 64 }, role: "secondary", source: "--color-secondary", confidence: 0.90 },
      accent: { hex: "#00d4aa", rgb: { r: 0, g: 212, b: 170 }, role: "accent", source: "--color-accent", confidence: 0.85 },
      background: { hex: "#ffffff", rgb: { r: 255, g: 255, b: 255 }, role: "background", source: "body", confidence: 0.99 },
      surface: { hex: "#f6f9fc", rgb: { r: 246, g: 249, b: 252 }, role: "surface", source: ".card", confidence: 0.80 },
      text: { hex: "#425466", rgb: { r: 66, g: 84, b: 102 }, role: "text", source: "body", confidence: 0.92 },
      secondaryText: { hex: "#8898aa", rgb: { r: 136, g: 152, b: 170 }, role: "secondaryText", source: ".muted", confidence: 0.78 },
      border: { hex: "#e3e8ee", rgb: { r: 227, g: 232, b: 238 }, role: "border", source: ".border", confidence: 0.85 },
      link: { hex: "#635bff", rgb: { r: 99, g: 91, b: 255 }, role: "link", source: "a", confidence: 0.88 },
      muted: { hex: "#f0f5fa", rgb: { r: 240, g: 245, b: 250 }, role: "muted", source: ".bg-muted", confidence: 0.75 },
    },
    darkMode: {
      primary: { hex: "#7a73ff", rgb: { r: 122, g: 115, b: 255 }, role: "primary", confidence: 0.90 },
      background: { hex: "#0a2540", rgb: { r: 10, g: 37, b: 64 }, role: "background", confidence: 0.95 },
      text: { hex: "#adbdcc", rgb: { r: 173, g: 189, b: 204 }, role: "text", confidence: 0.85 },
      surface: { hex: "#1a3a5c", rgb: { r: 26, g: 58, b: 92 }, role: "surface", confidence: 0.80 },
    },
    semantic: {
      success: { hex: "#28a745", rgb: { r: 40, g: 167, b: 69 }, role: "success", confidence: 0.88 },
      warning: { hex: "#f5a623", rgb: { r: 245, g: 166, b: 35 }, role: "warning", confidence: 0.82 },
      error: { hex: "#dc3545", rgb: { r: 220, g: 53, b: 69 }, role: "error", confidence: 0.90 },
      info: { hex: "#17a2b8", rgb: { r: 23, g: 162, b: 184 }, role: "info", confidence: 0.80 },
    },
    rawPalette: [
      { hex: "#635bff", role: "primary", confidence: 0.95 },
      { hex: "#0a2540", role: "secondary", confidence: 0.90 },
      { hex: "#00d4aa", role: "accent", confidence: 0.85 },
      { hex: "#ffffff", role: "background", confidence: 0.99 },
      { hex: "#f6f9fc", role: "surface", confidence: 0.80 },
      { hex: "#425466", role: "text", confidence: 0.92 },
      { hex: "#8898aa", role: "secondaryText", confidence: 0.78 },
      { hex: "#e3e8ee", role: "border", confidence: 0.85 },
      { hex: "#28a745", role: "success", confidence: 0.88 },
      { hex: "#dc3545", role: "error", confidence: 0.90 },
    ],
  },

  typography: {
    families: [
      {
        name: "Inter",
        role: "body",
        source: "google-fonts",
        weights: [400, 500, 600],
        fallbackStack: "system-ui, sans-serif",
        confidence: 0.95,
      },
      {
        name: "Sohne",
        role: "heading",
        source: "self-hosted",
        weights: [400, 500, 700],
        fallbackStack: "system-ui, sans-serif",
        confidence: 0.90,
      },
      {
        name: "JetBrains Mono",
        role: "mono",
        source: "google-fonts",
        weights: [400, 700],
        fallbackStack: "Menlo, Consolas, monospace",
        confidence: 0.88,
      },
    ],
    scale: {
      h1: { fontSize: "3rem", fontWeight: 700, lineHeight: "1.1", letterSpacing: "-0.03em", fontFamily: "Sohne" },
      h2: { fontSize: "2.25rem", fontWeight: 700, lineHeight: "1.2", letterSpacing: "-0.02em", fontFamily: "Sohne" },
      h3: { fontSize: "1.5rem", fontWeight: 600, lineHeight: "1.3", letterSpacing: "-0.01em", fontFamily: "Sohne" },
      h4: { fontSize: "1.25rem", fontWeight: 600, lineHeight: "1.4", fontFamily: "Sohne" },
      body: { fontSize: "1rem", fontWeight: 400, lineHeight: "1.6", fontFamily: "Inter" },
      small: { fontSize: "0.875rem", fontWeight: 400, lineHeight: "1.5", fontFamily: "Inter" },
      caption: { fontSize: "0.75rem", fontWeight: 400, lineHeight: "1.4", fontFamily: "Inter" },
    },
    conventions: {
      headingCase: "sentence-case",
      bodyLineHeight: "1.6",
      codeFont: "JetBrains Mono",
    },
  },

  spacing: {
    baseUnit: "8px",
    borderRadius: {
      small: "4px",
      medium: "8px",
      large: "12px",
    },
    containerMaxWidth: "1280px",
    grid: {
      columns: 12,
      gap: "1.5rem",
    },
  },

  assets: [
    {
      type: "hero",
      url: "https://r2.extractvibe.com/stripe.com/hero.webp",
      format: "webp",
      context: "hero section",
      extractedFrom: ".hero-image",
      dimensions: { width: 1920, height: 1080 },
      confidence: 0.85,
    },
    {
      type: "illustration",
      url: "https://r2.extractvibe.com/stripe.com/payments-illustration.svg",
      format: "svg",
      context: "features section",
      extractedFrom: ".feature-illustration",
      confidence: 0.78,
    },
  ],

  voice: {
    toneSpectrum: {
      formalCasual: 4,
      playfulSerious: 6,
      enthusiasticMatterOfFact: 5,
      respectfulIrreverent: 3,
      technicalAccessible: 4,
    },
    copywritingStyle: {
      avgSentenceLength: 16,
      vocabularyComplexity: "moderate",
      jargonUsage: "some",
      rhetoricalDevices: ["parallelism", "tricolon", "understatement"],
      ctaStyle: "Start now",
    },
    contentPatterns: {
      headingCase: "sentence-case",
      emojiUsage: "none",
      exclamationFrequency: "rare",
      questionUsageInHeadings: false,
      bulletPreference: true,
    },
    sampleCopy: [
      "Payments infrastructure for the internet.",
      "Millions of businesses of all sizes use Stripe online and in person.",
      "A fully integrated suite of payments products.",
      "Start building with Stripe's APIs and documentation.",
    ],
  },

  rules: {
    dos: [
      "Use clear, concise language that prioritizes developer understanding",
      "Maintain a professional yet approachable tone",
      "Lead with the benefit, not the feature",
      "Use code examples to illustrate integration points",
      "Prefer sentence case for all headings",
    ],
    donts: [
      "Don't use exclamation marks excessively",
      "Don't use informal slang or colloquialisms",
      "Don't sacrifice accuracy for brevity",
      "Avoid buzzwords without concrete backing",
    ],
    source: "inferred",
  },

  vibe: {
    summary: "Polished and confident with a developer-first edge — premium without being pretentious",
    tags: ["minimal", "techy", "premium", "developer-first", "polished"],
    visualEnergy: 5,
    designEra: "flat 2.0",
    comparableBrands: ["Linear", "Vercel", "Plaid"],
    emotionalTone: "trustworthy",
    targetAudienceInferred: "Developers and technical founders building internet businesses",
    confidence: 0.88,
  },

  officialGuidelines: {
    discoveredUrl: "https://stripe.com/newsroom/brand-assets",
    hasOfficialKit: true,
    guidelineRules: [
      "Use the Stripe wordmark with adequate clear space",
      "The primary brand color is Stripe Blurple (#635bff)",
      "Do not modify, distort, or recolor the Stripe logo",
    ],
  },

  buttons: {
    styles: [
      {
        variant: "primary",
        backgroundColor: "#635bff",
        textColor: "#ffffff",
        borderRadius: "8px",
        padding: "12px 24px",
        fontSize: "16px",
        fontWeight: 600,
        fontFamily: "Inter",
        sampleText: "Start now",
        confidence: 0.92,
      },
      {
        variant: "secondary",
        backgroundColor: "transparent",
        textColor: "#635bff",
        borderRadius: "8px",
        borderColor: "#635bff",
        borderWidth: "1px",
        padding: "12px 24px",
        fontSize: "16px",
        fontWeight: 600,
        fontFamily: "Inter",
        sampleText: "Contact sales",
        confidence: 0.85,
      },
      {
        variant: "ghost",
        backgroundColor: "transparent",
        textColor: "#425466",
        borderRadius: "8px",
        padding: "12px 24px",
        fontSize: "16px",
        fontWeight: 500,
        fontFamily: "Inter",
        sampleText: "Learn more",
        confidence: 0.78,
      },
    ],
  },

  effects: {
    shadows: [
      {
        value: "0 2px 4px rgba(0,0,0,0.08)",
        source: ".card",
        context: "card",
      },
      {
        value: "0 8px 24px rgba(0,0,0,0.12)",
        source: ".elevated-card",
        context: "card",
      },
      {
        value: "0 1px 3px rgba(0,0,0,0.1)",
        source: ".button",
        context: "button",
      },
    ],
    gradients: [
      {
        value: "linear-gradient(135deg, #635bff 0%, #00d4aa 100%)",
        source: ".hero-gradient",
        context: "hero background",
      },
    ],
  },

  designAssets: [
    {
      src: "https://r2.extractvibe.com/stripe.com/payments-flow.svg",
      alt: "Payments flow illustration",
      width: 800,
      height: 600,
      format: "svg",
      context: "features section",
    },
  ],

  ogImage: "https://stripe.com/img/v3/home/social.png",
};
