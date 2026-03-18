import { SeoPageTemplate } from "~/components/seo-page-template";
import { designSystemPageData } from "~/lib/seo-pages/features";

export function meta() {
  return [
    { title: "Design System Extraction — Generate Tokens from Any Site | ExtractVibe" },
    {
      name: "description",
      content:
        "Generate a complete design system from any website. Extract colors, typography, spacing, and components as structured design tokens.",
    },
    {
      property: "og:title",
      content: "Design System Extraction | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "Generate a complete design system from any website. Extract colors, typography, spacing, and components as tokens.",
    },
  ];
}

export default function DesignSystemPage() {
  return <SeoPageTemplate data={designSystemPageData} />;
}
