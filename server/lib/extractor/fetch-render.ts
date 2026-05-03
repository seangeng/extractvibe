import puppeteer from "@cloudflare/puppeteer";
import type { Env } from "../../env";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DarkModeInfo {
  hasDarkClass: boolean;
  currentTheme: string | null;
  colorScheme: string;
  hasThemeToggle: boolean;
  darkStylesheetFound: boolean;
  supportsDarkMode: boolean;
}

export interface FetchRenderOutput {
  // Meta
  meta: Record<string, string>;
  title: string;
  brandName: string | null;
  description: string | null;

  // Text content
  headings: Array<{ tag: string; text: string }>;
  heroText: string[];
  ctaTexts: string[];
  navLabels: string[];
  footerText: string;
  bodyText: string;

  // Computed styles
  elementStyles: Array<{
    selector: string;
    tag: string;
    styles: Record<string, string>;
  }>;
  cssCustomProperties: Record<string, string>;
  shadows: Array<{ value: string; selector: string }>;
  gradients: Array<{ value: string; selector: string }>;

  // Dark mode detection
  darkModeInfo: DarkModeInfo;

  // Icons & logos
  icons: Array<{ rel: string; href: string; sizes?: string; type?: string }>;
  logoImages: Array<{
    src: string;
    alt?: string;
    context: string;
    width?: number;
    height?: number;
    score?: number;
  }>;
  inlineSvgs: Array<{
    svg: string;
    context: string;
    width?: number;
    height?: number;
    purpose?: string;
    score?: number;
  }>;

  // Assets
  ogImage: string | null;
  backgroundImages: Array<{ url: string; selector: string }>;
  stylesheetUrls: string[];
  manifestUrl: string | null;
  manifestData: Record<string, any> | null;

  // Design assets
  designAssets: Array<{
    src: string;
    alt: string;
    width: number;
    height: number;
    format: string;
    context: string;
    isDesignAsset: boolean;
  }>;

  // Icon library detection
  iconLibrary: {
    name: string;
    version?: string;
    confidence: number;
    sampleIcons: string[];
    source: string;
  } | null;

  // Screenshot
  screenshot: Uint8Array | null;

  // Raw HTML for downstream analysis
  html: string;
}

// ---------------------------------------------------------------------------
// DOM extraction — runs inside page.evaluate()
// ---------------------------------------------------------------------------

interface DomExtractionResult {
  meta: Record<string, string>;
  title: string;
  brandName: string | null;
  description: string | null;

  headings: Array<{ tag: string; text: string }>;
  heroText: string[];
  ctaTexts: string[];
  navLabels: string[];
  footerText: string;
  bodyText: string;

  icons: Array<{ rel: string; href: string; sizes?: string; type?: string }>;
  logoImages: Array<{
    src: string;
    alt?: string;
    context: string;
    width?: number;
    height?: number;
    score?: number;
  }>;
  inlineSvgs: Array<{
    svg: string;
    context: string;
    width?: number;
    height?: number;
    purpose?: string;
    score?: number;
  }>;

  ogImage: string | null;
  stylesheetUrls: string[];
  manifestUrl: string | null;

  designAssets: Array<{
    src: string;
    alt: string;
    width: number;
    height: number;
    format: string;
    context: string;
    isDesignAsset: boolean;
  }>;

  iconLibrary: {
    name: string;
    version?: string;
    confidence: number;
    sampleIcons: string[];
    source: string;
  } | null;

  darkModeInfo: {
    hasDarkClass: boolean;
    currentTheme: string | null;
    colorScheme: string;
    hasThemeToggle: boolean;
    darkStylesheetFound: boolean;
    supportsDarkMode: boolean;
  };

  html: string;
}

