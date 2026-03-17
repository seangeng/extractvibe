/**
 * parse-visual.ts — Visual Identity Parser
 *
 * Takes the raw output from the browser extraction step (fetch-render) and
 * transforms it into structured brand kit data: logos, colors, typography,
 * spacing, and basic identity information.
 */

import type {
  BrandLogo,
  BrandColors,
  BrandTypography,
  BrandSpacing,
  BrandAsset,
  BrandIdentity,
  BrandDesignAsset,
  ColorValue,
  ColorMode,
  SemanticColors,
  FontFamily,
  FontRole,
  FontSource,
  TypeScale,
  TypeScaleEntry,
  HeadingCase,
  LogoType,
  LogoFormat,
  LogoVariant,
  RGB,
  BorderRadiusScale,
  GridSystem,
  ButtonStyle,
  BrandButtons,
  ShadowValue,
  GradientValue,
  BrandEffects,
} from "../../schema/v1";
import type { Env } from "../../env";

// ─── FetchRenderOutput Type ──────────────────────────────────────────
// This will be replaced with an import from ./fetch-render once that module
// exists. For now we define the shape we expect from the browser extraction.

export interface IconEntry {
  rel: string;
  href: string;
  sizes?: string;
  type?: string;
}

export interface LogoImage {
  src: string;
  alt?: string;
  /** Where this image was found: "nav", "header", "footer", "hero", etc. */
  context: string;
  width?: number;
  height?: number;
}

export interface InlineSvg {
  content: string;
  /** Where this SVG was found: "nav", "header", "footer", etc. */
  context: string;
  /** Estimated purpose: "logo", "icon", "decoration" */
  purpose?: string;
}

export interface ComputedStyleEntry {
  /** CSS selector, e.g. "body", "h1", "a", "button", "nav", "code" */
  selector: string;
  styles: Record<string, string>;
}

export interface CssCustomProperty {
  name: string;
  value: string;
  /** Context where defined: ":root", ".dark", "@media (prefers-color-scheme: dark)", etc. */
  context?: string;
}

export interface HeadingEntry {
  level: number;
  text: string;
}

export interface FetchRenderOutput {
  url: string;
  domain: string;
  title?: string;
  metaDescription?: string;
  metaThemeColor?: string;
  manifestThemeColor?: string;
  manifestBackgroundColor?: string;
  icons: IconEntry[];
  logoImages: LogoImage[];
  inlineSvgs: InlineSvg[];
  computedStyles: ComputedStyleEntry[];
  cssCustomProperties: CssCustomProperty[];
  stylesheetUrls: string[];
  headings: HeadingEntry[];
  /** Raw elements with their spacing/layout properties */
  layoutElements?: ComputedStyleEntry[];
  /** Enriched button details from fetch-render */
  buttonDetails?: Array<{ selector: string; tag: string; styles: Record<string, string>; textContent?: string; className?: string }>;
  /** Shadow samples from cards/modals/dropdowns */
  shadows?: Array<{ value: string; selector: string }>;
  /** Gradient samples from backgrounds */
  gradients?: Array<{ value: string; selector: string }>;
  /** Open Graph image URL */
  ogImage?: string | null;
  /** Design assets extracted from DOM */
  designAssets?: Array<{
    src: string;
    alt: string;
    width: number;
    height: number;
    format: string;
    context: string;
    isDesignAsset: boolean;
  }>;
}

// ─── Output ──────────────────────────────────────────────────────────

export interface ParseVisualOutput {
  identity: BrandIdentity;
  logos: BrandLogo[];
  colors: BrandColors;
  typography: BrandTypography;
  spacing: BrandSpacing;
  assets: BrandAsset[];
  buttons: BrandButtons;
  effects: BrandEffects;
  designAssets: BrandDesignAsset[];
  ogImage?: string;
}

// ─── Named CSS Colors (subset of most common) ───────────────────────

const CSS_NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  orange: "#ffa500",
  purple: "#800080",
  pink: "#ffc0cb",
  gray: "#808080",
  grey: "#808080",
  silver: "#c0c0c0",
  navy: "#000080",
  teal: "#008080",
  maroon: "#800000",
  olive: "#808000",
  lime: "#00ff00",
  aqua: "#00ffff",
  fuchsia: "#ff00ff",
  coral: "#ff7f50",
  salmon: "#fa8072",
  tomato: "#ff6347",
  gold: "#ffd700",
  khaki: "#f0e68c",
  indigo: "#4b0082",
  violet: "#ee82ee",
  plum: "#dda0dd",
  orchid: "#da70d6",
  tan: "#d2b48c",
  chocolate: "#d2691e",
  sienna: "#a0522d",
  peru: "#cd853f",
  beige: "#f5f5dc",
  ivory: "#fffff0",
  linen: "#faf0e6",
  snow: "#fffafa",
  seashell: "#fff5ee",
  mintcream: "#f5fffa",
  honeydew: "#f0fff0",
  aliceblue: "#f0f8ff",
  lavender: "#e6e6fa",
  mistyrose: "#ffe4e1",
  whitesmoke: "#f5f5f5",
  gainsboro: "#dcdcdc",
  lightgray: "#d3d3d3",
  lightgrey: "#d3d3d3",
  darkgray: "#a9a9a9",
  darkgrey: "#a9a9a9",
  dimgray: "#696969",
  dimgrey: "#696969",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  slategray: "#708090",
  slategrey: "#708090",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  cornflowerblue: "#6495ed",
  royalblue: "#4169e1",
  dodgerblue: "#1e90ff",
  deepskyblue: "#00bfff",
  steelblue: "#4682b4",
  cadetblue: "#5f9ea0",
  mediumaquamarine: "#66cdaa",
  mediumseagreen: "#3cb371",
  seagreen: "#2e8b57",
  darkgreen: "#006400",
  forestgreen: "#228b22",
  limegreen: "#32cd32",
  springgreen: "#00ff7f",
  darkred: "#8b0000",
  firebrick: "#b22222",
  crimson: "#dc143c",
  indianred: "#cd5c5c",
  rosybrown: "#bc8f8f",
  darkorange: "#ff8c00",
  orangered: "#ff4500",
  darkviolet: "#9400d3",
  mediumpurple: "#9370db",
  slateblue: "#6a5acd",
  rebeccapurple: "#663399",
};

/** Colors that should be skipped — not meaningful brand colors */
const SKIP_COLORS = new Set([
  "transparent",
  "inherit",
  "initial",
  "unset",
  "currentcolor",
  "currentColor",
  "none",
]);

// ─── Helper Functions ────────────────────────────────────────────────

