import type { SeoPageData } from "~/components/seo-page-template";

export const colorsPageData: SeoPageData = {
  heroLabel: "Color Extraction",
  heroTitle: "Every color your brand uses,",
  heroTitleMuted: "mapped and organized automatically.",
  heroDescription:
    "ExtractVibe analyzes the full CSS of any website to extract primary, secondary, and semantic colors. It detects light and dark mode palettes, identifies CSS custom properties, and generates export-ready color tokens in any format you need.",
  features: [
    {
      title: "Primary and semantic color detection",
      description:
        "Goes beyond simple color picking. ExtractVibe parses every CSS rule on the page, weighing colors by visual prominence and usage frequency. It distinguishes between primary brand colors, semantic colors used for success states, warnings, and errors, and neutral palette tones used for backgrounds and text. The result is a structured palette that mirrors how the brand actually uses color in production.",
    },
    {
      title: "Light and dark mode awareness",
      description:
        "Automatically detects prefers-color-scheme media queries and CSS custom property overrides to extract separate palettes for light and dark mode. If a site ships both themes, ExtractVibe captures both and maps the relationship between corresponding tokens, so you can reproduce the exact same adaptive behavior in your own design system.",
    },
    {
      title: "CSS variable and token mapping",
      description:
        "Extracts CSS custom properties (--brand-primary, --text-muted, etc.) and maps them to their resolved hex, HSL, or RGB values. This gives you the token layer that most color pickers miss entirely. The output includes variable names, fallback values, and the cascade context where each token is defined, ready to drop into your own stylesheet or design tool.",
    },
    {
      title: "Gradient and opacity analysis",
      description:
        "Captures linear gradients, radial gradients, and conic gradients along with their stop positions and color values. ExtractVibe also tracks opacity and alpha channel usage across the palette, identifying semi-transparent overlays and glass-morphism patterns that define the visual texture of modern interfaces.",
    },
  ],
  steps: [
    {
      number: "01",
      title: "Enter any URL",
      description:
        "Paste a website URL into ExtractVibe. The extraction engine fetches and renders the page in a real Chromium browser, executing JavaScript and loading all stylesheets.",
    },
    {
      number: "02",
      title: "Automated CSS parsing",
      description:
        "Every stylesheet, inline style, and computed style is parsed. Colors are deduplicated, normalized, and ranked by visual weight and frequency of use across the DOM.",
    },
    {
      number: "03",
      title: "Structured palette output",
      description:
        "Receive a structured JSON palette with primary, secondary, semantic, and neutral colors. Export as CSS variables, Tailwind config, Figma tokens, or Style Dictionary format.",
    },
  ],
  codeExample: {
    title: "Extract colors via API",
    language: "javascript",
    code: `const response = await fetch("https://extractvibe.com/api/extract", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "ev_your_api_key_here"
  },
  body: JSON.stringify({ url: "https://stripe.com" })
});

const { jobId } = await response.json();

// Poll for results
const result = await fetch(
  \`https://extractvibe.com/api/extract/\${jobId}/result\`,
  { headers: { "x-api-key": "ev_your_api_key_here" } }
);

const brandKit = await result.json();
console.log(brandKit.colors);
// {
//   primary: "#635BFF",
//   secondary: "#0A2540",
//   semantic: { success: "#30D158", warning: "#FFD60A", error: "#FF453A" },
//   neutrals: ["#F6F9FC", "#E3E8EE", "#697386", "#425466", "#0A2540"],
//   darkMode: { primary: "#7A73FF", background: "#0A2540" }
// }`,
  },
  faq: [
    {
      question: "How many colors does ExtractVibe extract from a single page?",
      answer:
        "ExtractVibe typically identifies 15-40 unique colors per website, depending on the complexity of the design system. These are deduplicated and normalized, then grouped into categories: primary brand colors, semantic colors (success, warning, error, info), neutrals, and accent colors. You get the full palette, not just the top 5.",
    },
    {
      question: "Does it detect CSS custom properties and design tokens?",
      answer:
        "Yes. ExtractVibe parses CSS custom properties (CSS variables) and maps each variable name to its resolved value. This means you get both the token names (like --color-brand-primary) and their actual hex/HSL/RGB values, preserving the semantic structure of the original design system.",
    },
    {
      question: "Can ExtractVibe detect dark mode palettes?",
      answer:
        "Absolutely. ExtractVibe detects prefers-color-scheme media queries and data-theme attribute patterns to extract separate light and dark mode palettes. It maps the relationship between corresponding tokens across themes, so you can see exactly how each color transforms between modes.",
    },
    {
      question: "What output formats are supported for color data?",
      answer:
        "Color data is returned as structured JSON by default, with hex, HSL, and RGB representations for every color. You can also export as CSS custom properties, Tailwind CSS config, Figma design tokens, or Style Dictionary format for integration into any design or development workflow.",
    },
    {
      question: "How does color ranking work?",
      answer:
        "Colors are ranked by a combination of visual prominence (how much screen area they occupy), usage frequency (how many CSS rules reference them), and semantic importance (primary buttons and headings weigh more than border colors). This weighted ranking ensures the most important brand colors surface first.",
    },
  ],
  ctaTitle: "Extract your color palette",
  ctaDescription:
    "Get a complete, structured color palette from any website in seconds. No manual color picking required.",
  relatedPages: [
    {
      title: "Typography Extraction",
      description: "Detect font families, weights, and type scales.",
      href: "/features/typography",
    },
    {
      title: "Gradient Extraction",
      description: "Capture linear, radial, and conic gradients.",
      href: "/features/gradients",
    },
    {
      title: "Design System Extraction",
      description: "Extract a complete design system from any site.",
      href: "/features/design-system",
    },
    {
      title: "For Design Agencies",
      description: "Streamline brand audits with automated extraction.",
      href: "/use-cases/design-agencies",
    },
  ],
};

