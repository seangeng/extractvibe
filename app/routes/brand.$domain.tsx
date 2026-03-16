import { Link } from "react-router";
import { Sparkles, ArrowRight, Globe, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/brand.$domain";
import type {
  ExtractVibeBrandKit,
  ColorValue,
  ColorMode,
  ToneSpectrum,
  FontFamily,
  TypeScale,
  TypeScaleEntry,
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

// ─── Sub-components ──────────────────────────────────────────────────────

function ColorSwatch({ color }: { color: ColorValue; label?: string }) {
  const hex = color.hex || "#000000";
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="h-14 w-14 rounded-lg border border-[hsl(var(--border))] shadow-sm sm:h-16 sm:w-16"
        style={{ backgroundColor: hex }}
      />
      <div className="text-center">
        <p className="font-mono text-xs font-medium">{hex}</p>
        {color.role && (
          <p className="text-[10px] capitalize text-[hsl(var(--muted-foreground))]">
            {color.role}
          </p>
        )}
      </div>
    </div>
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
        <span className="font-medium text-[hsl(var(--foreground))]">
          {label}
        </span>
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

function FontFamilyCard({ family }: { family: FontFamily }) {
  return (
    <div className="space-y-2 rounded-lg border border-[hsl(var(--border))] p-4">
      <div className="flex items-start justify-between gap-2">
        <h4
          className="text-lg font-semibold"
          style={{ fontFamily: family.name }}
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
        <p className="break-all font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
          {family.fallbackStack}
        </p>
      )}
    </div>
  );
}

function TypeScalePreview({ scale }: { scale: TypeScale }) {
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

  const entries = Object.entries(scale).filter(
    ([, v]) => v && (v as TypeScaleEntry).fontSize
  ) as [string, TypeScaleEntry][];

  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
        Type Scale
      </h4>
      <div className="space-y-2">
        {entries.map(([level, entry]) => (
          <div
            key={level}
            className="flex items-center gap-4 rounded-lg border border-[hsl(var(--border))] px-4 py-3"
          >
            <Badge variant="outline" className="w-16 justify-center font-mono text-xs">
              {level}
            </Badge>
            <p
              className={cn(
                sizeMap[level] || "text-base",
                "flex-1 font-semibold leading-tight"
              )}
              style={{
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

  const accentColor =
    colors?.lightMode?.primary?.hex ||
    colors?.lightMode?.accent?.hex ||
    "#6366f1";

  const lightColors = getAllColors(colors?.lightMode);
  const darkColors = getAllColors(colors?.darkMode);
  const allDisplayColors = lightColors.length > 0 ? lightColors : darkColors;

  const toneSpectrum = voice?.toneSpectrum;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">ExtractVibe</span>
          </Link>
          <Button asChild size="sm">
            <Link to="/sign-up">Extract your brand</Link>
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10 md:py-16">
        {/* ─── 1. Brand Header ──────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
            <Globe className="h-4 w-4" />
            <a
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[hsl(var(--foreground))]"
            >
              {domain}
            </a>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            {brandName}
          </h1>
          {vibe?.summary && (
            <p className="max-w-2xl text-lg italic leading-relaxed text-[hsl(var(--muted-foreground))]">
              &ldquo;{vibe.summary}&rdquo;
            </p>
          )}
          {vibe?.tags && vibe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {vibe.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </section>

        {/* ─── 2. Color Palette ─────────────────────────────────────────── */}
        {allDisplayColors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Color Palette</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {lightColors.length > 0 && (
                  <div className="space-y-3">
                    {darkColors.length > 0 && (
                      <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                        Light Mode
                      </h4>
                    )}
                    <div className="flex flex-wrap gap-4">
                      {lightColors.map(({ key, color }) => (
                        <ColorSwatch
                          key={key}
                          color={{ ...color, role: color.role || key }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {darkColors.length > 0 && (
                  <div className="space-y-3">
                    {lightColors.length > 0 && (
                      <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                        Dark Mode
                      </h4>
                    )}
                    <div className="flex flex-wrap gap-4">
                      {darkColors.map(({ key, color }) => (
                        <ColorSwatch
                          key={key}
                          color={{ ...color, role: color.role || key }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── 3. Typography ────────────────────────────────────────────── */}
        {typography &&
          ((typography.families && typography.families.length > 0) ||
            typography.scale) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Typography</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Font families */}
                {typography.families && typography.families.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                      Font Families
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {typography.families.map((family: FontFamily, idx: number) => (
                        <FontFamilyCard key={family.name || idx} family={family} />
                      ))}
                    </div>
                  </div>
                )}
                {/* Type scale preview */}
                {typography.scale && <TypeScalePreview scale={typography.scale} />}
              </CardContent>
            </Card>
          )}

        {/* ─── 4. Voice Tone Spectrum ───────────────────────────────────── */}
        {toneSpectrum &&
          (toneSpectrum.formalCasual !== undefined ||
            toneSpectrum.playfulSerious !== undefined ||
            toneSpectrum.enthusiasticMatterOfFact !== undefined ||
            toneSpectrum.respectfulIrreverent !== undefined ||
            toneSpectrum.technicalAccessible !== undefined) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Voice & Tone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <ToneBar
                  label="Formality"
                  leftLabel="Formal"
                  rightLabel="Casual"
                  value={toneSpectrum.formalCasual}
                  accentColor={accentColor}
                />
                <ToneBar
                  label="Mood"
                  leftLabel="Playful"
                  rightLabel="Serious"
                  value={toneSpectrum.playfulSerious}
                  accentColor={accentColor}
                />
                <ToneBar
                  label="Energy"
                  leftLabel="Enthusiastic"
                  rightLabel="Matter-of-Fact"
                  value={toneSpectrum.enthusiasticMatterOfFact}
                  accentColor={accentColor}
                />
                <ToneBar
                  label="Attitude"
                  leftLabel="Respectful"
                  rightLabel="Irreverent"
                  value={toneSpectrum.respectfulIrreverent}
                  accentColor={accentColor}
                />
                <ToneBar
                  label="Complexity"
                  leftLabel="Technical"
                  rightLabel="Accessible"
                  value={toneSpectrum.technicalAccessible}
                  accentColor={accentColor}
                />
              </CardContent>
            </Card>
          )}

        {/* ─── 5. Brand Rules ───────────────────────────────────────────── */}
        {rules &&
          ((rules.dos && rules.dos.length > 0) ||
            (rules.donts && rules.donts.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Brand Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* DOs */}
                  {rules.dos && rules.dos.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Do
                      </h4>
                      <ul className="space-y-2">
                        {rules.dos.map((rule: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm leading-relaxed text-[hsl(var(--foreground))]"
                          >
                            <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* DON'Ts */}
                  {rules.donts && rules.donts.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-red-600">
                        <XCircle className="h-4 w-4" />
                        Don&apos;t
                      </h4>
                      <ul className="space-y-2">
                        {rules.donts.map((rule: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm leading-relaxed text-[hsl(var(--foreground))]"
                          >
                            <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        {/* ─── 6. Vibe Tags & Comparable Brands ─────────────────────────── */}
        {vibe &&
          ((vibe.visualEnergy !== undefined && vibe.visualEnergy !== null) ||
            vibe.designEra ||
            vibe.emotionalTone ||
            vibe.targetAudienceInferred ||
            (vibe.comparableBrands && vibe.comparableBrands.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Brand Vibe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Visual energy meter */}
                {vibe.visualEnergy !== undefined &&
                  vibe.visualEnergy !== null && (
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
                </div>

                {/* Comparable brands */}
                {vibe.comparableBrands && vibe.comparableBrands.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Comparable Brands
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {vibe.comparableBrands.map((brand: string) => (
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

        {/* ─── CTA ──────────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-[hsl(var(--border))] bg-gradient-to-b from-brand-primary/5 to-transparent px-6 py-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Extract your own brand kit — free
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[hsl(var(--muted-foreground))]">
            Get colors, fonts, voice, and personality from any website in
            seconds. Open source.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" className="h-12 px-8">
              <Link to="/sign-up">
                Get started free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-semibold">ExtractVibe</span>
            </Link>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              &copy; {new Date().getFullYear()} ExtractVibe. Open source.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
