import { SeoPageTemplate } from "~/components/seo-page-template";
import { voicePageData } from "~/lib/seo-pages/features";

export function meta() {
  return [
    { title: "Brand Voice Analysis — AI-Powered Tone Detection | ExtractVibe" },
    {
      name: "description",
      content:
        "AI-powered brand voice analysis. Extract tone, personality traits, writing style rules, and do's/don'ts from any website's copy.",
    },
    {
      property: "og:title",
      content: "Brand Voice Analysis — AI-Powered Tone Detection | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "AI-powered brand voice analysis. Extract tone, personality traits, and writing style guidelines from any website.",
    },
  ];
}

export default function VoicePage() {
  return <SeoPageTemplate data={voicePageData} />;
}