export const typographyPageData: SeoPageData = {
  heroLabel: "Typography Detection",
  heroTitle: "Every font, weight, and scale,",
  heroTitleMuted: "reverse-engineered from the DOM.",
  heroDescription:
    "ExtractVibe inspects computed styles across the entire DOM to identify font families, weights, sizes, line heights, and letter spacing. It reconstructs the complete type scale and detects fallback stacks, Google Fonts, and self-hosted typefaces.",
  features: [
    {
      title: "Font family and fallback stack detection",
      description:
        "Identifies every font-family declaration in use, from the primary display typeface to the monospace font for code blocks. ExtractVibe resolves the full fallback chain and detects whether fonts are loaded from Google Fonts, Adobe Fonts, a CDN, or self-hosted from the site's own domain. You get the exact CSS font stack needed to reproduce the typography.",
    },
    {
      title: "Type scale reconstruction",
      description:
        "Analyzes all font-size values in use across headings, body text, captions, and UI elements. ExtractVibe detects the underlying scale ratio (major third, perfect fourth, custom) and maps each size to its semantic role. The output is a complete type scale you can drop into a Tailwind config or CSS stylesheet.",
    },
    {
      title: "Weight and style mapping",
      description:
        "Captures every font-weight and font-style combination in use, from thin (100) to black (900), including italic variants. This mapping shows which weights the brand actually uses versus which are merely loaded, helping you optimize your own font loading strategy and match the visual hierarchy precisely.",
    },
    {
      title: "Line height and spacing analysis",
      description:
        "Extracts line-height, letter-spacing, and word-spacing values for each text style. These micro-typography details are what separate a pixel-perfect reproduction from a rough approximation. ExtractVibe captures the relationship between font size and leading, preserving the vertical rhythm of the original design.",
    },
  ],
  steps: [
    {
      number: "01",
      title: "Render in headless browser",
      description:
        "The target page is rendered in a real Chromium instance so that web fonts load, JavaScript-injected styles execute, and the final computed typography is visible to the extraction engine.",
    },
    {
      number: "02",
      title: "DOM-wide style inspection",
      description:
        "Every text node in the DOM is inspected for its computed font-family, font-size, font-weight, line-height, and letter-spacing. Values are aggregated and deduplicated across all elements.",
    },
    {
      number: "03",
      title: "Structured typography output",
      description:
        "Receive a structured type system with font families, the full scale, weight mappings, and spacing values. Export as CSS, Tailwind theme, or JSON tokens.",
    },
  ],
  codeExample: {
    title: "Typography extraction output",
    language: "json",
    code: `{
  "typography": {
    "families": {
      "display": "Inter",
      "body": "Inter",
      "mono": "JetBrains Mono"
    },
    "scale": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem"
    },
    "weights": [400, 500, 600, 700],
    "lineHeights": {
      "tight": 1.1,
      "normal": 1.5,
      "relaxed": 1.625
    },
    "source": "Google Fonts",
    "fallbackStack": "Inter, ui-sans-serif, system-ui, sans-serif"
  }
}`,
  },
  faq: [
    {
      question: "Can ExtractVibe detect Google Fonts and Adobe Fonts?",
      answer:
        "Yes. ExtractVibe inspects stylesheet link tags, @import rules, and @font-face declarations to determine the font source. It identifies Google Fonts, Adobe Fonts (Typekit), fonts loaded from CDNs like fonts.bunny.net, and self-hosted fonts served from the site's own domain.",
    },
    {
      question: "Does it detect variable fonts and optical sizing?",
      answer:
        "ExtractVibe detects variable font usage by inspecting font-variation-settings and the weight range in @font-face descriptors. If a site uses optical sizing (opsz axis), weight ranges, or other variable font axes, those parameters are captured and included in the output.",
    },
    {
      question: "How accurate is the type scale detection?",
      answer:
        "Extremely accurate. Because ExtractVibe reads computed styles from a fully rendered page rather than parsing static CSS, it captures the actual font sizes in use after all responsive breakpoints, clamp() functions, and JavaScript manipulations have been applied. The scale is derived from real rendered values, not CSS source.",
    },
    {
      question: "What if a site uses system fonts only?",
      answer:
        "ExtractVibe handles system font stacks gracefully. It detects -apple-system, BlinkMacSystemFont, Segoe UI, and other platform-specific font declarations, reports them as the primary typeface, and still extracts the full type scale, weight usage, and spacing values that define the typography system.",
    },
    {
      question: "Can I export the type scale as a Tailwind config?",
      answer:
        "Yes. The extracted type scale, font families, and weight mappings can be exported as a ready-to-use Tailwind CSS theme extension. Copy the output directly into your tailwind.config.ts file to match the target brand's typography system with zero manual measurement.",
    },
  ],
  ctaTitle: "Map any site's typography",
  ctaDescription:
    "Get the complete type system from any website, including families, scale, weights, and spacing.",
  relatedPages: [
    {
      title: "Color Extraction",
      description: "Extract primary, semantic, and dark mode color palettes.",
      href: "/features/colors",
    },
    {
      title: "Design System Extraction",
      description: "Extract a complete design system from any site.",
      href: "/features/design-system",
    },
    {
      title: "For Developers",
      description: "Build brand-matched UIs with extracted tokens.",
      href: "/use-cases/developers",
    },
    {
      title: "Design Tokens",
      description: "Generate design tokens from any website.",
      href: "/use-cases/design-tokens",
    },
  ],
};

