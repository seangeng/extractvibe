import { SeoPageTemplate } from "~/components/seo-page-template";
import { gradientsPageData } from "~/lib/seo-pages/features";

export function meta() {
  return [
    { title: "Gradient Extraction — Capture CSS Gradients | ExtractVibe" },
    {
      name: "description",
      content:
        "Extract CSS gradients from any website. Get exact color stops, directions, and gradient types as copy-ready CSS or design tokens.",
    },
    {
      property: "og:title",
      content: "Gradient Extraction — Capture CSS Gradients | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "Extract CSS gradients from any website. Get exact color stops, directions, and gradient types as ready-to-use CSS.",
    },
  ];
}

export default function GradientsPage() {
  return <SeoPageTemplate data={gradientsPageData} />;
}