function extractDom(): DomExtractionResult {
  // ---- Helpers ----

  function text(el: Element | null | undefined): string {
    return (el?.textContent ?? "").replace(/\s+/g, " ").trim();
  }

  function attr(el: Element, name: string): string | undefined {
    const v = el.getAttribute(name);
    return v === null ? undefined : v;
  }

  function closestContext(el: Element): string {
    if (el.closest("nav")) return "nav";
    if (el.closest("header")) return "header";
    if (el.closest("footer")) return "footer";
    return "body";
  }

  function elementTextTokens(el: Element): string {
    const parts: string[] = [];
    let current: Element | null = el;
    let depth = 0;
    while (current && depth < 4) {
      for (const name of ["id", "class", "aria-label", "title", "alt", "src", "href"]) {
        const value = current.getAttribute(name);
        if (value) parts.push(value);
      }
      current = current.parentElement;
      depth++;
    }
    const anchor = el.closest("a");
    if (anchor) parts.push(text(anchor).slice(0, 80));
    return parts.join(" ").toLowerCase();
  }

  function elementOwnTokens(el: Element): string {
    const parts: string[] = [];
    for (const name of ["id", "class", "aria-label", "title", "alt", "src", "href"]) {
      const value = el.getAttribute(name);
      if (value) parts.push(value);
    }

    const parent = el.parentElement;
    if (parent) {
      for (const name of ["id", "class", "aria-label", "title"]) {
        const value = parent.getAttribute(name);
        if (value) parts.push(value);
      }
    }

    const anchor = el.closest("a");
    if (anchor) {
      for (const name of ["id", "class", "aria-label", "title", "href"]) {
        const value = anchor.getAttribute(name);
        if (value) parts.push(value);
      }
      parts.push(text(anchor).slice(0, 80));
    }

    return parts.join(" ").toLowerCase();
  }

  function hasLogoToken(el: Element): boolean {
    return /(^|[\s/_-])(logo|brandlogo|brand-logo|brandmark|brand-mark|brand_logo|site-logo|site_logo|wordmark|logomark|identity)([\s/_-]|$)/i.test(elementOwnTokens(el));
  }

  function hasHomeBrandToken(el: Element): boolean {
    return isHomeAnchor(el) && /(^|[\s/_-])brand([\s/_-]|$)/i.test(elementOwnTokens(el));
  }

  function isUtilitySvg(el: Element): boolean {
    const tokens = elementOwnTokens(el);
    return /\b(lucide|heroicon|tabler|phosphor|radix|arrow|chevron|menu|search|close|external|download|upload|copy|github|twitter|x-icon)\b/i.test(tokens);
  }

  function isHomeAnchor(el: Element): boolean {
    const anchor = el.closest("a[href]") as HTMLAnchorElement | null;
    if (!anchor) return false;
    const raw = anchor.getAttribute("href") ?? "";
    if (raw === "/" || raw === "./" || raw === "") return true;
    try {
      const href = new URL(raw, window.location.href);
      return href.origin === window.location.origin && (href.pathname === "/" || href.pathname === "");
    } catch {
      return false;
    }
  }

  function isFirstHeaderNavLink(el: Element): boolean {
    const container = el.closest("header, nav");
    const anchor = el.closest("a[href]");
    const firstAnchor = container?.querySelector("a[href]");
    return Boolean(anchor && firstAnchor && anchor === firstAnchor);
  }

  function logoCandidateScore(el: Element, width?: number, height?: number): number {
    let score = 0;
    const context = closestContext(el);
    const tokens = elementTextTokens(el);

    if (hasLogoToken(el)) score += 5;
    if (hasHomeBrandToken(el)) score += 2;
    if (context === "header" || context === "nav") score += 2;
    if (context === "footer") score += 1;
    if (isHomeAnchor(el)) score += 3;
    if (isFirstHeaderNavLink(el)) score += 2;

    if (width && height) {
      const area = width * height;
      const aspect = width / height;
      if (width < 10 || height < 10 || area < 100) score -= 4;
      if (width > 520 || height > 260) score -= 2;
      if (aspect >= 1.15 && aspect <= 8 && width <= 420 && height <= 180) score += 1;
      if (Math.abs(aspect - 1) < 0.3 && width <= 180 && height <= 180) score += 1;
    }

    if (/\b(hero|banner|screenshot|avatar|user|profile|tracking|pixel|placeholder)\b/.test(tokens)) {
      score -= 3;
    }

    return score;
  }

  // ---- Meta tags ----

  const meta: Record<string, string> = {};
  document.querySelectorAll("meta").forEach((m) => {
    const key =
      m.getAttribute("property") ||
      m.getAttribute("name") ||
      m.getAttribute("http-equiv");
    const content = m.getAttribute("content");
    if (key && content) {
      meta[key] = content;
    }
  });

  // ---- Title ----

  const title = document.title || "";

  // ---- Brand name ----

  const brandName =
    meta["og:site_name"] ||
    meta["application-name"] ||
    meta["apple-mobile-web-app-title"] ||
    title.split(/\s[-|]\s/)[0] ||
    null;

  // ---- Description ----

  const description =
    meta["description"] || meta["og:description"] || null;

  // ---- Headings ----

  const headings: Array<{ tag: string; text: string }> = [];
  document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
    const t = text(h);
    if (t) {
      headings.push({ tag: h.tagName.toLowerCase(), text: t });
    }
  });

  // ---- Hero text ----

  const heroText: string[] = [];
  const heroSelectors = [
    "[class*='hero']",
    "[class*='banner']",
    "[class*='jumbotron']",
    "[class*='Hero']",
    "[class*='Banner']",
    "main > section:first-of-type",
    "body > section:first-of-type",
    "#hero",
    ".hero",
  ];
  const seenHero = new Set<string>();

  for (const sel of heroSelectors) {
    document.querySelectorAll(sel).forEach((section) => {
      section.querySelectorAll("h1, h2, p").forEach((el) => {
        const t = text(el);
        if (t && !seenHero.has(t)) {
          seenHero.add(t);
          heroText.push(t);
        }
      });
    });
  }

  // If nothing matched hero selectors, fall back to the first h1 + surrounding p
  if (heroText.length === 0) {
    const firstH1 = document.querySelector("h1");
    if (firstH1) {
      const t = text(firstH1);
      if (t) heroText.push(t);
      // Grab sibling paragraphs
      let sibling = firstH1.nextElementSibling;
      let count = 0;
      while (sibling && count < 3) {
        if (sibling.tagName === "P") {
          const pt = text(sibling);
          if (pt) heroText.push(pt);
        }
        sibling = sibling.nextElementSibling;
        count++;
      }
    }
  }

  // ---- CTA texts ----

  const ctaTexts: string[] = [];
  const ctaSelectors = [
    "[class*='hero'] a",
    "[class*='hero'] button",
    "[class*='banner'] a",
    "[class*='banner'] button",
    "[class*='cta']",
    "[class*='CTA']",
    "a[class*='primary']",
    "button[class*='primary']",
    "header a[class*='btn']",
    "header button",
    "main > section:first-of-type a",
    "main > section:first-of-type button",
  ];
  const seenCta = new Set<string>();

  for (const sel of ctaSelectors) {
    document.querySelectorAll(sel).forEach((el) => {
      const t = text(el);
      if (t && t.length < 80 && !seenCta.has(t)) {
        seenCta.add(t);
        ctaTexts.push(t);
      }
    });
  }

  // ---- Nav labels ----

  const navLabels: string[] = [];
  document.querySelectorAll("nav a, nav button, header nav li").forEach((el) => {
    const t = text(el);
    if (t && t.length < 60) {
      navLabels.push(t);
    }
  });

  // ---- Footer text ----

  const footerEl = document.querySelector("footer");
  const footerText = footerEl ? text(footerEl) : "";

  // ---- Body text (truncated) ----

  const bodyText = text(document.body).slice(0, 10_000);

  // ---- Icons / link tags ----

  const icons: Array<{ rel: string; href: string; sizes?: string; type?: string }> = [];
  const stylesheetUrls: string[] = [];
  let manifestUrl: string | null = null;

  document.querySelectorAll("link").forEach((link) => {
    const rel = (link.getAttribute("rel") ?? "").toLowerCase();
    const href = link.getAttribute("href");

    if (!href) return;

    if (
      rel === "icon" ||
      rel === "shortcut icon" ||
      rel === "apple-touch-icon" ||
      rel === "apple-touch-icon-precomposed"
    ) {
      icons.push({
        rel,
        href,
        sizes: attr(link, "sizes"),
        type: attr(link, "type"),
      });
    }

    if (rel === "stylesheet" && href) {
      stylesheetUrls.push(href);
    }

    if (rel === "manifest") {
      manifestUrl = href;
    }
  });

  // ---- OG image ----

  const ogImage = meta["og:image"] || null;

  // ---- Logo candidates (images) ----

  const logoImages: Array<{
    src: string;
    alt?: string;
    context: string;
    width?: number;
    height?: number;
    score?: number;
  }> = [];
  const seenLogoSrcs = new Set<string>();

  Array.from(document.images).slice(0, 160).forEach((img) => {
    const src = img.currentSrc || img.src || img.getAttribute("src");
    if (!src || seenLogoSrcs.has(src)) return;

    const rect = img.getBoundingClientRect();
    const width = img.naturalWidth || Math.round(rect.width) || undefined;
    const height = img.naturalHeight || Math.round(rect.height) || undefined;
    const score = logoCandidateScore(img, width, height);
    if (score < 5) return;

    seenLogoSrcs.add(src);
    logoImages.push({
      src,
      alt: attr(img, "alt"),
      context: closestContext(img),
      width,
      height,
      score,
    });
  });

  // ---- Inline SVGs in header / nav ----

  const inlineSvgs: Array<{
    svg: string;
    context: string;
    width?: number;
    height?: number;
    purpose?: string;
    score?: number;
  }> = [];
  const seenSvg = new Set<string>();

  Array.from(document.querySelectorAll("svg")).slice(0, 160).forEach((svg) => {
    const html = (svg as SVGElement).outerHTML;
    const normalized = html?.replace(/\s+/g, " ").trim();
    if (!normalized || normalized.length > 50_000 || seenSvg.has(normalized)) return;

    const rect = svg.getBoundingClientRect();
    const width = Math.round(rect.width) || undefined;
    const height = Math.round(rect.height) || undefined;
    let score = logoCandidateScore(svg, width, height);

    if (isUtilitySvg(svg) && !hasLogoToken(svg) && !isHomeAnchor(svg)) {
      score -= 6;
    }
    if (svg.getAttribute("aria-hidden") === "true" && !hasLogoToken(svg) && !isHomeAnchor(svg)) {
      score -= 2;
    }
    if (!hasLogoToken(svg) && !isHomeAnchor(svg) && width && height && width <= 32 && height <= 32) {
      score -= 3;
    }
    if (score < 6) return;

    seenSvg.add(normalized);
    inlineSvgs.push({
      svg: html,
      context: closestContext(svg),
      width,
      height,
      purpose: "logo",
      score,
    });
  });

  // ---- Design assets (transparent PNGs, SVGs, interesting images) ----

  const designAssets: Array<{
    src: string;
    alt: string;
    width: number;
    height: number;
    format: string;
    context: string;
    isDesignAsset: boolean;
  }> = [];
  const seenAssetSrcs = new Set<string>();
  const allImgs = document.querySelectorAll("img");

  for (let i = 0; i < Math.min(allImgs.length, 80); i++) {
    const img = allImgs[i] as HTMLImageElement;
    const src = img.src || img.getAttribute("src") || "";
    if (!src || seenAssetSrcs.has(src)) continue;
    if (src.startsWith("data:")) continue;

    const width = img.naturalWidth || img.width || 0;
    const height = img.naturalHeight || img.height || 0;

    // Skip tiny icons (< 40px) and tracking pixels
    if (width < 40 || height < 40) continue;

    const isPNG = src.toLowerCase().includes(".png");
    const isSVG = src.toLowerCase().includes(".svg");
    const isWebP = src.toLowerCase().includes(".webp");
    const isJPG =
      src.toLowerCase().includes(".jpg") ||
      src.toLowerCase().includes(".jpeg");

    // Determine if it's likely a design asset vs a photo
    const alt = img.alt || "";
    const isLikelyDesignAsset =
      isPNG ||
      isSVG ||
      isWebP ||
      alt.toLowerCase().includes("logo") ||
      alt.toLowerCase().includes("icon") ||
      alt.toLowerCase().includes("illustration") ||
      img.closest('[class*="hero"]') !== null ||
      img.closest('[class*="feature"]') !== null ||
      img.closest('[class*="bento"]') !== null;

    seenAssetSrcs.add(src);
    designAssets.push({
      src: src,
      alt: alt.substring(0, 100),
      width: width,
      height: height,
      format: isPNG
        ? "png"
        : isSVG
          ? "svg"
          : isWebP
            ? "webp"
            : isJPG
              ? "jpg"
              : "other",
      context: closestContext(img),
      isDesignAsset: isLikelyDesignAsset,
    });
  }

  // ---- Icon library detection ----

  const iconLibrary: DomExtractionResult["iconLibrary"] = (() => {
    type IconDetection = {
      name: string;
      version?: string;
      confidence: number;
      sampleIcons: string[];
      source: string;
    };

    // --- Check CSS class patterns ---

    // Font Awesome
    const faElements = document.querySelectorAll(
      '[class*="fa-"], .fas, .far, .fab, .fal, [class*="fa-solid"], [class*="fa-regular"], [class*="fa-brands"]'
    );
    if (faElements.length > 0) {
      const samples: string[] = [];
      const seen = new Set<string>();
      faElements.forEach((el) => {
        if (samples.length >= 10) return;
        const classes = el.className?.toString() || "";
        const match = classes.match(/fa-([a-z0-9-]+)/);
        if (match && match[1] !== "solid" && match[1] !== "regular" && match[1] !== "brands" && match[1] !== "light") {
          if (!seen.has(match[1])) {
            seen.add(match[1]);
            samples.push(match[1]);
          }
        }
      });
      // Try to detect version from stylesheet URL
      let version: string | undefined;
      for (const url of stylesheetUrls) {
        const vMatch = url.match(/font-?awesome[\/.-]v?(\d+[\d.]*)/i);
        if (vMatch) { version = vMatch[1]; break; }
      }
      return {
        name: "Font Awesome",
        version,
        confidence: Math.min(0.5 + faElements.length * 0.05, 0.95),
        sampleIcons: samples,
        source: "class-pattern",
      } satisfies IconDetection;
    }

    // Material Icons
    const materialElements = document.querySelectorAll(
      '.material-icons, .material-icons-outlined, .material-icons-round, .material-symbols-outlined, .material-symbols-rounded'
    );
    if (materialElements.length > 0) {
      const samples: string[] = [];
      const seen = new Set<string>();
      materialElements.forEach((el) => {
        if (samples.length >= 10) return;
        const name = (el.textContent ?? "").trim();
        if (name && !seen.has(name)) {
          seen.add(name);
          samples.push(name);
        }
      });
      return {
        name: "Material Icons",
        confidence: Math.min(0.5 + materialElements.length * 0.05, 0.95),
        sampleIcons: samples,
        source: "class-pattern",
      } satisfies IconDetection;
    }

    // Lucide
    const lucideElements = document.querySelectorAll('svg[class*="lucide"]');
    if (lucideElements.length > 0) {
      const samples: string[] = [];
      const seen = new Set<string>();
      lucideElements.forEach((el) => {
        if (samples.length >= 10) return;
        const classes = (el.className as unknown as { baseVal?: string })?.baseVal || el.getAttribute("class") || "";
        const match = classes.match(/lucide-([a-z0-9-]+)/);
        if (match && !seen.has(match[1])) {
          seen.add(match[1]);
          samples.push(match[1]);
        }
      });
      return {
        name: "Lucide",
        confidence: Math.min(0.5 + lucideElements.length * 0.05, 0.95),
        sampleIcons: samples,
        source: "class-pattern",
      } satisfies IconDetection;
    }

    // Heroicons
    const heroiconSvgs = document.querySelectorAll('svg[data-slot="icon"]');
    const heroiconParents = document.querySelectorAll('[class*="heroicon"]');
    const heroiconCount = heroiconSvgs.length + heroiconParents.length;
    if (heroiconCount > 0) {
      return {
        name: "Heroicons",
        confidence: Math.min(0.5 + heroiconCount * 0.05, 0.95),
        sampleIcons: [],
        source: "class-pattern",
      } satisfies IconDetection;
    }

    // Phosphor
    const phosphorElements = document.querySelectorAll('[class*="ph-"]');
    if (phosphorElements.length > 0) {
      const samples: string[] = [];
      const seen = new Set<string>();
      phosphorElements.forEach((el) => {
        if (samples.length >= 10) return;
        const classes = el.className?.toString() || "";
        const match = classes.match(/ph-([a-z0-9-]+)/);
        if (match && match[1] !== "bold" && match[1] !== "fill" && match[1] !== "light" && match[1] !== "thin" && match[1] !== "duotone") {
          if (!seen.has(match[1])) {
            seen.add(match[1]);
            samples.push(match[1]);
          }
        }
      });
      return {
        name: "Phosphor",
        confidence: Math.min(0.5 + phosphorElements.length * 0.05, 0.95),
        sampleIcons: samples,
        source: "class-pattern",
      } satisfies IconDetection;
    }

    // Tabler Icons
    const tablerElements = document.querySelectorAll('svg[class*="tabler-icon"], svg[class*="icon-tabler"]');
    if (tablerElements.length > 0) {
      const samples: string[] = [];
      const seen = new Set<string>();
      tablerElements.forEach((el) => {
        if (samples.length >= 10) return;
        const classes = (el.className as unknown as { baseVal?: string })?.baseVal || el.getAttribute("class") || "";
        const match = classes.match(/(?:tabler-icon|icon-tabler)-([a-z0-9-]+)/);
        if (match && !seen.has(match[1])) {
          seen.add(match[1]);
          samples.push(match[1]);
        }
      });
      return {
        name: "Tabler Icons",
        confidence: Math.min(0.5 + tablerElements.length * 0.05, 0.95),
        sampleIcons: samples,
        source: "class-pattern",
      } satisfies IconDetection;
    }

    // Bootstrap Icons
    const biElements = document.querySelectorAll('[class*="bi-"]');
    if (biElements.length > 0) {
      const samples: string[] = [];
      const seen = new Set<string>();
      biElements.forEach((el) => {
        if (samples.length >= 10) return;
        const classes = el.className?.toString() || "";
        const match = classes.match(/bi-([a-z0-9-]+)/);
        if (match && !seen.has(match[1])) {
          seen.add(match[1]);
          samples.push(match[1]);
        }
      });
      return {
        name: "Bootstrap Icons",
        confidence: Math.min(0.5 + biElements.length * 0.05, 0.95),
        sampleIcons: samples,
        source: "class-pattern",
      } satisfies IconDetection;
    }

    // Ionicons
    const ionElements = document.querySelectorAll('ion-icon, [class*="ionicon"]');
    if (ionElements.length > 0) {
      const samples: string[] = [];
      const seen = new Set<string>();
      ionElements.forEach((el) => {
        if (samples.length >= 10) return;
        const name = el.getAttribute("name") || el.getAttribute("icon") || "";
        if (name && !seen.has(name)) {
          seen.add(name);
          samples.push(name);
        }
      });
      return {
        name: "Ionicons",
        confidence: Math.min(0.5 + ionElements.length * 0.05, 0.95),
        sampleIcons: samples,
        source: "class-pattern",
      } satisfies IconDetection;
    }

    // Feather Icons
    const featherElements = document.querySelectorAll('svg[class*="feather"]');
    if (featherElements.length > 0) {
      const samples: string[] = [];
      const seen = new Set<string>();
      featherElements.forEach((el) => {
        if (samples.length >= 10) return;
        const classes = (el.className as unknown as { baseVal?: string })?.baseVal || el.getAttribute("class") || "";
        const match = classes.match(/feather-([a-z0-9-]+)/);
        if (match && !seen.has(match[1])) {
          seen.add(match[1]);
          samples.push(match[1]);
        }
      });
      return {
        name: "Feather",
        confidence: Math.min(0.5 + featherElements.length * 0.05, 0.95),
        sampleIcons: samples,
        source: "class-pattern",
      } satisfies IconDetection;
    }

    // Remix Icons
    const riElements = document.querySelectorAll('[class*="ri-"]');
    if (riElements.length > 0) {
      const samples: string[] = [];
      const seen = new Set<string>();
      riElements.forEach((el) => {
        if (samples.length >= 10) return;
        const classes = el.className?.toString() || "";
        const match = classes.match(/ri-([a-z0-9-]+)/);
        if (match && match[1] !== "line" && match[1] !== "fill" && match[1] !== "fw" && match[1] !== "xxs" && match[1] !== "xs" && match[1] !== "sm" && match[1] !== "lg" && match[1] !== "xl" && match[1] !== "xxl") {
          if (!seen.has(match[1])) {
            seen.add(match[1]);
            samples.push(match[1]);
          }
        }
      });
      return {
        name: "Remix Icons",
        confidence: Math.min(0.5 + riElements.length * 0.05, 0.95),
        sampleIcons: samples,
        source: "class-pattern",
      } satisfies IconDetection;
    }

    // --- Check loaded stylesheets/scripts ---

    for (const url of stylesheetUrls) {
      const lowerUrl = url.toLowerCase();

      if (lowerUrl.includes("font-awesome") || lowerUrl.includes("fontawesome")) {
        let version: string | undefined;
        const vMatch = url.match(/font-?awesome[\/.-]v?(\d+[\d.]*)/i);
        if (vMatch) version = vMatch[1];
        return {
          name: "Font Awesome",
          version,
          confidence: 0.8,
          sampleIcons: [],
          source: "stylesheet",
        } satisfies IconDetection;
      }

      if (lowerUrl.includes("material-icons") || lowerUrl.includes("fonts.googleapis.com/icon")) {
        return {
          name: "Material Icons",
          confidence: 0.8,
          sampleIcons: [],
          source: "stylesheet",
        } satisfies IconDetection;
      }
    }

    // Check script tags for icon libraries
    const scripts = document.querySelectorAll("script[src]");
    for (let i = 0; i < scripts.length; i++) {
      const src = (scripts[i].getAttribute("src") || "").toLowerCase();
      if (src.includes("heroicons")) {
        return {
          name: "Heroicons",
          confidence: 0.7,
          sampleIcons: [],
          source: "script",
        } satisfies IconDetection;
      }
      if (src.includes("ionicons")) {
        return {
          name: "Ionicons",
          confidence: 0.7,
          sampleIcons: [],
          source: "script",
        } satisfies IconDetection;
      }
    }

    return null;
  })();

  // ---- Raw HTML ----

  const html = document.documentElement.outerHTML;

  // ---- Detect dark mode implementation ----

  const darkModeInfo = (() => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    // 1. Class-based: .dark, .theme-dark, .dark-mode, .dark-theme
    const darkClasses = ['dark', 'theme-dark', 'dark-mode', 'dark-theme', 'night'];
    const hasDarkClass = darkClasses.some(cls =>
      htmlEl.classList.contains(cls) || bodyEl.classList.contains(cls)
    );

    // 2. Data attribute-based: data-theme, data-mode, data-color-scheme, data-color-mode
    const darkAttrs = [
      { el: htmlEl, attr: 'data-theme' },
      { el: htmlEl, attr: 'data-mode' },
      { el: htmlEl, attr: 'data-color-scheme' },
      { el: htmlEl, attr: 'data-color-mode' },
      { el: bodyEl, attr: 'data-theme' },
      { el: bodyEl, attr: 'data-mode' },
    ];
    const currentThemeAttr = darkAttrs.find(({ el, attr }) => el.getAttribute(attr));
    const currentTheme = currentThemeAttr
      ? currentThemeAttr.el.getAttribute(currentThemeAttr.attr)
      : null;

    // 3. CSS color-scheme property
    const colorScheme = getComputedStyle(htmlEl).colorScheme || '';

    // 4. Check for dark mode toggle elements (buttons/switches with common patterns)
    const toggleSelectors = [
      '[aria-label*="dark" i]', '[aria-label*="theme" i]', '[aria-label*="mode" i]',
      'button[class*="theme" i]', 'button[class*="dark" i]', 'button[class*="mode" i]',
      '[data-testid*="theme" i]', '[data-testid*="dark" i]',
    ];
    const hasThemeToggle = toggleSelectors.some(sel => {
      try { return document.querySelector(sel) !== null; } catch { return false; }
    });

    // 5. Check if dark-mode stylesheets/rules exist (without toggling)
    let darkStylesheetFound = false;
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            const ruleText = rule.cssText || '';
            if (ruleText.includes('prefers-color-scheme: dark') ||
                ruleText.includes('.dark') ||
                ruleText.includes('[data-theme="dark"]') ||
                ruleText.includes('[data-mode="dark"]') ||
                ruleText.includes('[data-color-scheme="dark"]') ||
                ruleText.includes('[data-color-mode="dark"]') ||
                ruleText.includes('.theme-dark') ||
                ruleText.includes('.dark-mode') ||
                ruleText.includes('.dark-theme')) {
              darkStylesheetFound = true;
              break;
            }
          }
        } catch { /* CORS */ }
        if (darkStylesheetFound) break;
      }
    } catch { /* ignore */ }

    return {
      hasDarkClass,
      currentTheme,
      colorScheme,
      hasThemeToggle,
      darkStylesheetFound,
      supportsDarkMode: hasDarkClass || !!currentTheme || colorScheme.includes('dark') || hasThemeToggle || darkStylesheetFound,
    };
  })();

  return {
    meta,
    title,
    brandName,
    description,
    headings,
    heroText,
    ctaTexts,
    navLabels,
    footerText,
    bodyText,
    icons,
    logoImages,
    inlineSvgs,
    ogImage,
    stylesheetUrls,
    manifestUrl,
    designAssets,
    iconLibrary,
    darkModeInfo,
    html,
  };
}

