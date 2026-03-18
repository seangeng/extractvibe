import { SeoPageTemplate } from "~/components/seo-page-template";
import { developersData } from "~/lib/seo-pages/use-cases";

export function meta() {
  return [
    { title: "Brand Extraction API for Developers | ExtractVibe" },
    {
      name: "description",
      content:
        "Integrate brand intelligence into any application. REST API with structured JSON output for colors, typography, voice, and design tokens.",
    },
    {
      property: "og:title",
      content: "Brand Extraction API for Developers | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "Integrate brand intelligence into any app. REST API with JSON output for colors, typography, voice, and tokens.",
    },
  ];
}

export default function DevelopersPage() {
  return <SeoPageTemplate data={developersData} />;
}
