/**
 * ExtractVibe Brand Kit Schema — v1
 *
 * This is the core schema that defines the product output.
 * Every extraction produces a JSON blob conforming to ExtractVibeBrandKit.
 *
 * Design principles:
 * - Almost every field is optional — brands vary wildly in what they expose.
 * - Confidence scores (0–1) indicate extraction certainty.
 * - Two color modes (light/dark) are first-class citizens.
 * - Voice/vibe fields capture the intangible personality of a brand.
 */

export const SCHEMA_VERSION = "v1" as const;

// ─── Primitives & Helpers ────────────────────────────────────────────

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

/** A single resolved color with provenance metadata. */
export interface ColorValue {
  /** Hex value, e.g. "#1a73e8" */
  hex?: string;
  /** RGB breakdown */
  rgb?: RGB;
  /** Human-readable color name, e.g. "Royal Blue", "Charcoal" */
  name?: string;
  /** Semantic role this color plays, e.g. "primary", "CTA background" */
  role?: string;
  /** Where the color was found: CSS variable name, selector, meta tag, etc. */
  source?: string;
  /** Extraction confidence 0–1 */
  confidence?: number;
}

// ─── Meta ────────────────────────────────────────────────────────────

/** Metadata about the extraction itself. */
export interface BrandKitMeta {
  /** The URL that was submitted for extraction */
  url?: string;
  /** Normalized domain, e.g. "stripe.com" */
  domain?: string;
  /** ISO-8601 timestamp of when extraction completed */
  extractedAt?: string;
  /** Schema version used for this result */
  schemaVersion?: string;
  /** Total extraction wall-clock time in milliseconds */
  durationMs?: number;
  /** How many pages/resources were crawled */
  extractionDepth?: number;
  /** Total pages discovered on the site (via Firecrawl map, if available) */
  sitePageCount?: number;
}

// ─── Identity ────────────────────────────────────────────────────────

export interface BrandArchetype {
  /** Archetype name, e.g. "The Creator", "The Explorer" */
  name: string;
  /** Confidence 0–1 */
  confidence?: number;
}

/** Core brand identity — name, tagline, personality. */
export interface BrandIdentity {
  /** Primary brand name as displayed on the site */
  brandName?: string;
  /** Tagline or slogan, if present */
  tagline?: string;
  /** Short brand description (typically from meta description or hero copy) */
  description?: string;
  /** Brand archetypes with confidence scores */
  archetypes?: BrandArchetype[];
}

// ─── Logos ────────────────────────────────────────────────────────────

export type LogoType =
  | "primary"
  | "secondary"
  | "wordmark"
  | "logomark"
  | "monochrome"
  | "favicon"
  | "social";

export type LogoFormat = "svg" | "png" | "ico" | "webp" | "jpg";
export type LogoVariant = "light" | "dark" | "color" | "mono";

/** A single discovered logo asset. */
export interface BrandLogo {
  /** Classification of this logo */
  type?: LogoType;
  /** URL to the extracted/stored copy (e.g. R2 URL) */
  url?: string;
  /** Original URL on the source site */
  originalUrl?: string;
  /** Image format */
  format?: LogoFormat;
  /** Visual variant */
  variant?: LogoVariant;
  /** Pixel dimensions (not applicable for SVG) */
  dimensions?: Dimensions;
  /** Extraction confidence 0–1 */
  confidence?: number;
  /** Where this logo was sourced from */
  source?: "extracted" | "loadlogo" | "favicon";
}

// ─── Colors ──────────────────────────────────────────────────────────

/** Semantic status colors. */
export interface SemanticColors {
  success?: ColorValue;
  warning?: ColorValue;
  error?: ColorValue;
  info?: ColorValue;
}

/** Color palette for a single mode (light or dark). */
export interface ColorMode {
  primary?: ColorValue;
  secondary?: ColorValue;
  accent?: ColorValue;
  background?: ColorValue;
  surface?: ColorValue;
  text?: ColorValue;
  secondaryText?: ColorValue;
  border?: ColorValue;
  link?: ColorValue;
  muted?: ColorValue;
}