export const voicePageData: SeoPageData = {
  heroLabel: "Brand Voice Analysis",
  heroTitle: "Tone, style, and personality,",
  heroTitleMuted: "decoded from real copy.",
  heroDescription:
    "ExtractVibe uses AI language models to analyze the written content on any website and extract brand voice characteristics. It identifies tone spectrum, copywriting patterns, sentence structure, vocabulary level, and the personality traits that define how the brand communicates.",
  features: [
    {
      title: "Tone spectrum analysis",
      description:
        "Maps the brand's voice along multiple axes: formal vs. casual, technical vs. accessible, enthusiastic vs. reserved, playful vs. serious. Rather than a single label, ExtractVibe generates a multi-dimensional tone profile that captures the nuance of how the brand communicates. A developer tools company might be technically precise yet casual in tone, and ExtractVibe captures that combination.",
    },
    {
      title: "Copywriting pattern detection",
      description:
        "Identifies recurring copywriting patterns like headline formulas, CTA phrasing, value proposition structures, and feature description formats. ExtractVibe detects whether a brand leads with benefits or features, uses questions or statements, and favors short punchy copy or long-form explanations. These patterns become actionable guidelines for reproducing the voice.",
    },
    {
      title: "Vocabulary and reading level",
      description:
        "Analyzes word choice complexity, jargon usage, and reading grade level. ExtractVibe identifies whether the brand uses technical terminology, industry-specific vocabulary, or plain language. It measures average sentence length, syllable complexity, and the ratio of common to uncommon words, giving you a precise vocabulary profile.",
    },
    {
      title: "Personality trait inference",
      description:
        "Synthesizes voice analysis into a set of brand personality traits using established brand personality frameworks. The output includes traits like innovative, trustworthy, bold, approachable, or authoritative, each with a confidence score. These traits serve as guardrails for content creation and brand consistency checks.",
    },
  ],
  steps: [
    {
      number: "01",
      title: "Content extraction",
      description:
        "ExtractVibe collects all visible text content from the page, including headlines, body copy, CTAs, navigation labels, and microcopy. Content is segmented by semantic role.",
    },
    {
      number: "02",
      title: "AI-powered analysis",
      description:
        "The extracted text is analyzed by language models that evaluate tone, style, vocabulary, and communication patterns. Multiple passes ensure accuracy across different content types.",
    },
    {
      number: "03",
      title: "Voice profile generation",
      description:
        "Results are synthesized into a structured voice profile with tone spectrum scores, personality traits, copywriting patterns, and writing guidelines that can be used by content teams.",
    },
  ],
  codeExample: {
    title: "Voice analysis output",
    language: "json",
    code: `{
  "voice": {
    "tone": {
      "formality": 0.35,
      "technicality": 0.72,
      "enthusiasm": 0.58,
      "warmth": 0.45
    },
    "personality": [
      { "trait": "innovative", "score": 0.89 },
      { "trait": "precise", "score": 0.84 },
      { "trait": "confident", "score": 0.78 },
      { "trait": "approachable", "score": 0.62 }
    ],
    "patterns": {
      "headlineStyle": "benefit-led, concise",
      "ctaStyle": "action verb + outcome",
      "sentenceLength": "short to medium",
      "jargonLevel": "moderate — technical terms explained inline"
    },
    "readingLevel": "grade 9-10",
    "samplePhrases": [
      "Ship faster with confidence",
      "Built for teams that move quickly"
    ]
  }
}`,
  },
  faq: [
    {
      question: "How does ExtractVibe analyze brand voice?",
      answer:
        "ExtractVibe extracts all visible text content from the target website, segments it by type (headlines, body, CTAs, microcopy), and sends it to AI language models for multi-dimensional analysis. The models evaluate tone, vocabulary, sentence structure, and rhetorical patterns to generate a comprehensive voice profile.",
    },
    {
      question: "What AI models power the voice analysis?",
      answer:
        "Voice analysis uses a combination of Cloudflare Workers AI for initial text processing and OpenRouter-hosted models (like Gemini Flash) for deep tone and personality analysis. This two-stage approach balances speed with analytical depth, ensuring high-quality voice profiles without excessive latency.",
    },
    {
      question: "Can I use the voice profile to generate content?",
      answer:
        "Yes. The voice profile output is designed to be used as a system prompt or style guide for AI content generation. You can feed the tone spectrum, personality traits, and copywriting patterns into any LLM to generate content that matches the target brand's voice. Many agencies use ExtractVibe profiles as the foundation for brand-consistent AI copy.",
    },
    {
      question: "How accurate is the voice analysis for multilingual sites?",
      answer:
        "ExtractVibe currently provides the best results for English-language content. For multilingual sites, it detects the primary language of each page and performs analysis on the dominant language. Support for direct analysis of additional languages including Spanish, French, German, and Japanese is on the roadmap.",
    },
    {
      question: "Does voice analysis work on single-page sites?",
      answer:
        "Yes, though the accuracy improves with more content. A single page typically provides enough copy for a solid tone and vocabulary analysis. For the most comprehensive voice profile, ExtractVibe can be configured to crawl multiple pages, giving the AI models a larger sample of the brand's communication style.",
    },
  ],
  ctaTitle: "Decode any brand's voice",
  ctaDescription:
    "Understand exactly how a brand communicates, from tone and personality to copywriting patterns.",
  relatedPages: [
    {
      title: "Design System Extraction",
      description: "Combine voice with visual identity for the full picture.",
      href: "/features/design-system",
    },
    {
      title: "Color Extraction",
      description: "Extract the visual palette alongside the verbal identity.",
      href: "/features/colors",
    },
    {
      title: "For Design Agencies",
      description: "Deliver voice guidelines as part of brand audits.",
      href: "/use-cases/design-agencies",
    },
    {
      title: "Competitive Analysis",
      description: "Compare voice profiles across competitor brands.",
      href: "/use-cases/competitive-analysis",
    },
  ],
};

