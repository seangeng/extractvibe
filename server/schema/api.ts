/**
 * ExtractVibe API Zod Schemas
 *
 * Comprehensive Zod schemas for all API request/response bodies.
 * These mirror the TypeScript interfaces in v1.ts and are used for
 * OpenAPI spec generation via @asteasolutions/zod-to-openapi.
 */

import { z } from "zod/v3";

// ─── Error Responses ────────────────────────────────────────────────

export const ErrorResponse = z.object({
  error: z.string(),
});

export const RateLimitError = z.object({
  error: z.string(),
  limit: z.number(),
  retryAfter: z.number(),
});

// ─── Health ─────────────────────────────────────────────────────────

export const HealthResponse = z.object({
  ok: z.boolean(),
  version: z.string(),
});

// ─── API Index ──────────────────────────────────────────────────────

export const ApiIndexResponse = z.object({
  name: z.string(),
  version: z.string(),
  docs: z.string(),
  endpoints: z.record(z.string(), z.string()),
});

// ─── Extract ────────────────────────────────────────────────────────

export const ExtractRequest = z.object({
  url: z.string(),
});

export const ExtractResponse = z.object({
  jobId: z.string(),
  domain: z.string(),
});

export const JobStatusResponse = z.object({
  jobId: z.string(),
  status: z.object({
    status: z.string(),
    error: z.any().nullable(),
    output: z.any().nullable(),
  }),
});

// ─── Credits ────────────────────────────────────────────────────────

export const CreditsResponse = z.object({
  credits: z.number(),
  plan: z.string(),
});

// ─── API Keys ───────────────────────────────────────────────────────

export const CreateKeyRequest = z.object({
  name: z.string().optional(),
});

export const CreateKeyResponse = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
});

export const ApiKeyItem = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
});

export const ApiKeysList = z.object({
  keys: z.array(ApiKeyItem),
});

export const DeleteKeyResponse = z.object({
  ok: z.boolean(),
});

// ─── Extraction History ─────────────────────────────────────────────

export const HistoryItem = z.object({
  id: z.string(),
  domain: z.string(),
  url: z.string(),
  status: z.string(),
  durationMs: z.number().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});

export const HistoryResponse = z.object({
  extractions: z.array(HistoryItem),
});

// ─── Export Format ──────────────────────────────────────────────────

export const ExportFormat = z.enum(["json", "css", "tailwind", "markdown", "tokens"]);

// ─── Brand Kit Schemas (bottom-up from v1.ts) ──────────────────────

// Primitives & Helpers

export const RGBSchema = z.object({
  r: z.number(),
  g: z.number(),
  b: z.number(),
});

export const DimensionsSchema = z.object({
  width: z.number(),
  height: z.number(),
});

export const ColorValueSchema = z.object({
  hex: z.string().optional(),
  rgb: RGBSchema.optional(),
  role: z.string().optional(),
  source: z.string().optional(),
  confidence: z.number().optional(),
});

// Meta

export const BrandKitMetaSchema = z.object({
  url: z.string().optional(),
  domain: z.string().optional(),
  extractedAt: z.string().optional(),
  schemaVersion: z.string().optional(),
  durationMs: z.number().optional(),
  extractionDepth: z.number().optional(),
});

// Identity

export const BrandArchetypeSchema = z.object({
  name: z.string(),
  confidence: z.number().optional(),
});

export const BrandIdentitySchema = z.object({
  brandName: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  archetypes: z.array(BrandArchetypeSchema).optional(),
});

// Logos

export const LogoTypeSchema = z.enum([
  "primary",
  "secondary",
  "wordmark",
  "logomark",
  "monochrome",
  "favicon",
  "social",
]);

export const LogoFormatSchema = z.enum(["svg", "png", "ico", "webp", "jpg"]);

export const LogoVariantSchema = z.enum(["light", "dark", "color", "mono"]);

export const BrandLogoSchema = z.object({
  type: LogoTypeSchema.optional(),
  url: z.string().optional(),
  originalUrl: z.string().optional(),
  format: LogoFormatSchema.optional(),
  variant: LogoVariantSchema.optional(),
  dimensions: DimensionsSchema.optional(),
  confidence: z.number().optional(),
  source: z.enum(["extracted", "loadlogo", "favicon"]).optional(),
});

