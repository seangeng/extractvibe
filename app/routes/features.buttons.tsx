import { SeoPageTemplate } from "~/components/seo-page-template";
import { buttonsPageData } from "~/lib/seo-pages/features";

export function meta() {
  return [
    { title: "Button & CTA Extraction — Capture Interactive Styles | ExtractVibe" },
    {
      name: "description",
      content:
        "Extract button styles, CTA patterns, hover states, and interaction design from any website. Get CSS-ready specifications for every variant.",
    },
    {
      property: "og:title",
      content: "Button & CTA Extraction | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "Extract button styles, CTA patterns, and hover states from any website. Get CSS-ready specifications instantly.",
    },
  ];
}

export default function ButtonsPage() {
  return <SeoPageTemplate data={buttonsPageData} />;
}