export const buttonsPageData: SeoPageData = {
  heroLabel: "Button Style Extraction",
  heroTitle: "Every button variant,",
  heroTitleMuted: "captured from the live interface.",
  heroDescription:
    "ExtractVibe identifies and extracts all button styles from any website, including primary, secondary, outline, ghost, and destructive variants. It captures border radius, padding, font properties, hover states, and transition timing to give you a complete button system.",
  features: [
    {
      title: "Multi-variant detection",
      description:
        "Automatically identifies distinct button variants by analyzing visual differences in background color, border style, text color, and sizing. ExtractVibe distinguishes between primary CTAs, secondary actions, outline/ghost buttons, and destructive or danger-state buttons. Each variant is captured with its full set of CSS properties, so you can reproduce the exact hierarchy of button importance used in the original design.",
    },
    {
      title: "Border radius and shape analysis",
      description:
        "Captures the exact border-radius values used across button variants, whether they use pixel values, rem units, percentage-based rounding, or fully rounded pill shapes. ExtractVibe also detects asymmetric border radius (different values per corner) and maps these shapes to the overall design language of the site, revealing whether the brand favors sharp, rounded, or fully circular interactive elements.",
    },
    {
      title: "Padding, sizing, and responsive behavior",
      description:
        "Extracts horizontal and vertical padding, min-width, min-height, and any responsive size changes across breakpoints. This ensures your button reproduction feels right at every viewport width. ExtractVibe captures the relationship between button size variants (sm, md, lg) if multiple sizes exist on the page, giving you a complete size scale.",
    },
    {
      title: "Hover, focus, and transition states",
      description:
        "Identifies hover and focus state changes including background color shifts, box-shadow additions, transform scales, and opacity changes. ExtractVibe captures transition timing functions and durations, so the interactive feel of the buttons matches the original. This micro-interaction data is often the difference between a faithful reproduction and a flat imitation.",
    },
  ],
  steps: [
    {
      number: "01",
      title: "Identify interactive elements",
      description:
        "ExtractVibe scans the DOM for all button and anchor elements styled as buttons, using both semantic HTML tags and ARIA roles to ensure complete coverage.",
    },
    {
      number: "02",
      title: "Compute style snapshots",
      description:
        "Each button's computed styles are captured in its default, hover, focus, and active states. Styles are grouped by visual similarity to identify distinct variants.",
    },
    {
      number: "03",
      title: "Export button tokens",
      description:
        "Receive a structured set of button tokens with all CSS properties per variant, ready to implement in your component library or design system.",
    },
  ],
  codeExample: {
    title: "Button extraction output",
    language: "json",
    code: `{
  "buttons": {
    "primary": {
      "background": "#635BFF",
      "color": "#FFFFFF",
      "borderRadius": "9999px",
      "padding": "12px 24px",
      "fontSize": "14px",
      "fontWeight": 600,
      "transition": "all 150ms ease",
      "hover": {
        "background": "#7A73FF",
        "transform": "scale(1.02)"
      }
    },
    "outline": {
      "background": "transparent",
      "color": "#425466",
      "border": "1px solid #E3E8EE",
      "borderRadius": "9999px",
      "padding": "12px 24px",
      "hover": {
        "background": "#F6F9FC"
      }
    },
    "ghost": {
      "background": "transparent",
      "color": "#425466",
      "borderRadius": "8px",
      "padding": "8px 16px",
      "hover": {
        "background": "#F6F9FC"
      }
    }
  }
}`,
  },
  faq: [
    {
      question: "How does ExtractVibe detect different button variants?",
      answer:
        "ExtractVibe clusters buttons by their visual properties, including background color, border style, text color, and size. Buttons that share the same visual treatment are grouped into a single variant. The system automatically labels variants as primary, secondary, outline, ghost, or destructive based on their visual characteristics and DOM context.",
    },
    {
      question: "Does it capture hover and focus states?",
      answer:
        "Yes. ExtractVibe programmatically triggers hover and focus states on each button element in the headless browser, capturing the computed style changes. This includes color transitions, box-shadow additions, transform effects, and opacity changes, along with the exact transition-duration and timing-function values.",
    },
    {
      question: "Can I use extracted button styles in my React component library?",
      answer:
        "Absolutely. The button token output is structured to map directly to component variants in libraries like shadcn/ui, Radix, or custom component systems. Each variant includes all the CSS properties you need to create matching button components with proper hover, focus, and active states.",
    },
    {
      question: "What about icon buttons and button groups?",
      answer:
        "ExtractVibe detects icon-only buttons (square aspect ratio with centered SVG/icon content) and captures their specific sizing and padding. It also identifies button groups and segmented controls, extracting the shared border radius and the special border treatment between adjacent buttons.",
    },
    {
      question: "Are disabled button states captured?",
      answer:
        "Yes. When buttons with disabled attributes or aria-disabled are present on the page, ExtractVibe captures the disabled state styling including reduced opacity, color changes, and cursor modifications. This ensures your button component handles all interactive states faithfully.",
    },
  ],
  ctaTitle: "Extract button systems",
  ctaDescription:
    "Get every button variant with full styling details, ready to implement in your own component library.",
  relatedPages: [
    {
      title: "Color Extraction",
      description: "Understand the color palette behind button styles.",
      href: "/features/colors",
    },
    {
      title: "Design System Extraction",
      description: "Extract buttons as part of a complete design system.",
      href: "/features/design-system",
    },
    {
      title: "Typography Extraction",
      description: "Capture the font properties used in button labels.",
      href: "/features/typography",
    },
    {
      title: "For Developers",
      description: "Build component libraries from extracted styles.",
      href: "/use-cases/developers",
    },
  ],
};