/** Complete color system extracted from the site. */
export interface BrandColors {
  /** Light mode palette */
  lightMode?: ColorMode;
  /** Dark mode palette (null if no dark mode detected) */
  darkMode?: ColorMode;
  /** Semantic / status colors */
  semantic?: SemanticColors;
  /** Every unique color detected, before role assignment */
  rawPalette?: ColorValue[];
}

// ─── Typography ──────────────────────────────────────────────────────

export type FontRole = "heading" | "body" | "mono" | "display";
export type FontSource =
  | "google-fonts"
  | "adobe-fonts"
  | "self-hosted"
  | "system";

/** A single font family used on the site. */
export interface FontFamily {
  /** Font family name, e.g. "Inter", "Playfair Display" */
  name?: string;
  /** What role this font plays */
  role?: FontRole;
  /** Where the font is loaded from */
  source?: FontSource;
  /** Detected font weights, e.g. [400, 500, 700] */
  weights?: number[];
  /** CSS fallback stack, e.g. "system-ui, sans-serif" */
  fallbackStack?: string;
  /** Extraction confidence 0–1 */
  confidence?: number;
}

/** A single entry in the type scale. */
export interface TypeScaleEntry {
  /** e.g. "2.5rem", "40px" */
  fontSize?: string;
  /** e.g. 700 */
  fontWeight?: number;
  /** e.g. "1.2", "1.5" */
  lineHeight?: string;
  /** e.g. "-0.02em" */
  letterSpacing?: string;
  /** e.g. "uppercase", "capitalize" */
  textTransform?: string;
  /** Font family name this level uses */
  fontFamily?: string;
}

