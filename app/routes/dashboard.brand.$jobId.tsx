import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  Loader2,
  Download,
  RefreshCw,
  Check,
  ExternalLink,
  Globe,
  Clock,
  Image,
  Zap,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronDown,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { api } from "~/lib/api";
import { cn } from "~/lib/utils";
import type {
  ExtractVibeBrandKit,
  ColorValue,
  ColorMode,
  ToneSpectrum,
  TypeScaleEntry,
  FontFamily,
  ButtonStyle,
  BrandButtons,
  ShadowValue,
  GradientValue,
  BrandEffects,
  BrandDesignAsset,
} from "../../server/schema/v1";

export function meta() {
  return [{ title: "Brand Kit — ExtractVibe" }];
}

// ─── Helpers ────────────────────────────────────────────────────────────

function formatDuration(ms?: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function cleanBrandName(name?: string): string {
  if (!name) return "Unknown Brand";
  // Strip common title tag suffixes like " | Home", " - Dashboard", etc.
  return name
    .replace(/\s*[\|–—-]\s*(Home|Homepage|Website|Official Site|Official Website)$/i, "")
    .trim();
}

function resolveLogoUrl(originalUrl?: string, domain?: string): string {
  if (!originalUrl) return "";
  if (originalUrl.startsWith("http")) return originalUrl;
  if (originalUrl.startsWith("//")) return `https:${originalUrl}`;
  if (domain) return `https://${domain}${originalUrl.startsWith("/") ? "" : "/"}${originalUrl}`;
  return originalUrl;
}

function rgbToString(rgb?: { r: number; g: number; b: number }): string {
  if (!rgb) return "";
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

function confidencePercent(c?: number): string {
  if (c === undefined || c === null) return "";
  return `${Math.round(c * 100)}%`;
}

// ─── Clipboard Copy Hook ────────────────────────────────────────────────

function useCopyToClipboard() {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedValue(text);
      setTimeout(() => setCopiedValue(null), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedValue(text);
      setTimeout(() => setCopiedValue(null), 2000);
    }
  }, []);

  return { copiedValue, copy };
}

// ─── Numbered Section Label ─────────────────────────────────────────────

