import puppeteer from "@cloudflare/puppeteer";
import type { Env } from "../../env";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

  // Icons & logos
  icons: Array<{ rel: string; href: string; sizes?: string; type?: string }>;
  logoImages: Array<{
    src: string;
    alt?: string;
    context: string;
    width?: number;
    height?: number;
  }>;
  inlineSvgs: Array<{
    svg: string;
    context: string;
    width?: number;
    height?: number;
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
  }>;
  inlineSvgs: Array<{
    svg: string;
    context: string;
    width?: number;
    height?: number;
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
  }> = [];
  const seenLogoSrcs = new Set<string>();

  const logoSelectors = [
    "header img",
    "nav img",
    "header a:first-child img",
    "[class*='logo'] img",
    "[class*='Logo'] img",
    "[id*='logo'] img",
    "[id*='Logo'] img",
    "a[href='/'] img",
    "a[href='./'] img",
  ];

  for (const sel of logoSelectors) {
    document.querySelectorAll(sel).forEach((img) => {
      const src = (img as HTMLImageElement).src || img.getAttribute("src");
      if (!src || seenLogoSrcs.has(src)) return;
      seenLogoSrcs.add(src);

      logoImages.push({
        src,
        alt: attr(img, "alt"),
        context: closestContext(img),
        width: (img as HTMLImageElement).naturalWidth || undefined,
        height: (img as HTMLImageElement).naturalHeight || undefined,
      });
    });
  }

  // ---- Inline SVGs in header / nav ----

  const inlineSvgs: Array<{
    svg: string;
    context: string;
    width?: number;
    height?: number;
  }> = [];

  const svgContainerSelectors = [
    "header svg",
    "nav svg",
    "[class*='logo'] svg",
    "[class*='Logo'] svg",
    "[id*='logo'] svg",
    "[id*='Logo'] svg",
  ];
  const seenSvg = new Set<string>();

  for (const sel of svgContainerSelectors) {
    document.querySelectorAll(sel).forEach((svg) => {
      const html = (svg as SVGElement).outerHTML;
      // Skip very large or duplicate SVGs
      if (!html || html.length > 50_000 || seenSvg.has(html)) return;
      seenSvg.add(html);

      const rect = svg.getBoundingClientRect();
      inlineSvgs.push({
        svg: html,
        context: closestContext(svg),
        width: rect.width || undefined,
        height: rect.height || undefined,
      });
    });
  }

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

  // ---- Raw HTML ----

  const html = document.documentElement.outerHTML;

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

  // Defaults — returned on complete failure
  const defaults: FetchRenderOutput = {
    meta: {},
    title: "",
    brandName: null,
    description: null,
    headings: [],
    heroText: [],
    ctaTexts: [],
    navLabels: [],
    footerText: "",
    bodyText: "",
    elementStyles: [],
    cssCustomProperties: {},
    shadows: [],
    gradients: [],
    icons: [],
    logoImages: [],
    inlineSvgs: [],
    ogImage: null,
    backgroundImages: [],
    stylesheetUrls: [],
    manifestUrl: null,
    manifestData: null,
    designAssets: [],
    screenshot: null,
    html: "",
  };

  try {
    browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();

    // Desktop viewport
    await page.setViewport({ width: 1440, height: 900 });

    // Navigate — networkidle2 allows 2 in-flight connections (analytics, etc.)
    // and settles significantly faster than networkidle0 with minimal quality loss
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30_000,
    });

    // ------------------------------------------------------------------
    // Extract DOM content (single evaluate for all DOM-based data)
    // ------------------------------------------------------------------

    let domResult: DomExtractionResult;
    try {
      domResult = await page.evaluate(extractDom);
    } catch (err) {
      console.error("DOM extraction failed:", err);
      domResult = {
        meta: {},
        title: "",
        brandName: null,
        description: null,
        headings: [],
        heroText: [],
        ctaTexts: [],
        navLabels: [],
        footerText: "",
        bodyText: "",
        icons: [],
        logoImages: [],
        inlineSvgs: [],
        ogImage: null,
        stylesheetUrls: [],
        manifestUrl: null,
        designAssets: [],
        html: "",
      };
    }

    // ------------------------------------------------------------------
    // Extract computed styles (separate evaluate — style computation is
    // independent and isolating it limits blast radius on failure)
    // ------------------------------------------------------------------

    let stylesResult: StylesExtractionResult;
    try {
      stylesResult = await page.evaluate(extractStyles);
    } catch (err) {
      console.error("Styles extraction failed:", err);
      stylesResult = {
        elementStyles: [],
        cssCustomProperties: {},
        backgroundImages: [],
        shadows: [],
        gradients: [],
      };
    }

    // ------------------------------------------------------------------
    // Screenshot
    // ------------------------------------------------------------------

    let screenshot: Uint8Array | null = null;
    try {
      const buf = await page.screenshot({ fullPage: true, type: "png" });
      // The screenshot returns a Buffer (Node-compat) or ArrayBuffer depending
      // on the runtime. Normalise to Uint8Array for a consistent return type.
      if (buf instanceof Uint8Array) {
        screenshot = buf;
      } else {
        screenshot = new Uint8Array(buf as ArrayBuffer);
      }
    } catch (err) {
      console.error("Screenshot failed:", err);
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

      // Screenshot
      screenshot,

      // Raw HTML
      html: domResult.html,
    };
  } catch (err) {
    console.error("fetchAndRender failed:", err);
    return defaults;
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
