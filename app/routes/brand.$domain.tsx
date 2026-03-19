import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Globe, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
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

// ─── SSR Loader ──────────────────────────────────────────────────────────

export async function loader({ params, context }: Route.LoaderArgs) {
  const domain = params.domain;
  const env = context.cloudflare.env;
  const cached = await env.CACHE.get(`brand:${domain}`, "json");
  if (!cached) throw new Response("Brand not found", { status: 404 });
  return { kit: cached as ExtractVibeBrandKit, domain: domain! };
}

// ─── SEO Meta ────────────────────────────────────────────────────────────

export function meta({ data }: Route.MetaArgs) {
  if (!data) return [{ title: "Brand Not Found — ExtractVibe" }];
  const { domain, kit } = data;
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
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-[180px] w-[180px]" />;

  const unique = colors.filter((c, i, arr) => {
    if (!c.color.hex) return false;
    return arr.findIndex((a) => a.color.hex === c.color.hex) === i;
  });
  if (unique.length === 0) return null;

  return (
    <Suspense fallback={<div className="h-[180px] w-[180px]" />}>
      <div className="h-[180px] w-[180px]">
        <LazyColorDonut colors={unique} />
      </div>
    </Suspense>
  );
}

function PersonalityRadar({ spectrum }: { spectrum: ToneSpectrum }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-[280px] w-[280px]" />;

  return (
    <Suspense fallback={<div className="h-[280px] w-[280px]" />}>
      <div className="h-[280px] w-[280px]">
        <LazyPersonalityRadar spectrum={spectrum} />
      </div>
    </Suspense>
  );
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
      <div className="flex overflow-hidden rounded-xl bg-checkerboard">
        {colors.map(({ key, color }) => (
          <div key={key} className="min-w-[60px] flex-1">
            <div
              className="h-24 w-full border-r border-white/10 last:border-r-0"
              style={{ backgroundColor: color.hex || "#000000" }}
            />
          </div>
        ))}
      </div>
      <div className="flex">
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

  const fontStackLookup = new Map<string, string>();
  for (const fam of families || []) {
    fontStackLookup.set(fam.name || "", buildFontStack(fam));
  }

  function getFontStack(entry: TypeScaleEntry): string {
    if (entry.fontFamily) {
      const stack = fontStackLookup.get(entry.fontFamily);
      if (stack) return stack;
      return `${JSON.stringify(entry.fontFamily)}, system-ui, sans-serif`;
    }
    const first = families?.[0];
    return first ? buildFontStack(first) : "system-ui, sans-serif";
  }

  const entries = Object.entries(scale).filter(
    ([, v]) => v && (v as TypeScaleEntry).fontSize
  ) as [string, TypeScaleEntry][];

  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      {entries.map(([level, entry]) => (
        <div
          key={level}
          className="flex items-center gap-4 rounded-xl border border-[hsl(var(--border))] px-4 py-3"
        >
          <Badge variant="outline" className="w-16 justify-center font-mono text-xs">
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

// ─── Page Component ──────────────────────────────────────────────────────

export default function PublicBrandPage({
  loaderData,
}: Route.ComponentProps) {
  const { kit, domain } = loaderData;
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
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* ─── Header ───────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/extract-vibe-logo.svg" alt="ExtractVibe" className="h-8 w-8" />
            <span className="text-lg font-bold">ExtractVibe</span>
          </Link>
          <Button asChild size="sm">
            <Link to="/sign-up">Extract your brand</Link>
          </Button>
        </div>
      </nav>

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

        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-12 md:pb-20 md:pt-16">
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

          {/* Vibe summary as pull quote */}
          {vibe?.summary && (
            <blockquote className="mt-8 max-w-prose border-l-2 border-[hsl(var(--foreground))] pl-5 text-lg italic leading-relaxed text-[hsl(var(--muted-foreground))] md:text-xl">
              {vibe.summary}
            </blockquote>
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
            <section className="mx-auto max-w-4xl px-6 py-16 md:py-20">
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
            </section>
          </>
        )}

        {/* ─── Typography ───────────────────────────────────────────────── */}
        {typography &&
          ((typography.families && typography.families.length > 0) ||
            typography.scale) && (
            <>
              <hr className="border-[hsl(var(--border))]" />
              <section className="mx-auto max-w-4xl px-6 py-16 md:py-20">
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
            <section className="mx-auto max-w-4xl px-6 py-10 md:py-14">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                Components
              </p>
              <h2 className="mt-2 text-xl font-semibold">Design System</h2>

              <div className="mt-8 space-y-8">
                {/* Buttons — live preview + expandable specs */}
                {hasButtons && (
                  <div className="space-y-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                      Buttons
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {kit.buttons!.styles.map((btn: ButtonStyle, i: number) => (
                        <details key={i} className="group rounded-xl border border-[hsl(var(--border))] overflow-hidden">
                          <summary className="flex cursor-pointer items-center justify-between bg-[hsl(var(--card))] px-5 py-5 [&::-webkit-details-marker]:hidden">
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
                            <Badge variant="outline" className="text-[10px] capitalize group-open:hidden">{btn.variant}</Badge>
                            <span className="hidden text-xs text-[hsl(var(--muted-foreground))] group-open:inline">specs</span>
                          </summary>
                          <div className="space-y-1.5 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-5 py-4 font-mono text-xs text-[hsl(var(--muted-foreground))]">
                            {btn.backgroundColor && (
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: btn.backgroundColor }} />
                                background: {btn.backgroundColor}
                              </div>
                            )}
                            {btn.textColor && (
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: btn.textColor }} />
                                color: {btn.textColor}
                              </div>
                            )}
                            {btn.borderRadius && <div>border-radius: {btn.borderRadius}</div>}
                            {btn.borderColor && <div>border-color: {btn.borderColor}</div>}
                            {btn.padding && <div>padding: {btn.padding}</div>}
                            {btn.fontWeight && <div>font-weight: {btn.fontWeight}</div>}
                            {btn.boxShadow && <div>box-shadow: {btn.boxShadow.slice(0, 50)}...</div>}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shadows — expandable with full CSS */}
                {hasShadows && (
                  <div className="space-y-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                      Shadows
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {kit.effects!.shadows.map((shadow: ShadowValue, i: number) => (
                        <details key={i} className="group">
                          <summary className="cursor-pointer [&::-webkit-details-marker]:hidden">
                            <div
                              className="flex h-20 w-36 items-center justify-center rounded-xl bg-white transition-transform group-hover:scale-105"
                              style={{ boxShadow: shadow.value }}
                            >
                              <span className="text-[10px] capitalize text-neutral-400">
                                {shadow.context}
                              </span>
                            </div>
                          </summary>
                          <div className="mt-2 max-w-[18rem] rounded-lg bg-[hsl(var(--muted))]/50 px-3 py-2">
                            <p className="break-all font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
                              {shadow.value}
                            </p>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gradients as a horizontal strip */}
                {hasGradients && (
                  <div className="space-y-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                      Gradients
                    </p>
                    <div className="flex overflow-hidden rounded-lg">
                      {kit.effects!.gradients.slice(0, 6).map((gradient: GradientValue, i: number) => (
                        <div key={i} className="min-w-[80px] flex-1">
                          <div
                            className="h-16 w-full"
                            style={{ backgroundImage: gradient.value }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      {kit.effects!.gradients.slice(0, 6).map((gradient: GradientValue, i: number) => (
                        <div key={i} className="min-w-[80px] flex-1">
                          <p className="truncate font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
                            {gradient.value.slice(0, 40)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
              <section className="mx-auto max-w-4xl px-6 py-16 md:py-20">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  Voice & Tone
                </p>
                <h2 className="mt-2 text-xl font-semibold">Personality</h2>

                {/* Radar chart centered */}
                <div className="mt-10 flex justify-center">
                  <PersonalityRadar spectrum={toneSpectrum} />
                </div>

                {/* Vibe detail metrics row below radar */}
                {hasVibe && (
                  <div className="mt-12 flex flex-wrap justify-center gap-x-14 gap-y-6 border-t border-[hsl(var(--border))] pt-10">
                    {vibe!.visualEnergy !== undefined && vibe!.visualEnergy !== null && (
                      <div className="text-center">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                          Visual Energy
                        </p>
                        <p className="mt-1 text-lg font-semibold tabular-nums">
                          {vibe!.visualEnergy}<span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">/10</span>
                        </p>
                      </div>
                    )}
                    {vibe!.designEra && (
                      <div className="text-center">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                          Design Era
                        </p>
                        <p className="mt-1 text-sm font-medium capitalize">
                          {vibe!.designEra}
                        </p>
                      </div>
                    )}
                    {vibe!.emotionalTone && (
                      <div className="text-center">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                          Emotional Tone
                        </p>
                        <p className="mt-1 text-sm font-medium capitalize">
                          {vibe!.emotionalTone}
                        </p>
                      </div>
                    )}
                    {vibe!.targetAudienceInferred && (
                      <div className="text-center">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                          Audience
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {vibe!.targetAudienceInferred}
                        </p>
                      </div>
                    )}
                    {vibe!.comparableBrands && vibe!.comparableBrands.length > 0 && (
                      <div className="text-center">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                          Comparable Brands
                        </p>
                        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                          {vibe!.comparableBrands.join(", ")}
                        </p>
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
              <section className="mx-auto max-w-4xl px-6 py-16 md:py-20">
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
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                        Do
                      </h4>
                      <ul className="space-y-5">
                        {rules.dos.map((rule: string, i: number) => (
                          <li
                            key={i}
                            className="border-l-2 border-emerald-500 pl-4 text-sm leading-relaxed"
                          >
                            {rule}
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
                      <ul className="space-y-5">
                        {rules.donts.map((rule: string, i: number) => (
                          <li
                            key={i}
                            className="border-l-2 border-[hsl(var(--destructive))] pl-4 text-sm leading-relaxed"
                          >
                            {rule}
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
              <div className="mx-auto max-w-4xl px-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  Design Assets
                </p>
                <h2 className="mt-2 text-xl font-semibold">Visual Elements</h2>
              </div>

              <div className="scrollbar-none mt-6 flex gap-4 overflow-x-auto px-6 pb-2 md:px-[max(1.5rem,calc((100%-56rem)/2+1.5rem))]">
                {kit.designAssets.slice(0, 12).map((asset: BrandDesignAsset, i: number) => (
                  <div
                    key={i}
                    className="flex-shrink-0 overflow-hidden rounded-xl border border-[hsl(var(--border))]"
                    style={{ width: "220px" }}
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

        {/* ─── CTA ────────────────────────────────────────────────────── */}
        <hr className="border-[hsl(var(--border))]" />
        <section className="mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
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
    </div>
  );
}