function SectionLabel({
  number,
  label,
  title,
}: {
  number: string;
  label: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
        {number} / {label}
      </p>
      <h2 className="mt-3 font-display text-2xl font-bold">{title}</h2>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────

function ColorSwatch({
  color,
  onCopy,
  copiedValue,
}: {
  color: ColorValue;
  onCopy: (text: string) => void;
  copiedValue: string | null;
}) {
  const hex = color.hex || "#000000";
  const isCopied = copiedValue === hex;

  return (
    <button
      type="button"
      onClick={() => onCopy(hex)}
      className="group flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-[hsl(var(--muted))]/60"
      title={`Click to copy ${hex}`}
    >
      <div
        className="relative h-16 w-16 rounded-xl border border-[hsl(var(--border))] transition-transform group-hover:scale-105"
        style={{ backgroundColor: hex }}
      >
        {isCopied && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
            <Check className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="font-mono text-xs font-medium">{hex}</p>
        {color.role && (
          <p className="text-[10px] capitalize text-[hsl(var(--muted-foreground))]">
            {color.role}
          </p>
        )}
        {color.rgb && (
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity group-hover:opacity-100">
            rgb({rgbToString(color.rgb)})
          </p>
        )}
      </div>
    </button>
  );
}

function ToneBar({
  label,
  leftLabel,
  rightLabel,
  value,
}: {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value?: number;
  accentColor?: string;
}) {
  if (value === undefined || value === null) return null;
  const percentage = ((value - 1) / 9) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
        <span>{leftLabel}</span>
        <span className="font-medium text-[hsl(var(--foreground))]">{label}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-[hsl(var(--muted))]">
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--foreground))]"
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ConfidenceBar({
  confidence,
}: {
  confidence?: number;
  accentColor?: string;
}) {
  if (confidence === undefined || confidence === null) return null;
  const percent = Math.round(confidence * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-[hsl(var(--muted))]">
        <div
          className="h-full rounded-full bg-[hsl(var(--foreground))] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-[hsl(var(--muted-foreground))]">
        {percent}%
      </span>
    </div>
  );
}

// ─── Color Mode Section ─────────────────────────────────────────────────

function ColorModeSection({
  mode,
  label,
  onCopy,
  copiedValue,
}: {
  mode?: ColorMode;
  label: string;
  onCopy: (text: string) => void;
  copiedValue: string | null;
}) {
  if (!mode) return null;

  const entries = Object.entries(mode).filter(
    ([, v]) => v && (v as ColorValue).hex
  ) as [string, ColorValue][];

  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
        {label}
      </h4>
      <div className="flex flex-wrap gap-1">
        {entries.map(([key, color]) => (
          <ColorSwatch
            key={key}
            color={{ ...color, role: color.role || key }}
            onCopy={onCopy}
            copiedValue={copiedValue}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Type Scale Entry ───────────────────────────────────────────────────

function TypeScaleRow({
  level,
  entry,
  families,
}: {
  level: string;
  entry: TypeScaleEntry;
  families?: FontFamily[];
}) {
  const sizeMap: Record<string, string> = {
    h1: "text-4xl",
    h2: "text-3xl",
    h3: "text-2xl",
    h4: "text-xl",
    h5: "text-lg",
    h6: "text-base",
    body: "text-base",
    small: "text-sm",
    caption: "text-xs",
  };

  function getFontStack(): string {
    if (entry.fontFamily && families) {
      const match = families.find((f) => f.name === entry.fontFamily);
      if (match) return buildFontStack(match);
      return `${JSON.stringify(entry.fontFamily)}, system-ui, sans-serif`;
    }
    const first = families?.[0];
    return first ? buildFontStack(first) : "system-ui, sans-serif";
  }

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[hsl(var(--border))] p-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="w-24 shrink-0">
        <Badge variant="outline" className="font-mono text-xs">
          {level}
        </Badge>
      </div>
      <div className="flex-1">
        <p
          className={cn(sizeMap[level] || "text-base", "leading-tight")}
          style={{
            fontFamily: getFontStack(),
            fontWeight: entry.fontWeight || undefined,
            letterSpacing: entry.letterSpacing || undefined,
            textTransform: (entry.textTransform as React.CSSProperties["textTransform"]) || undefined,
          }}
        >
          The quick brown fox
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[hsl(var(--muted-foreground))]">
        {entry.fontSize && <span>Size: {entry.fontSize}</span>}
        {entry.fontWeight && <span>Weight: {entry.fontWeight}</span>}
        {entry.lineHeight && <span>LH: {entry.lineHeight}</span>}
        {entry.letterSpacing && <span>LS: {entry.letterSpacing}</span>}
        {entry.fontFamily && (
          <span className="font-mono text-[10px]">{entry.fontFamily}</span>
        )}
      </div>
    </div>
  );
}

// ─── Font Helpers ───────────────────────────────────────────────────────

function buildFontStack(family: FontFamily): string {
  const parts = [JSON.stringify(family.name)];
  if (family.fallbackStack) {
    parts.push(family.fallbackStack);
  }
  parts.push("system-ui", "sans-serif");
  return parts.join(", ");
}

// ─── Font Family Card ───────────────────────────────────────────────────

function FontFamilyCard({
  family,
}: {
  family: FontFamily;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-[hsl(var(--border))] p-4">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-lg font-semibold" style={{ fontFamily: buildFontStack(family) }}>
          {family.name || "Unknown"}
        </h4>
        <div className="flex gap-1.5">
          {family.role && (
            <Badge variant="secondary" className="text-[10px]">
              {family.role}
            </Badge>
          )}
          {family.source && (
            <Badge variant="outline" className="text-[10px]">
              {family.source}
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
      {family.fallbackStack && (
        <p className="break-all font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
          {family.fallbackStack}
        </p>
      )}
      {family.confidence !== undefined && (
        <ConfidenceBar confidence={family.confidence} />
      )}
    </div>
  );
}

// ─── Export Helpers ──────────────────────────────────────────────────────

function downloadJson(data: ExtractVibeBrandKit) {
  const domain = data.meta?.domain || "brand";
  const filename = `${domain}-brand-kit.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Main Page Component ────────────────────────────────────────────────

export default function BrandKitPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { copiedValue, copy } = useCopyToClipboard();

  const [data, setData] = useState<ExtractVibeBrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;
    async function fetchResult() {
      setLoading(true);
      setError(null);
      try {
        const result = await api.get<ExtractVibeBrandKit>(
          `/api/extract/${jobId}/result`
        );
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof Error) {
            if (err.message.toLowerCase().includes("processing") || err.message.toLowerCase().includes("pending")) {
              setError("This brand kit is still being processed. Please check back shortly.");
            } else if (err.message.toLowerCase().includes("not found") || (err as any).status === 404) {
              setError("Brand kit not found. It may have been deleted or the extraction failed.");
            } else {
              setError(err.message);
            }
          } else {
            setError("Failed to load brand kit.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchResult();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  // ─── Loading State ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--muted-foreground))]" />
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Loading brand kit...
        </p>
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--destructive))]/10">
          <AlertCircle className="h-7 w-7 text-[hsl(var(--destructive))]" />
        </div>
        <div className="text-center">
          <h2 className="font-display text-lg font-semibold">Could not load brand kit</h2>
          <p className="mt-1 max-w-md text-sm text-[hsl(var(--muted-foreground))]">
            {error || "An unexpected error occurred."}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/dashboard/history")}>
            <ArrowLeft className="h-4 w-4" />
            Back to History
          </Button>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // ─── Destructure ───────────────────────────────────────────────────────

  const { meta, identity, logos, colors, typography, voice, rules, vibe, officialGuidelines, buttons, effects, designAssets, ogImage } = data;
  const brandName = cleanBrandName(identity?.brandName);
  const domain = meta?.domain || "";

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-12">
      {/* ─── 1. Header Bar ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/history")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            {/* Brand Logo */}
            {logos && logos.length > 0 && logos[0].url && (
              <div className="mb-3 inline-flex items-center justify-center rounded-xl bg-checkerboard p-4">
                <img
                  src={logos[0].url}
                  alt={`${domain} logo`}
                  className="h-10 w-auto"
                  loading="lazy"
                />
              </div>
            )}
            <h1 className="font-display text-2xl font-bold md:text-3xl">{brandName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[hsl(var(--muted-foreground))]">
              {domain && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {domain}
                </span>
              )}
              {meta?.extractedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(meta.extractedAt)}
                </span>
              )}
              {meta?.durationMs && (
                <span className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" />
                  {formatDuration(meta.durationMs)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-12 sm:pl-0">
          {/* Export dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(!exportOpen)}
            >
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-3 w-3" />
            </Button>
            {exportOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setExportOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-1 w-64 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1">
                  {[
                    { format: "json", icon: "\u{1F4E6}", label: "JSON", desc: "Full brand kit data" },
                    { format: "css", icon: "\u{1F3A8}", label: "CSS", desc: "Custom properties for :root" },
                    { format: "tailwind", icon: "\u{1F30A}", label: "Tailwind", desc: "@theme block for Tailwind v4" },
                    { format: "markdown", icon: "\u{1F4DD}", label: "Markdown", desc: "Human-readable brand report" },
                    { format: "tokens", icon: "\u{1F527}", label: "Tokens", desc: "W3C Design Token format" },
                  ].map((opt) => (
                    <button
                      key={opt.format}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[hsl(var(--muted))]"
                      onClick={() => {
                        window.open(`/api/extract/${jobId}/export/${opt.format}`, "_blank");
                        setExportOpen(false);
                      }}
                    >
                      <span className="text-base leading-none">{opt.icon}</span>
                      <div className="flex flex-col">
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">{opt.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => {
              const url = meta?.url;
              if (url) {
                navigate(`/dashboard/extract?url=${encodeURIComponent(url)}`);
              } else {
                navigate("/dashboard/extract");
              }
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Re-extract
          </Button>
        </div>
      </div>

      {/* ─── 01. Vibe Summary ─────────────────────────────────────────────── */}
      {vibe && (vibe.summary || (vibe.tags && vibe.tags.length > 0)) && (
        <section className="space-y-5">
          <SectionLabel number="01" label="Vibe" title="Brand Personality" />

          {/* Summary */}
          {vibe.summary && (
            <p className="max-w-2xl text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
              &ldquo;{vibe.summary}&rdquo;
            </p>
          )}

          {/* Tags */}
          {vibe.tags && vibe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {vibe.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Visual energy meter */}
          {vibe.visualEnergy !== undefined && vibe.visualEnergy !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">
                  Visual Energy
                </span>
                <span className="font-semibold tabular-nums">
                  {vibe.visualEnergy}/10
                </span>
              </div>
              <div className="relative h-1.5 w-full rounded-full bg-[hsl(var(--muted))]">
                <div
                  className="h-full rounded-full bg-[hsl(var(--foreground))] transition-all duration-500"
                  style={{ width: `${(vibe.visualEnergy / 10) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
                <span>Calm & Understated</span>
                <span>High-Energy & Bold</span>
              </div>
            </div>
          )}

          {/* Info row */}
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {vibe.designEra && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Design Era
                </p>
                <p className="mt-0.5 text-sm font-medium capitalize">
                  {vibe.designEra}
                </p>
              </div>
            )}
            {vibe.emotionalTone && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Emotional Tone
                </p>
                <p className="mt-0.5 text-sm font-medium capitalize">
                  {vibe.emotionalTone}
                </p>
              </div>
            )}
            {vibe.targetAudienceInferred && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Target Audience
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {vibe.targetAudienceInferred}
                </p>
              </div>
            )}
            {vibe.confidence !== undefined && vibe.confidence !== null && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Confidence
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums">
                  {confidencePercent(vibe.confidence)}
                </p>
              </div>
            )}
          </div>

          {/* Comparable brands */}
          {vibe.comparableBrands && vibe.comparableBrands.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Comparable Brands
              </p>
              <div className="flex flex-wrap gap-1.5">
                {vibe.comparableBrands.map((brand) => (
                  <Badge key={brand} variant="outline" className="text-xs">
                    {brand}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {/* OG Image */}
          {ogImage && (
            <div className="mt-6 overflow-hidden rounded-xl border border-[hsl(var(--border))]">
              <img src={ogImage} alt={`${domain} preview`} className="w-full" loading="lazy" />
            </div>
          )}
        </section>
      )}

      {/* ─── 02. Brand Identity ───────────────────────────────────────────── */}
      {identity &&
        (identity.brandName || identity.tagline || identity.description || (identity.archetypes && identity.archetypes.length > 0)) && (
        <section className="space-y-5">
          <SectionLabel number="02" label="Identity" title="Brand Identity" />

          <div className="space-y-3">
            {identity.brandName && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Brand Name
                </p>
                <p className="mt-0.5 font-display text-lg font-bold">{cleanBrandName(identity.brandName)}</p>
              </div>
            )}
            {identity.tagline && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Tagline
                </p>
                <p className="mt-0.5 text-sm text-[hsl(var(--foreground))]">
                  &ldquo;{identity.tagline}&rdquo;
                </p>
              </div>
            )}
            {identity.description && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Description
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {identity.description}
                </p>
              </div>
            )}
          </div>

          {/* Archetypes */}
          {identity.archetypes && identity.archetypes.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Brand Archetypes
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {identity.archetypes.map((arch) => (
                  <div
                    key={arch.name}
                    className="space-y-2 rounded-xl border border-[hsl(var(--border))] p-3"
                  >
                    <p className="text-sm font-semibold">{arch.name}</p>
                    {arch.confidence !== undefined && (
                      <ConfidenceBar confidence={arch.confidence} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── 03. Logo Gallery ─────────────────────────────────────────────── */}
      {logos && logos.length > 0 && (
        <section className="space-y-5">
          <SectionLabel
            number="03"
            label="Logos"
            title={`${logos.length} Logo${logos.length === 1 ? "" : "s"} Discovered`}
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {logos.map((logo, idx) => {
              const src = resolveLogoUrl(logo.originalUrl || logo.url, domain);
              return (
                <div
                  key={`${logo.type}-${idx}`}
                  className="group overflow-hidden rounded-xl border border-[hsl(var(--border))]"
                >
                  {/* Image area */}
                  <div className="flex h-36 items-center justify-center bg-[hsl(var(--muted))]/40 p-4">
                    {src ? (
                      <img
                        src={src}
                        alt={`${brandName} ${logo.type || "logo"}`}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Image className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="space-y-2 p-3">
                    <div className="flex items-center gap-1.5">
                      {logo.type && (
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {logo.type}
                        </Badge>
                      )}
                      {logo.variant && (
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {logo.variant}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                      <span>
                        {[
                          logo.format?.toUpperCase(),
                          logo.dimensions
                            ? `${logo.dimensions.width}x${logo.dimensions.height}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </span>
                      {src && (
                        <a
                          href={src}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[hsl(var(--foreground))] hover:underline"
                        >
                          <Download className="h-3 w-3" />
                          Save
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── 04. Color Palette ────────────────────────────────────────────── */}
      {colors && (colors.lightMode || colors.darkMode || colors.semantic || (colors.rawPalette && colors.rawPalette.length > 0)) && (
        <section className="space-y-5">
          <SectionLabel number="04" label="Color Palette" title="Colors" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Click any swatch to copy the hex value
          </p>

          {/* Light mode */}
          <ColorModeSection
            mode={colors.lightMode}
            label="Light Mode"
            onCopy={copy}
            copiedValue={copiedValue}
          />

          {/* Dark mode */}
          <ColorModeSection
            mode={colors.darkMode}
            label="Dark Mode"
            onCopy={copy}
            copiedValue={copiedValue}
          />

          {/* Semantic */}
          {colors.semantic && (
            (() => {
              const semanticEntries = Object.entries(colors.semantic).filter(
                ([, v]) => v && (v as ColorValue).hex
              ) as [string, ColorValue][];
              if (semanticEntries.length === 0) return null;
              return (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                    Semantic Colors
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {semanticEntries.map(([key, color]) => (
                      <ColorSwatch
                        key={key}
                        color={{ ...color, role: color.role || key }}
                        onCopy={copy}
                        copiedValue={copiedValue}
                      />
                    ))}
                  </div>
                </div>
              );
            })()
          )}

          {/* Raw palette */}
          {colors.rawPalette && colors.rawPalette.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                All Detected Colors ({colors.rawPalette.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {colors.rawPalette
                  .filter((c) => c.hex)
                  .map((color, idx) => (
                    <ColorSwatch
                      key={`${color.hex}-${idx}`}
                      color={color}
                      onCopy={copy}
                      copiedValue={copiedValue}
                    />
                  ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── 05. Typography ───────────────────────────────────────────────── */}
      {typography && ((typography.families && typography.families.length > 0) || typography.scale || typography.conventions) && (
        <section className="space-y-5">
          <SectionLabel number="05" label="Typography" title="Fonts & Type Scale" />

          {/* Font families */}
          {typography.families && typography.families.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Font Families
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {typography.families.map((family, idx) => (
                  <FontFamilyCard
                    key={family.name || idx}
                    family={family}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Type scale */}
          {typography.scale && (() => {
            const scaleEntries = Object.entries(typography.scale).filter(
              ([, v]) => v && (v as TypeScaleEntry).fontSize
            ) as [string, TypeScaleEntry][];
            if (scaleEntries.length === 0) return null;
            return (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  Type Scale
                </h4>
                <div className="space-y-2">
                  {scaleEntries.map(([level, entry]) => (
                    <TypeScaleRow key={level} level={level} entry={entry} families={typography.families} />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Conventions */}
          {typography.conventions && (typography.conventions.headingCase || typography.conventions.bodyLineHeight || typography.conventions.codeFont) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Conventions
              </h4>
              <div className="flex flex-wrap gap-3">
                {typography.conventions.headingCase && (
                  <div className="rounded-xl border border-[hsl(var(--border))] px-4 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Heading Case
                    </p>
                    <p className="mt-0.5 text-sm font-medium capitalize">
                      {typography.conventions.headingCase}
                    </p>
                  </div>
                )}
                {typography.conventions.bodyLineHeight && (
                  <div className="rounded-xl border border-[hsl(var(--border))] px-4 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Body Line Height
                    </p>
                    <p className="mt-0.5 text-sm font-medium">
                      {typography.conventions.bodyLineHeight}
                    </p>
                  </div>
                )}
                {typography.conventions.codeFont && (
                  <div className="rounded-xl border border-[hsl(var(--border))] px-4 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Code Font
                    </p>
                    <p className="mt-0.5 text-sm font-mono font-medium">
                      {typography.conventions.codeFont}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── 06. Buttons ──────────────────────────────────────────────────── */}
      {buttons?.styles && buttons.styles.length > 0 && (
        <section className="space-y-5">
          <SectionLabel number="06" label="Buttons" title="Button Styles" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {buttons.styles.map((btn: ButtonStyle, i: number) => (
              <div key={i} className="space-y-3 rounded-xl border border-[hsl(var(--border))] p-5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs capitalize">{btn.variant}</Badge>
                  {btn.sampleText && (
                    <span className="text-xs text-[hsl(var(--muted-foreground))] truncate max-w-[150px]">
                      &ldquo;{btn.sampleText}&rdquo;
                    </span>
                  )}
                </div>
                {/* Live preview button */}
                <div className="flex items-center justify-center py-4">
                  <span
                    className="inline-flex items-center justify-center text-sm"
                    style={{
                      backgroundColor: btn.backgroundColor || 'transparent',
                      color: btn.textColor || 'inherit',
                      borderRadius: btn.borderRadius || '4px',
                      borderWidth: btn.borderWidth || (btn.borderColor ? '1px' : '0'),
                      borderStyle: btn.borderWidth ? 'solid' : (btn.borderColor ? 'solid' : 'none'),
                      borderColor: btn.borderColor || 'transparent',
                      padding: btn.padding || '10px 20px',
                      fontSize: btn.fontSize || '14px',
                      fontWeight: btn.fontWeight || 400,
                      boxShadow: btn.boxShadow || 'none',
                    }}
                  >
                    {btn.sampleText || btn.variant}
                  </span>
                </div>
                {/* Properties */}
                <div className="space-y-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                  {btn.backgroundColor && (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm border border-[hsl(var(--border))]" style={{ backgroundColor: btn.backgroundColor }} />
                      <span className="font-mono">{btn.backgroundColor}</span>
                      <span className="text-[10px]">background</span>
                    </div>
                  )}
                  {btn.textColor && (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm border border-[hsl(var(--border))]" style={{ backgroundColor: btn.textColor }} />
                      <span className="font-mono">{btn.textColor}</span>
                      <span className="text-[10px]">text</span>
                    </div>
                  )}
                  {btn.borderRadius && <div>Radius: <span className="font-mono">{btn.borderRadius}</span></div>}
                  {btn.padding && <div>Padding: <span className="font-mono">{btn.padding}</span></div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 07. Effects ──────────────────────────────────────────────────── */}
      {((effects?.shadows?.length || 0) > 0 || (effects?.gradients?.length || 0) > 0) && (
        <section className="space-y-5">
          <SectionLabel number="07" label="Effects" title="Shadows & Gradients" />

          {/* Shadows */}
          {effects?.shadows && effects.shadows.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Box Shadows</h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {effects.shadows.map((shadow: ShadowValue, i: number) => (
                  <div key={i} className="space-y-2">
                    <div
                      className="flex h-20 items-center justify-center rounded-xl bg-white"
                      style={{ boxShadow: shadow.value }}
                    >
                      <Badge variant="outline" className="text-[10px] capitalize">{shadow.context}</Badge>
                    </div>
                    <p className="truncate font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{shadow.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gradients */}
          {effects?.gradients && effects.gradients.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Gradients</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {effects.gradients.slice(0, 4).map((gradient: GradientValue, i: number) => (
                  <div key={i} className="space-y-2">
                    <div
                      className="h-16 w-full rounded-xl border border-[hsl(var(--border))]"
                      style={{ backgroundImage: gradient.value }}
                    />
                    <p className="truncate font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{gradient.value.slice(0, 80)}...</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── 08. Design Assets ──────────────────────────────────────────── */}
      {designAssets && designAssets.length > 0 && (
        <section className="space-y-5">
          <SectionLabel number="08" label="Design Assets" title="Visual Elements" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {designAssets.slice(0, 9).map((asset: BrandDesignAsset, i: number) => (
              <div key={i} className="group relative overflow-hidden rounded-xl border border-[hsl(var(--border))]">
                <div className="flex aspect-video items-center justify-center bg-checkerboard p-4">
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
                    <span className="tabular-nums">{asset.width}&times;{asset.height}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 09. Voice & Personality ──────────────────────────────────────── */}
      {voice && (voice.toneSpectrum || voice.copywritingStyle || voice.contentPatterns || (voice.sampleCopy && voice.sampleCopy.length > 0)) && (
        <section className="space-y-5">
          <SectionLabel number="09" label="Voice & Tone" title="Personality" />

          {/* Tone spectrum */}
          {voice.toneSpectrum && (() => {
            const spectrum = voice.toneSpectrum;
            const axes: {
              key: keyof ToneSpectrum;
              label: string;
              left: string;
              right: string;
            }[] = [
              { key: "formalCasual", label: "Formality", left: "Formal", right: "Casual" },
              { key: "playfulSerious", label: "Tone", left: "Playful", right: "Serious" },
              { key: "enthusiasticMatterOfFact", label: "Energy", left: "Enthusiastic", right: "Matter-of-fact" },
              { key: "respectfulIrreverent", label: "Attitude", left: "Respectful", right: "Irreverent" },
              { key: "technicalAccessible", label: "Complexity", left: "Technical", right: "Accessible" },
            ];
            const hasAny = axes.some((a) => spectrum[a.key] !== undefined && spectrum[a.key] !== null);
            if (!hasAny) return null;
            return (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  Tone Spectrum
                </h4>
                <div className="space-y-5">
                  {axes.map((axis) => (
                    <ToneBar
                      key={axis.key}
                      label={axis.label}
                      leftLabel={axis.left}
                      rightLabel={axis.right}
                      value={spectrum[axis.key]}
                    />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Copywriting style */}
          {voice.copywritingStyle && (() => {
            const cs = voice.copywritingStyle;
            const hasAny = cs.avgSentenceLength || cs.vocabularyComplexity || cs.jargonUsage || cs.ctaStyle;
            if (!hasAny) return null;
            return (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  Copywriting Style
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {cs.avgSentenceLength !== undefined && (
                    <div className="rounded-xl border border-[hsl(var(--border))] p-3 text-center">
                      <p className="text-2xl font-bold tabular-nums">{cs.avgSentenceLength}</p>
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        Avg Words/Sentence
                      </p>
                    </div>
                  )}
                  {cs.vocabularyComplexity && (
                    <div className="rounded-xl border border-[hsl(var(--border))] p-3 text-center">
                      <p className="text-lg font-bold capitalize">{cs.vocabularyComplexity}</p>
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        Vocabulary
                      </p>
                    </div>
                  )}
                  {cs.jargonUsage && (
                    <div className="rounded-xl border border-[hsl(var(--border))] p-3 text-center">
                      <p className="text-lg font-bold capitalize">{cs.jargonUsage}</p>
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        Jargon Usage
                      </p>
                    </div>
                  )}
                  {cs.ctaStyle && (
                    <div className="rounded-xl border border-[hsl(var(--border))] p-3 text-center">
                      <p className="text-sm font-bold">&ldquo;{cs.ctaStyle}&rdquo;</p>
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        CTA Style
                      </p>
                    </div>
                  )}
                </div>
                {cs.rhetoricalDevices && cs.rhetoricalDevices.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                      Rhetorical Devices
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cs.rhetoricalDevices.map((d) => (
                        <Badge key={d} variant="outline" className="text-[10px]">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Content patterns */}
          {voice.contentPatterns && (() => {
            const cp = voice.contentPatterns;
            const items: { label: string; value: string }[] = [];
            if (cp.headingCase) items.push({ label: "Heading Case", value: cp.headingCase });
            if (cp.emojiUsage) items.push({ label: "Emoji Usage", value: cp.emojiUsage });
            if (cp.exclamationFrequency) items.push({ label: "Exclamation Frequency", value: cp.exclamationFrequency });
            if (cp.questionUsageInHeadings !== undefined) items.push({ label: "Questions in Headings", value: cp.questionUsageInHeadings ? "Yes" : "No" });
            if (cp.bulletPreference !== undefined) items.push({ label: "Prefers Bullets", value: cp.bulletPreference ? "Yes" : "No" });
            if (items.length === 0) return null;
            return (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  Content Patterns
                </h4>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] px-3 py-2"
                    >
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">
                        {item.label}
                      </span>
                      <span className="text-sm font-medium capitalize">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Sample copy */}
          {voice.sampleCopy && voice.sampleCopy.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Sample Copy
              </h4>
              <div className="space-y-2">
                {voice.sampleCopy.map((sample, idx) => (
                  <p
                    key={idx}
                    className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]"
                  >
                    &ldquo;{sample}&rdquo;
                  </p>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── 10. Brand Rules ──────────────────────────────────────────────── */}
      {rules && ((rules.dos && rules.dos.length > 0) || (rules.donts && rules.donts.length > 0)) && (
        <section className="space-y-5">
          <SectionLabel number="10" label="Brand Rules" title="Dos & Don&apos;ts" />

          {rules.source && (
            <Badge variant="outline" className="text-[10px] capitalize">
              Source: {rules.source}
            </Badge>
          )}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* DOs */}
            {rules.dos && rules.dos.length > 0 && (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Do
                </h4>
                <ul className="space-y-2">
                  {rules.dos.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm leading-relaxed text-[hsl(var(--foreground))]"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* DON'Ts */}
            {rules.donts && rules.donts.length > 0 && (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--destructive))]">
                  <XCircle className="h-4 w-4" />
                  Don&apos;t
                </h4>
                <ul className="space-y-2">
                  {rules.donts.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm leading-relaxed text-[hsl(var(--foreground))]"
                    >
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--destructive))]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── 11. Official Guidelines ──────────────────────────────────────── */}
      {officialGuidelines && officialGuidelines.hasOfficialKit && (
        <section className="space-y-5">
          <SectionLabel number="11" label="Guidelines" title="Official Brand Guidelines" />

          {officialGuidelines.discoveredUrl && (
            <a
              href={officialGuidelines.discoveredUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[hsl(var(--muted))]"
            >
              <ExternalLink className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <span className="break-all">{officialGuidelines.discoveredUrl}</span>
            </a>
          )}

          {officialGuidelines.guidelineRules &&
            officialGuidelines.guidelineRules.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  Extracted Guideline Rules
                </h4>
                <ul className="space-y-1.5">
                  {officialGuidelines.guidelineRules.map((rule, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 rounded-xl border border-[hsl(var(--border))] px-3 py-2 text-sm"
                    >
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))]" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </section>
      )}
    </div>
  );
}
