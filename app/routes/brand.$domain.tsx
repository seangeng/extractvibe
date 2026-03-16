import { Link } from "react-router";
import { Globe, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
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
      <h2 className="mt-3 font-serif text-2xl font-bold">{title}</h2>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function ColorSwatch({ color }: { color: ColorValue; label?: string }) {
  const hex = color.hex || "#000000";
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="h-16 w-16 rounded-xl border border-[hsl(var(--border))]"
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
        <span className="font-medium text-[hsl(var(--foreground))]">
          {label}
        </span>
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

function FontFamilyCard({ family }: { family: FontFamily }) {
  return (
    <div className="space-y-2 rounded-xl border border-[hsl(var(--border))] p-4">
      <div className="flex items-start justify-between gap-2">
        <h4
          className="font-serif text-lg font-semibold"
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
            className="flex items-center gap-4 rounded-xl border border-[hsl(var(--border))] px-4 py-3"
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
            <img src="/extract-vibe-logo.svg" alt="ExtractVibe" className="h-8 w-8" />
            <span className="text-lg font-bold">ExtractVibe</span>
          </Link>
          <Button asChild size="sm">
            <Link to="/sign-up">Extract your brand</Link>
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl space-y-12 px-6 py-10 md:py-16">
        {/* ─── 01. Brand Header ──────────────────────────────────────────── */}
        <section className="animate-fade-up space-y-4">
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
          <h1 className="font-serif text-3xl font-bold tracking-tight md:text-5xl">
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
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {/* Visual energy bar */}
          {vibe?.visualEnergy !== undefined && vibe.visualEnergy !== null && (
            <div className="max-w-md space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                <span>Visual Energy</span>
                <span className="font-semibold tabular-nums text-[hsl(var(--foreground))]">
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
          {/* Comparable brands */}
          {vibe?.comparableBrands && vibe.comparableBrands.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Comparable Brands
              </p>
              <div className="flex flex-wrap gap-1.5">
                {vibe.comparableBrands.map((brand: string) => (
                  <span key={brand} className="text-sm text-[hsl(var(--muted-foreground))]">
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ─── 02. Color Palette ─────────────────────────────────────────── */}
        {allDisplayColors.length > 0 && (
          <section className="animate-fade-up animation-delay-100 space-y-5">
            <SectionLabel number="01" label="Color Palette" title="Colors" />

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
          </section>
        )}

        {/* ─── 03. Typography ────────────────────────────────────────────── */}
        {typography &&
          ((typography.families && typography.families.length > 0) ||
            typography.scale) && (
            <section className="animate-fade-up animation-delay-200 space-y-5">
              <SectionLabel number="02" label="Typography" title="Fonts" />

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
            </section>
          )}

        {/* ─── 04. Voice Tone Spectrum ───────────────────────────────────── */}
        {toneSpectrum &&
          (toneSpectrum.formalCasual !== undefined ||
            toneSpectrum.playfulSerious !== undefined ||
            toneSpectrum.enthusiasticMatterOfFact !== undefined ||
            toneSpectrum.respectfulIrreverent !== undefined ||
            toneSpectrum.technicalAccessible !== undefined) && (
            <section className="animate-fade-up animation-delay-300 space-y-5">
              <SectionLabel number="03" label="Voice & Tone" title="Personality" />

              <div className="space-y-5">
                <ToneBar
                  label="Formality"
                  leftLabel="Formal"
                  rightLabel="Casual"
                  value={toneSpectrum.formalCasual}
                />
                <ToneBar
                  label="Mood"
                  leftLabel="Playful"
                  rightLabel="Serious"
                  value={toneSpectrum.playfulSerious}
                />
                <ToneBar
                  label="Energy"
                  leftLabel="Enthusiastic"
                  rightLabel="Matter-of-Fact"
                  value={toneSpectrum.enthusiasticMatterOfFact}
                />
                <ToneBar
                  label="Attitude"
                  leftLabel="Respectful"
                  rightLabel="Irreverent"
                  value={toneSpectrum.respectfulIrreverent}
                />
                <ToneBar
                  label="Complexity"
                  leftLabel="Technical"
                  rightLabel="Accessible"
                  value={toneSpectrum.technicalAccessible}
                />
              </div>
            </section>
          )}

        {/* ─── 05. Brand Rules ───────────────────────────────────────────── */}
        {rules &&
          ((rules.dos && rules.dos.length > 0) ||
            (rules.donts && rules.donts.length > 0)) && (
            <section className="animate-fade-up animation-delay-400 space-y-5">
              <SectionLabel number="04" label="Brand Rules" title="Dos & Don&apos;ts" />

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
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          {rule}
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
                      {rules.donts.map((rule: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm leading-relaxed text-[hsl(var(--foreground))]"
                        >
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--destructive))]" />
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

        {/* ─── 06. Vibe Details ──────────────────────────────────────────── */}
        {vibe &&
          ((vibe.visualEnergy !== undefined && vibe.visualEnergy !== null) ||
            vibe.designEra ||
            vibe.emotionalTone ||
            vibe.targetAudienceInferred) && (
            <section className="animate-fade-up animation-delay-400 space-y-5">
              <SectionLabel number="05" label="Brand Vibe" title="Details" />

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
            </section>
          )}

        {/* ─── CTA ──────────────────────────────────────────────────────── */}
        <section className="animate-fade-up animation-delay-400 rounded-xl border border-[hsl(var(--border))] px-6 py-12 text-center">
          <h2 className="font-serif text-2xl font-bold tracking-tight md:text-3xl">
            Extract your own brand kit
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[hsl(var(--muted-foreground))]">
            Get colors, fonts, voice, and personality from any website in
            seconds. Open source.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" className="h-12 px-8">
              <Link to="/sign-up">
                Get started free
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
              <img src="/extract-vibe-logo.svg" alt="ExtractVibe" className="h-7 w-7" />
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