export const logosPageData: SeoPageData = {
  heroLabel: "Logo Detection",
  heroTitle: "Logos in every format,",
  heroTitleMuted: "extracted and organized.",
  heroDescription:
    "ExtractVibe locates and extracts all logo assets from a website, including SVG source code, PNG/WebP raster images, favicons, Apple touch icons, and Open Graph images. It identifies the primary logo, wordmark variants, and icon-only versions used across the site.",
  features: [
    {
      title: "Multi-format logo extraction",
      description:
        "Finds logos embedded as inline SVG, as image tags (PNG, WebP, AVIF), as CSS background images, and as link rel='icon' favicons. ExtractVibe prioritizes SVG sources when available because they scale without quality loss. All discovered logo assets are downloaded, organized by type, and stored in R2 for permanent access via your brand kit.",
    },
    {
      title: "Favicon and app icon collection",
      description:
        "Extracts the complete set of favicons and app icons: favicon.ico, apple-touch-icon, maskable icons from the web app manifest, and SVG favicons. These are often overlooked but essential for brand identity documentation. ExtractVibe captures each size variant and its intended use context, from browser tabs to mobile home screens.",
    },
    {
      title: "Logo placement and usage context",
      description:
        "Records where each logo appears on the page: navigation header, footer, loading screens, or OG meta tags. This contextual information reveals how the brand deploys different logo variants across different contexts, which is valuable for brand guidelines that specify when to use the full wordmark versus the icon-only version.",
    },
    {
      title: "Color and background analysis",
      description:
        "For each extracted logo, ExtractVibe analyzes the surrounding background color and the logo's own color composition. This helps determine whether the logo is designed for light backgrounds, dark backgrounds, or both. For SVG logos, it extracts fill and stroke colors to map them to the brand's color palette.",
    },
  ],
  steps: [
    {
      number: "01",
      title: "Scan all logo sources",
      description:
        "ExtractVibe checks the page header for link rel='icon' tags, scans the nav and footer for image elements, inspects the web app manifest, and looks for OG image meta tags.",
    },
    {
      number: "02",
      title: "Download and classify",
      description:
        "Each discovered logo asset is downloaded, classified by format (SVG, PNG, ICO) and type (primary, favicon, touch icon), and stored in cloud storage for reliable access.",
    },
    {
      number: "03",
      title: "Organized logo kit",
      description:
        "Receive a structured collection of all logo assets with metadata including dimensions, format, file size, background context, and the URL where each logo was found.",
    },
  ],
  codeExample: {
    title: "Logo detection output",
    language: "json",
    code: `{
  "logos": {
    "primary": {
      "type": "svg",
      "url": "https://r2.extractvibe.com/abc123/logo-primary.svg",
      "width": 120,
      "height": 32,
      "context": "nav header",
      "colors": ["#635BFF", "#0A2540"]
    },
    "favicon": {
      "type": "svg",
      "url": "https://r2.extractvibe.com/abc123/favicon.svg",
      "sizes": ["32x32", "16x16"]
    },
    "appleTouchIcon": {
      "type": "png",
      "url": "https://r2.extractvibe.com/abc123/apple-touch-icon.png",
      "width": 180,
      "height": 180
    },
    "ogImage": {
      "type": "png",
      "url": "https://r2.extractvibe.com/abc123/og-image.png",
      "width": 1200,
      "height": 630
    }
  }
}`,
  },
  faq: [
    {
      question: "Does ExtractVibe extract SVG source code?",
      answer:
        "Yes. When a logo is embedded as inline SVG or linked as an .svg file, ExtractVibe captures the full SVG source code. This gives you a scalable, editable version of the logo that you can modify in any vector editor. SVG sources are prioritized over raster formats because they offer the highest quality and flexibility.",
    },
    {
      question: "What about logos in CSS background images?",
      answer:
        "ExtractVibe inspects CSS background-image properties on elements that are likely to contain logos (header, nav, footer regions). If a logo is set via CSS rather than an HTML image tag, it is still detected and extracted. This covers a common pattern where logos are applied through CSS for responsive image handling.",
    },
    {
      question: "How does ExtractVibe determine which image is the primary logo?",
      answer:
        "The primary logo is identified by analyzing placement (typically in the main navigation or header), link destination (usually links to the homepage), and semantic context (alt text, aria labels). Images in the site's main navigation that link to the root URL are given the highest confidence as the primary logo.",
    },
    {
      question: "Are the extracted logos stored permanently?",
      answer:
        "Yes. All extracted logo assets are uploaded to Cloudflare R2 cloud storage and associated with your brand kit. They remain accessible via permanent URLs for as long as your account is active. This means you can reference extracted logos directly in your design tools or documentation without worrying about the original site changing.",
    },
    {
      question: "Can ExtractVibe extract logos from single-page applications?",
      answer:
        "Yes. Because ExtractVibe renders pages in a full Chromium browser with JavaScript execution enabled, it can extract logos from SPAs built with React, Vue, Angular, or any other framework. The headless browser waits for the page to fully render before scanning for logo elements.",
    },
  ],
  ctaTitle: "Extract any brand's logos",
  ctaDescription:
    "Get every logo variant, favicon, and app icon from any website, organized and ready to use.",
  relatedPages: [
    {
      title: "Color Extraction",
      description: "Map logo colors to the brand's full palette.",
      href: "/features/colors",
    },
    {
      title: "Design System Extraction",
      description: "Extract logos as part of the complete design system.",
      href: "/features/design-system",
    },
    {
      title: "For Design Agencies",
      description: "Collect client logos automatically for brand audits.",
      href: "/use-cases/design-agencies",
    },
    {
      title: "Brand Monitoring",
      description: "Track logo changes across brand properties.",
      href: "/use-cases/brand-monitoring",
    },
  ],
};

