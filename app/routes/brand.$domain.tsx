import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useRevalidator } from "react-router";
import { Globe, Check, X, Code2, Loader2, Eye, Braces, Copy, ChevronDown, ChevronRight, Download } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { CodeBlock } from "~/components/docs/code-block";
import { MarketingFooter } from "~/components/marketing-layout";
import type { Route } from "./+types/brand.$domain";
import type {
  ExtractVibeBrandKit,
  ColorValue,
  ColorMode,
  ToneSpectrum,
  FontFamily,
  TypeScale,
  TypeScaleEntry,
  ButtonStyle,
  BrandButtons,
  ShadowValue,
  GradientValue,
  BrandEffects,
  BrandDesignAsset,
} from "../../server/schema/v1";

// Stale-while-revalidate: serve cached data but re-extract after 7 days
const STALE_AFTER = 60 * 60 * 24 * 7;

// ─── SSR Loader ──────────────────────────────────────────────────────────

// Max public auto-extractions per IP per day
const MAX_PUBLIC_EXTRACTIONS_PER_IP = 5;
// Max public auto-extractions globally per hour (cost budget)
const MAX_PUBLIC_EXTRACTIONS_PER_HOUR = 30;

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const domain = params.domain!;
  const env = context.cloudflare.env;

  // Block obviously invalid or private domains
  if (isPrivateDomain(domain)) {
    throw new Response("Not found", { status: 404 });
  }

  // Check for cached brand kit with metadata
  const [cached, metaJson] = await Promise.all([
    env.CACHE.get(`brand:${domain}`, "json"),
    env.CACHE.get(`brand:${domain}:meta`, "json"),
  ]);

  const meta = metaJson as { extractedAt: number; jobId: string } | null;

  if (cached) {
    // Stale-while-revalidate: serve cached data, trigger background re-extract if stale
    const age = meta?.extractedAt ? (Date.now() - meta.extractedAt) / 1000 : Infinity;
    if (age > STALE_AFTER) {
      const ctx = context.cloudflare.ctx;
      ctx.waitUntil(triggerExtraction(env, domain));
    }
    return { kit: cached as ExtractVibeBrandKit, domain, status: "ready" as const, jobId: null };
  }

  // No cache — check if there's already an extraction in progress
  const existing = await env.DB.prepare(
    `SELECT id, status FROM extraction WHERE domain = ? AND status IN ('queued', 'running') ORDER BY "createdAt" DESC LIMIT 1`
  ).bind(domain).first<{ id: string; status: string }>();

  if (existing) {
    return { kit: null, domain, status: "extracting" as const, jobId: existing.id };
  }

  // ── Rate limits before auto-starting ──

  // 1. Per-domain: max 3 per hour
  const domainCount = await env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM extraction WHERE domain = ? AND "createdAt" > datetime('now', '-1 hour')`
  ).bind(domain).first<{ cnt: number }>();

  if (domainCount && domainCount.cnt >= 3) {
    return { kit: null, domain, status: "rate_limited" as const, jobId: null };
  }

  // 2. Per-IP: max 5 per day (prevent one visitor from triggering many domains)
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const ipKey = `public-extract:${ip}`;
  const ipCountRaw = await env.CACHE.get(ipKey);
  const ipCount = ipCountRaw ? parseInt(ipCountRaw, 10) : 0;

  if (ipCount >= MAX_PUBLIC_EXTRACTIONS_PER_IP) {
    return { kit: null, domain, status: "rate_limited" as const, jobId: null };
  }

  // 3. Global hourly budget (prevent mass abuse across all domains)
  const globalKey = "public-extract:global:hour";
  const globalCountRaw = await env.CACHE.get(globalKey);
  const globalCount = globalCountRaw ? parseInt(globalCountRaw, 10) : 0;

  if (globalCount >= MAX_PUBLIC_EXTRACTIONS_PER_HOUR) {
    return { kit: null, domain, status: "rate_limited" as const, jobId: null };
  }

  // All checks passed — start extraction and increment counters
  const jobId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO extraction (id, "userId", domain, url, status, "schemaVersion", "createdAt")
     VALUES (?, ?, ?, ?, 'queued', 'v1', datetime('now'))`
  ).bind(jobId, `public:brand-page`, domain, `https://${domain}`).run();

  await env.EXTRACT_BRAND.create({
    id: jobId,
    params: { url: `https://${domain}`, jobId, userId: `public:brand-page` },
  });

  // Increment rate limit counters (fire-and-forget)
  const ctx = context.cloudflare.ctx;
  ctx.waitUntil(Promise.all([
    env.CACHE.put(ipKey, String(ipCount + 1), { expirationTtl: 86400 }),
    env.CACHE.put(globalKey, String(globalCount + 1), { expirationTtl: 3600 }),
  ]));

  return { kit: null, domain, status: "extracting" as const, jobId };
}

/** Block private IPs, localhost, and obviously invalid domains */
function isPrivateDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  if (d === "localhost" || d.endsWith(".local") || d.endsWith(".internal")) return true;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(d)) {
    // IPv4 — block all private ranges
    const parts = d.split(".").map(Number);
    if (parts[0] === 127) return true;
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 0) return true;
  }
  // Must have at least one dot (real TLD)
  if (!d.includes(".")) return true;
  return false;
}

