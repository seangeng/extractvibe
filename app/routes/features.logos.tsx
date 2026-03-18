import { SeoPageTemplate } from "~/components/seo-page-template";
import { logosPageData } from "~/lib/seo-pages/features";

export function meta() {
  return [
    { title: "Logo Extraction — Detect and Download Brand Logos | ExtractVibe" },
    {
      name: "description",
      content:
        "Detect and download logos from any website in SVG, PNG, and ICO formats. Identify logo variants, placement patterns, and clear space.",
    },
    {
      property: "og:title",
      content: "Logo Extraction — Detect and Download Logos | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "Detect and download logos from any website in SVG, PNG, and ICO. Find logo variants and placement patterns.",
    },
  ];
}

export default function LogosPage() {
  return <SeoPageTemplate data={logosPageData} />;
}
