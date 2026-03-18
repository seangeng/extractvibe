import { SeoPageTemplate } from "~/components/seo-page-template";
import { typographyPageData } from "~/lib/seo-pages/features";

export function meta() {
  return [
    { title: "Typography Detection — Identify Fonts from Any Website | ExtractVibe" },
    {
      name: "description",
      content:
        "Detect font families, weights, sizes, and typographic hierarchy from any live website. Export type systems as design tokens or CSS.",
    },
    {
      property: "og:title",
      content: "Typography Detection — Identify Fonts | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "Detect font families, weights, sizes, and typographic hierarchy from any live website. Export type systems as design tokens.",
    },
  ];
}

export default function TypographyPage() {
  return <SeoPageTemplate data={typographyPageData} />;
}