async function triggerExtraction(env: Route.LoaderArgs["context"]["cloudflare"]["env"], domain: string): Promise<void> {
  try {
    const existing = await env.DB.prepare(
      `SELECT id FROM extraction WHERE domain = ? AND status IN ('queued', 'running') LIMIT 1`
    ).bind(domain).first<{ id: string }>();
    if (existing) return;

    // Check global budget before background re-extraction too
    const globalKey = "public-extract:global:hour";
    const globalCountRaw = await env.CACHE.get(globalKey);
    const globalCount = globalCountRaw ? parseInt(globalCountRaw, 10) : 0;
    if (globalCount >= MAX_PUBLIC_EXTRACTIONS_PER_HOUR) return;

    const jobId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO extraction (id, "userId", domain, url, status, "schemaVersion", "createdAt")
       VALUES (?, ?, ?, ?, 'queued', 'v1', datetime('now'))`
    ).bind(jobId, `system:revalidate`, domain, `https://${domain}`).run();

    await env.EXTRACT_BRAND.create({
      id: jobId,
      params: { url: `https://${domain}`, jobId, userId: `system:revalidate` },
    });

    await env.CACHE.put(globalKey, String(globalCount + 1), { expirationTtl: 3600 });
  } catch {
    // Non-fatal — stale data is still served
  }
}

// ─── SEO Meta ────────────────────────────────────────────────────────────

export function meta({ data }: Route.MetaArgs) {
  if (!data) return [{ title: "Brand Not Found — ExtractVibe" }];
  const { domain, kit } = data;
  if (!kit) {
    return [
      { title: `${domain} Brand Kit — ExtractVibe` },
      {
        name: "description",
        content: `Extract the brand kit for ${domain}: colors, typography, tone of voice, and more. Powered by ExtractVibe.`,
      },
    ];
  }
  return [
    { title: `${domain} Brand Kit — Colors, Fonts, Voice | ExtractVibe` },
    {
      name: "description",
      content: `Comprehensive brand kit for ${domain}: colors, typography, tone of voice, brand rules, and more. Extracted by ExtractVibe.`,
    },
    { property: "og:title", content: `${domain} Brand Kit — ExtractVibe` },
    {
      property: "og:description",
      content: `Colors, fonts, voice, and vibe for ${domain}`,
    },
  ];
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function cleanBrandName(name?: string): string {
  if (!name) return "Unknown Brand";
  return name
    .replace(
      /\s*[\|–—-]\s*(Home|Homepage|Website|Official Site|Official Website)$/i,
      ""
    )
    .trim();
}

function getAllColors(mode?: ColorMode): { key: string; color: ColorValue }[] {
  if (!mode) return [];
  return Object.entries(mode)
    .filter(([, v]) => v && (v as ColorValue).hex)
    .map(([key, v]) => ({ key, color: v as ColorValue }));
}

// ─── Lazy chart imports (client-only, SSR-safe) ──────────────────────────

import { lazy, Suspense } from "react";

const LazyColorDonut = lazy(() => import("~/components/charts/color-donut"));
const LazyPersonalityRadar = lazy(() => import("~/components/charts/personality-radar"));

function ColorDonut({ colors }: { colors: { key: string; color: ColorValue }[] }) {
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || hasError) return <div className="aspect-square w-full max-w-[180px]" />;

  const unique = colors.filter((c, i, arr) => {
    if (!c.color.hex) return false;
    return arr.findIndex((a) => a.color.hex === c.color.hex) === i;
  });
  if (unique.length === 0) return null;

  const ariaLabel = `Color palette: ${unique.map((c) => c.color.hex).join(", ")}`;

  return (
    <ErrorCatcher onError={() => setHasError(true)}>
      <Suspense fallback={<div className="aspect-square w-full max-w-[180px]" />}>
        <div className="aspect-square w-full max-w-[180px]">
          <LazyColorDonut colors={unique} ariaLabel={ariaLabel} />
        </div>
      </Suspense>
    </ErrorCatcher>
  );
}

function PersonalityRadar({ spectrum }: { spectrum: ToneSpectrum }) {
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || hasError) return <div className="aspect-square w-full max-w-[280px]" />;

  const traits: string[] = [];
  if (spectrum.formalCasual != null) traits.push(`Casual ${spectrum.formalCasual}`);
  if (spectrum.playfulSerious != null) traits.push(`Serious ${spectrum.playfulSerious}`);
  if (spectrum.enthusiasticMatterOfFact != null) traits.push(`Direct ${spectrum.enthusiasticMatterOfFact}`);
  if (spectrum.respectfulIrreverent != null) traits.push(`Bold ${spectrum.respectfulIrreverent}`);
  if (spectrum.technicalAccessible != null) traits.push(`Accessible ${spectrum.technicalAccessible}`);
  const ariaLabel = `Brand personality: ${traits.join(", ")}`;

  return (
    <ErrorCatcher onError={() => setHasError(true)}>
      <Suspense fallback={<div className="aspect-square w-full max-w-[280px]" />}>
        <div className="aspect-square w-full max-w-[280px]">
          <LazyPersonalityRadar spectrum={spectrum} ariaLabel={ariaLabel} />
        </div>
      </Suspense>
    </ErrorCatcher>
  );
}

