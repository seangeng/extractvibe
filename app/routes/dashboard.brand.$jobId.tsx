import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  Loader2,
  Download,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Clock,
  Sparkles,
  Palette,
  Type,
  Image,
  MessageSquare,
  ShieldCheck,
  BookOpen,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { api } from "~/lib/api";
import { cn } from "~/lib/utils";
import type {
  ExtractVibeBrandKit,
  ColorValue,
  ColorMode,
  ToneSpectrum,
  TypeScaleEntry,
  FontFamily,
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
        className="relative h-16 w-16 rounded-lg border border-[hsl(var(--border))] shadow-sm transition-transform group-hover:scale-105"
        style={{ backgroundColor: hex }}
      >
        {isCopied && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
            <Check className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-xs font-mono font-medium">{hex}</p>
        {color.role && (
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] capitalize">
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
  accentColor,
}: {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value?: number;
  accentColor: string;
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
      <div className="relative h-2 w-full rounded-full bg-[hsl(var(--muted))]">
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
          style={{
            left: `${percentage}%`,
            backgroundColor: accentColor,
          }}
        />
        <div
          className="h-full rounded-full opacity-20"
          style={{
            width: `${percentage}%`,
            backgroundColor: accentColor,
          }}
        />
      </div>
    </div>
  );
}

function ConfidenceBar({
  confidence,
  accentColor,
}: {
  confidence?: number;
  accentColor: string;
}) {
  if (confidence === undefined || confidence === null) return null;
  const percent = Math.round(confidence * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-[hsl(var(--muted))]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, backgroundColor: accentColor }}
        />
      </div>
      <span className="text-xs tabular-nums text-[hsl(var(--muted-foreground))]">
        {percent}%
      </span>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))]">
          <Icon className="h-4.5 w-4.5 text-[hsl(var(--muted-foreground))]" />
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && (
            <CardDescription className="mt-0.5">{description}</CardDescription>
          )}
        </div>
      </div>
    </CardHeader>
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
}: {
  level: string;
  entry: TypeScaleEntry;
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

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[hsl(var(--border))] p-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="w-24 shrink-0">
        <Badge variant="outline" className="font-mono text-xs">
          {level}
        </Badge>
      </div>
      <div className="flex-1">
        <p
          className={cn(sizeMap[level] || "text-base", "font-semibold leading-tight")}
          style={{
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

// ─── Font Family Card ───────────────────────────────────────────────────

function FontFamilyCard({
  family,
  accentColor,
}: {
  family: FontFamily;
  accentColor: string;
}) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-lg font-semibold" style={{ fontFamily: family.name }}>
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
            <span
              key={w}
              className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs tabular-nums"
            >
              {w}
            </span>
          ))}
        </div>
      )}
      {family.fallbackStack && (
        <p className="font-mono text-[10px] text-[hsl(var(--muted-foreground))] break-all">
          {family.fallbackStack}
        </p>
      )}
      {family.confidence !== undefined && (
        <ConfidenceBar confidence={family.confidence} accentColor={accentColor} />
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

  // Derive the brand's primary color for accent usage
  const accentColor =
    data?.colors?.lightMode?.primary?.hex ||
    data?.colors?.lightMode?.accent?.hex ||
    "#6366f1";

  // ─── Loading State ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
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
          <h2 className="text-lg font-semibold">Could not load brand kit</h2>
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

  const { meta, identity, logos, colors, typography, voice, rules, vibe, officialGuidelines } = data;
  const brandName = cleanBrandName(identity?.brandName);
  const domain = meta?.domain || "";

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
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
            <h1 className="text-2xl font-bold tracking-tight">{brandName}</h1>
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
                <div className="absolute right-0 z-50 mt-1 w-64 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 shadow-lg">
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
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-[hsl(var(--muted))] transition-colors"
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

      {/* ─── 2. Vibe Summary ─────────────────────────────────────────────── */}
      {vibe && (vibe.summary || (vibe.tags && vibe.tags.length > 0)) && (
        <Card
          className="overflow-hidden"
          style={{ borderColor: `${accentColor}30` }}
        >
          <SectionHeader
            icon={Sparkles}
            title="Vibe"
            description="AI-generated brand personality summary"
          />
          <CardContent className="space-y-5">
            {/* Summary */}
            {vibe.summary && (
              <p className="text-lg italic leading-relaxed text-[hsl(var(--foreground))]">
                "{vibe.summary}"
              </p>
            )}

            {/* Tags */}
            {vibe.tags && vibe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {vibe.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
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
                <div className="h-3 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(vibe.visualEnergy / 10) * 100}%`,
                      background: `linear-gradient(to right, ${accentColor}80, ${accentColor})`,
                    }}
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
                <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
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
          </CardContent>
        </Card>
      )}

      {/* ─── 3. Brand Identity ───────────────────────────────────────────── */}
      {identity &&
        (identity.brandName || identity.tagline || identity.description || (identity.archetypes && identity.archetypes.length > 0)) && (
        <Card>
          <SectionHeader
            icon={Globe}
            title="Brand Identity"
            description="Core name, tagline, and personality"
          />
          <CardContent className="space-y-5">
            <div className="space-y-3">
              {identity.brandName && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Brand Name
                  </p>
                  <p className="mt-0.5 text-lg font-bold">{cleanBrandName(identity.brandName)}</p>
                </div>
              )}
              {identity.tagline && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Tagline
                  </p>
                  <p className="mt-0.5 text-sm italic text-[hsl(var(--foreground))]">
                    "{identity.tagline}"
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
                      className="rounded-lg border border-[hsl(var(--border))] p-3 space-y-2"
                    >
                      <p className="text-sm font-semibold">{arch.name}</p>
                      {arch.confidence !== undefined && (
                        <ConfidenceBar
                          confidence={arch.confidence}
                          accentColor={accentColor}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── 4. Logo Gallery ─────────────────────────────────────────────── */}
      {logos && logos.length > 0 && (
        <Card>
          <SectionHeader
            icon={Image}
            title="Logos"
            description={`${logos.length} logo${logos.length === 1 ? "" : "s"} discovered`}
          />
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {logos.map((logo, idx) => {
                const src = resolveLogoUrl(logo.originalUrl || logo.url, domain);
                return (
                  <div
                    key={`${logo.type}-${idx}`}
                    className="group overflow-hidden rounded-lg border border-[hsl(var(--border))]"
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
                            className="flex items-center gap-1 text-brand-primary hover:underline"
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
          </CardContent>
        </Card>
      )}

      {/* ─── 5. Color Palette ────────────────────────────────────────────── */}
      {colors && (colors.lightMode || colors.darkMode || colors.semantic || (colors.rawPalette && colors.rawPalette.length > 0)) && (
        <Card>
          <SectionHeader
            icon={Palette}
            title="Color Palette"
            description="Click any swatch to copy the hex value"
          />
          <CardContent className="space-y-6">
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
          </CardContent>
        </Card>
      )}

      {/* ─── 6. Typography ───────────────────────────────────────────────── */}
      {typography && ((typography.families && typography.families.length > 0) || typography.scale || typography.conventions) && (
        <Card>
          <SectionHeader
            icon={Type}
            title="Typography"
            description="Fonts, type scale, and conventions"
          />
          <CardContent className="space-y-6">
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
                      accentColor={accentColor}
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
                      <TypeScaleRow key={level} level={level} entry={entry} />
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
                    <div className="rounded-lg border border-[hsl(var(--border))] px-4 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        Heading Case
                      </p>
                      <p className="mt-0.5 text-sm font-medium capitalize">
                        {typography.conventions.headingCase}
                      </p>
                    </div>
                  )}
                  {typography.conventions.bodyLineHeight && (
                    <div className="rounded-lg border border-[hsl(var(--border))] px-4 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        Body Line Height
                      </p>
                      <p className="mt-0.5 text-sm font-medium">
                        {typography.conventions.bodyLineHeight}
                      </p>
                    </div>
                  )}
                  {typography.conventions.codeFont && (
                    <div className="rounded-lg border border-[hsl(var(--border))] px-4 py-2">
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
          </CardContent>
        </Card>
      )}

      {/* ─── 7. Voice & Personality ──────────────────────────────────────── */}
      {voice && (voice.toneSpectrum || voice.copywritingStyle || voice.contentPatterns || (voice.sampleCopy && voice.sampleCopy.length > 0)) && (
        <Card>
          <SectionHeader
            icon={MessageSquare}
            title="Voice & Personality"
            description="How the brand sounds in text"
          />
          <CardContent className="space-y-6">
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
                        accentColor={accentColor}
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
                      <div className="rounded-lg border border-[hsl(var(--border))] p-3 text-center">
                        <p className="text-2xl font-bold tabular-nums">{cs.avgSentenceLength}</p>
                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                          Avg Words/Sentence
                        </p>
                      </div>
                    )}
                    {cs.vocabularyComplexity && (
                      <div className="rounded-lg border border-[hsl(var(--border))] p-3 text-center">
                        <p className="text-lg font-bold capitalize">{cs.vocabularyComplexity}</p>
                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                          Vocabulary
                        </p>
                      </div>
                    )}
                    {cs.jargonUsage && (
                      <div className="rounded-lg border border-[hsl(var(--border))] p-3 text-center">
                        <p className="text-lg font-bold capitalize">{cs.jargonUsage}</p>
                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                          Jargon Usage
                        </p>
                      </div>
                    )}
                    {cs.ctaStyle && (
                      <div className="rounded-lg border border-[hsl(var(--border))] p-3 text-center">
                        <p className="text-sm font-bold">"{cs.ctaStyle}"</p>
                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                          CTA Style
                        </p>
                      </div>
                    )}
                  </div>
                  {cs.rhetoricalDevices && cs.rhetoricalDevices.length > 0 && (
                    <div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5">
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
                        className="flex items-center justify-between rounded-md border border-[hsl(var(--border))] px-3 py-2"
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
                    <blockquote
                      key={idx}
                      className="rounded-lg border-l-4 bg-[hsl(var(--muted))]/40 py-3 pl-4 pr-3 text-sm italic leading-relaxed text-[hsl(var(--foreground))]"
                      style={{ borderLeftColor: accentColor }}
                    >
                      "{sample}"
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── 8. Brand Rules ──────────────────────────────────────────────── */}
      {rules && ((rules.dos && rules.dos.length > 0) || (rules.donts && rules.donts.length > 0)) && (
        <Card>
          <SectionHeader
            icon={ShieldCheck}
            title="Brand Rules"
            description="Dos and don'ts for staying on-brand"
          />
          <CardContent className="space-y-4">
            {rules.source && (
              <Badge variant="outline" className="text-[10px] capitalize">
                Source: {rules.source}
              </Badge>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* DOs */}
              {rules.dos && rules.dos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Do
                  </h4>
                  <ul className="space-y-1.5">
                    {rules.dos.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 rounded-md bg-emerald-500/5 px-3 py-2 text-sm"
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
                <div className="space-y-2">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
                    <XCircle className="h-4 w-4" />
                    Don't
                  </h4>
                  <ul className="space-y-1.5">
                    {rules.donts.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 rounded-md bg-red-500/5 px-3 py-2 text-sm"
                      >
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── 9. Official Guidelines ──────────────────────────────────────── */}
      {officialGuidelines && officialGuidelines.hasOfficialKit && (
        <Card>
          <SectionHeader
            icon={BookOpen}
            title="Official Guidelines"
            description="Discovered brand guidelines from the website"
          />
          <CardContent className="space-y-4">
            {officialGuidelines.discoveredUrl && (
              <a
                href={officialGuidelines.discoveredUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[hsl(var(--muted))]"
              >
                <ExternalLink className="h-4 w-4 text-brand-primary" />
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
                        className="flex items-start gap-2 rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm"
                      >
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-primary" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
