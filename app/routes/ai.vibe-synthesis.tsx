import type { SeoPageData } from "~/components/seo-page-template";
import { SeoPageTemplate } from "~/components/seo-page-template";

export function meta() {
  return [
    { title: "AI Vibe Synthesis — Holistic Brand Profiles | ExtractVibe" },
    {
      name: "description",
      content:
        "How ExtractVibe AI synthesizes visual and verbal brand data into a holistic brand personality profile with actionable guidelines.",
    },
    {
      property: "og:title",
      content: "AI Vibe Synthesis — Holistic Brand Profiles | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "How AI combines colors, typography, and voice into a unified brand vibe profile with actionable guidelines.",
    },
  ];
}

const vibeSynthesisData: SeoPageData = {
  heroLabel: "AI — Vibe Synthesis",
  heroTitle: "AI-powered vibe synthesis",
  heroTitleMuted: "for holistic brand profiles.",
  heroDescription:
    "Vibe synthesis is ExtractVibe's signature capability. It combines visual identity data (colors, typography, layout) with verbal identity data (tone, personality, copy style) into a single, coherent brand profile.",
  features: [
    {
      title: "Visual + Verbal Fusion",
      description:
        "The AI considers how visual choices (dark color palettes, geometric fonts) align with verbal signals (formal tone, technical vocabulary) to determine the overall brand vibe.",
    },
    {
      title: "Vibe Tags",
      description:
        "Each brand receives 3-5 vibe tags (e.g., 'premium', 'developer-first', 'minimal') that capture its essence in human-readable terms usable in design briefs and AI prompts.",
    },
    {
      title: "Brand Rules Generation",
      description:
        "The synthesis step generates inferred brand guidelines including color usage rules, typography dos/don'ts, and overall design principles derived from the site's patterns.",
    },
    {
      title: "Confidence Scoring",
      description:
        "Each aspect of the brand profile includes a confidence score based on how much supporting evidence was found on the page, helping you know which insights are most reliable.",
    },
  ],
  steps: [
    {
      number: "01",
      title: "Data aggregation",
      description: "Visual identity (colors, fonts, layout) and verbal identity (tone, personality, copy) data from previous pipeline steps are combined into a unified input.",
    },
    {
      number: "02",
      title: "Cross-signal analysis",
      description: "The AI model identifies patterns where visual and verbal signals reinforce or contradict each other, building a coherent brand narrative.",
    },
    {
      number: "03",
      title: "Profile generation",
      description: "A structured brand profile is generated with vibe tags, brand rules, personality summary, and confidence scores for each dimension.",
    },
  ],
  codeExample: {
    title: "Vibe synthesis output",
    language: "json",
    code: `{
  "vibe": {
    "summary": "A premium, developer-focused brand that communicates technical depth with visual polish. Dark color palette and geometric typography signal sophistication, while clear copy and structured layouts convey trustworthiness.",
    "tags": ["premium", "developer-first", "polished", "technical", "modern"],
    "confidence": 0.87,
    "rules": {
      "visual": [
        "Use dark backgrounds with high-contrast text",
        "Maintain generous whitespace between sections",
        "Prefer geometric sans-serif fonts",
        "Use accent colors sparingly for CTAs only"
      ],
      "verbal": [
        "Lead with technical accuracy",
        "Use active voice and direct statements",
        "Avoid marketing superlatives",
        "Include code examples where relevant"
      ]
    }
  }
}`,
  },
  faq: [
    {
      question: "What does 'vibe synthesis' mean?",
      answer: "Vibe synthesis is the process of combining visual brand signals (colors, typography, layout) with verbal brand signals (tone, personality, copy style) to create a holistic brand personality profile.",
    },
    {
      question: "How are vibe tags generated?",
      answer: "The AI model analyzes patterns across all extracted brand data and selects 3-5 descriptive tags from a curated vocabulary of brand attributes. Tags are ranked by relevance and confidence.",
    },
    {
      question: "Can I use vibe data in AI prompts?",
      answer: "Yes. Vibe tags and brand rules are specifically designed to be usable as AI prompt context. Include them in system prompts to generate on-brand content with any language model.",
    },
  ],
  ctaTitle: "See vibe synthesis in action",
  ctaDescription: "Extract a holistic brand profile from any website. Vibe tags, brand rules, and confidence scores included.",
  relatedPages: [
    { title: "AI Technology", description: "Overview of ExtractVibe's dual-AI architecture.", href: "/ai" },
    { title: "Brand Voice Analysis", description: "How AI analyzes tone and personality from copy.", href: "/ai/brand-voice-analysis" },
    { title: "Design System", description: "Extract complete design systems from websites.", href: "/features/design-system" },
  ],
};

export default function VibeSynthesisPage() {
  return <SeoPageTemplate data={vibeSynthesisData} />;
}
