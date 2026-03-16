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
  route("brand/:domain", "routes/brand.$domain.tsx"),
  layout("routes/dashboard.tsx", [
    route("dashboard", "routes/dashboard._index.tsx"),
    route("dashboard/extract", "routes/dashboard.extract.tsx"),
    route("dashboard/history", "routes/dashboard.history.tsx"),
    route("dashboard/brand/:jobId", "routes/dashboard.brand.$jobId.tsx"),
    route("dashboard/keys", "routes/dashboard.keys.tsx"),
    route("dashboard/settings", "routes/dashboard.settings.tsx"),
  ]),
] satisfies RouteConfig;