// Colors

export const SemanticColorsSchema = z.object({
  success: ColorValueSchema.optional(),
  warning: ColorValueSchema.optional(),
  error: ColorValueSchema.optional(),
  info: ColorValueSchema.optional(),
});

export const ColorModeSchema = z.object({
  primary: ColorValueSchema.optional(),
  secondary: ColorValueSchema.optional(),
  accent: ColorValueSchema.optional(),
  background: ColorValueSchema.optional(),
  surface: ColorValueSchema.optional(),
  text: ColorValueSchema.optional(),
  secondaryText: ColorValueSchema.optional(),
  border: ColorValueSchema.optional(),
  link: ColorValueSchema.optional(),
  muted: ColorValueSchema.optional(),
});

export const BrandColorsSchema = z.object({
  lightMode: ColorModeSchema.optional(),
  darkMode: ColorModeSchema.optional(),
  semantic: SemanticColorsSchema.optional(),
  rawPalette: z.array(ColorValueSchema).optional(),
});

// Typography

export const FontRoleSchema = z.enum(["heading", "body", "mono", "display"]);

export const FontSourceSchema = z.enum([
  "google-fonts",
  "adobe-fonts",
  "self-hosted",
  "system",
]);

export const FontFamilySchema = z.object({
  name: z.string().optional(),
  role: FontRoleSchema.optional(),
  source: FontSourceSchema.optional(),
  weights: z.array(z.number()).optional(),
  fallbackStack: z.string().optional(),
  confidence: z.number().optional(),
});

export const TypeScaleEntrySchema = z.object({
  fontSize: z.string().optional(),
  fontWeight: z.number().optional(),
  lineHeight: z.string().optional(),
  letterSpacing: z.string().optional(),
  textTransform: z.string().optional(),
  fontFamily: z.string().optional(),
});

export const TypeScaleSchema = z.object({
  h1: TypeScaleEntrySchema.optional(),
  h2: TypeScaleEntrySchema.optional(),
  h3: TypeScaleEntrySchema.optional(),
  h4: TypeScaleEntrySchema.optional(),
  h5: TypeScaleEntrySchema.optional(),
  h6: TypeScaleEntrySchema.optional(),
  body: TypeScaleEntrySchema.optional(),
  small: TypeScaleEntrySchema.optional(),
  caption: TypeScaleEntrySchema.optional(),
});

export const HeadingCaseSchema = z.enum([
  "title-case",
  "sentence-case",
  "lowercase",
  "uppercase",
]);

export const TypographyConventionsSchema = z.object({
  headingCase: HeadingCaseSchema.optional(),
  bodyLineHeight: z.string().optional(),
  codeFont: z.string().optional(),
});

export const BrandTypographySchema = z.object({
  families: z.array(FontFamilySchema).optional(),
  scale: TypeScaleSchema.optional(),
  conventions: TypographyConventionsSchema.optional(),
});

// Spacing

export const BorderRadiusScaleSchema = z.object({
  small: z.string().optional(),
  medium: z.string().optional(),
  large: z.string().optional(),
});

export const GridSystemSchema = z.object({
  columns: z.number().optional(),
  gap: z.string().optional(),
});

export const BrandSpacingSchema = z.object({
  baseUnit: z.string().optional(),
  borderRadius: BorderRadiusScaleSchema.optional(),
  containerMaxWidth: z.string().optional(),
  grid: GridSystemSchema.optional(),
});

// Assets

export const AssetTypeSchema = z.enum([
  "pattern",
  "illustration",
  "icon",
  "hero",
  "social",
  "backdrop",
  "favicon",
]);

export const BrandAssetSchema = z.object({
  type: AssetTypeSchema.optional(),
  url: z.string().optional(),
  format: z.string().optional(),
  context: z.string().optional(),
  extractedFrom: z.string().optional(),
  dimensions: DimensionsSchema.optional(),
  confidence: z.number().optional(),
});

// Design Assets

export const BrandDesignAssetSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  format: z.string().optional(),
  context: z.string().optional(),
});

// Voice

export const ToneSpectrumSchema = z.object({
  formalCasual: z.number().optional(),
  playfulSerious: z.number().optional(),
  enthusiasticMatterOfFact: z.number().optional(),
  respectfulIrreverent: z.number().optional(),
  technicalAccessible: z.number().optional(),
});

