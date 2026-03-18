export type { SeoPageData } from "~/components/seo-page-template";

export {
  colorsPageData,
  typographyPageData,
  voicePageData,
  buttonsPageData,
  logosPageData,
  gradientsPageData,
  designSystemPageData,
} from "./features";

export {
  designAgenciesData,
  developersData,
  brandMonitoringData,
  competitiveAnalysisData,
  designTokensData,
} from "./use-cases";

/** All SEO pages with their paths, for use in sitemap generation and internal linking. */
export function getAllPages(): Array<{ path: string; title: string; type: "feature" | "use-case" }> {
  return [
    // Feature pages
    { path: "/features/colors", title: "Color Extraction", type: "feature" },
    { path: "/features/typography", title: "Typography Detection", type: "feature" },
    { path: "/features/voice", title: "Brand Voice Analysis", type: "feature" },
    { path: "/features/buttons", title: "Button Style Extraction", type: "feature" },
    { path: "/features/logos", title: "Logo Detection", type: "feature" },
    { path: "/features/gradients", title: "Gradient & Shadow Extraction", type: "feature" },
    { path: "/features/design-system", title: "Design System Extraction", type: "feature" },
    // Use-case pages
    { path: "/use-cases/design-agencies", title: "For Design Agencies", type: "use-case" },
    { path: "/use-cases/developers", title: "For Developers", type: "use-case" },
    { path: "/use-cases/brand-monitoring", title: "Brand Monitoring", type: "use-case" },
    { path: "/use-cases/competitive-analysis", title: "Competitive Analysis", type: "use-case" },
    { path: "/use-cases/design-tokens", title: "Design Tokens", type: "use-case" },
  ];
}