// ---------------------------------------------------------------------------
// Computed styles extraction — runs inside a second page.evaluate()
// ---------------------------------------------------------------------------

interface StylesExtractionResult {
  elementStyles: Array<{
    selector: string;
    tag: string;
    styles: Record<string, string>;
  }>;
  cssCustomProperties: Record<string, string>;
  backgroundImages: Array<{ url: string; selector: string }>;
  shadows: Array<{ value: string; selector: string }>;
  gradients: Array<{ value: string; selector: string }>;
}

function extractStyles(): StylesExtractionResult {
  const STYLE_PROPERTIES = [
    "font-family",
    "font-size",
    "font-weight",
    "line-height",
    "letter-spacing",
    "text-transform",
    "color",
    "background-color",
    "border-radius",
    "padding",
    "margin",
    "box-shadow",
    "border-color",
    "border-width",
    "border-style",
    "background-image",
  ] as const;

  const SELECTORS: Array<{ selector: string; tag: string }> = [
    { selector: "html", tag: "html" },
    { selector: "body", tag: "body" },
    { selector: "h1", tag: "h1" },
    { selector: "h2", tag: "h2" },
    { selector: "h3", tag: "h3" },
    { selector: "h4", tag: "h4" },
    { selector: "h5", tag: "h5" },
    { selector: "h6", tag: "h6" },
    { selector: "a", tag: "a" },
    { selector: "button", tag: "button" },
    { selector: "nav", tag: "nav" },
    { selector: "header", tag: "header" },
    { selector: "footer", tag: "footer" },
    { selector: "input", tag: "input" },
    { selector: "p", tag: "p" },
    { selector: "code", tag: "code" },
    { selector: "pre", tag: "pre" },
    // CTA-specific selectors to catch colored buttons
    { selector: "a[class*='primary']", tag: "a" },
    { selector: "a[class*='cta']", tag: "a" },
    { selector: "a[class*='btn']", tag: "a" },
    { selector: "button[class*='primary']", tag: "button" },
    { selector: "[class*='cta']", tag: "div" },
  ];

  // ---- Per-element computed styles ----

  const elementStyles: Array<{
    selector: string;
    tag: string;
    styles: Record<string, string>;
  }> = [];

  for (const { selector, tag } of SELECTORS) {
    const el = document.querySelector(selector);
    if (!el) continue;

    const computed = getComputedStyle(el);
    const styles: Record<string, string> = {};

    for (const prop of STYLE_PROPERTIES) {
      const value = computed.getPropertyValue(prop);
      if (value) {
        styles[prop] = value;
      }
    }

    elementStyles.push({ selector, tag, styles });
  }

  // ---- Sample buttons/links with non-transparent backgrounds or visible borders ----

  const btns = document.querySelectorAll("a, button");
  let btnCount = 0;
  for (let i = 0; i < btns.length && btnCount < 15; i++) {
    const computed = getComputedStyle(btns[i]);
    const bg = computed.backgroundColor;
    const borderWidth = computed.borderWidth;
    const hasBg = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
    const hasBorder = borderWidth && borderWidth !== "0px" && borderWidth !== "0";

    // Capture buttons with visible background OR visible border
    if (hasBg || hasBorder) {
      elementStyles.push({
        selector: `button-sample-${btnCount}`,
        tag: btns[i].tagName.toLowerCase(),
        styles: {
          "background-color": bg,
          "color": computed.color,
          "font-family": computed.fontFamily,
          "font-size": computed.fontSize,
          "font-weight": computed.fontWeight,
          "border-radius": computed.borderRadius,
          "border-color": computed.borderColor,
          "border-width": computed.borderWidth,
          "border-style": computed.borderStyle,
          "padding": computed.padding,
          "box-shadow": computed.boxShadow !== "none" ? computed.boxShadow : "",
          "background-image": computed.backgroundImage !== "none" ? computed.backgroundImage : "",
          "text-content": btns[i].textContent?.trim().slice(0, 80) || "",
          "class-name": btns[i].className?.toString().slice(0, 200) || "",
        },
      });
      btnCount++;
    }
  }

  // ---- Sample hero/main section backgrounds ----

  const sections = document.querySelectorAll('main, section, [class*="hero"], [class*="Hero"]');
  let secCount = 0;
  for (let i = 0; i < sections.length && secCount < 5; i++) {
    const computed = getComputedStyle(sections[i]);
    const bg = computed.backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
      elementStyles.push({
        selector: `section-sample-${secCount}`,
        tag: sections[i].tagName.toLowerCase(),
        styles: {
          "background-color": bg,
          "color": computed.color,
        },
      });
      secCount++;
    }
  }

  // ---- Sample box-shadows from cards, modals, dropdowns, etc. ----

  const shadowSelectors = [
    '[class*="card"]', '[class*="Card"]',
    '[class*="dropdown"]', '[class*="Dropdown"]',
    '[class*="menu"]', '[class*="Menu"]',
    '[class*="modal"]', '[class*="Modal"]',
    '[class*="dialog"]', '[class*="Dialog"]',
    '[class*="popover"]', '[class*="Popover"]',
    '[class*="tooltip"]',
    'header', 'nav',
    '[class*="shadow"]',
  ];
  const shadowMap = new Map<string, string>();
  for (const sel of shadowSelectors) {
    try {
      document.querySelectorAll(sel).forEach((el) => {
        if (shadowMap.size >= 15) return;
        const shadow = getComputedStyle(el).boxShadow;
        if (shadow && shadow !== "none" && !shadowMap.has(shadow)) {
          shadowMap.set(shadow, sel);
        }
      });
    } catch {
      /* skip invalid selectors */
    }
  }
  const shadows = Array.from(shadowMap.entries()).map((entry) => ({
    value: entry[0],
    selector: entry[1],
  }));

  // ---- Extract gradients from backgrounds ----

  const gradients: Array<{ value: string; selector: string }> = [];
  const gradientSelectors = [
    "body", "main", "header", "section",
    '[class*="hero"]', '[class*="Hero"]',
    '[class*="banner"]', '[class*="Banner"]',
    '[class*="gradient"]', '[class*="Gradient"]',
    '[class*="bg-"]',
  ];
  const seenGradients = new Set<string>();
  for (const gsel of gradientSelectors) {
    try {
      document.querySelectorAll(gsel).forEach((el) => {
        if (gradients.length >= 10) return;
        const bgImg = getComputedStyle(el).backgroundImage;
        if (
          bgImg &&
          bgImg !== "none" &&
          (bgImg.includes("gradient") ||
            bgImg.includes("linear") ||
            bgImg.includes("radial") ||
            bgImg.includes("conic"))
        ) {
          if (!seenGradients.has(bgImg)) {
            seenGradients.add(bgImg);
            gradients.push({ value: bgImg, selector: gsel });
          }
        }
      });
    } catch {
      /* skip */
    }
  }

  // ---- Sample text colors from paragraphs and spans ----

  const textEls = document.querySelectorAll("p, span, li");
  const textColorCounts: Record<string, number> = {};
  for (let ti = 0; ti < Math.min(textEls.length, 100); ti++) {
    const tc = getComputedStyle(textEls[ti]).color;
    if (tc) {
      textColorCounts[tc] = (textColorCounts[tc] || 0) + 1;
    }
  }
  // Sort by frequency, take top 5 unique text colors
  const sortedTextColors = Object.entries(textColorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  for (let sci = 0; sci < sortedTextColors.length; sci++) {
    elementStyles.push({
      selector: `text-sample-${sci}`,
      tag: "p",
      styles: { color: sortedTextColors[sci][0] },
    });
  }

  // ---- CSS custom properties from :root ----

  const cssCustomProperties: Record<string, string> = {};

  // Method 1: iterate over stylesheets and look for :root rules
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (!rules) continue;

        for (const rule of Array.from(rules)) {
          if (
            rule instanceof CSSStyleRule &&
            (rule.selectorText === ":root" || rule.selectorText === "html")
          ) {
            for (let i = 0; i < rule.style.length; i++) {
              const name = rule.style[i];
              if (name.startsWith("--")) {
                cssCustomProperties[name] = rule.style.getPropertyValue(name).trim();
              }
            }
          }
        }
      } catch {
        // Cross-origin stylesheets throw SecurityError — skip silently
      }
    }
  } catch {
    // Stylesheet access may fail entirely in some environments
  }

  // Method 2: computed style on documentElement as fallback / supplement
  try {
    const rootComputed = getComputedStyle(document.documentElement);
    // getComputedStyle doesn't enumerate custom properties, but we can try
    // reading the inline style on :root which sometimes has them
    const rootStyle = document.documentElement.style;
    for (let i = 0; i < rootStyle.length; i++) {
      const name = rootStyle[i];
      if (name.startsWith("--") && !(name in cssCustomProperties)) {
        cssCustomProperties[name] =
          rootComputed.getPropertyValue(name).trim();
      }
    }
  } catch {
    // Non-fatal
  }

  // ---- Background images ----

  const backgroundImages: Array<{ url: string; selector: string }> = [];
  const bgSelectors = [
    "body",
    "main",
    "header",
    "[class*='hero']",
    "[class*='banner']",
    "[class*='Hero']",
    "[class*='Banner']",
    "section:first-of-type",
    "#hero",
    ".hero",
  ];
  const urlRegex = /url\(["']?(.*?)["']?\)/g;

  for (const sel of bgSelectors) {
    document.querySelectorAll(sel).forEach((el) => {
      const bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === "none") return;

      let match: RegExpExecArray | null;
      urlRegex.lastIndex = 0;
      while ((match = urlRegex.exec(bg)) !== null) {
        backgroundImages.push({
          url: match[1],
          selector: sel,
        });
      }
    });
  }

  return { elementStyles, cssCustomProperties, backgroundImages, shadows, gradients };
}