export const gradientsPageData: SeoPageData = {
  heroLabel: "Gradient & Shadow Extraction",
  heroTitle: "Gradients, shadows, and depth,",
  heroTitleMuted: "captured from the visual layer.",
  heroDescription:
    "ExtractVibe extracts linear gradients, radial gradients, conic gradients, box shadows, and text shadows from any website. It captures stop positions, color values, blur radii, and spread distances to reproduce the exact depth and texture of the original design.",
  features: [
    {
      title: "Linear and radial gradient extraction",
      description:
        "Captures complete gradient definitions including direction and angle for linear gradients, shape and position for radial gradients, and all color stop positions. Each gradient is extracted with its full CSS syntax and also decomposed into structured data with individual stop colors and percentages, making it easy to recreate in CSS, Figma, or any design tool.",
    },
    {
      title: "Box shadow and elevation system",
      description:
        "Extracts every box-shadow declaration on the page, including multi-layered shadows, inset shadows, and the color/blur/spread values of each layer. ExtractVibe groups shadows by visual similarity to reveal the site's elevation system, from subtle card shadows to prominent modal overlays. This gives you a complete depth scale to implement in your own design system.",
    },
    {
      title: "Glass morphism and blur detection",
      description:
        "Identifies backdrop-filter and filter blur effects used for frosted glass, translucent overlays, and depth-of-field effects. ExtractVibe captures blur radius, saturation adjustments, and background opacity values that create modern glass morphism aesthetics. These effects are increasingly common in contemporary UI design and are often the hardest to reverse-engineer manually.",
    },
    {
      title: "Text shadow and glow effects",
      description:
        "Captures text-shadow properties used for readability over images, decorative glow effects, and embossed text styles. ExtractVibe distinguishes between functional shadows (improving contrast against varied backgrounds) and decorative shadows (adding visual flair), so you understand both the aesthetic and accessibility purpose of each effect.",
    },
  ],
  steps: [
    {
      number: "01",
      title: "Full style audit",
      description:
        "ExtractVibe scans every element's computed styles for gradient backgrounds, box-shadows, text-shadows, and filter/backdrop-filter properties across the entire page.",
    },
    {
      number: "02",
      title: "Decompose and structure",
      description:
        "Complex CSS values are parsed into structured data: gradient stops become arrays, multi-layer shadows become ordered lists, and blur values are normalized into consistent units.",
    },
    {
      number: "03",
      title: "Organized depth system",
      description:
        "Receive a complete elevation and texture system with all gradients, shadows, and effects organized by type and visual weight, ready for implementation.",
    },
  ],
  codeExample: {
    title: "Gradient and shadow output",
    language: "json",
    code: `{
  "gradients": [
    {
      "type": "linear",
      "angle": "135deg",
      "stops": [
        { "color": "#635BFF", "position": "0%" },
        { "color": "#7A73FF", "position": "50%" },
        { "color": "#A899FF", "position": "100%" }
      ],
      "css": "linear-gradient(135deg, #635BFF 0%, #7A73FF 50%, #A899FF 100%)"
    }
  ],
  "shadows": {
    "sm": "0 1px 2px rgba(0, 0, 0, 0.05)",
    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
    "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
  },
  "effects": {
    "glassMorphism": {
      "backdropBlur": "12px",
      "backgroundOpacity": 0.8,
      "borderOpacity": 0.2
    }
  }
}`,
  },
  faq: [
    {
      question: "Does ExtractVibe capture multi-stop gradients?",
      answer:
        "Yes. ExtractVibe captures gradients with any number of color stops, including complex multi-stop gradients with explicit position percentages. Each stop is extracted with its exact color value (hex, RGB, or HSL) and position, preserving the precise color distribution of the original gradient.",
    },
    {
      question: "How are multi-layer box shadows handled?",
      answer:
        "Many modern designs use multiple box-shadow layers on a single element for realistic depth effects. ExtractVibe captures each shadow layer separately with its offset, blur, spread, and color values, then groups them as a single composite shadow token. This preserves the layered effect when you implement the shadow in your own design system.",
    },
    {
      question: "Can ExtractVibe detect backdrop-filter effects?",
      answer:
        "Yes. Backdrop-filter properties including blur, brightness, contrast, saturation, and grayscale are all detected and extracted. These effects are commonly used for frosted glass navigation bars, modal overlays, and floating card designs. ExtractVibe captures the complete filter chain along with the element's background opacity.",
    },
    {
      question: "What about CSS conic gradients?",
      answer:
        "Conic gradients are fully supported. ExtractVibe captures the from-angle, color stops, and position parameters. Conic gradients are less common than linear or radial gradients but appear in color wheels, pie-chart-like decorations, and some modern loading indicators.",
    },
    {
      question: "Are CSS shadows different from Figma drop shadows?",
      answer:
        "CSS box-shadow and Figma drop shadow use slightly different parameters, but ExtractVibe provides both the raw CSS values and decomposed numeric values (offset-x, offset-y, blur, spread, color) that map directly to Figma's shadow properties. This makes it straightforward to recreate the exact shadow in either environment.",
    },
  ],
  ctaTitle: "Capture depth and texture",
  ctaDescription:
    "Extract every gradient, shadow, and visual effect from any website to reproduce its depth system.",
  relatedPages: [
    {
      title: "Color Extraction",
      description: "Get the color values that feed into gradients.",
      href: "/features/colors",
    },
    {
      title: "Button Styles",
      description: "See how shadows and gradients apply to buttons.",
      href: "/features/buttons",
    },
    {
      title: "Design System Extraction",
      description: "Extract gradients as part of the complete system.",
      href: "/features/design-system",
    },
    {
      title: "Design Tokens",
      description: "Generate token files with gradient and shadow definitions.",
      href: "/use-cases/design-tokens",
    },
  ],
};

