import type { SeoPageData } from "~/components/seo-page-template";

export const designAgenciesData: SeoPageData = {
  heroLabel: "Use Case -- Design Agencies",
  heroTitle: "Brand intelligence",
  heroTitleMuted: "that saves agencies hours per client.",
  heroDescription:
    "Design agencies use ExtractVibe to extract complete brand kits from client websites in seconds, eliminating hours of manual brand auditing. Start every project with a comprehensive brand foundation -- colors, typography, voice, logos, and design tokens -- without opening a single DevTools panel.",
  features: [
    {
      title: "Client onboarding in 30 seconds",
      description:
        "Extract a complete brand kit from a client's existing website before the first kickoff meeting. Arrive prepared with their exact color palette, typography stack, button system, and voice profile. This level of preparation impresses clients and sets a professional tone from the first interaction. No more asking clients to send brand assets that may be outdated or incomplete.",
    },
    {
      title: "Competitive landscape analysis",
      description:
        "Run batch extractions on competitor websites to create comprehensive competitive landscape reports in minutes instead of days. Compare color strategies, typography choices, tone of voice, and visual density across an entire industry vertical. Identify positioning gaps and differentiation opportunities that become the foundation of your strategic recommendations.",
    },
    {
      title: "Brand consistency auditing",
      description:
        "Compare extractions across a client's web properties -- main site, marketing pages, docs, blog -- to identify brand inconsistencies and recommend improvements. ExtractVibe reveals when a subdomain uses different fonts, when color usage drifts between teams, or when tone of voice shifts between product and marketing pages. Deliver objective, data-backed consistency reports.",
    },
    {
      title: "Design system bootstrapping",
      description:
        "Use extracted design tokens as the starting point for new design systems, ensuring alignment with existing brand assets. Export tokens as CSS variables, Tailwind config, or Figma tokens and use them as the foundation layer of a new component library. This approach preserves brand continuity while giving you a structured starting point rather than a blank canvas.",
    },
  ],
  steps: [
    {
      number: "01",
      title: "Extract the client brand",
      description:
        "Paste the client's website URL. ExtractVibe generates a comprehensive brand kit in under 30 seconds, covering colors, typography, voice, logos, and component styles.",
    },
    {
      number: "02",
      title: "Extract competitors",
      description:
        "Run extractions on 3-5 competitor websites to build a competitive brand landscape. Compare palettes, type choices, and voice profiles side by side.",
    },
    {
      number: "03",
      title: "Deliver insights",
      description:
        "Export brand kits as JSON, design tokens, or visual reports. Use the extracted data as the foundation for strategic recommendations and design system proposals.",
    },
  ],
  codeExample: {
    title: "Batch extraction for competitive analysis",
    language: "javascript",
    code: `const competitors = [
  "https://stripe.com",
  "https://square.com",
  "https://adyen.com",
  "https://braintree.com"
];

// Extract all competitors in parallel
const extractions = await Promise.all(
  competitors.map(url =>
    fetch("https://extractvibe.com/api/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "ev_your_api_key_here"
      },
      body: JSON.stringify({ url })
    }).then(r => r.json())
  )
);

// Poll each job for results
const results = await Promise.all(
  extractions.map(async ({ jobId }) => {
    // Wait for completion, then fetch result
    const result = await fetch(
      \`https://extractvibe.com/api/extract/\${jobId}/result\`,
      { headers: { "x-api-key": "ev_your_api_key_here" } }
    );
    return result.json();
  })
);

// Compare color palettes across competitors
results.forEach(brand => {
  console.log(brand.domain, brand.colors.primary);
});`,
  },
  faq: [
    {
      question: "How many extractions can an agency run per month?",
      answer:
        "Free accounts get 50 extractions per month, which is enough for initial evaluation. Paid plans scale from 500 to unlimited extractions. Most agencies find that the Starter plan covers their needs, with Pro plans available for high-volume agencies running competitive analyses across multiple clients.",
    },
    {
      question: "Can I white-label ExtractVibe reports for client delivery?",
      answer:
        "ExtractVibe is open source under the MIT license. You can self-host the entire platform and customize the output format, branding, and report templates to match your agency's visual identity. The API returns structured JSON that you can render into any report format you prefer.",
    },
    {
      question: "How do agencies typically integrate ExtractVibe into their workflow?",
      answer:
        "Most agencies use ExtractVibe at two key stages: during the proposal/pitch phase to demonstrate brand understanding, and during the discovery phase to create a comprehensive brand audit. Some agencies also use recurring extractions to monitor client brand consistency across web properties over time.",
    },
    {
      question: "Does ExtractVibe replace manual brand auditing?",
      answer:
        "ExtractVibe automates the data collection phase of brand auditing, which typically takes 2-4 hours of manual work per website. It does not replace the strategic analysis and recommendations that experienced brand strategists provide. Think of it as a research accelerator that gives your team perfect data to work with.",
    },
    {
      question: "Can I share extraction results with clients?",
      answer:
        "Yes. Extraction results are accessible via permanent URLs and can be shared with anyone. You can send clients a link to their brand kit page, export the data as a PDF-ready JSON document, or integrate the results into your own reporting tools via the API.",
    },
  ],
  ctaTitle: "Start extracting for clients",
  ctaDescription:
    "Eliminate hours of manual brand auditing. Extract complete brand kits in seconds and deliver data-backed insights.",
  relatedPages: [
    {
      title: "Competitive Analysis",
      description: "Compare competitor brand identities at scale.",
      href: "/use-cases/competitive-analysis",
    },
    {
      title: "Design Tokens",
      description: "Generate design tokens from any website.",
      href: "/use-cases/design-tokens",
    },
    {
      title: "Design System Extraction",
      description: "Extract complete design systems from any site.",
      href: "/features/design-system",
    },
    {
      title: "Voice Analysis",
      description: "AI-powered brand voice profiling for client audits.",
      href: "/features/voice",
    },
  ],
};