/** The full heading + body type scale. */
export interface TypeScale {
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

export type HeadingCase =
  | "title-case"
  | "sentence-case"
  | "lowercase"
  | "uppercase";

/** Higher-level typographic conventions. */
export interface TypographyConventions {
  /** How headings are cased */
  headingCase?: HeadingCase;
  /** Typical body line-height, e.g. "1.6" */
  bodyLineHeight?: string;
  /** Monospace / code font name */
  codeFont?: string;
}

/** Everything about how the brand uses type. */
export interface BrandTypography {
  /** All detected font families */
  families?: FontFamily[];
  /** The heading/body type scale */
  scale?: TypeScale;
  /** Conventions and patterns */
  conventions?: TypographyConventions;
}

// ─── Spacing ─────────────────────────────────────────────────────────

export interface BorderRadiusScale {
  small?: string;
  medium?: string;
  large?: string;
}

export interface GridSystem {
  /** Number of columns, e.g. 12 */
  columns?: number;
  /** Gap between columns, e.g. "1.5rem" */
  gap?: string;
}

/** Spacing and layout tokens. */
export interface BrandSpacing {
  /** Base spacing unit, e.g. "8px", "0.5rem" */
  baseUnit?: string;
  /** Border radius scale */
  borderRadius?: BorderRadiusScale;
  /** Max-width of the main content container, e.g. "1280px" */
  containerMaxWidth?: string;
  /** Grid system if detected */
  grid?: GridSystem;
}

// ─── Assets ──────────────────────────────────────────────────────────

export type AssetType =
  | "pattern"
  | "illustration"
  | "icon"
  | "hero"
  | "social"
  | "backdrop"
  | "favicon";

/** A non-logo visual asset found on the site. */
export interface BrandAsset {
  /** Classification of this asset */
  type?: AssetType;
  /** URL to the extracted/stored copy */
  url?: string;
  /** Image format */
  format?: string;
  /** Where on the page this was found, e.g. "hero section", "footer" */
  context?: string;
  /** CSS selector or URL that led to this asset */
  extractedFrom?: string;
  /** Pixel dimensions */
  dimensions?: Dimensions;
  /** Extraction confidence 0–1 */
  confidence?: number;
}

// ─── Design Assets ───────────────────────────────────────────────────

/** A design asset (illustration, hero image, transparent PNG, etc.) found on the site. */
export interface BrandDesignAsset {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  format?: string;
  context?: string;
}

// ─── Voice ───────────────────────────────────────────────────────────

/**
 * Tone spectrum — each axis is a 1–10 scale.
 * Lower values = left label, higher values = right label.
 */
export interface ToneSpectrum {
  /** 1 = very formal, 10 = very casual */
  formalCasual?: number;
  /** 1 = very playful, 10 = very serious */
  playfulSerious?: number;
  /** 1 = very enthusiastic, 10 = very matter-of-fact */
  enthusiasticMatterOfFact?: number;
  /** 1 = very respectful, 10 = very irreverent */
  respectfulIrreverent?: number;
  /** 1 = very technical, 10 = very accessible */
  technicalAccessible?: number;
}

export type VocabularyComplexity = "simple" | "moderate" | "advanced";
export type JargonUsage = "none" | "some" | "heavy";

/** How the brand writes copy. */
export interface CopywritingStyle {
  /** Average sentence length in words */
  avgSentenceLength?: number;
  /** Overall vocabulary complexity */
  vocabularyComplexity?: VocabularyComplexity;
  /** How much industry jargon is used */
  jargonUsage?: JargonUsage;
  /** Detected rhetorical devices, e.g. "alliteration", "tricolon" */
  rhetoricalDevices?: string[];
  /** Call-to-action style, e.g. "Start free trial", "Get started" */
  ctaStyle?: string;
}

export type EmojiUsage = "none" | "light" | "heavy";
export type ExclamationFrequency = "none" | "rare" | "frequent";

/** Patterns in how content is structured. */
export interface ContentPatterns {
  /** Heading case convention observed */
  headingCase?: string;
  /** How much emoji appears in copy */
  emojiUsage?: EmojiUsage;
  /** Frequency of exclamation marks */
  exclamationFrequency?: ExclamationFrequency;
  /** Whether questions appear in headings */
  questionUsageInHeadings?: boolean;
  /** Whether the brand prefers bullet lists over prose */
  bulletPreference?: boolean;
}

/** The brand's voice — how it sounds in text. */
export interface BrandVoice {
  /** Multi-axis tone positioning */
  toneSpectrum?: ToneSpectrum;
  /** Copywriting analysis */
  copywritingStyle?: CopywritingStyle;
  /** Content structure patterns */
  contentPatterns?: ContentPatterns;
  /** Representative copy samples pulled from the site */
  sampleCopy?: string[];
}

// ─── Rules ───────────────────────────────────────────────────────────

/** Explicit brand dos & don'ts. */
export interface BrandRules {
  /** Things the brand consistently does / recommends */
  dos?: string[];
  /** Things the brand avoids / discourages */
  donts?: string[];
  /** Where these rules came from */
  source?: "inferred" | "official" | "merged";
}

// ─── Vibe ────────────────────────────────────────────────────────────

/** The overall "vibe" — a subjective, AI-generated brand summary. */
export interface BrandVibe {
  /** One-sentence vibe summary, e.g. "Polished and confident with a developer-first edge" */
  summary?: string;
  /** Vibe tags, e.g. ["minimal", "techy", "premium"] */
  tags?: string[];
  /** 1 = calm/understated, 10 = high-energy/bold */
  visualEnergy?: number;
  /** Design era, e.g. "neo-brutalism", "flat 2.0", "glassmorphism" */
  designEra?: string;
  /** Brands with a similar look and feel */
  comparableBrands?: string[];
  /** Dominant emotional tone, e.g. "trustworthy", "playful", "rebellious" */
  emotionalTone?: string;
  /** Who this brand seems to be targeting */
  targetAudienceInferred?: string;
  /** Overall vibe confidence 0–1 */
  confidence?: number;
}

// ─── Official Guidelines ─────────────────────────────────────────────

/** Info about the brand's own official brand guidelines, if discovered. */
export interface OfficialGuidelines {
  /** URL of the official brand guidelines page, if found */
  discoveredUrl?: string | null;
  /** Whether the brand has a public brand kit / guidelines page */
  hasOfficialKit?: boolean;
  /** Rules extracted from official guidelines */
  guidelineRules?: string[];
}

// ─── Buttons ────────────────────────────────────────────────────────

/** A single button variant style extracted from the site. */
export interface ButtonStyle {
  variant: "primary" | "secondary" | "outline" | "ghost" | "text";
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  borderColor?: string;
  borderWidth?: string;
  padding?: string;
  fontSize?: string;
  fontWeight?: number;
  fontFamily?: string;
  boxShadow?: string;
  sampleText?: string;
  confidence?: number;
}

/** All detected button styles on the site. */
export interface BrandButtons {
  styles: ButtonStyle[];
}

// ─── Effects ────────────────────────────────────────────────────────

/** A single box-shadow value with provenance. */
export interface ShadowValue {
  value: string;
  source?: string;
  context?: "card" | "button" | "navigation" | "dropdown" | "modal" | "element";
}

/** A single gradient value with provenance. */
export interface GradientValue {
  value: string;
  source?: string;
  context?: string;
}

/** Shadows and gradients used across the site. */
export interface BrandEffects {
  shadows: ShadowValue[];
  gradients: GradientValue[];
}

// ─── Icon Library ────────────────────────────────────────────────────

/** Detected icon library used on the site. */
export interface IconLibrary {
  /** Library name, e.g. "Font Awesome", "Lucide", "Material Icons" */
  name: string;
  /** Library version, if detectable from stylesheet/script URLs */
  version?: string;
  /** Detection confidence 0–1 */
  confidence: number;
  /** Up to 10 sample icon names found on the page */
  sampleIcons: string[];
  /** How the library was detected */
  source: string;
}

// ─── Top-Level Brand Kit ─────────────────────────────────────────────

/** The complete brand kit result returned by an ExtractVibe extraction. */
export interface ExtractVibeBrandKit {
  meta: BrandKitMeta;
  identity?: BrandIdentity;
  logos?: BrandLogo[];
  colors?: BrandColors;
  typography?: BrandTypography;
  spacing?: BrandSpacing;
  assets?: BrandAsset[];
  voice?: BrandVoice;
  rules?: BrandRules;
  vibe?: BrandVibe;
  officialGuidelines?: OfficialGuidelines;
  buttons?: BrandButtons;
  effects?: BrandEffects;
  designAssets?: BrandDesignAsset[];
  ogImage?: string;
  /** Detected icon library used on the site */
  iconLibrary?: IconLibrary | null;
}

// ─── Factory ─────────────────────────────────────────────────────────

/**
 * Creates an empty brand kit with sensible defaults.
 * Use this as the starting point for an extraction — each pipeline stage
 * fills in its section.
 */
export function createEmptyBrandKit(url: string): ExtractVibeBrandKit {
  const domain = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();

  return {
    meta: {
      url,
      domain,
      extractedAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
      durationMs: 0,
      extractionDepth: 0,
    },
    identity: {
      brandName: undefined,
      tagline: undefined,
      description: undefined,
      archetypes: [],
    },
    logos: [],
    colors: {
      lightMode: {},
      darkMode: undefined,
      semantic: {},
      rawPalette: [],
    },
    typography: {
      families: [],
      scale: {},
      conventions: {},
    },
    spacing: {
      baseUnit: undefined,
      borderRadius: {},
      containerMaxWidth: undefined,
      grid: undefined,
    },
    assets: [],
    voice: {
      toneSpectrum: {},
      copywritingStyle: {},
      contentPatterns: {},
      sampleCopy: [],
    },
    rules: {
      dos: [],
      donts: [],
      source: "inferred",
    },
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
    iconLibrary: null,
  };
}