export const designSystemPageData: SeoPageData = {
  heroLabel: "Design System Extraction",
  heroTitle: "The complete design system,",
  heroTitleMuted: "extracted from a single URL.",
  heroDescription:
    "ExtractVibe combines color extraction, typography detection, component analysis, voice profiling, and vibe synthesis into a single, comprehensive design system extraction. The result is a structured, export-ready brand kit that covers every dimension of brand identity, from visual tokens to verbal guidelines.",
  features: [
    {
      title: "Unified visual and verbal identity",
      description:
        "Most tools extract either visual tokens or written content. ExtractVibe does both in a single pass, combining color palettes, typography scales, component styles, gradients, and shadows with brand voice analysis, personality traits, and copywriting patterns. The output is a holistic brand profile that connects how a brand looks with how it sounds, giving design teams a complete reference for brand-consistent work.",
    },
    {
      title: "Export-ready token formats",
      description:
        "The extracted design system can be exported as CSS custom properties, Tailwind CSS theme configuration, Figma design tokens (compatible with the Tokens Studio plugin), Style Dictionary format for multi-platform design systems, or raw JSON for custom integrations. Each export format is production-ready, with proper naming conventions and organized token categories.",
    },
    {
      title: "Brand scoring and completeness analysis",
      description:
        "ExtractVibe assigns a brand completeness score based on the depth and consistency of the extracted identity. It evaluates color palette diversity, typography hierarchy clarity, component consistency, voice coherence, and overall design system maturity. The score highlights strengths and identifies gaps where the brand's digital presence could be strengthened.",
    },
    {
      title: "Vibe synthesis and brand rules",
      description:
        "The synthesis step combines all extracted signals into a coherent brand profile with inferred guidelines, do's and don'ts, and a set of brand rules. These rules are generated by AI analysis that identifies patterns across the visual and verbal identity, such as 'always use sentence case in headings' or 'primary CTA buttons use the brand purple, never red.' This turns raw data into actionable brand guidelines.",
    },
  ],
  steps: [
    {
      number: "01",
      title: "Enter a URL",
      description:
        "Paste any website URL. ExtractVibe renders the page in a headless Chromium browser, loading all assets, executing JavaScript, and capturing the fully rendered state.",
    },
    {
      number: "02",
      title: "Multi-step extraction pipeline",
      description:
        "A durable Workflow orchestrates five extraction stages: fetch and render, parse visual assets, analyze brand voice, synthesize the vibe, and score the result. Each stage runs independently with automatic retries.",
    },
    {
      number: "03",
      title: "Complete brand kit",
      description:
        "Receive a comprehensive brand kit with colors, typography, logos, buttons, gradients, voice profile, personality traits, brand rules, and a completeness score. Export in any format.",
    },
  ],
  codeExample: {
    title: "Full design system extraction",
    language: "bash",
    code: `# Start extraction
curl -X POST https://extractvibe.com/api/extract \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ev_your_api_key_here" \\
  -d '{"url": "https://linear.app"}'

# Response: { "jobId": "abc-123", "domain": "linear.app" }

# Poll for completion
curl https://extractvibe.com/api/extract/abc-123 \\
  -H "x-api-key: ev_your_api_key_here"

# Get the full brand kit
curl https://extractvibe.com/api/extract/abc-123/result \\
  -H "x-api-key: ev_your_api_key_here"

# Returns: complete design system with colors, typography,
# logos, buttons, gradients, voice, personality, and rules`,
  },
  faq: [
    {
      question: "How long does a full design system extraction take?",
      answer:
        "A typical extraction completes in 15-25 seconds. The pipeline runs five stages in sequence: page rendering (~3s), visual asset parsing (~4s), voice analysis (~5s), vibe synthesis (~4s), and scoring (~2s). Progress is streamed via WebSocket in real time so you can watch each stage complete.",
    },
    {
      question: "What makes this different from a browser extension color picker?",
      answer:
        "Browser extension color pickers sample individual pixels or CSS values one at a time. ExtractVibe performs a comprehensive analysis of the entire page, extracting 50+ fields across colors, typography, components, voice, and personality in a single automated pass. It also synthesizes extracted data into actionable brand rules and guidelines, which no color picker can do.",
    },
    {
      question: "Can I extract design systems from password-protected sites?",
      answer:
        "Currently, ExtractVibe extracts from publicly accessible pages only. The headless browser renders the page as an anonymous visitor would see it. Support for authenticated extraction (via cookies or login credentials) is on the roadmap for a future release.",
    },
    {
      question: "Is the extraction API suitable for batch processing?",
      answer:
        "Yes. The API is designed for programmatic use. You can start multiple extractions concurrently, each returning a unique jobId. Poll each job independently or connect via WebSocket for real-time progress. Rate limits are generous for paid plans, supporting batch processing of hundreds of domains.",
    },
    {
      question: "How does the brand scoring work?",
      answer:
        "Brand scoring evaluates five dimensions: palette diversity and contrast ratio compliance, typography hierarchy clarity, component consistency across button and input styles, voice coherence across different page sections, and overall design system maturity. Each dimension is scored 0-100 and combined into a weighted overall score that reflects how well-defined and consistent the brand's digital identity is.",
    },
  ],
  ctaTitle: "Extract the full system",
  ctaDescription:
    "Get a complete design system from any website: colors, typography, components, voice, personality, and actionable brand rules.",
  relatedPages: [
    {
      title: "Color Extraction",
      description: "Deep dive into color palette extraction.",
      href: "/features/colors",
    },
    {
      title: "Typography Detection",
      description: "Detailed typography and type scale analysis.",
      href: "/features/typography",
    },
    {
      title: "Voice Analysis",
      description: "AI-powered brand voice and personality profiling.",
      href: "/features/voice",
    },
    {
      title: "Design Tokens",
      description: "Generate production-ready design tokens.",
      href: "/use-cases/design-tokens",
    },
  ],
};