export const VocabularyComplexitySchema = z.enum(["simple", "moderate", "advanced"]);

export const JargonUsageSchema = z.enum(["none", "some", "heavy"]);

export const CopywritingStyleSchema = z.object({
  avgSentenceLength: z.number().optional(),
  vocabularyComplexity: VocabularyComplexitySchema.optional(),
  jargonUsage: JargonUsageSchema.optional(),
  rhetoricalDevices: z.array(z.string()).optional(),
  ctaStyle: z.string().optional(),
});

export const EmojiUsageSchema = z.enum(["none", "light", "heavy"]);

export const ExclamationFrequencySchema = z.enum(["none", "rare", "frequent"]);

export const ContentPatternsSchema = z.object({
  headingCase: z.string().optional(),
  emojiUsage: EmojiUsageSchema.optional(),
  exclamationFrequency: ExclamationFrequencySchema.optional(),
  questionUsageInHeadings: z.boolean().optional(),
  bulletPreference: z.boolean().optional(),
});

export const BrandVoiceSchema = z.object({
  toneSpectrum: ToneSpectrumSchema.optional(),
  copywritingStyle: CopywritingStyleSchema.optional(),
  contentPatterns: ContentPatternsSchema.optional(),
  sampleCopy: z.array(z.string()).optional(),
});

// Rules

export const BrandRulesSchema = z.object({
  dos: z.array(z.string()).optional(),
  donts: z.array(z.string()).optional(),
  source: z.enum(["inferred", "official", "merged"]).optional(),
});

// Vibe

export const BrandVibeSchema = z.object({
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  visualEnergy: z.number().optional(),
  designEra: z.string().optional(),
  comparableBrands: z.array(z.string()).optional(),
  emotionalTone: z.string().optional(),
  targetAudienceInferred: z.string().optional(),
  confidence: z.number().optional(),
});

// Official Guidelines

export const OfficialGuidelinesSchema = z.object({
  discoveredUrl: z.string().nullable().optional(),
  hasOfficialKit: z.boolean().optional(),
  guidelineRules: z.array(z.string()).optional(),
});

// Buttons

export const ButtonVariantSchema = z.enum([
  "primary",
  "secondary",
  "outline",
  "ghost",
  "text",
]);

export const ButtonStyleSchema = z.object({
  variant: ButtonVariantSchema,
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  borderRadius: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.string().optional(),
  padding: z.string().optional(),
  fontSize: z.string().optional(),
  fontWeight: z.number().optional(),
  fontFamily: z.string().optional(),
  boxShadow: z.string().optional(),
  sampleText: z.string().optional(),
  confidence: z.number().optional(),
});

export const BrandButtonsSchema = z.object({
  styles: z.array(ButtonStyleSchema),
});

// Effects

export const ShadowContextSchema = z.enum([
  "card",
  "button",
  "navigation",
  "dropdown",
  "modal",
  "element",
]);

export const ShadowValueSchema = z.object({
  value: z.string(),
  source: z.string().optional(),
  context: ShadowContextSchema.optional(),
});

export const GradientValueSchema = z.object({
  value: z.string(),
  source: z.string().optional(),
  context: z.string().optional(),
});

export const BrandEffectsSchema = z.object({
  shadows: z.array(ShadowValueSchema),
  gradients: z.array(GradientValueSchema),
});

// ─── Top-Level Brand Kit ────────────────────────────────────────────

export const ExtractVibeBrandKitSchema = z.object({
  meta: BrandKitMetaSchema,
  identity: BrandIdentitySchema.optional(),
  logos: z.array(BrandLogoSchema).optional(),
  colors: BrandColorsSchema.optional(),
  typography: BrandTypographySchema.optional(),
  spacing: BrandSpacingSchema.optional(),
  assets: z.array(BrandAssetSchema).optional(),
  voice: BrandVoiceSchema.optional(),
  rules: BrandRulesSchema.optional(),
  vibe: BrandVibeSchema.optional(),
  officialGuidelines: OfficialGuidelinesSchema.optional(),
  buttons: BrandButtonsSchema.optional(),
  effects: BrandEffectsSchema.optional(),
  designAssets: z.array(BrandDesignAssetSchema).optional(),
  ogImage: z.string().optional(),
});
