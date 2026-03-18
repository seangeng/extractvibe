import { SeoPageTemplate } from "~/components/seo-page-template";
import { designTokensData } from "~/lib/seo-pages/use-cases";

export function meta() {
  return [
    { title: "Design Token Generation from Any Website | ExtractVibe" },
    {
      name: "description",
      content:
        "Convert any website into structured design tokens. Export as W3C Design Tokens, Style Dictionary, Tailwind config, or CSS custom properties.",
    },
    {
      property: "og:title",
      content: "Design Token Generation | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "Convert any website into structured design tokens. Export as W3C, Tailwind, Style Dictionary, or CSS format.",
    },
  ];
}

export default function DesignTokensPage() {
  return <SeoPageTemplate data={designTokensData} />;
}
