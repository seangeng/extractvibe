import { SeoPageTemplate } from "~/components/seo-page-template";
import { colorsPageData } from "~/lib/seo-pages/features";

export function meta() {
  return [
    { title: "Color Extraction — Extract Brand Colors from Any Website | ExtractVibe" },
    {
      name: "description",
      content:
        "Extract complete brand color palettes from any website. Get hex, RGB, HSL values with contrast analysis and export to Tailwind, CSS variables, or design tokens.",
    },
    {
      property: "og:title",
      content: "Color Extraction — Extract Brand Colors | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "Extract complete brand color palettes from any website. Get hex, RGB, HSL values with contrast analysis and design token export.",
    },
  ];
}

export default function ColorsPage() {
  return <SeoPageTemplate data={colorsPageData} />;
}