export function hexToRgb(hex: string): RGB | null {
  const cleaned = hex.replace("#", "");
  let r: number, g: number, b: number;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  } else if (cleaned.length === 8) {
    // 8-digit hex with alpha — ignore alpha
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function colorDistance(c1: RGB, c2: RGB): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function parseColor(
  cssColor: string
): { hex: string; rgb: RGB } | null {
  if (!cssColor || typeof cssColor !== "string") return null;

  const trimmed = cssColor.trim().toLowerCase();

  // Skip meaningless values
  if (SKIP_COLORS.has(trimmed) || SKIP_COLORS.has(cssColor.trim())) {
    return null;
  }

  // Hex
  if (trimmed.startsWith("#")) {
    const rgb = hexToRgb(trimmed);
    if (!rgb) return null;
    return { hex: rgbToHex(rgb.r, rgb.g, rgb.b), rgb };
  }

  // rgb() or rgba()
  const rgbMatch = trimmed.match(
    /rgba?\(\s*(\d+(?:\.\d+)?)\s*[,\s]\s*(\d+(?:\.\d+)?)\s*[,\s]\s*(\d+(?:\.\d+)?)(?:\s*[,/]\s*(\d+(?:\.\d+)?))?/
  );
  if (rgbMatch) {
    const r = Math.round(parseFloat(rgbMatch[1]));
    const g = Math.round(parseFloat(rgbMatch[2]));
    const b = Math.round(parseFloat(rgbMatch[3]));
    if (r > 255 || g > 255 || b > 255) return null;
    // Skip fully transparent colors (alpha === 0)
    if (rgbMatch[4] !== undefined) {
      const alpha = parseFloat(rgbMatch[4]);
      if (alpha === 0) return null;
      // Also skip nearly transparent (alpha < 0.1)
      if (alpha < 0.1) return null;
    }
    const rgb: RGB = { r, g, b };
    return { hex: rgbToHex(r, g, b), rgb };
  }

  // hsl() or hsla()
  const hslMatch = trimmed.match(
    /hsla?\(\s*(\d+(?:\.\d+)?)\s*[,\s]\s*(\d+(?:\.\d+)?)%?\s*[,\s]\s*(\d+(?:\.\d+)?)%?/
  );
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]) / 360;
    const s = parseFloat(hslMatch[2]) / 100;
    const l = parseFloat(hslMatch[3]) / 100;
    const rgb = hslToRgb(h, s, l);
    return { hex: rgbToHex(rgb.r, rgb.g, rgb.b), rgb };
  }

  // Named colors
  const namedHex = CSS_NAMED_COLORS[trimmed];
  if (namedHex) {
    const rgb = hexToRgb(namedHex);
    if (!rgb) return null;
    return { hex: namedHex, rgb };
  }

  return null;
}

