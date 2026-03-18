import { SeoPageTemplate } from "~/components/seo-page-template";
import { designAgenciesData } from "~/lib/seo-pages/use-cases";

export function meta() {
  return [
    { title: "Brand Intelligence for Design Agencies | ExtractVibe" },
    {
      name: "description",
      content:
        "Accelerate client onboarding and competitive research. Extract brand kits from client websites in seconds instead of hours.",
    },
    {
      property: "og:title",
      content: "Brand Intelligence for Design Agencies | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "Extract brand kits from client websites in seconds. Accelerate onboarding, competitive audits, and design system creation.",
    },
  ];
}

export default function DesignAgenciesPage() {
  return <SeoPageTemplate data={designAgenciesData} />;
}