// ---------------------------------------------------------------------------
// Manifest fetcher (runs outside the browser, using native fetch)
// ---------------------------------------------------------------------------

async function fetchManifest(
  manifestUrl: string,
  pageUrl: string
): Promise<Record<string, any> | null> {
  try {
    // Resolve relative manifest URLs against the page URL
    const resolved = new URL(manifestUrl, pageUrl).href;
    const res = await fetch(resolved, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, any>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function fetchAndRender(
  env: Env,
  url: string
): Promise<FetchRenderOutput> {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();

    // Desktop viewport
    await page.setViewport({ width: 1440, height: 900 });

    // Navigate — domcontentloaded fires fast on SSR/RSC sites where networkidle*
    // never settles (long-poll connections, analytics streams). Follow with a
    // small settle delay so client-side hydration + late assets land before extraction.
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    // Settle for client-side hydration. 1s is enough for most React/Vue
    // SPAs to mount; values above that are diminishing returns and were
    // tuned conservatively before measurement.
    await new Promise((resolve) => setTimeout(resolve, 1_000));

    // ------------------------------------------------------------------
    // Run DOM extraction, styles extraction, and screenshot capture in
    // parallel. The evaluates serialize on the page's V8 thread but the
    // screenshot uses Chromium's separate rasterizer pipeline, so it
    // overlaps with the evaluates. Saves 1-2s vs sequential.
    // ------------------------------------------------------------------

    const domEmpty: DomExtractionResult = {
      meta: {}, title: "", brandName: null, description: null,
      headings: [], heroText: [], ctaTexts: [], navLabels: [],
      footerText: "", bodyText: "", icons: [], logoImages: [],
      inlineSvgs: [], ogImage: null, stylesheetUrls: [], manifestUrl: null,
      designAssets: [], iconLibrary: null,
      darkModeInfo: {
        hasDarkClass: false, currentTheme: null, colorScheme: "",
        hasThemeToggle: false, darkStylesheetFound: false, supportsDarkMode: false,
      },
      html: "",
    };
    const stylesEmpty: StylesExtractionResult = {
      elementStyles: [], cssCustomProperties: {},
      backgroundImages: [], shadows: [], gradients: [],
    };

    const evaluatesPromise = (async () => {
      let dom: DomExtractionResult;
      let styles: StylesExtractionResult;
      try {
        dom = await page.evaluate(extractDom);
      } catch (err) {
        console.error("DOM extraction failed:", err);
        dom = domEmpty;
      }
      try {
        styles = await page.evaluate(extractStyles);
      } catch (err) {
        console.error("Styles extraction failed:", err);
        styles = stylesEmpty;
      }
      return { dom, styles };
    })();

    const screenshotPromise = (async (): Promise<Uint8Array | null> => {
      try {
        const buf = await page.screenshot({ fullPage: false, type: "png" });
        return buf instanceof Uint8Array ? buf : new Uint8Array(buf as ArrayBuffer);
      } catch (err) {
        console.error("Screenshot failed:", err);
        return null;
      }
    })();

    let [{ dom: domResult, styles: stylesResult }, screenshot] = await Promise.all([
      evaluatesPromise,
      screenshotPromise,
    ]);

    // Some sites (e.g. ramp.com homepage) serve a markdown-only "machine"
    // version at the root and only render full HTML on subpages like
    // /pricing. Detect that case — no logo images, no inline SVGs, no
    // icons, no manifest — and retry once on a likely-marketing subpage.
    // Without this we mark such sites as q=65 with 0 logos despite the
    // brand having a perfectly normal pricing/marketing page.
    const noVisualAssets =
      domResult.logoImages.length === 0 &&
      domResult.inlineSvgs.length === 0 &&
      domResult.icons.length === 0;
    const isRootPath = (() => {
      try { return new URL(url).pathname === "/" || new URL(url).pathname === ""; }
      catch { return false; }
    })();
    if (noVisualAssets && isRootPath) {
      const fallbackUrl = url.replace(/\/+$/, "") + "/pricing";
      try {
        await page.goto(fallbackUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        const [retryDom, retryStyles, retryShot] = await Promise.all([
          page.evaluate(extractDom).catch(() => domEmpty),
          page.evaluate(extractStyles).catch(() => stylesEmpty),
          page.screenshot({ fullPage: false, type: "png" })
            .then((b) => (b instanceof Uint8Array ? b : new Uint8Array(b as ArrayBuffer)))
            .catch(() => null),
        ]);
        const retryHasAssets =
          retryDom.logoImages.length > 0 ||
          retryDom.inlineSvgs.length > 0 ||
          retryDom.icons.length > 0;
        if (retryHasAssets) {
          domResult = retryDom;
          stylesResult = retryStyles;
          if (retryShot) screenshot = retryShot;
        }
      } catch { /* fallback non-fatal — keep original empty result */ }
    }

    // ------------------------------------------------------------------
    // Manifest (fetched outside the browser to avoid CORS issues)
    // ------------------------------------------------------------------

    let manifestData: Record<string, any> | null = null;
    if (domResult.manifestUrl) {
      manifestData = await fetchManifest(domResult.manifestUrl, url);

      // Merge manifest icons into the icons array
      if (manifestData?.icons && Array.isArray(manifestData.icons)) {
        for (const icon of manifestData.icons) {
          if (icon.src) {
            domResult.icons.push({
              rel: "manifest-icon",
              href: new URL(icon.src, url).href,
              sizes: icon.sizes,
              type: icon.type,
            });
          }
        }
      }
    }

    // ------------------------------------------------------------------
    // Sanity check — bail loud if extraction produced nothing usable.
    // Without this, the workflow happily continues with empty inputs and
    // marks the job complete with a garbage brand kit. Throwing here lets
    // the workflow retry policy (limit: 2) actually kick in.
    // ------------------------------------------------------------------

    const isEmpty =
      domResult.title === "" &&
      domResult.html === "" &&
      domResult.headings.length === 0 &&
      domResult.bodyText === "" &&
      stylesResult.elementStyles.length === 0;

    if (isEmpty) {
      throw new Error(
        `fetchAndRender: extraction returned no content for ${url} — page.goto likely succeeded but DOM/styles evaluate produced empty results`
      );
    }

    // ------------------------------------------------------------------
    // Assemble output
    // ------------------------------------------------------------------

    return {
      // Meta
      meta: domResult.meta,
      title: domResult.title,
      brandName: domResult.brandName,
      description: domResult.description,

      // Text content
      headings: domResult.headings,
      heroText: domResult.heroText,
      ctaTexts: domResult.ctaTexts,
      navLabels: domResult.navLabels,
      footerText: domResult.footerText,
      bodyText: domResult.bodyText,

      // Computed styles
      elementStyles: stylesResult.elementStyles,
      cssCustomProperties: stylesResult.cssCustomProperties,
      shadows: stylesResult.shadows,
      gradients: stylesResult.gradients,

      // Dark mode detection
      darkModeInfo: domResult.darkModeInfo,

      // Icons & logos
      icons: domResult.icons,
      logoImages: domResult.logoImages,
      inlineSvgs: domResult.inlineSvgs,

      // Assets
      ogImage: domResult.ogImage,
      backgroundImages: stylesResult.backgroundImages,
      stylesheetUrls: domResult.stylesheetUrls,
      manifestUrl: domResult.manifestUrl,
      manifestData,

      // Design assets
      designAssets: domResult.designAssets || [],

      // Icon library
      iconLibrary: domResult.iconLibrary,

      // Screenshot
      screenshot,

      // Raw HTML
      html: domResult.html,
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Browser may already be closed or disconnected
      }
    }
  }
}