export const developersData: SeoPageData = {
  heroLabel: "Use Case -- Developers",
  heroTitle: "Brand extraction API",
  heroTitleMuted: "built for developers who ship.",
  heroDescription:
    "Developers use the ExtractVibe API to programmatically extract brand data from any website. Build brand-aware features, automate design-to-code workflows, and create AI tools that understand visual identity. REST API with API key auth, WebSocket progress streaming, and structured JSON output.",
  features: [
    {
      title: "Simple REST API with structured output",
      description:
        "Start an extraction with a single POST request and get back structured JSON with colors, typography, logos, voice traits, and design tokens. The API uses standard REST conventions with API key authentication via the x-api-key header. Responses include typed fields with consistent naming, making it easy to integrate into TypeScript applications, Python scripts, or any language that handles JSON.",
    },
    {
      title: "Real-time WebSocket progress",
      description:
        "Connect via WebSocket to get real-time progress updates as the extraction pipeline processes each step. The WebSocket sends structured events with step identifiers and percentage progress, so you can build responsive UIs that show users exactly what is happening. If WebSocket is unavailable, fall back to polling the job status endpoint.",
    },
    {
      title: "Open source and self-hostable",
      description:
        "ExtractVibe is open source under the MIT license. Clone the repository, configure your Cloudflare bindings, and deploy your own instance. The entire stack runs on Cloudflare Workers, D1, KV, R2, and Browser Rendering, so there are no external dependencies to manage. Self-hosting gives you full control over rate limits, data retention, and AI model selection.",
    },
    {
      title: "Design token export for CI/CD",
      description:
        "Integrate brand extraction into your CI/CD pipeline. Extract tokens on every deploy to ensure your implementation stays in sync with the target brand. Export as CSS custom properties for web projects, Tailwind config for utility-first workflows, or Style Dictionary format for multi-platform token distribution across web, iOS, and Android.",
    },
  ],
  steps: [
    {
      number: "01",
      title: "Get your API key",
      description:
        "Sign up for a free account and generate an API key from the dashboard. Keys use the ev_ prefix and support up to 50 extractions per month on the free tier.",
    },
    {
      number: "02",
      title: "Start an extraction",
      description:
        "POST a URL to /api/extract with your API key. The endpoint returns a jobId immediately (202 response) while the extraction runs asynchronously in a durable Workflow.",
    },
    {
      number: "03",
      title: "Get structured results",
      description:
        "Poll /api/extract/:jobId/result or connect via WebSocket for real-time progress. When complete, receive a full brand kit as structured JSON ready for programmatic use.",
    },
  ],
  codeExample: {
    title: "Quick start with the API",
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

// Poll for results (or use WebSocket for real-time updates)
const result = await fetch(
  \`https://extractvibe.com/api/extract/\${jobId}/result\`,
  { headers: { "x-api-key": "ev_your_api_key_here" } }
);

const brandKit = await result.json();

// Access structured brand data
console.log(brandKit.colors);      // { primary, secondary, accent, ... }
console.log(brandKit.typography);   // { families, scale, weights, ... }
console.log(brandKit.voice);        // { tone, personality, patterns, ... }
console.log(brandKit.logos);        // { primary, favicon, ogImage, ... }
console.log(brandKit.buttons);      // { primary, outline, ghost, ... }`,
  },
  faq: [
    {
      question: "Is the API free to use?",
      answer:
        "Free accounts get 50 API calls per month with no credit card required. This is enough for development, testing, and light production use. Paid plans start at $19/month for 500 extractions, with Pro plans offering unlimited calls for high-volume integrations.",
    },
    {
      question: "How long does an extraction take?",
      answer:
        "Most extractions complete in 15-25 seconds. The pipeline renders the page in a real browser (~3s), parses visual assets (~4s), analyzes brand voice with AI (~5s), synthesizes the vibe (~4s), and packages the results (~2s). Complex sites with heavy JavaScript may take up to 60 seconds.",
    },
    {
      question: "Can I self-host ExtractVibe?",
      answer:
        "Yes. ExtractVibe is open source under the MIT license and designed to run entirely on Cloudflare Workers. Clone the repository, create D1/KV/R2 resources, configure your wrangler.jsonc bindings, and deploy with wrangler deploy. The self-hosted version has no functional limitations.",
    },
    {
      question: "What rate limits apply to the API?",
      answer:
        "Free accounts are limited to 50 extractions per month and 3 anonymous extractions per day per IP address. Paid plans have higher monthly limits and support concurrent extractions. API keys include rate limit headers (X-RateLimit-Remaining) so you can implement client-side throttling.",
    },
    {
      question: "Is there a Python SDK or CLI?",
      answer:
        "The API is language-agnostic REST, so any HTTP client works. Community-maintained SDKs for Python, Go, and Ruby are in development. A CLI tool is on the roadmap for extracting brands directly from the terminal and piping results into other tools.",
    },
  ],
  ctaTitle: "Get your API key",
  ctaDescription:
    "Start building with the ExtractVibe API. 50 free extractions per month, no credit card required.",
  relatedPages: [
    {
      title: "API Documentation",
      description: "Complete API reference with code examples.",
      href: "/docs",
    },
    {
      title: "Design Tokens",
      description: "Generate tokens for CI/CD integration.",
      href: "/use-cases/design-tokens",
    },
    {
      title: "Design System Extraction",
      description: "What the full extraction output includes.",
      href: "/features/design-system",
    },
    {
      title: "Color Extraction",
      description: "Deep dive into the color extraction output.",
      href: "/features/colors",
    },
  ],
};

export const brandMonitoringData: SeoPageData = {
  heroLabel: "Use Case -- Brand Monitoring",
  heroTitle: "Automated brand monitoring",
  heroTitleMuted: "across all your web properties.",
  heroDescription:
    "Use ExtractVibe to monitor how brands evolve over time. Schedule recurring extractions and detect when colors, typography, logos, or tone of voice drift from established guidelines. Ideal for brand managers, compliance teams, and agencies managing multi-property brand portfolios.",
  features: [
    {
      title: "Scheduled recurring extractions",
      description:
        "Set up daily, weekly, or monthly extractions for any URL. ExtractVibe runs the full extraction pipeline automatically and stores each snapshot with a timestamp. Over time, this builds a complete history of how the brand's digital identity has evolved, giving you a timeline of changes that can be correlated with design sprints, rebrandings, or team changes.",
    },
    {
      title: "Change detection and diffing",
      description:
        "Compare extraction snapshots over time to detect exactly what changed. ExtractVibe highlights when primary colors shift, fonts are swapped, logos are updated, or tone of voice drifts. Changes are categorized by severity -- a primary color change is flagged as high impact, while a minor spacing adjustment is low impact -- so you can focus on the changes that matter most.",
    },
    {
      title: "Multi-property consistency tracking",
      description:
        "Monitor multiple domains and subdomains simultaneously to ensure brand consistency across all web properties. Compare the marketing site against the docs site, the blog against the product app, or regional variants against the global standard. ExtractVibe reveals cross-property inconsistencies that are invisible when reviewing each site in isolation.",
    },
    {
      title: "Alert notifications via webhook",
      description:
        "Receive webhook notifications when significant brand identity changes are detected. Configure alert thresholds by change type and severity. Integrate with Slack, email, or any webhook-compatible tool. This enables proactive brand management where you catch drift before it compounds, rather than discovering inconsistencies during quarterly reviews.",
    },
  ],
  steps: [
    {
      number: "01",
      title: "Add URLs to monitor",
      description:
        "Enter the URLs of your brand properties: main website, product app, docs, blog, and any regional variants. Set the extraction frequency for each.",
    },
    {
      number: "02",
      title: "Baseline extraction",
      description:
        "ExtractVibe runs an initial extraction to establish the baseline brand identity for each property. This becomes the reference point for future change detection.",
    },
    {
      number: "03",
      title: "Ongoing monitoring",
      description:
        "Automated extractions run on schedule. When changes are detected, you receive alerts with a detailed diff showing exactly what shifted and how significant the change is.",
    },
  ],
  codeExample: {
    title: "Compare brand snapshots via API",
    language: "javascript",
    code: `// Extract baseline
const baseline = await fetch("https://extractvibe.com/api/extract", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "ev_your_api_key_here"
  },
  body: JSON.stringify({ url: "https://yoursite.com" })
}).then(r => r.json());

// Later: extract again and compare
const current = await fetch("https://extractvibe.com/api/extract", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "ev_your_api_key_here"
  },
  body: JSON.stringify({ url: "https://yoursite.com" })
}).then(r => r.json());

// Fetch both results and diff
const baselineResult = await fetch(
  \`https://extractvibe.com/api/extract/\${baseline.jobId}/result\`,
  { headers: { "x-api-key": "ev_your_api_key_here" } }
).then(r => r.json());

const currentResult = await fetch(
  \`https://extractvibe.com/api/extract/\${current.jobId}/result\`,
  { headers: { "x-api-key": "ev_your_api_key_here" } }
).then(r => r.json());

// Compare primary colors
if (baselineResult.colors.primary !== currentResult.colors.primary) {
  console.log("Primary color changed!");
}`,
  },
  faq: [
    {
      question: "How often can I schedule extractions?",
      answer:
        "You can schedule extractions daily, weekly, or monthly. Custom intervals (e.g., every 3 days) are available on Pro plans. Each scheduled extraction counts against your monthly extraction quota, so choose a frequency that balances coverage with usage.",
    },
    {
      question: "What types of brand changes are detected?",
      answer:
        "ExtractVibe detects changes to primary and secondary colors (hex value shifts), font family swaps, logo file changes, type scale modifications, button style updates, and significant shifts in voice tone scores. Each change type is categorized by impact level to help you prioritize your response.",
    },
    {
      question: "Can I monitor competitor brands too?",
      answer:
        "Yes. Brand monitoring works on any publicly accessible URL, not just your own properties. Many teams monitor key competitor websites alongside their own to track competitive positioning changes and respond to competitor rebrandings quickly.",
    },
    {
      question: "How far back does the change history go?",
      answer:
        "Extraction snapshots are retained for 12 months on paid plans and 30 days on free plans. Each snapshot includes the full brand kit data, so you can compare any two points in time to see exactly what changed between them.",
    },
    {
      question: "Can I integrate alerts with Slack or Teams?",
      answer:
        "Yes. Brand change alerts are delivered via webhook, which can be connected to Slack, Microsoft Teams, Discord, or any tool that accepts incoming webhooks. The webhook payload includes the change type, severity, old value, new value, and a link to the full comparison.",
    },
  ],
  ctaTitle: "Start monitoring brands",
  ctaDescription:
    "Track brand identity changes automatically across all your web properties. Get alerts before drift compounds.",
  relatedPages: [
    {
      title: "Competitive Analysis",
      description: "Compare competitor brands side by side.",
      href: "/use-cases/competitive-analysis",
    },
    {
      title: "For Design Agencies",
      description: "How agencies use monitoring for client work.",
      href: "/use-cases/design-agencies",
    },
    {
      title: "Color Extraction",
      description: "Track color palette changes over time.",
      href: "/features/colors",
    },
    {
      title: "Voice Analysis",
      description: "Monitor brand voice drift across properties.",
      href: "/features/voice",
    },
  ],
};

export const competitiveAnalysisData: SeoPageData = {
  heroLabel: "Use Case -- Competitive Analysis",
  heroTitle: "Competitive brand analysis",
  heroTitleMuted: "across your entire industry.",
  heroDescription:
    "Extract and compare brand identities across competitor websites in parallel. Identify positioning gaps, color trends, typography patterns, and voice differentiation opportunities. Build competitive intelligence that drives strategic design decisions.",
  features: [
    {
      title: "Side-by-side brand comparison",
      description:
        "Extract multiple competitor brands simultaneously and compare their color palettes, typography choices, voice characteristics, and component styles in a unified view. See at a glance which competitors use similar blue palettes, which favor geometric sans-serifs, and which adopt a casual versus authoritative tone. This visual comparison reveals clustering and whitespace in the competitive landscape.",
    },
    {
      title: "Industry trend identification",
      description:
        "Analyze brands across an entire industry vertical to identify common design patterns, emerging trends, and standard conventions. When you see that 80% of fintech companies use dark blue as their primary color, you can make a data-driven decision about whether to follow the convention for trust signals or break from it for differentiation. ExtractVibe turns subjective impressions into quantifiable patterns.",
    },
    {
      title: "Positioning gap discovery",
      description:
        "Discover underutilized colors, tones, and visual styles that could differentiate your brand from competitors. If every competitor in your space uses minimalist, cool-toned interfaces with formal copy, ExtractVibe reveals that warm tones and conversational voice are an open positioning opportunity. These insights become the foundation of differentiation strategies.",
    },
    {
      title: "Structured comparison reports",
      description:
        "Export comparison data as structured JSON for custom report generation, or use the built-in comparison view for stakeholder presentations. Each comparison includes delta values showing the quantitative difference between brands across color, typography, and voice dimensions. Data-driven reports carry more weight than subjective opinions in executive discussions.",
    },
  ],
  steps: [
    {
      number: "01",
      title: "List your competitors",
      description:
        "Enter URLs for your brand and each competitor. ExtractVibe extracts all of them in parallel, typically completing the entire competitive set in under 2 minutes.",
    },
    {
      number: "02",
      title: "Compare identities",
      description:
        "View side-by-side comparisons of colors, typography, voice, and visual patterns. Filter by dimension to focus on specific aspects of brand identity.",
    },
    {
      number: "03",
      title: "Find opportunities",
      description:
        "Identify positioning gaps and differentiation opportunities based on the competitive landscape. Export insights for strategic planning and stakeholder presentations.",
    },
  ],
  codeExample: {
    title: "Competitive analysis via API",
    language: "javascript",
    code: `// Extract multiple competitor brands in parallel
const urls = [
  "https://figma.com",
  "https://sketch.com",
  "https://framer.com",
  "https://webflow.com"
];

const jobs = await Promise.all(
  urls.map(url =>
    fetch("https://extractvibe.com/api/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "ev_your_api_key_here"
      },
      body: JSON.stringify({ url })
    }).then(r => r.json())
  )
);

// Fetch all results
const brands = await Promise.all(
  jobs.map(({ jobId }) =>
    fetch(
      \`https://extractvibe.com/api/extract/\${jobId}/result\`,
      { headers: { "x-api-key": "ev_your_api_key_here" } }
    ).then(r => r.json())
  )
);

// Compare: which primary colors are unique?
const primaryColors = brands.map(b => ({
  domain: b.domain,
  primary: b.colors.primary,
  voice: b.voice.tone
}));`,
  },
  faq: [
    {
      question: "How many competitors can I analyze at once?",
      answer:
        "There is no hard limit on the number of concurrent extractions. Each competitor extraction uses one credit from your monthly quota. Most competitive analyses cover 4-8 competitors, but you can extract and compare as many brands as your plan allows. The API handles parallel requests efficiently.",
    },
    {
      question: "Can I track competitor brand changes over time?",
      answer:
        "Yes. Combine competitive analysis with brand monitoring to track how competitor identities evolve. Schedule recurring extractions on competitor URLs and compare snapshots over time. This reveals when competitors rebrand, shift their messaging, or update their design systems.",
    },
    {
      question: "Does ExtractVibe compare voice and tone across competitors?",
      answer:
        "Yes. The voice analysis output includes numeric scores for formality, technicality, enthusiasm, and warmth, which can be directly compared across competitors. This quantitative approach to voice comparison is uniquely valuable because tone differences are otherwise difficult to articulate and compare objectively.",
    },
    {
      question: "Can I export competitive analysis reports?",
      answer:
        "Yes. All comparison data is available as structured JSON via the API, including delta values between brands. You can import this data into Google Sheets, build custom dashboards, or generate PDF reports. The structured format makes it easy to integrate competitive intelligence into your existing workflow tools.",
    },
    {
      question: "How is this different from manual competitive auditing?",
      answer:
        "Manual competitive auditing typically takes 4-8 hours per competitor and relies on subjective observation. ExtractVibe completes the same analysis in under 30 seconds per site and provides quantifiable data points. It also catches details that manual audits miss, like CSS variable naming patterns, shadow elevation systems, and subtle tone variations.",
    },
  ],
  ctaTitle: "Analyze your competitors",
  ctaDescription:
    "Understand competitor brand strategies with quantifiable data. Find positioning gaps and differentiation opportunities.",
  relatedPages: [
    {
      title: "Brand Monitoring",
      description: "Track competitor brand changes over time.",
      href: "/use-cases/brand-monitoring",
    },
    {
      title: "For Design Agencies",
      description: "How agencies use competitive analysis for clients.",
      href: "/use-cases/design-agencies",
    },
    {
      title: "Color Extraction",
      description: "Compare color palettes across brands.",
      href: "/features/colors",
    },
    {
      title: "Voice Analysis",
      description: "Compare brand voice profiles quantitatively.",
      href: "/features/voice",
    },
  ],
};

export const designTokensData: SeoPageData = {
  heroLabel: "Use Case -- Design Tokens",
  heroTitle: "Generate design tokens",
  heroTitleMuted: "from any live website.",
  heroDescription:
    "Extract design tokens from live websites and export them in W3C Design Tokens format, Style Dictionary, Tailwind config, or CSS custom properties. Bridge the gap between existing brand implementations and structured token systems without manual measurement.",
  features: [
    {
      title: "W3C Design Tokens format",
      description:
        "Export extracted brand data in the W3C Design Tokens Community Group format for tool-agnostic interoperability. The output follows the latest DTCG specification with proper type annotations, group nesting, and value resolution. This format is supported by Tokens Studio (Figma plugin), Style Dictionary, and an growing ecosystem of design tooling that speaks the same token language.",
    },
    {
      title: "Tailwind CSS configuration",
      description:
        "Generate a complete Tailwind CSS theme configuration from any website. The output includes color palette, font families, font sizes, spacing scale, border radius values, and box shadows, all structured as a valid Tailwind theme extension. Copy the output into your tailwind.config.ts and your utility classes will match the target brand immediately.",
    },
    {
      title: "CSS custom properties export",
      description:
        "Export as CSS custom properties (--brand-primary, --font-heading, --radius-lg, etc.) ready to paste into any stylesheet. Variable names are generated from semantic analysis of how each token is used in the original design. The output includes both the :root definitions and a commented reference showing where each token was observed on the original site.",
    },
    {
      title: "Style Dictionary for multi-platform",
      description:
        "Generate Style Dictionary-compatible JSON for multi-platform token distribution. The output is ready to run through the Style Dictionary build process, generating platform-specific outputs for web (CSS, SCSS), iOS (Swift UIColor), Android (XML resources), and React Native. A single extraction can feed your entire multi-platform design system pipeline.",
    },
  ],
  steps: [
    {
      number: "01",
      title: "Extract from a live site",
      description:
        "Enter a URL and run an extraction. ExtractVibe analyzes the full page to identify all design tokens in use: colors, typography, spacing, radii, shadows, and component styles.",
    },
    {
      number: "02",
      title: "Choose your format",
      description:
        "Select your preferred token format: W3C DTCG, Tailwind config, CSS custom properties, Style Dictionary JSON, or raw JSON. Each format is production-ready with proper naming conventions.",
    },
    {
      number: "03",
      title: "Integrate into your workflow",
      description:
        "Drop the exported tokens into your project. Use them as the foundation of a new design system, sync them with Figma via Tokens Studio, or feed them into your CI/CD pipeline.",
    },
  ],
  codeExample: {
    title: "Export as Tailwind config",
    language: "javascript",
    code: `// Extracted design tokens as Tailwind config
// Generated by ExtractVibe from https://stripe.com

module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#635bff",
          secondary: "#0a2540",
          accent: "#00d4aa",
          muted: "#697386",
          background: "#f6f9fc",
        },
      },
      fontFamily: {
        heading: ["-apple-system", "BlinkMacSystemFont", "sans-serif"],
        body: ["-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["Menlo", "Monaco", "monospace"],
      },
      borderRadius: {
        brand: "8px",
        "brand-lg": "12px",
        "brand-full": "9999px",
      },
      boxShadow: {
        "brand-sm": "0 1px 2px rgba(0,0,0,0.05)",
        "brand-md": "0 4px 6px -1px rgba(0,0,0,0.1)",
        "brand-lg": "0 10px 15px -3px rgba(0,0,0,0.1)",
      },
      spacing: {
        "brand-xs": "4px",
        "brand-sm": "8px",
        "brand-md": "16px",
        "brand-lg": "24px",
        "brand-xl": "48px",
      },
    },
  },
};`,
  },
  faq: [
    {
      question: "What design token formats does ExtractVibe support?",
      answer:
        "ExtractVibe exports tokens in W3C Design Tokens Community Group format (DTCG), Style Dictionary JSON, Tailwind CSS theme config, CSS custom properties, and raw JSON. Each format follows the conventions and naming patterns expected by the target toolchain, so the output is immediately usable without manual reformatting.",
    },
    {
      question: "Can I use extracted tokens in Figma?",
      answer:
        "Yes. Export tokens in W3C DTCG format and import them into Figma using the Tokens Studio plugin (formerly Figma Tokens). This creates a bi-directional sync between the extracted brand tokens and your Figma design files. Any token changes can be pushed to code or pulled from code depending on your workflow.",
    },
    {
      question: "How accurate are the extracted token values?",
      answer:
        "Very accurate. ExtractVibe reads computed styles from a fully rendered page, which means the token values reflect the actual visual output after all CSS specificity, media queries, and JavaScript manipulations have been applied. The values you get are what users actually see, not what was written in the source CSS.",
    },
    {
      question: "Can I integrate token extraction into CI/CD?",
      answer:
        "Yes. Use the ExtractVibe API in your build pipeline to extract tokens on every deployment. Compare the output against your expected values to catch brand drift automatically. This is particularly useful for design systems teams that want to ensure implementation matches the design source of truth.",
    },
    {
      question: "Does it extract spacing and sizing tokens?",
      answer:
        "Yes. ExtractVibe extracts padding, margin, gap, and dimensional values from the page and identifies the underlying spacing scale. It detects whether the site uses a 4px, 8px, or custom base unit and maps all observed spacing values to a normalized scale that you can adopt in your own design system.",
    },
  ],
  ctaTitle: "Generate design tokens",
  ctaDescription:
    "Convert any website into structured design tokens. Export in W3C, Tailwind, Style Dictionary, or CSS format.",
  relatedPages: [
    {
      title: "Design System Extraction",
      description: "Extract a complete design system, not just tokens.",
      href: "/features/design-system",
    },
    {
      title: "For Developers",
      description: "How developers use the ExtractVibe API.",
      href: "/use-cases/developers",
    },
    {
      title: "Typography Detection",
      description: "Detailed typography token extraction.",
      href: "/features/typography",
    },
    {
      title: "Color Extraction",
      description: "Deep dive into color token extraction.",
      href: "/features/colors",
    },
  ],
};