/** Simple error boundary to catch chart hydration failures gracefully */
class ErrorCatcher extends React.Component<
  { children: React.ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────

function buildFontStack(family: FontFamily): string {
  const parts = [JSON.stringify(family.name)];
  if (family.fallbackStack) {
    parts.push(family.fallbackStack);
  }
  parts.push("system-ui", "sans-serif");
  return parts.join(", ");
}

function ColorBar({ color, label }: { color: ColorValue; label: string }) {
  const hex = color.hex || "#000000";
  return (
    <div className="flex min-w-[60px] flex-1 flex-col">
      <div
        className="h-20 w-full first:rounded-l-lg last:rounded-r-lg"
        style={{ backgroundColor: hex }}
      />
      <div className="mt-2 text-center">
        <p className="font-mono text-[11px] font-medium">{hex}</p>
        <p className="text-[10px] capitalize text-[hsl(var(--muted-foreground))]">
          {label}
        </p>
      </div>
    </div>
  );
}

function ColorStrip({
  colors,
  label,
}: {
  colors: { key: string; color: ColorValue }[];
  label?: string;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
          {label}
        </p>
      )}
      <div className="scrollbar-none overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <div className="flex min-w-0 overflow-hidden rounded-xl border border-[hsl(var(--border))]" style={{ minWidth: `${Math.max(colors.length * 60, 0)}px` }}>
          {colors.map(({ key, color }) => (
            <div key={key} className="min-w-[60px] flex-1">
              <div
                className="h-24 w-full border-r border-[hsl(var(--border))]/30 last:border-r-0"
                style={{ backgroundColor: color.hex || "#000000" }}
              />
            </div>
          ))}
        </div>
        <div className="flex" style={{ minWidth: `${Math.max(colors.length * 60, 0)}px` }}>
          {colors.map(({ key, color }) => (
            <div key={key} className="min-w-[60px] flex-1 text-center">
              <p className="font-mono text-[11px] font-medium">{color.hex}</p>
              <p className="text-[10px] capitalize text-[hsl(var(--muted-foreground))]">
                {color.role || key}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FontFamilyCard({ family }: { family: FontFamily }) {
  return (
    <div className="space-y-2 rounded-xl border border-[hsl(var(--border))] p-4">
      <div className="flex items-start justify-between gap-2">
        <h4
          className="text-lg font-semibold"
          style={{ fontFamily: buildFontStack(family) }}
        >
          {family.name || "Unknown"}
        </h4>
        <div className="flex gap-1.5">
          {family.role && (
            <Badge variant="secondary" className="text-[10px]">
              {family.role}
            </Badge>
          )}
        </div>
      </div>
      {family.weights && family.weights.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {family.weights.map((w) => (
            <Badge key={w} variant="outline" className="text-xs tabular-nums">
              {w}
            </Badge>
          ))}
        </div>
      )}
      {family.source && (
        <Badge variant="outline" className="text-[10px]">
          {family.source}
        </Badge>
      )}
      {family.fallbackStack && (
        <p className="break-all font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
          {family.fallbackStack}
        </p>
      )}
    </div>
  );
}

function TypeScalePreview({ scale, families }: { scale: TypeScale; families?: FontFamily[] }) {
  const sizeMap: Record<string, string> = {
    h1: "text-3xl",
    h2: "text-2xl",
    h3: "text-xl",
    h4: "text-lg",
    h5: "text-base",
    h6: "text-sm",
    body: "text-base",
    small: "text-sm",
    caption: "text-xs",
  };

  const fontStackLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const fam of families || []) {
      map.set(fam.name || "", buildFontStack(fam));
    }
    return map;
  }, [families]);

  function getFontStack(entry: TypeScaleEntry): string {
    if (entry.fontFamily) {
      const stack = fontStackLookup.get(entry.fontFamily);
      if (stack) return stack;
      return `${JSON.stringify(entry.fontFamily)}, system-ui, sans-serif`;
    }
    const first = families?.[0];
    return first ? buildFontStack(first) : "system-ui, sans-serif";
  }

  const entries = useMemo(
    () => Object.entries(scale).filter(
      ([, v]) => v && (v as TypeScaleEntry).fontSize
    ) as [string, TypeScaleEntry][],
    [scale]
  );

  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      {entries.map(([level, entry]) => (
        <div
          key={level}
          className="flex items-center gap-3 overflow-hidden rounded-xl border border-[hsl(var(--border))] px-3 py-3 sm:gap-4 sm:px-4"
        >
          <Badge variant="outline" className="w-14 shrink-0 justify-center font-mono text-xs sm:w-16">
            {level}
          </Badge>
          <p
            className={cn(
              sizeMap[level] || "text-base",
              "flex-1 leading-tight"
            )}
            style={{
              fontFamily: getFontStack(entry),
              fontWeight: entry.fontWeight || undefined,
              letterSpacing: entry.letterSpacing || undefined,
            }}
          >
            The quick brown fox
          </p>
          <span className="hidden text-xs text-[hsl(var(--muted-foreground))] sm:block">
            {entry.fontSize}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Developer Access ────────────────────────────────────────────────────

function DeveloperAccess({ domain, jobId }: { domain: string; jobId?: string }) {
  const [tab, setTab] = useState(0);

  const resultEndpoint = jobId
    ? `https://extractvibe.com/api/extract/${jobId}/result`
    : `https://extractvibe.com/api/brand/${domain}`;

  const tabs = [
    {
      label: "cURL",
      language: "bash",
      code: `# Fetch the full brand kit
curl ${resultEndpoint} \\
  -H "x-api-key: ev_your_key"

# Export as CSS variables
curl ${resultEndpoint.replace("/result", "/export/css").replace(`/brand/${domain}`, "/extract/JOB_ID/export/css")} \\
  -H "x-api-key: ev_your_key"

# Export as Tailwind config
curl ${resultEndpoint.replace("/result", "/export/tailwind").replace(`/brand/${domain}`, "/extract/JOB_ID/export/tailwind")} \\
  -H "x-api-key: ev_your_key"`,
    },
    {
      label: "JavaScript",
      language: "javascript",
      code: `const res = await fetch("${resultEndpoint}", {
  headers: { "x-api-key": "ev_your_key" },
});
const kit = await res.json();

// Access brand data
console.log(kit.colors.semantic.lightMode);  // { primary, secondary, accent, ... }
console.log(kit.typography.families);         // [{ name, weights, source }]
console.log(kit.voice.toneSpectrum);          // { formal, playful, ... }
console.log(kit.vibe.tags);                   // ["minimal", "technical", ...]`,
    },
    {
      label: "Python",
      language: "python",
      code: `import requests

kit = requests.get("${resultEndpoint}",
    headers={"x-api-key": "ev_your_key"}).json()

# Access brand data
print(kit["colors"]["semantic"]["lightMode"])  # primary, secondary, accent...
print(kit["typography"]["families"])            # font names, weights, sources
print(kit["voice"]["toneSpectrum"])             # formal, playful, technical...
print(kit["vibe"]["tags"])                      # minimal, technical, clean...`,
    },
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <details className="rounded-xl border border-[hsl(var(--border))] p-5">
        <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium">
          <Code2 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          Developer Access
        </summary>
        <div className="mt-4">
          <div className="flex gap-1 rounded-lg bg-[hsl(var(--muted))] p-1">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setTab(i)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === i
                    ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <CodeBlock
              code={tabs[tab].code}
              language={tabs[tab].language}
              title={tabs[tab].label}
            />
          </div>
        </div>
      </details>
    </section>
  );
}

// ─── Floating View Toggle ────────────────────────────────────────────────

type ViewMode = "visual" | "json";

function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0"
      )}
      style={{ transitionDuration: "400ms", transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
    >
      <div className="flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 p-1 shadow-lg shadow-black/5 backdrop-blur-xl">
        <button
          onClick={() => onChange("visual")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all",
            mode === "visual"
              ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-sm"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
          style={{ transitionDuration: "200ms", transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
        >
          <Eye className="h-3.5 w-3.5" />
          Visual
        </button>
        <button
          onClick={() => onChange("json")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all",
            mode === "json"
              ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-sm"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
          style={{ transitionDuration: "200ms", transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
        >
          <Braces className="h-3.5 w-3.5" />
          JSON
        </button>
      </div>
    </div>
  );
}

// ─── JSON / API View ────────────────────────────────────────────────────

function JsonApiView({ kit, domain }: { kit: ExtractVibeBrandKit; domain: string }) {
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["meta", "identity", "colors", "typography", "voice", "vibe", "rules"])
  );

  const fullJson = useMemo(() => JSON.stringify(kit, null, 2), [kit]);

  const sections = useMemo(() => {
    const keys = Object.keys(kit) as (keyof ExtractVibeBrandKit)[];
    return keys
      .filter((k) => kit[k] !== undefined && kit[k] !== null)
      .map((key) => ({
        key,
        json: JSON.stringify(kit[key], null, 2),
        lineCount: JSON.stringify(kit[key], null, 2).split("\n").length,
      }));
  }, [kit]);

  const handleCopyAll = useCallback(() => {
    navigator.clipboard.writeText(fullJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fullJson]);

  const handleCopySection = useCallback((json: string) => {
    navigator.clipboard.writeText(json);
  }, []);

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleDownload = useCallback(() => {
    const blob = new Blob([fullJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${domain}-brand-kit.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fullJson, domain]);

  const sectionLabels: Record<string, string> = {
    meta: "Metadata",
    identity: "Identity",
    logos: "Logos",
    ogImage: "OG Image",
    colors: "Colors",
    typography: "Typography",
    spacing: "Spacing",
    buttons: "Buttons",
    effects: "Effects",
    designAssets: "Design Assets",
    voice: "Voice & Tone",
    rules: "Brand Rules",
    vibe: "Vibe",
    officialGuidelines: "Official Guidelines",
    iconLibrary: "Icon Library",
  };

  return (
    <div className="min-h-screen bg-neutral-950 pb-24">
      {/* Sticky toolbar */}
      <div className="sticky top-[65px] z-40 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-neutral-500">
              {domain}
            </span>
            <span className="text-neutral-700">/</span>
            <span className="font-mono text-xs text-neutral-400">
              brand-kit.json
            </span>
            <span className="rounded-md bg-neutral-800 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500">
              v1
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
            >
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy all"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* API quick reference */}
      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="shrink-0 rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-400">
              GET
            </span>
            <code className="min-w-0 break-all font-mono text-xs text-neutral-300">
              https://extractvibe.com/api/brand/{domain}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(`curl https://extractvibe.com/api/brand/${domain}`)}
              className="ml-auto shrink-0 rounded-md p-1.5 text-neutral-600 transition-colors hover:bg-neutral-800 hover:text-neutral-400"
              aria-label="Copy curl command"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="mx-auto max-w-4xl px-4 pt-4 sm:px-6">
        <div className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900/30">
          {sections.map(({ key, json, lineCount }) => {
            const expanded = expandedSections.has(key);
            return (
              <div key={key}>
                <button
                  onClick={() => toggleSection(key)}
                  className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-800/30"
                >
                  {expanded ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
                  )}
                  <span className="font-mono text-sm text-sky-400">
                    &quot;{key}&quot;
                  </span>
                  <span className="font-mono text-xs text-neutral-600">
                    {sectionLabels[key] || key}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-neutral-700">
                    {lineCount} lines
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopySection(json);
                    }}
                    className="rounded p-1 text-neutral-700 opacity-0 transition-all hover:bg-neutral-700 hover:text-neutral-400 group-hover:opacity-100"
                    aria-label={`Copy ${key}`}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </button>
                {expanded && (
                  <div className="border-t border-neutral-800/50 bg-neutral-950/50">
                    <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-relaxed">
                      <code
                        className="font-mono text-neutral-300"
                        dangerouslySetInnerHTML={{ __html: highlightJsonString(json) }}
                      />
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Export formats */}
      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
        <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-600">
          Export formats
        </p>
        <div className="grid gap-2 sm:grid-cols-4">
          {["css", "tailwind", "markdown", "tokens"].map((fmt) => (
            <a
              key={fmt}
              href={`/api/brand/${domain}`}
              onClick={(e) => {
                e.preventDefault();
                // Can't export from /brand endpoint — show the format name
              }}
              className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/30 px-3 py-2.5 font-mono text-xs text-neutral-400 transition-colors hover:border-neutral-700 hover:text-neutral-300"
            >
              <Download className="h-3 w-3 text-neutral-600" />
              .{fmt}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Inline JSON syntax highlighter for the collapsible view */
function highlightJsonString(code: string): string {
  return code.split("\n").map(line => {
    const escaped = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped
      .replace(/^(\s*)("[\w\-]+")(:\s)/gm, '$1<span class="text-sky-400">$2</span>$3')
      .replace(/(:\s*)("(?:[^"\\]|\\.)*")/g, '$1<span class="text-emerald-400">$2</span>')
      .replace(/(:\s*)(\d+(?:\.\d+)?)/g, '$1<span class="text-amber-400">$2</span>')
      .replace(/\b(true|false|null)\b/g, '<span class="text-violet-400">$1</span>');
  }).join("\n");
}

// ─── Page Component ──────────────────────────────────────────────────────

export default function PublicBrandPage({
  loaderData,
}: Route.ComponentProps) {
  const { kit, domain, status, jobId } = loaderData;
  const revalidator = useRevalidator();
  const [viewMode, setViewMode] = useState<ViewMode>("visual");

  // Poll for extraction completion when in extracting state
  useEffect(() => {
    if (status !== "extracting" || !jobId) return;
    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        await new Promise((r) => setTimeout(r, 3000));
        if (cancelled) break;
        try {
          const res = await fetch(`/api/extract/${jobId}`);
          if (!res.ok) continue;
          const data = await res.json() as { status: string };
          if (data.status === "complete") {
            revalidator.revalidate();
            return;
          }
          if (data.status === "failed" || data.status === "error") {
            return; // Stop polling on failure
          }
        } catch {
          // Network error — keep polling
        }
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [status, jobId, revalidator]);

  if (!kit) {
    const isExtracting = status === "extracting";
    const isRateLimited = status === "rate_limited";
    return (
      <div className="min-h-screen bg-[hsl(var(--background))]">
        <nav className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/extract-vibe-logo.svg" alt="ExtractVibe" className="h-8 w-8" />
              <span className="text-lg font-bold">ExtractVibe</span>
            </Link>
            <Button asChild size="sm">
              <Link to="/sign-up">Get started</Link>
            </Button>
          </div>
        </nav>

        <div className="mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
          {isExtracting ? (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-[hsl(var(--muted-foreground))]" />
              <h1 className="mt-6 font-display text-2xl font-bold tracking-tight md:text-3xl">
                Extracting {domain}
              </h1>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                Analyzing colors, typography, voice, and more. This usually takes 30–60 seconds.
              </p>
              <div className="mx-auto mt-10 h-1 w-48 overflow-hidden rounded-full bg-[hsl(var(--border))]">
                <div className="h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-[hsl(var(--foreground))]/20" />
              </div>
            </>
          ) : isRateLimited ? (
            <>
              <Globe className="mx-auto h-10 w-10 text-[hsl(var(--muted-foreground))]" />
              <h1 className="mt-6 font-display text-2xl font-bold tracking-tight md:text-3xl">
                {domain}
              </h1>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                This brand has been requested recently. Please try again in a few minutes.
              </p>
            </>
          ) : (
            <>
              <Globe className="mx-auto h-10 w-10 text-[hsl(var(--muted-foreground))]" />
              <h1 className="mt-6 font-display text-2xl font-bold tracking-tight md:text-3xl">
                {domain}
              </h1>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                Something went wrong starting the extraction. Try again later.
              </p>
            </>
          )}
        </div>

        <MarketingFooter />
      </div>
    );
  }

  const { identity, colors, typography, voice, rules, vibe } = kit;

  const brandName = cleanBrandName(identity?.brandName);

  const lightColors = getAllColors(colors?.lightMode);
  const darkColors = getAllColors(colors?.darkMode);
  const allDisplayColors = lightColors.length > 0 ? lightColors : darkColors;

  const toneSpectrum = voice?.toneSpectrum;

  const hasButtons = kit.buttons?.styles && kit.buttons.styles.length > 0;
  const hasShadows = (kit.effects?.shadows?.length || 0) > 0;
  const hasGradients = (kit.effects?.gradients?.length || 0) > 0;
  const hasDesignSystem = hasButtons || hasShadows || hasGradients;

  const hasVibe =
    vibe &&
    ((vibe.visualEnergy !== undefined && vibe.visualEnergy !== null) ||
      vibe.designEra ||
      vibe.emotionalTone ||
      vibe.targetAudienceInferred ||
      (vibe.comparableBrands && vibe.comparableBrands.length > 0));

  return (
    <div className={cn("min-h-screen", viewMode === "json" ? "bg-neutral-950" : "bg-[hsl(var(--background))]")}>
      {/* ─── Header ───────────────────────────────────────────────────── */}
      <nav className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md",
        viewMode === "json"
          ? "border-neutral-800 bg-neutral-950/80"
          : "border-[hsl(var(--border))] bg-[hsl(var(--background))]/80"
      )}>
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/extract-vibe-logo.svg" alt="ExtractVibe" className="h-8 w-8" />
            <span className={cn("text-lg font-bold", viewMode === "json" && "text-neutral-100")}>ExtractVibe</span>
          </Link>
          <Button asChild size="sm">
            <Link to="/sign-up">Extract your brand</Link>
          </Button>
        </div>
      </nav>

      <ViewToggle mode={viewMode} onChange={setViewMode} />

      {viewMode === "json" ? (
        <JsonApiView kit={kit} domain={domain} />
      ) : (
      <>
      {/* ─── Hero Banner ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* OG image as blurred background tint */}
        {kit.ogImage && (
          <div className="absolute inset-0 z-0">
            <img
              src={kit.ogImage}
              alt=""
              className="h-full w-full object-cover opacity-[0.07] blur-2xl"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--background))]/60 to-[hsl(var(--background))]" />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 pb-16 pt-12 md:pb-20 md:pt-16">
          {/* Logo on checkerboard */}
          {kit.logos && kit.logos.length > 0 && kit.logos[0].url && (
            <div className="mb-6 inline-flex items-center justify-center rounded-lg bg-checkerboard p-3">
              <img
                src={kit.logos[0].url}
                alt={`${domain} logo`}
                className="h-8 w-auto"
                loading="lazy"
              />
            </div>
          )}

          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {brandName}
          </h1>

          <a
            href={`https://${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
          >
            <Globe className="h-3.5 w-3.5" />
            {domain}
          </a>

          {/* Vibe summary */}
          {vibe?.summary && (
            <p className="mt-8 max-w-prose text-lg leading-relaxed text-[hsl(var(--muted-foreground))] md:text-xl">
              &ldquo;{vibe.summary}&rdquo;
            </p>
          )}

          {/* Tags */}
          {vibe?.tags && vibe.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {vibe.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      <main>
        {/* ─── Color Palette ────────────────────────────────────────────── */}
        {allDisplayColors.length > 0 && (
          <>
            <hr className="border-[hsl(var(--border))]" />
            <section className="bg-checkerboard">
              <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 md:py-20">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                Color Palette
              </p>
              <h2 className="mt-2 text-xl font-semibold">Colors</h2>

              <div className="mt-8 flex flex-col gap-10 md:flex-row md:items-start">
                {/* Donut chart */}
                {allDisplayColors.length >= 3 && (
                  <div className="flex-shrink-0 self-center md:self-start">
                    <ColorDonut colors={allDisplayColors} />
                  </div>
                )}

                {/* Color strips */}
                <div className="flex-1 space-y-8">
                  {lightColors.length > 0 && (
                    <ColorStrip
                      colors={lightColors}
                      label={darkColors.length > 0 ? "Light Mode" : undefined}
                    />
                  )}
                  {darkColors.length > 0 && (
                    <ColorStrip
                      colors={darkColors}
                      label={lightColors.length > 0 ? "Dark Mode" : undefined}
                    />
                  )}
                </div>
              </div>
              </div>
            </section>
          </>
        )}

        {/* ─── Typography ───────────────────────────────────────────────── */}
        {typography &&
          ((typography.families && typography.families.length > 0) ||
            typography.scale) && (
            <>
              <hr className="border-[hsl(var(--border))]" />
              <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16 md:py-20">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  Typography
                </p>
                <h2 className="mt-2 text-xl font-semibold">Fonts</h2>

                <div className="mt-8 grid gap-10 md:grid-cols-2">
                  {/* Left: font families */}
                  {typography.families && typography.families.length > 0 && (
                    <div className="space-y-3">
                      {typography.families.map((family: FontFamily, idx: number) => (
                        <FontFamilyCard key={family.name || idx} family={family} />
                      ))}
                    </div>
                  )}

                  {/* Right: type scale */}
                  {typography.scale && (
                    <div>
                      <TypeScalePreview scale={typography.scale} families={typography.families} />
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

        {/* ─── Design System (Buttons + Effects) ────────────────────────── */}
        {hasDesignSystem && (
          <>
            <hr className="border-[hsl(var(--border))]" />
            <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 md:py-14">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                Components
              </p>
              <h2 className="mt-2 text-xl font-semibold">Design System</h2>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Buttons — each in its own card */}
                {hasButtons && kit.buttons!.styles.map((btn: ButtonStyle, i: number) => (
                  <div key={`btn-${i}`} className="flex flex-col rounded-xl border border-[hsl(var(--border))] overflow-hidden">
                    {/* Preview area */}
                    <div className="flex flex-1 items-center justify-center bg-checkerboard px-5 py-8">
                      <span
                        className="inline-flex items-center justify-center text-sm"
                        style={{
                          backgroundColor: btn.backgroundColor || "transparent",
                          color: btn.textColor || "inherit",
                          borderRadius: btn.borderRadius || "4px",
                          borderWidth: btn.borderWidth || (btn.borderColor ? "1px" : "0"),
                          borderStyle: btn.borderWidth ? "solid" : btn.borderColor ? "solid" : "none",
                          borderColor: btn.borderColor || "transparent",
                          padding: btn.padding || "10px 20px",
                          fontSize: btn.fontSize || "14px",
                          fontWeight: btn.fontWeight || 400,
                          boxShadow: btn.boxShadow || "none",
                        }}
                      >
                        {btn.sampleText || btn.variant}
                      </span>
                    </div>
                    {/* Specs */}
                    <div className="border-t border-[hsl(var(--border))] px-4 py-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] capitalize">{btn.variant}</Badge>
                        {btn.borderRadius && <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{btn.borderRadius}</span>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
                        {btn.backgroundColor && (
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2.5 w-2.5 rounded-full border border-[hsl(var(--border))]" style={{ backgroundColor: btn.backgroundColor }} />
                            {btn.backgroundColor}
                          </span>
                        )}
                        {btn.textColor && (
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2.5 w-2.5 rounded-full border border-[hsl(var(--border))]" style={{ backgroundColor: btn.textColor }} />
                            {btn.textColor}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Shadows — each in its own card */}
                {hasShadows && kit.effects!.shadows.map((shadow: ShadowValue, i: number) => (
                  <div key={`shadow-${i}`} className="flex flex-col rounded-xl border border-[hsl(var(--border))] overflow-hidden">
                    <div className="flex flex-1 items-center justify-center bg-checkerboard p-6">
                      <div
                        className="h-20 w-full rounded-xl bg-white"
                        style={{ boxShadow: shadow.value }}
                      />
                    </div>
                    <div className="border-t border-[hsl(var(--border))] px-4 py-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] capitalize">{shadow.context || "shadow"}</Badge>
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">box-shadow</span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 break-all font-mono text-[10px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                        {shadow.value}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Gradients — each in its own card */}
                {hasGradients && kit.effects!.gradients.slice(0, 6).map((gradient: GradientValue, i: number) => (
                  <div key={`grad-${i}`} className="flex flex-col rounded-xl border border-[hsl(var(--border))] overflow-hidden">
                    <div className="h-28 w-full bg-checkerboard">
                      <div
                        className="h-full w-full"
                        style={{ backgroundImage: gradient.value }}
                      />
                    </div>
                    <div className="border-t border-[hsl(var(--border))] px-4 py-3">
                      <Badge variant="outline" className="text-[10px]">gradient</Badge>
                      <p className="mt-1.5 line-clamp-2 break-all font-mono text-[10px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                        {gradient.value.slice(0, 80)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ─── Voice & Personality ──────────────────────────────────────── */}
        {toneSpectrum &&
          (toneSpectrum.formalCasual !== undefined ||
            toneSpectrum.playfulSerious !== undefined ||
            toneSpectrum.enthusiasticMatterOfFact !== undefined ||
            toneSpectrum.respectfulIrreverent !== undefined ||
            toneSpectrum.technicalAccessible !== undefined) && (
            <>
              <hr className="border-[hsl(var(--border))]" />
              <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16 md:py-20">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  Voice & Tone
                </p>
                <h2 className="mt-2 text-xl font-semibold">Personality</h2>

                {/* Radar chart */}
                <div className="mt-10 flex justify-center">
                  <div className="w-full max-w-sm rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:p-6 md:p-10">
                    <div className="flex justify-center">
                      <PersonalityRadar spectrum={toneSpectrum} />
                    </div>
                  </div>
                </div>

                {/* Vibe details as a structured grid of cards */}
                {hasVibe && (
                  <div className="mt-12 grid gap-4 sm:grid-cols-3">
                    {vibe!.visualEnergy !== undefined && vibe!.visualEnergy !== null && (
                      <div className="rounded-xl border border-[hsl(var(--border))] p-5">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                          Visual Energy
                        </p>
                        <div className="mt-3 flex items-end gap-1">
                          <span className="text-3xl font-bold tabular-nums leading-none">
                            {vibe!.visualEnergy}
                          </span>
                          <span className="mb-0.5 text-sm text-[hsl(var(--muted-foreground))]">/10</span>
                        </div>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                          <div
                            className="h-full rounded-full bg-[hsl(var(--foreground))]"
                            style={{ width: `${(vibe!.visualEnergy / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {vibe!.designEra && (
                      <div className="rounded-xl border border-[hsl(var(--border))] p-5">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                          Design Era
                        </p>
                        <p className="mt-3 text-lg font-semibold capitalize leading-tight">
                          {vibe!.designEra}
                        </p>
                      </div>
                    )}
                    {vibe!.emotionalTone && (
                      <div className="rounded-xl border border-[hsl(var(--border))] p-5">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                          Emotional Tone
                        </p>
                        <p className="mt-3 text-lg font-semibold capitalize leading-tight">
                          {vibe!.emotionalTone}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Audience and comparable brands below */}
                {hasVibe && (vibe!.targetAudienceInferred || (vibe!.comparableBrands && vibe!.comparableBrands.length > 0)) && (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {vibe!.targetAudienceInferred && (
                      <div className="rounded-xl border border-[hsl(var(--border))] p-5">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                          Target Audience
                        </p>
                        <p className="mt-3 text-sm leading-relaxed">
                          {vibe!.targetAudienceInferred}
                        </p>
                      </div>
                    )}
                    {vibe!.comparableBrands && vibe!.comparableBrands.length > 0 && (
                      <div className="rounded-xl border border-[hsl(var(--border))] p-5">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                          Comparable Brands
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {vibe!.comparableBrands.map((brand: string) => (
                            <Badge key={brand} variant="outline">{brand}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          )}

        {/* ─── Brand Guidelines ────────────────────────────────────────── */}
        {rules &&
          ((rules.dos && rules.dos.length > 0) ||
            (rules.donts && rules.donts.length > 0)) && (
            <>
              <hr className="border-[hsl(var(--border))]" />
              <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16 md:py-20">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  Brand Rules
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  Dos & Don&apos;ts
                </h2>

                <div className="mt-8 grid gap-0 sm:grid-cols-2">
                  {/* Dos */}
                  {rules.dos && rules.dos.length > 0 && (
                    <div className="space-y-3 border-r-0 pb-6 pr-0 sm:border-r sm:border-[hsl(var(--border))] sm:pb-0 sm:pr-8">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--success))]">
                        Do
                      </h4>
                      <ul className="space-y-4">
                        {rules.dos.map((rule: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-3"
                          >
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
                            <span className="text-sm leading-relaxed">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Don'ts */}
                  {rules.donts && rules.donts.length > 0 && (
                    <div className="space-y-3 border-t border-[hsl(var(--border))] pt-6 sm:border-t-0 sm:pl-8 sm:pt-0">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--destructive))]">
                        Don&apos;t
                      </h4>
                      <ul className="space-y-4">
                        {rules.donts.map((rule: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-3"
                          >
                            <X className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--destructive))]" />
                            <span className="text-sm leading-relaxed">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

        {/* ─── Assets (horizontal scroll strip) ─────────────────────────── */}
        {kit.designAssets && kit.designAssets.length > 0 && (
          <>
            <hr className="border-[hsl(var(--border))]" />
            <section className="py-10 md:py-14">
              <div className="mx-auto max-w-4xl px-4 sm:px-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  Design Assets
                </p>
                <h2 className="mt-2 text-xl font-semibold">Visual Elements</h2>
              </div>

              <div className="scrollbar-none mt-6 flex gap-4 overflow-x-auto px-4 sm:px-6 pb-2 md:px-[max(1.5rem,calc((100%-56rem)/2+1.5rem))]">
                {kit.designAssets.slice(0, 12).map((asset: BrandDesignAsset, i: number) => (
                  <div
                    key={i}
                    className="w-48 sm:w-[220px] shrink-0 overflow-hidden rounded-xl border border-[hsl(var(--border))]"
                  >
                    <div className="flex h-36 items-center justify-center bg-checkerboard p-3">
                      <img
                        src={asset.src}
                        alt={asset.alt || "Design asset"}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex items-center justify-between border-t border-[hsl(var(--border))] px-3 py-2 text-[10px] text-[hsl(var(--muted-foreground))]">
                      <span className="font-mono uppercase">{asset.format}</span>
                      {asset.width && asset.height && (
                        <span className="tabular-nums">
                          {asset.width}&times;{asset.height}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ─── Developer Access ───────────────────────────────────────── */}
        <hr className="border-[hsl(var(--border))]" />
        <DeveloperAccess domain={domain} />

        {/* ─── CTA ────────────────────────────────────────────────────── */}
        <hr className="border-[hsl(var(--border))]" />
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center md:py-28">
          <h2 className="font-display text-xl font-semibold tracking-tight md:text-2xl">
            Extract your own brand kit
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[hsl(var(--muted-foreground))]">
            Get colors, fonts, voice, and personality from any website in
            seconds. Open source.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="h-12 px-8">
              <Link to="/sign-up">Get started free</Link>
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
      </>
      )}
    </div>
  );
}
