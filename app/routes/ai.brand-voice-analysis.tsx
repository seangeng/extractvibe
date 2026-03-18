import type { SeoPageData } from "~/components/seo-page-template";
import { SeoPageTemplate } from "~/components/seo-page-template";

export function meta() {
  return [
    { title: "AI Brand Voice Analysis — How It Works | ExtractVibe" },
    {
      name: "description",
      content:
        "Deep dive on how ExtractVibe uses AI to analyze brand voice. Tone classification, personality profiling, and writing guideline generation.",
    },
    {
      property: "og:title",
      content: "AI Brand Voice Analysis — How It Works | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "How ExtractVibe AI analyzes brand voice: tone classification, personality profiling, and writing guidelines.",
    },
  ];
}

const brandVoiceAiData: SeoPageData = {
  heroLabel: "AI — Brand Voice Analysis",
  heroTitle: "How AI analyzes",
  heroTitleMuted: "brand voice and personality.",
  heroDescription:
    "ExtractVibe uses OpenRouter-connected language models to read website copy and classify tone, identify personality traits, and generate actionable writing guidelines. Here is how it works under the hood.",
  features: [
    {
      title: "Text Extraction",
      description:
        "After the page is rendered, all visible text content is extracted from headings, paragraphs, buttons, navigation, and meta descriptions. Non-content text (scripts, styles) is filtered out.",
    },
    {
      title: "Tone Classification",
      description:
        "The AI model classifies brand tone across multiple dimensions: formal vs. casual, serious vs. playful, technical vs. accessible, and authoritative vs. conversational. Each dimension is scored on a scale.",
    },
    {
      title: "Personality Profiling",
      description:
        "Using a multi-trait model inspired by brand archetypes, the AI identifies dominant personality traits like innovative, trustworthy, bold, friendly, sophisticated, or rebellious.",
    },
    {
      title: "Guideline Generation",
      description:
        "The AI produces concrete writing guidelines including sentence length recommendations, vocabulary level, punctuation patterns, and a list of do's and don'ts for maintaining brand voice consistency.",
    },
  ],
  steps: [
    {
      number: "01",
      title: "Text is extracted",
      description: "All visible copy is scraped from the rendered DOM, including headings, body text, CTAs, and meta content.",
    },
    {
      number: "02",
      title: "AI analyzes patterns",
      description: "Gemini Flash 2.0 analyzes word choice, sentence structure, emotional tone, and communication patterns.",
    },
    {
      number: "03",
      title: "Guidelines are generated",
      description: "The model produces a structured voice profile with tone scores, personality traits, and writing do's/don'ts.",
    },
  ],
  codeExample: {
    title: "Voice analysis API response",
    language: "json",
    code: `{
  "voice": {
    "tone": {
      "formality": 0.7,
      "enthusiasm": 0.6,
      "technicality": 0.8,
      "warmth": 0.5
    },
    "personality": [
      "innovative",
      "confident",
      "precise",
      "developer-focused"
    ],
    "writingStyle": {
      "sentenceLength": "medium",
      "vocabulary": "technical but accessible",
      "punctuation": "minimal exclamation marks"
    },
    "dos": [
      "Use active voice",
      "Lead with benefits",
      "Keep sentences under 20 words",
      "Use specific numbers and metrics"
    ],
    "donts": [
      "Avoid buzzwords and jargon",
      "Don't use excessive exclamation marks",
      "Avoid passive constructions",
      "Don't start sentences with 'We'"
    ]
  }
}`,
  },
  faq: [
    {
      question: "Which AI model powers voice analysis?",
      answer: "ExtractVibe uses Gemini Flash 2.0 via OpenRouter for voice analysis. This model offers strong language understanding at a low cost per token, making it ideal for analyzing brand copy.",
    },
    {
      question: "How accurate is the voice analysis?",
      answer: "Voice analysis is most accurate on pages with substantial copy (marketing pages, about pages, blog posts). Minimal pages with little text may produce less detailed results.",
    },
    {
      question: "Can I customize the voice analysis dimensions?",
      answer: "The API returns a fixed set of tone dimensions and personality traits. If you need custom dimensions, you can self-host ExtractVibe and modify the analysis prompts.",
    },
  ],
  ctaTitle: "Analyze any brand's voice",
  ctaDescription: "Get AI-powered voice analysis with tone scores, personality traits, and writing guidelines.",
  relatedPages: [
    { title: "AI Technology", description: "Overview of ExtractVibe's dual-AI architecture.", href: "/ai" },
    { title: "Vibe Synthesis", description: "How AI combines visual and verbal identity.", href: "/ai/vibe-synthesis" },
    { title: "Voice Feature", description: "Brand voice extraction feature overview.", href: "/features/voice" },
  ],
};

export default function BrandVoiceAnalysisPage() {
  return <SeoPageTemplate data={brandVoiceAiData} />;
}
