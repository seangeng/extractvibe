import { SeoPageTemplate } from "~/components/seo-page-template";
import { brandMonitoringData } from "~/lib/seo-pages/use-cases";

export function meta() {
  return [
    { title: "Automated Brand Monitoring — Track Identity Changes | ExtractVibe" },
    {
      name: "description",
      content:
        "Monitor brand identity changes across the web. Schedule recurring extractions and get alerts when colors, fonts, or voice shift.",
    },
    {
      property: "og:title",
      content: "Automated Brand Monitoring | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "Track brand identity changes automatically. Schedule extractions and get alerts when colors, fonts, or voice change.",
    },
  ];
}

export default function BrandMonitoringPage() {
  return <SeoPageTemplate data={brandMonitoringData} />;
}
