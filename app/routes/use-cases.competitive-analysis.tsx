import { SeoPageTemplate } from "~/components/seo-page-template";
import { competitiveAnalysisData } from "~/lib/seo-pages/use-cases";

export function meta() {
  return [
    { title: "Competitive Brand Analysis at Scale | ExtractVibe" },
    {
      name: "description",
      content:
        "Compare competitor brand identities side by side. Identify color trends, typography patterns, and voice differentiation opportunities.",
    },
    {
      property: "og:title",
      content: "Competitive Brand Analysis at Scale | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "Compare competitor brand identities at scale. Find positioning gaps and differentiation opportunities.",
    },
  ];
}

export default function CompetitiveAnalysisPage() {
  return <SeoPageTemplate data={competitiveAnalysisData} />;
}