function hslToRgb(h: number, s: number, l: number): RGB {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function detectFontSource(
  stylesheetUrls: string[],
  fontName: string
): FontSource {
  const normalizedName = fontName.toLowerCase().replace(/['"]/g, "").trim();

  // System font stacks
  const systemFonts = new Set([
    "system-ui",
    "-apple-system",
    "blinkmacsystemfont",
    "segoe ui",
    "roboto",
    "helvetica neue",
    "helvetica",
    "arial",
    "sans-serif",
    "serif",
    "monospace",
    "courier new",
    "courier",
    "times new roman",
    "times",
    "georgia",
    "ui-sans-serif",
    "ui-serif",
    "ui-monospace",
    "sf pro",
    "sf mono",
    "menlo",
    "consolas",
    "liberation mono",
    "dejavu sans mono",
  ]);

  if (systemFonts.has(normalizedName)) {
    return "system";
  }

  for (const url of stylesheetUrls) {
    const lowerUrl = url.toLowerCase();
    if (
      lowerUrl.includes("fonts.googleapis.com") &&
      lowerUrl.includes(encodeURIComponent(fontName).toLowerCase())
    ) {
      return "google-fonts";
    }
    if (
      lowerUrl.includes("fonts.googleapis.com") &&
      lowerUrl.includes(fontName.toLowerCase().replace(/\s+/g, "+"))
    ) {
      return "google-fonts";
    }
    if (lowerUrl.includes("use.typekit.net") || lowerUrl.includes("typekit")) {
      return "adobe-fonts";
    }
  }

  // If there are Google Fonts URLs but we couldn't match this specific font,
  // check if any Google Fonts URL contains the font name
  for (const url of stylesheetUrls) {
    if (url.includes("fonts.googleapis.com")) {
      const decoded = decodeURIComponent(url).toLowerCase();
      if (decoded.includes(normalizedName.replace(/\s+/g, "+"))) {
        return "google-fonts";
      }
    }
  }

  // If we have stylesheet URLs that suggest self-hosting
  for (const url of stylesheetUrls) {
    const lowerUrl = url.toLowerCase();
    if (
      lowerUrl.includes(".woff") ||
      lowerUrl.includes(".woff2") ||
      lowerUrl.includes(".ttf") ||
      lowerUrl.includes(".otf")
    ) {
      return "self-hosted";
    }
  }

  return "self-hosted";
}

export function detectHeadingCase(headings: string[]): HeadingCase {
  if (headings.length === 0) return "sentence-case";

  const classifications = headings.map(classifySingleHeading);

  const counts: Record<HeadingCase, number> = {
    "title-case": 0,
    "sentence-case": 0,
    lowercase: 0,
    uppercase: 0,
  };

  for (const c of classifications) {
    counts[c]++;
  }

  return findMostCommon(classifications) ?? "sentence-case";
}

function classifySingleHeading(text: string): HeadingCase {
  const trimmed = text.trim();
  if (!trimmed) return "sentence-case";

  // All uppercase
  if (trimmed === trimmed.toUpperCase() && trimmed !== trimmed.toLowerCase()) {
    return "uppercase";
  }

  // All lowercase
  if (trimmed === trimmed.toLowerCase()) {
    return "lowercase";
  }

  // Title case: most words start with uppercase (articles and prepositions
  // may be lowercase). If >60% of words with length > 3 are capitalized,
  // consider it title case.
  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
  if (words.length > 1) {
    const significantWords = words.filter((w) => w.length > 3);
    if (significantWords.length > 0) {
      const capitalizedCount = significantWords.filter(
        (w) => w[0] === w[0].toUpperCase()
      ).length;
      if (capitalizedCount / significantWords.length > 0.6) {
        return "title-case";
      }
    }
  }

  // Default: first word capitalized = sentence case
  if (trimmed[0] === trimmed[0].toUpperCase()) {
    return "sentence-case";
  }

  return "sentence-case";
}

export function findMostCommon<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;

  const counts = new Map<string, { value: T; count: number }>();
  for (const item of arr) {
    const key = JSON.stringify(item);
    const existing = counts.get(key);
    if (existing) {
      existing.count++;
    } else {
      counts.set(key, { value: item, count: 1 });
    }
  }

  let best: { value: T; count: number } | undefined;
  const entries = Array.from(counts.values());
  for (const entry of entries) {
    if (!best || entry.count > best.count) {
      best = entry;
    }
  }

  return best?.value;
}

// ─── Logo Detection Format Helper ────────────────────────────────────

function detectLogoFormat(url: string, type?: string): LogoFormat | undefined {
  // Check content-type first
  if (type) {
    const lower = type.toLowerCase();
    if (lower.includes("svg")) return "svg";
    if (lower.includes("png")) return "png";
    if (lower.includes("ico") || lower.includes("x-icon")) return "ico";
    if (lower.includes("webp")) return "webp";
    if (lower.includes("jpeg") || lower.includes("jpg")) return "jpg";
  }

  // Fall back to URL extension
  const extMatch = url.match(/\.(\w+)(?:\?.*)?$/);
  if (extMatch) {
    const ext = extMatch[1].toLowerCase();
    switch (ext) {
      case "svg":
        return "svg";
      case "png":
        return "png";
      case "ico":
        return "ico";
      case "webp":
        return "webp";
      case "jpg":
      case "jpeg":
        return "jpg";
    }
  }

  return undefined;
}

// ─── R2 Upload Helper ────────────────────────────────────────────────

async function uploadToR2(
  env: Env,
  domain: string,
  key: string,
  body: ArrayBuffer | string | ReadableStream,
  contentType?: string
): Promise<string> {
  const r2Key = `brands/${domain}/${key}`;
  await env.R2_BUCKET.put(r2Key, body, {
    httpMetadata: contentType ? { contentType } : undefined,
  });
  return r2Key;
}

async function fetchAndUploadLogo(
  env: Env,
  domain: string,
  srcUrl: string,
  index: number,
  format?: LogoFormat
): Promise<string | null> {
  try {
    // Resolve relative URLs
    let absoluteUrl = srcUrl;
    if (srcUrl.startsWith("//")) {
      absoluteUrl = `https:${srcUrl}`;
    } else if (srcUrl.startsWith("/")) {
      absoluteUrl = `https://${domain}${srcUrl}`;
    } else if (!srcUrl.startsWith("http")) {
      absoluteUrl = `https://${domain}/${srcUrl}`;
    }

    const response = await fetch(absoluteUrl, {
      headers: { "User-Agent": "ExtractVibe/1.0" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return null;

    const contentType =
      response.headers.get("content-type") ?? "application/octet-stream";
    const buffer = await response.arrayBuffer();

    const ext = format ?? "png";
    const r2Key = await uploadToR2(
      env,
      domain,
      `logo-${index}.${ext}`,
      buffer,
      contentType
    );

    return r2Key;
  } catch {
    // Non-fatal: logo upload failed, skip it
    return null;
  }
}

async function uploadInlineSvg(
  env: Env,
  domain: string,
  svgContent: string,
  index: number
): Promise<string | null> {
  try {
    const r2Key = await uploadToR2(
      env,
      domain,
      `logo-svg-${index}.svg`,
      svgContent,
      "image/svg+xml"
    );
    return r2Key;
  } catch {
    return null;
  }
}

// ─── 1. Parse Logos ──────────────────────────────────────────────────

async function parseLogos(
  fetchOutput: FetchRenderOutput,
  env: Env,
  domain: string
): Promise<{ logos: BrandLogo[]; assets: BrandAsset[] }> {
  const logos: BrandLogo[] = [];
  const assets: BrandAsset[] = [];
  let uploadIndex = 0;

  // --- From icons array (favicons, apple-touch-icons) ---
  for (const icon of fetchOutput.icons) {
    const rel = icon.rel?.toLowerCase() ?? "";
    const isFavicon =
      rel.includes("icon") ||
      rel.includes("shortcut") ||
      rel.includes("apple-touch-icon");

    if (!isFavicon) continue;

    const format = detectLogoFormat(icon.href, icon.type);
    const r2Key = await fetchAndUploadLogo(
      env,
      domain,
      icon.href,
      uploadIndex++,
      format
    );

    const logo: BrandLogo = {
      type: "favicon",
      originalUrl: icon.href,
      url: r2Key ?? undefined,
      format,
      confidence: 0.95,
    };

    // Parse dimensions from sizes attribute
    if (icon.sizes) {
      const sizeMatch = icon.sizes.match(/(\d+)x(\d+)/);
      if (sizeMatch) {
        logo.dimensions = {
          width: parseInt(sizeMatch[1], 10),
          height: parseInt(sizeMatch[2], 10),
        };
      }
    }

    logos.push(logo);
  }

  // --- From logoImages: classify by context ---
  const contextGroups = new Map<string, LogoImage[]>();
  for (const img of fetchOutput.logoImages) {
    const ctx = img.context.toLowerCase();
    const existing = contextGroups.get(ctx) ?? [];
    existing.push(img);
    contextGroups.set(ctx, existing);
  }

  for (const img of fetchOutput.logoImages) {
    const ctx = img.context.toLowerCase();
    const isPrimary = ctx.includes("nav") || ctx.includes("header");
    const isSecondary = ctx.includes("footer");

    const logoType: LogoType = isPrimary
      ? "primary"
      : isSecondary
        ? "secondary"
        : "primary";

    const format = detectLogoFormat(img.src);
    const r2Key = await fetchAndUploadLogo(
      env,
      domain,
      img.src,
      uploadIndex++,
      format
    );

    // Attempt to detect light/dark variants
    let variant: LogoVariant | undefined;
    const sameContextLogos = contextGroups.get(ctx);
    if (sameContextLogos && sameContextLogos.length > 1) {
      const srcLower = img.src.toLowerCase();
      const altLower = (img.alt ?? "").toLowerCase();
      if (srcLower.includes("dark") || altLower.includes("dark")) {
        variant = "dark";
      } else if (srcLower.includes("light") || altLower.includes("light")) {
        variant = "light";
      } else if (srcLower.includes("mono") || altLower.includes("mono")) {
        variant = "mono";
      } else {
        variant = "color";
      }
    }

    const logo: BrandLogo = {
      type: logoType,
      originalUrl: img.src,
      url: r2Key ?? undefined,
      format,
      variant,
      confidence: 0.85,
    };

    if (img.width && img.height) {
      logo.dimensions = { width: img.width, height: img.height };
    }

    logos.push(logo);
  }

  // --- From inlineSvgs in header/nav ---
  for (const svg of fetchOutput.inlineSvgs) {
    const ctx = svg.context.toLowerCase();
    const isHeaderOrNav = ctx.includes("nav") || ctx.includes("header");

    if (!isHeaderOrNav && svg.purpose !== "logo") continue;

    const r2Key = await uploadInlineSvg(env, domain, svg.content, uploadIndex++);

    const logoType: LogoType =
      svg.purpose === "logo" ? "logomark" : "primary";

    logos.push({
      type: logoType,
      url: r2Key ?? undefined,
      format: "svg",
      confidence: 0.9,
    });
  }

  // Non-logo SVGs and other images go to assets
  for (const svg of fetchOutput.inlineSvgs) {
    const ctx = svg.context.toLowerCase();
    const isHeaderOrNav = ctx.includes("nav") || ctx.includes("header");
    if (isHeaderOrNav || svg.purpose === "logo") continue;

    if (svg.purpose === "icon") {
      assets.push({
        type: "icon",
        format: "svg",
        context: svg.context,
        confidence: 0.7,
      });
    } else if (svg.purpose === "decoration") {
      assets.push({
        type: "pattern",
        format: "svg",
        context: svg.context,
        confidence: 0.5,
      });
    }
  }

  return { logos, assets };
}

// ─── 2. Parse Colors ─────────────────────────────────────────────────

interface CollectedColor {
  hex: string;
  rgb: RGB;
  role?: string;
  source: string;
  confidence: number;
  mode?: "light" | "dark";
}

/** Map CSS custom property names to semantic roles */
function mapCssVarToRole(
  name: string
): { role: string; semantic?: keyof SemanticColors } | null {
  const lower = name.toLowerCase();

  // Semantic / status colors
  if (lower.includes("success")) return { role: "success", semantic: "success" };
  if (lower.includes("warning")) return { role: "warning", semantic: "warning" };
  if (lower.includes("error") || lower.includes("danger"))
    return { role: "error", semantic: "error" };
  if (lower.includes("info")) return { role: "info", semantic: "info" };

  // Role colors
  if (lower.includes("primary") || lower.includes("brand"))
    return { role: "primary" };
  if (lower.includes("accent")) return { role: "accent" };
  if (lower.includes("secondary")) return { role: "secondary" };
  if (
    lower.includes("background") ||
    lower.includes("-bg") ||
    lower === "--bg"
  )
    return { role: "background" };
  if (
    lower.includes("foreground") ||
    lower.includes("-text") ||
    lower === "--text"
  )
    return { role: "text" };
  if (lower.includes("border")) return { role: "border" };
  if (lower.includes("link")) return { role: "link" };
  if (lower.includes("muted")) return { role: "muted" };
  if (lower.includes("surface")) return { role: "surface" };

  return null;
}

/** Determine if a CSS custom property context indicates dark mode */
function isDarkModeContext(context?: string): boolean {
  if (!context) return false;
  const lower = context.toLowerCase();
  return (
    lower.includes(".dark") ||
    lower.includes("[data-theme=\"dark\"]") ||
    lower.includes("[data-theme='dark']") ||
    lower.includes("dark-mode") ||
    lower.includes("prefers-color-scheme: dark") ||
    lower.includes("prefers-color-scheme:dark")
  );
}

/** Determine if a CSS custom property name suggests a dark variant */
function isDarkVariantName(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes("-dark-") ||
    lower.includes("dark-") ||
    lower.endsWith("-dark")
  );
}

function parseColors(fetchOutput: FetchRenderOutput): BrandColors {
  const collectedColors: CollectedColor[] = [];
  const rawPaletteMap = new Map<string, ColorValue>();

  // --- CSS Custom Properties ---
  // Handle both array format [{name, value, context}] and object format {name: value}
  const cssProps: Array<{ name: string; value: string; context?: string }> = Array.isArray(fetchOutput.cssCustomProperties)
    ? fetchOutput.cssCustomProperties
    : Object.entries(fetchOutput.cssCustomProperties || {}).map(([name, value]) => ({ name, value: String(value) }));

  for (const prop of cssProps) {
    const parsed = parseColor(prop.value);
    if (!parsed) continue;

    const roleInfo = mapCssVarToRole(prop.name);
    const isDark =
      isDarkModeContext(prop.context) || isDarkVariantName(prop.name);

    collectedColors.push({
      hex: parsed.hex,
      rgb: parsed.rgb,
      role: roleInfo?.role,
      source: `css-var: ${prop.name}`,
      confidence: 0.9,
      mode: isDark ? "dark" : "light",
    });

    if (roleInfo?.semantic) {
      collectedColors.push({
        hex: parsed.hex,
        rgb: parsed.rgb,
        role: roleInfo.semantic,
        source: `css-var: ${prop.name}`,
        confidence: 0.9,
        mode: isDark ? "dark" : "light",
      });
    }

    rawPaletteMap.set(parsed.hex, {
      hex: parsed.hex,
      rgb: parsed.rgb,
      source: `css-var: ${prop.name}`,
    });
  }

  // --- Computed Styles on Key Elements ---
  const elementRoleMap: Record<string, { property: string; role: string }[]> = {
    html: [
      { property: "background-color", role: "background" },
      { property: "backgroundColor", role: "background" },
    ],
    body: [
      { property: "background-color", role: "background" },
      { property: "backgroundColor", role: "background" },
      { property: "color", role: "text" },
    ],
    h1: [{ property: "color", role: "heading" }],
    h2: [{ property: "color", role: "heading" }],
    h3: [{ property: "color", role: "heading" }],
    a: [{ property: "color", role: "link" }],
    button: [
      { property: "background-color", role: "primary" },
      { property: "backgroundColor", role: "primary" },
      { property: "color", role: "button-text" },
    ],
    nav: [
      { property: "background-color", role: "surface" },
      { property: "backgroundColor", role: "surface" },
    ],
    code: [
      { property: "background-color", role: "code-bg" },
      { property: "backgroundColor", role: "code-bg" },
    ],
  };

  for (const entry of fetchOutput.computedStyles) {
    const selector = entry.selector.toLowerCase().replace(/[.#\[\]>+~: ]/g, "");

    // Handle sampled buttons/links — map to "primary" role
    if (selector.startsWith("button-sample")) {
      for (const prop of ["background-color", "backgroundColor"]) {
        const value = entry.styles[prop];
        if (!value) continue;
        const parsed = parseColor(value);
        if (!parsed) continue;
        collectedColors.push({
          hex: parsed.hex,
          rgb: parsed.rgb,
          role: "primary",
          source: `computed: ${entry.selector} ${prop}`,
          confidence: 0.8,
          mode: "light",
        });
        rawPaletteMap.set(parsed.hex, {
          hex: parsed.hex,
          rgb: parsed.rgb,
          source: `computed: ${entry.selector}`,
        });
      }
      continue;
    }

    // Handle sampled sections — map bg to "surface"
    if (selector.startsWith("section-sample")) {
      for (const prop of ["background-color", "backgroundColor"]) {
        const value = entry.styles[prop];
        if (!value) continue;
        const parsed = parseColor(value);
        if (!parsed) continue;
        collectedColors.push({
          hex: parsed.hex,
          rgb: parsed.rgb,
          role: "surface",
          source: `computed: ${entry.selector} ${prop}`,
          confidence: 0.7,
          mode: "light",
        });
        rawPaletteMap.set(parsed.hex, {
          hex: parsed.hex,
          rgb: parsed.rgb,
          source: `computed: ${entry.selector}`,
        });
      }
      continue;
    }

    // Handle text samples — detect secondary/muted text colors
    if (selector.startsWith("text-sample")) {
      const value = entry.styles["color"];
      if (!value) continue;
      const parsed = parseColor(value);
      if (!parsed) continue;

      // Check if this is different enough from primary text to be "secondary"
      const primaryText = collectedColors.find(c => c.role === "text" && c.mode === "light");
      if (primaryText) {
        const dist = colorDistance(parsed.rgb, primaryText.rgb);
        if (dist > 30) {
          // This is a meaningfully different text color — secondary/muted candidate
          collectedColors.push({
            hex: parsed.hex,
            rgb: parsed.rgb,
            role: "muted",
            source: `computed: ${entry.selector} color`,
            confidence: 0.6,
            mode: "light",
          });
          collectedColors.push({
            hex: parsed.hex,
            rgb: parsed.rgb,
            role: "secondaryText",
            source: `computed: ${entry.selector} color`,
            confidence: 0.6,
            mode: "light",
          });
        }
      }
      rawPaletteMap.set(parsed.hex, { hex: parsed.hex, rgb: parsed.rgb, source: `computed: ${entry.selector}` });
      continue;
    }

    const mappings = elementRoleMap[selector];
    if (!mappings) continue;

    for (const mapping of mappings) {
      const value = entry.styles[mapping.property];
      if (!value) continue;

      const parsed = parseColor(value);
      if (!parsed) continue;

      collectedColors.push({
        hex: parsed.hex,
        rgb: parsed.rgb,
        role: mapping.role,
        source: `computed: ${entry.selector} ${mapping.property}`,
        confidence: 0.75,
        mode: "light",
      });

      rawPaletteMap.set(parsed.hex, {
        hex: parsed.hex,
        rgb: parsed.rgb,
        source: `computed: ${entry.selector}`,
      });
    }
  }

  // Background fallback: if no background role collected, infer white
  const hasBackground = collectedColors.some(c => c.role === "background" && c.mode === "light");
  if (!hasBackground) {
    collectedColors.push({
      hex: "#ffffff",
      rgb: { r: 255, g: 255, b: 255 },
      role: "background",
      source: "inferred: default white (body transparent)",
      confidence: 0.5,
      mode: "light",
    });
    rawPaletteMap.set("#ffffff", { hex: "#ffffff", rgb: { r: 255, g: 255, b: 255 }, source: "inferred" });
  }

  // --- Meta theme-color ---
  if (fetchOutput.metaThemeColor) {
    const parsed = parseColor(fetchOutput.metaThemeColor);
    if (parsed) {
      collectedColors.push({
        hex: parsed.hex,
        rgb: parsed.rgb,
        role: "primary",
        source: "meta: theme-color",
        confidence: 0.85,
        mode: "light",
      });
      rawPaletteMap.set(parsed.hex, {
        hex: parsed.hex,
        rgb: parsed.rgb,
        source: "meta: theme-color",
      });
    }
  }

  // --- Manifest colors ---
  if (fetchOutput.manifestThemeColor) {
    const parsed = parseColor(fetchOutput.manifestThemeColor);
    if (parsed) {
      collectedColors.push({
        hex: parsed.hex,
        rgb: parsed.rgb,
        role: "primary",
        source: "manifest: theme_color",
        confidence: 0.85,
        mode: "light",
      });
      rawPaletteMap.set(parsed.hex, {
        hex: parsed.hex,
        rgb: parsed.rgb,
        source: "manifest: theme_color",
      });
    }
  }

  if (fetchOutput.manifestBackgroundColor) {
    const parsed = parseColor(fetchOutput.manifestBackgroundColor);
    if (parsed) {
      collectedColors.push({
        hex: parsed.hex,
        rgb: parsed.rgb,
        role: "background",
        source: "manifest: background_color",
        confidence: 0.85,
        mode: "light",
      });
      rawPaletteMap.set(parsed.hex, {
        hex: parsed.hex,
        rgb: parsed.rgb,
        source: "manifest: background_color",
      });
    }
  }

  // --- Deduplicate raw palette (ΔE < 5 in Euclidean RGB) ---
  const deduplicatedPalette: ColorValue[] = [];
  for (const color of Array.from(rawPaletteMap.values())) {
    if (!color.rgb) continue;
    const isDuplicate = deduplicatedPalette.some((existing) => {
      if (!existing.rgb) return false;
      return colorDistance(color.rgb!, existing.rgb!) < 5;
    });
    if (!isDuplicate) {
      deduplicatedPalette.push(color);
    }
  }

  // --- Build ColorMode objects ---
  const lightMode: ColorMode = {};
  const darkMode: ColorMode = {};
  const semantic: SemanticColors = {};
  let hasDarkMode = false;

  // Group collected colors by role, preferring highest confidence
  type RoleKey = keyof ColorMode;
  type SemanticKey = keyof SemanticColors;

  const roleKeys: RoleKey[] = [
    "primary",
    "secondary",
    "accent",
    "background",
    "surface",
    "text",
    "secondaryText",
    "border",
    "link",
    "muted",
  ];
  const semanticKeys: SemanticKey[] = ["success", "warning", "error", "info"];

  for (const role of roleKeys) {
    // Find best light-mode match for this role
    const lightMatches = collectedColors.filter(
      (c) => c.role === role && c.mode === "light"
    );
    if (lightMatches.length > 0) {
      lightMatches.sort((a, b) => b.confidence - a.confidence);
      const best = lightMatches[0];
      lightMode[role] = {
        hex: best.hex,
        rgb: best.rgb,
        role,
        source: best.source,
        confidence: best.confidence,
      };
    }

    // Find best dark-mode match for this role
    const darkMatches = collectedColors.filter(
      (c) => c.role === role && c.mode === "dark"
    );
    if (darkMatches.length > 0) {
      hasDarkMode = true;
      darkMatches.sort((a, b) => b.confidence - a.confidence);
      const best = darkMatches[0];
      darkMode[role] = {
        hex: best.hex,
        rgb: best.rgb,
        role,
        source: best.source,
        confidence: best.confidence,
      };
    }
  }

  for (const role of semanticKeys) {
    const matches = collectedColors.filter((c) => c.role === role);
    if (matches.length > 0) {
      matches.sort((a, b) => b.confidence - a.confidence);
      const best = matches[0];
      semantic[role] = {
        hex: best.hex,
        rgb: best.rgb,
        role,
        source: best.source,
        confidence: best.confidence,
      };
    }
  }

  // Smart inference: fill missing roles from rawPalette using heuristics
  const unfilledRoles = roleKeys.filter(r => !lightMode[r]);
  if (unfilledRoles.length > 0 && deduplicatedPalette.length > 0) {
    for (const color of deduplicatedPalette) {
      if (!color.rgb) continue;
      const { r, g, b } = color.rgb;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const saturation = max === 0 ? 0 : (max - min) / max;

      // background: very light color (luminance > 0.9)
      if (unfilledRoles.includes("background") && luminance > 0.9 && !lightMode["background"]) {
        lightMode["background"] = { hex: color.hex, rgb: color.rgb, role: "background", source: "inferred: lightest in palette", confidence: 0.4 };
      }

      // muted: medium gray, low saturation
      if (unfilledRoles.includes("muted") && saturation < 0.15 && luminance > 0.3 && luminance < 0.7 && !lightMode["muted"]) {
        lightMode["muted"] = { hex: color.hex, rgb: color.rgb, role: "muted", source: "inferred: gray in palette", confidence: 0.4 };
      }

      // border: light grayish
      if (unfilledRoles.includes("border") && saturation < 0.15 && luminance > 0.65 && luminance < 0.92 && !lightMode["border"]) {
        lightMode["border"] = { hex: color.hex, rgb: color.rgb, role: "border", source: "inferred: light gray in palette", confidence: 0.35 };
      }

      // accent: saturated color that isn't the primary
      if (unfilledRoles.includes("accent") && saturation > 0.3 && !lightMode["accent"]) {
        const primary = lightMode["primary"];
        if (primary?.rgb && colorDistance(color.rgb, primary.rgb) > 30) {
          lightMode["accent"] = { hex: color.hex, rgb: color.rgb, role: "accent", source: "inferred: saturated non-primary", confidence: 0.4 };
        }
      }
    }
  }

  return {
    lightMode: Object.keys(lightMode).length > 0 ? lightMode : undefined,
    darkMode: hasDarkMode ? darkMode : undefined,
    semantic: Object.keys(semantic).length > 0 ? semantic : undefined,
    rawPalette: deduplicatedPalette.length > 0 ? deduplicatedPalette : [],
  };
}

// ─── 3. Parse Typography ─────────────────────────────────────────────

interface FontInfo {
  primaryName: string;
  fallbackStack: string;
  role: FontRole;
  weights: Set<number>;
}

function parseFontFamily(fontFamilyStr: string): {
  primaryName: string;
  fallbackStack: string;
} {
  const families = fontFamilyStr.split(",").map((f) => f.trim().replace(/['"]/g, ""));
  const primaryName = families[0] ?? "sans-serif";
  const fallbackStack = families.slice(1).join(", ");
  return { primaryName, fallbackStack };
}

function selectorToFontRole(selector: string): FontRole | null {
  const lower = selector.toLowerCase();
  if (/^h[1-6]$/.test(lower) || lower.includes("heading")) return "heading";
  if (
    lower === "body" ||
    lower === "p" ||
    lower.includes("paragraph") ||
    lower.includes("body")
  )
    return "body";
  if (lower === "code" || lower === "pre" || lower.includes("mono"))
    return "mono";
  if (lower.includes("hero") || lower.includes("display")) return "display";
  if (lower === "button" || lower === "a" || lower === "nav") return "body";
  if (lower.startsWith("button-sample") || lower.includes("btn") || lower.includes("cta")) return "body";
  if (lower.startsWith("section-sample")) return "body";
  return null;
}

function parseTypography(fetchOutput: FetchRenderOutput): BrandTypography {
  const fontMap = new Map<string, FontInfo>();
  const typeScale: TypeScale = {};
  const headingTexts: string[] = [];

  // Collect heading texts for case detection
  for (const heading of fetchOutput.headings) {
    if (heading.text.trim().length > 0) {
      headingTexts.push(heading.text.trim());
    }
  }

  // Extract font information from computed styles
  for (const entry of fetchOutput.computedStyles) {
    const selector = entry.selector.trim();
    const fontFamilyStr =
      entry.styles["font-family"] ?? entry.styles["fontFamily"];

    if (!fontFamilyStr) continue;

    const { primaryName, fallbackStack } = parseFontFamily(fontFamilyStr);
    const role = selectorToFontRole(selector);
    if (!role) continue;

    // Accumulate font info
    const key = `${primaryName}::${role}`;
    const existing = fontMap.get(key);
    const weightStr =
      entry.styles["font-weight"] ?? entry.styles["fontWeight"];
    const weight = weightStr ? parseFontWeight(weightStr) : undefined;

    if (existing) {
      if (weight) existing.weights.add(weight);
    } else {
      fontMap.set(key, {
        primaryName,
        fallbackStack,
        role,
        weights: new Set(weight ? [weight] : []),
      });
    }

    // Build type scale entries for h1-h6, body, small
    const scaleKey = mapSelectorToScaleKey(selector);
    if (scaleKey && !typeScale[scaleKey]) {
      const fontSize =
        entry.styles["font-size"] ?? entry.styles["fontSize"];
      const fontWeight =
        entry.styles["font-weight"] ?? entry.styles["fontWeight"];
      const lineHeight =
        entry.styles["line-height"] ?? entry.styles["lineHeight"];
      const letterSpacing =
        entry.styles["letter-spacing"] ?? entry.styles["letterSpacing"];
      const textTransform =
        entry.styles["text-transform"] ?? entry.styles["textTransform"];

      const scaleEntry: TypeScaleEntry = {
        fontFamily: primaryName,
      };

      if (fontSize) scaleEntry.fontSize = fontSize;
      if (fontWeight) scaleEntry.fontWeight = parseFontWeight(fontWeight);
      if (lineHeight && lineHeight !== "normal") {
        scaleEntry.lineHeight = lineHeight;
      }
      if (letterSpacing && letterSpacing !== "normal") {
        scaleEntry.letterSpacing = letterSpacing;
      }
      if (textTransform && textTransform !== "none") {
        scaleEntry.textTransform = textTransform;
      }

      typeScale[scaleKey] = scaleEntry;
    }
  }

  // Build font families array
  const families: FontFamily[] = [];
  const seenFonts = new Set<string>();

  for (const info of Array.from(fontMap.values())) {
    // Deduplicate by name (a font might appear in multiple roles)
    const dedupKey = `${info.primaryName}::${info.role}`;
    if (seenFonts.has(dedupKey)) continue;
    seenFonts.add(dedupKey);

    const source = detectFontSource(
      fetchOutput.stylesheetUrls,
      info.primaryName
    );

    families.push({
      name: info.primaryName,
      role: info.role,
      source,
      weights: info.weights.size > 0 ? Array.from(info.weights).sort((a, b) => a - b) : undefined,
      fallbackStack: info.fallbackStack || undefined,
      confidence: 0.85,
    });
  }

  // Detect heading case
  const headingCase = detectHeadingCase(headingTexts);

  // Find body line-height
  const bodyEntry = fetchOutput.computedStyles.find(
    (e) => e.selector.toLowerCase() === "body" || e.selector.toLowerCase() === "p"
  );
  const bodyLineHeight = bodyEntry
    ? bodyEntry.styles["line-height"] ?? bodyEntry.styles["lineHeight"]
    : undefined;

  // Find code font
  const codeEntry = fetchOutput.computedStyles.find(
    (e) =>
      e.selector.toLowerCase() === "code" ||
      e.selector.toLowerCase() === "pre"
  );
  const codeFontStr = codeEntry
    ? codeEntry.styles["font-family"] ?? codeEntry.styles["fontFamily"]
    : undefined;
  const codeFont = codeFontStr
    ? parseFontFamily(codeFontStr).primaryName
    : undefined;

  return {
    families: families.length > 0 ? families : undefined,
    scale: Object.keys(typeScale).length > 0 ? typeScale : undefined,
    conventions: {
      headingCase,
      bodyLineHeight:
        bodyLineHeight && bodyLineHeight !== "normal"
          ? bodyLineHeight
          : undefined,
      codeFont,
    },
  };
}

function parseFontWeight(value: string): number {
  const lower = value.toLowerCase().trim();
  switch (lower) {
    case "normal":
    case "regular":
      return 400;
    case "bold":
      return 700;
    case "bolder":
      return 700;
    case "lighter":
      return 300;
    default: {
      const num = parseInt(lower, 10);
      return isNaN(num) ? 400 : num;
    }
  }
}

function mapSelectorToScaleKey(
  selector: string
): keyof TypeScale | null {
  const lower = selector.toLowerCase().trim();
  switch (lower) {
    case "h1":
      return "h1";
    case "h2":
      return "h2";
    case "h3":
      return "h3";
    case "h4":
      return "h4";
    case "h5":
      return "h5";
    case "h6":
      return "h6";
    case "body":
    case "p":
      return "body";
    case "small":
      return "small";
    case "caption":
    case "figcaption":
      return "caption";
    default:
      return null;
  }
}

// ─── 4. Parse Spacing ────────────────────────────────────────────────

function parseSpacing(fetchOutput: FetchRenderOutput): BrandSpacing {
  const spacingValues: number[] = [];
  const borderRadiusValues: number[] = [];
  let containerMaxWidth: string | undefined;
  let gridSystem: GridSystem | undefined;

  const allElements = [
    ...fetchOutput.computedStyles,
    ...(fetchOutput.layoutElements ?? []),
  ];

  for (const entry of allElements) {
    const styles = entry.styles;
    const selector = entry.selector.toLowerCase();

    // Collect padding and margin values
    const spacingProps = [
      "padding",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "margin",
      "margin-top",
      "margin-right",
      "margin-bottom",
      "margin-left",
      "marginTop",
      "marginRight",
      "marginBottom",
      "marginLeft",
      "gap",
      "row-gap",
      "column-gap",
      "rowGap",
      "columnGap",
    ];

    for (const prop of spacingProps) {
      const value = styles[prop];
      if (!value) continue;

      // Parse individual spacing values from shorthand or single values
      const parts = value.split(/\s+/);
      for (const part of parts) {
        const px = parseCssLength(part);
        if (px !== null && px > 0 && px <= 200) {
          spacingValues.push(px);
        }
      }
    }

    // Collect border-radius values
    const radiusProps = [
      "border-radius",
      "borderRadius",
      "border-top-left-radius",
      "borderTopLeftRadius",
      "border-top-right-radius",
      "borderTopRightRadius",
      "border-bottom-left-radius",
      "borderBottomLeftRadius",
      "border-bottom-right-radius",
      "borderBottomRightRadius",
    ];

    for (const prop of radiusProps) {
      const value = styles[prop];
      if (!value) continue;

      const parts = value.split(/[\s/]+/);
      for (const part of parts) {
        const px = parseCssLength(part);
        if (px !== null && px > 0) {
          // Only collect from buttons, cards, inputs
          if (
            selector.includes("button") ||
            selector.includes("card") ||
            selector.includes("input") ||
            selector.includes("select") ||
            selector.includes("textarea") ||
            selector.includes("dialog") ||
            selector.includes("modal")
          ) {
            borderRadiusValues.push(px);
          }
        }
      }
    }

    // Detect container max-width
    if (
      (selector.includes("container") ||
        selector === "main" ||
        selector === "body" ||
        selector.includes("wrapper") ||
        selector.includes("content")) &&
      !containerMaxWidth
    ) {
      const maxW =
        styles["max-width"] ?? styles["maxWidth"];
      if (maxW && maxW !== "none" && maxW !== "100%") {
        containerMaxWidth = maxW;
      }
    }

    // Detect grid system
    if (!gridSystem) {
      const gridCols =
        styles["grid-template-columns"] ?? styles["gridTemplateColumns"];
      if (gridCols && gridCols !== "none") {
        const columns = countGridColumns(gridCols);
        const gapValue = styles["gap"] ?? styles["column-gap"] ?? styles["columnGap"];
        if (columns > 0) {
          gridSystem = {
            columns,
            gap: gapValue && gapValue !== "normal" ? gapValue : undefined,
          };
        }
      }
    }
  }

  // Determine base unit from most common spacing value
  const baseUnit = detectBaseUnit(spacingValues);

  // Classify border-radius into small/medium/large
  const borderRadius = classifyBorderRadius(borderRadiusValues);

  return {
    baseUnit: baseUnit ? `${baseUnit}px` : undefined,
    borderRadius:
      Object.keys(borderRadius).length > 0 ? borderRadius : undefined,
    containerMaxWidth,
    grid: gridSystem,
  };
}

function parseCssLength(value: string): number | null {
  const trimmed = value.trim();

  // px values
  const pxMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)px$/);
  if (pxMatch) return parseFloat(pxMatch[1]);

  // rem values (assume 16px base)
  const remMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;

  // em values (assume 16px base)
  const emMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)em$/);
  if (emMatch) return parseFloat(emMatch[1]) * 16;

  // Plain number (treat as px)
  const numMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)$/);
  if (numMatch) return parseFloat(numMatch[1]);

  return null;
}

function detectBaseUnit(values: number[]): number | null {
  if (values.length === 0) return null;

  // Round values to nearest integer and find the GCD-like base
  const rounded = values.map((v) => Math.round(v)).filter((v) => v > 0);
  if (rounded.length === 0) return null;

  // Find the most common value that could be a base unit
  // Common base units: 2, 4, 8, 16
  const candidates = [2, 4, 6, 8, 10, 12, 16];
  let bestCandidate = 8;
  let bestScore = 0;

  for (const candidate of candidates) {
    // Score = how many values are multiples of this candidate
    const multiples = rounded.filter(
      (v) => Math.abs(v % candidate) < 1.5
    ).length;
    const score = multiples / rounded.length;

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  // If no clear base unit found, use the mode of all values
  if (bestScore < 0.3) {
    const mode = findMostCommon(rounded);
    return mode ?? 8;
  }

  return bestCandidate;
}

function classifyBorderRadius(values: number[]): BorderRadiusScale {
  if (values.length === 0) return {};

  const sorted = Array.from(new Set(values)).sort((a, b) => a - b);

  if (sorted.length === 1) {
    return { medium: `${sorted[0]}px` };
  }

  if (sorted.length === 2) {
    return {
      small: `${sorted[0]}px`,
      large: `${sorted[1]}px`,
    };
  }

  // With 3+ unique values, pick small/medium/large
  const small = sorted[0];
  const large = sorted[sorted.length - 1];
  const midIndex = Math.floor(sorted.length / 2);
  const medium = sorted[midIndex];

  return {
    small: `${small}px`,
    medium: `${medium}px`,
    large: `${large}px`,
  };
}

function countGridColumns(gridTemplateCols: string): number {
  // Handle repeat(12, 1fr) pattern
  const repeatMatch = gridTemplateCols.match(/repeat\(\s*(\d+)/);
  if (repeatMatch) return parseInt(repeatMatch[1], 10);

  // Count number of column definitions
  const parts = gridTemplateCols
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  return parts.length;
}

// ─── 5. Parse Buttons ────────────────────────────────────────────────

function parseButtons(fetchOutput: FetchRenderOutput): BrandButtons {
  const styles: ButtonStyle[] = [];

  // Collect button data from computedStyles (button-sample-* entries)
  const buttonEntries = fetchOutput.computedStyles.filter(
    e => e.selector.startsWith("button-sample")
  );

  for (const entry of buttonEntries) {
    const bg = entry.styles["background-color"] || entry.styles["backgroundColor"];
    const color = entry.styles["color"];
    const borderWidth = entry.styles["border-width"] || entry.styles["borderWidth"];
    const borderColor = entry.styles["border-color"] || entry.styles["borderColor"];
    const borderRadius = entry.styles["border-radius"] || entry.styles["borderRadius"];
    const padding = entry.styles["padding"];
    const fontSize = entry.styles["font-size"] || entry.styles["fontSize"];
    const fontWeight = entry.styles["font-weight"] || entry.styles["fontWeight"];
    const boxShadow = entry.styles["box-shadow"] || entry.styles["boxShadow"];
    const textContent = entry.styles["text-content"] || "";
    const className = entry.styles["class-name"] || "";

    const parsedBg = bg ? parseColor(bg) : null;
    const parsedColor = color ? parseColor(color) : null;
    const parsedBorder = borderColor ? parseColor(borderColor) : null;

    const hasBg = parsedBg !== null;
    const hasBorder = borderWidth && borderWidth !== "0px" && borderWidth !== "0";

    // Classify variant
    let variant: ButtonStyle["variant"] = "text";
    let confidence = 0.5;

    if (hasBg) {
      // Check if bg is saturated (not white/black/gray)
      const rgb = parsedBg.rgb;
      const max = Math.max(rgb.r, rgb.g, rgb.b);
      const min = Math.min(rgb.r, rgb.g, rgb.b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      const lightness = (max + min) / 510; // 0-1

      if (saturation > 0.3 && lightness > 0.1 && lightness < 0.9) {
        variant = "primary";
        confidence = 0.85;
      } else if (lightness > 0.85) {
        variant = "secondary";
        confidence = 0.6;
      } else {
        variant = "secondary";
        confidence = 0.5;
      }
    } else if (hasBorder) {
      variant = "outline";
      confidence = 0.7;
    } else {
      variant = "ghost";
      confidence = 0.4;
    }

    // Boost confidence from text content
    const lowerText = textContent.toLowerCase();
    if (lowerText.includes("get started") || lowerText.includes("sign up") || lowerText.includes("start now") || lowerText.includes("try free") || lowerText.includes("buy")) {
      if (variant === "primary") confidence = Math.min(confidence + 0.1, 1);
    }

    // Boost from class name
    const lowerClass = className.toLowerCase();
    if (lowerClass.includes("primary") || lowerClass.includes("cta")) {
      if (variant === "primary") confidence = Math.min(confidence + 0.1, 1);
    }

    styles.push({
      variant,
      backgroundColor: parsedBg?.hex,
      textColor: parsedColor?.hex,
      borderRadius: borderRadius || undefined,
      borderColor: parsedBorder?.hex,
      borderWidth: hasBorder ? borderWidth : undefined,
      padding: padding || undefined,
      fontSize: fontSize || undefined,
      fontWeight: fontWeight ? parseFontWeight(fontWeight) : undefined,
      boxShadow: boxShadow || undefined,
      sampleText: textContent || undefined,
      confidence,
    });
  }

  // Deduplicate: keep highest confidence per variant
  const variantMap = new Map<string, ButtonStyle>();
  for (const s of styles) {
    const existing = variantMap.get(s.variant);
    if (!existing || (s.confidence || 0) > (existing.confidence || 0)) {
      variantMap.set(s.variant, s);
    }
  }

  return { styles: Array.from(variantMap.values()) };
}

// ─── 6. Parse Effects ────────────────────────────────────────────────

function parseEffects(fetchOutput: FetchRenderOutput): BrandEffects {
  const shadows: ShadowValue[] = [];
  const gradients: GradientValue[] = [];

  // Shadows from dedicated field
  for (const s of fetchOutput.shadows || []) {
    if (!s.value || s.value === "none") continue;
    const sel = s.selector.toLowerCase();
    let context: ShadowValue["context"] = "element";
    if (sel.includes("card")) context = "card";
    else if (sel.includes("button") || sel.includes("btn")) context = "button";
    else if (sel.includes("nav") || sel === "header") context = "navigation";
    else if (sel.includes("drop") || sel.includes("menu")) context = "dropdown";
    else if (sel.includes("modal") || sel.includes("dialog")) context = "modal";

    shadows.push({ value: s.value, source: s.selector, context });
  }

  // Also check button samples for shadows
  for (const entry of fetchOutput.computedStyles) {
    if (!entry.selector.startsWith("button-sample")) continue;
    const shadow = entry.styles["box-shadow"] || entry.styles["boxShadow"];
    if (shadow && shadow !== "none" && !shadows.some(s => s.value === shadow)) {
      shadows.push({ value: shadow, source: entry.selector, context: "button" });
    }
  }

  // Gradients
  for (const g of fetchOutput.gradients || []) {
    if (!g.value || g.value === "none") continue;
    gradients.push({ value: g.value, source: g.selector, context: g.selector });
  }

  return { shadows, gradients };
}

// ─── 7. Parse Identity ───────────────────────────────────────────────

function parseIdentity(fetchOutput: FetchRenderOutput): BrandIdentity {
  return {
    brandName: fetchOutput.title ?? undefined,
    description: fetchOutput.metaDescription ?? undefined,
  };
}

// ─── Main Export ─────────────────────────────────────────────────────

export async function parseVisualIdentity(
  rawFetchOutput: any,
  env: Env,
  domain: string
): Promise<ParseVisualOutput> {
  // Normalize field names — fetch-render.ts uses elementStyles, parse-visual expects computedStyles
  const fetchOutput: FetchRenderOutput = {
    ...rawFetchOutput,
    computedStyles: rawFetchOutput.computedStyles || rawFetchOutput.elementStyles || [],
    cssCustomProperties: rawFetchOutput.cssCustomProperties || [],
    icons: rawFetchOutput.icons || [],
    logoImages: rawFetchOutput.logoImages || [],
    inlineSvgs: rawFetchOutput.inlineSvgs || [],
    headings: rawFetchOutput.headings || [],
    heroText: rawFetchOutput.heroText || [],
    ctaTexts: rawFetchOutput.ctaTexts || [],
    navLabels: rawFetchOutput.navLabels || [],
    backgroundImages: rawFetchOutput.backgroundImages || [],
    stylesheetUrls: rawFetchOutput.stylesheetUrls || [],
    meta: rawFetchOutput.meta || {},
  };

  // Run logo parsing (async due to R2 uploads) and sync parsers in parallel
  const [logoResult, colors, typography, spacing] = await Promise.all([
    parseLogos(fetchOutput, env, domain),
    Promise.resolve(parseColors(fetchOutput)),
    Promise.resolve(parseTypography(fetchOutput)),
    Promise.resolve(parseSpacing(fetchOutput)),
  ]);

  const identity = parseIdentity(fetchOutput);

  // Filter and rank design assets — prioritize PNGs/SVGs, skip JPG photos
  const rawDesignAssets = fetchOutput.designAssets || [];
  const rankedDesignAssets: BrandDesignAsset[] = rawDesignAssets
    .filter((a) => a.isDesignAsset || a.format === "svg" || a.format === "png")
    .sort((a, b) => {
      // SVGs first, then PNGs, then others
      const formatScore = (f: string) =>
        f === "svg" ? 3 : f === "png" ? 2 : f === "webp" ? 1 : 0;
      return formatScore(b.format) - formatScore(a.format);
    })
    .slice(0, 10)
    .map((a) => ({
      src: a.src,
      alt: a.alt || undefined,
      width: a.width || undefined,
      height: a.height || undefined,
      format: a.format || undefined,
      context: a.context || undefined,
    }));

  return {
    identity,
    logos: logoResult.logos,
    colors,
    typography,
    spacing,
    assets: logoResult.assets,
    buttons: parseButtons(fetchOutput),
    effects: parseEffects(fetchOutput),
    designAssets: rankedDesignAssets,
    ogImage: fetchOutput.ogImage || undefined,
  };
}
