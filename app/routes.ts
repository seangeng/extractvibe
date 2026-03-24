import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("sign-in", "routes/sign-in.tsx"),
  route("sign-up", "routes/sign-up.tsx"),
  route("docs", "routes/docs.tsx"),
  route("brand/:domain", "routes/brand.$domain.tsx"),

  // Features
  route("features/colors", "routes/features.colors.tsx"),
  route("features/typography", "routes/features.typography.tsx"),
  route("features/voice", "routes/features.voice.tsx"),
  route("features/buttons", "routes/features.buttons.tsx"),
  route("features/logos", "routes/features.logos.tsx"),
  route("features/gradients", "routes/features.gradients.tsx"),
  route("features/design-system", "routes/features.design-system.tsx"),

  // Use Cases
  route("use-cases/design-agencies", "routes/use-cases.design-agencies.tsx"),
  route("use-cases/developers", "routes/use-cases.developers.tsx"),
  route("use-cases/brand-monitoring", "routes/use-cases.brand-monitoring.tsx"),
  route("use-cases/competitive-analysis", "routes/use-cases.competitive-analysis.tsx"),
  route("use-cases/design-tokens", "routes/use-cases.design-tokens.tsx"),

  // AI
  route("ai", "routes/ai.tsx"),
  route("ai/brand-voice-analysis", "routes/ai.brand-voice-analysis.tsx"),
  route("ai/vibe-synthesis", "routes/ai.vibe-synthesis.tsx"),

  // Claim (agent account linking)
  route("claim/:token", "routes/claim.$token.tsx"),

  // Marketing
  route("pricing", "routes/pricing.tsx"),
  route("about", "routes/about.tsx"),
  route("changelog", "routes/changelog.tsx"),
  route("cli", "routes/cli.tsx"),
  route("open-source", "routes/open-source.tsx"),

  // Dashboard
  layout("routes/dashboard.tsx", [
    route("dashboard", "routes/dashboard._index.tsx"),
    route("dashboard/extract", "routes/dashboard.extract.tsx"),
    route("dashboard/history", "routes/dashboard.history.tsx"),
    route("dashboard/brand/:jobId", "routes/dashboard.brand.$jobId.tsx"),
    route("dashboard/keys", "routes/dashboard.keys.tsx"),
    route("dashboard/usage", "routes/dashboard.usage.tsx"),
    route("dashboard/settings", "routes/dashboard.settings.tsx"),
  ]),
] satisfies RouteConfig;
