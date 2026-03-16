import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  Sparkles,
  Palette,
  MessageSquareText,
  BookOpen,
  Waves,
  FileDown,
  ArrowRight,
  Globe,
  CheckCircle2,
  XCircle,
  Github,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useSession } from "~/lib/auth-client";

export function meta() {
  return [
    { title: "ExtractVibe — The brand kit your website already has" },
    {
      name: "description",
      content:
        "Extract comprehensive brand identity from any website — logos, colors, typography, voice, personality, and rules. Open source.",
    },
    {
      property: "og:title",
      content: "ExtractVibe — The brand kit your website already has",
    },
    {
      property: "og:description",
      content:
        "Extract comprehensive brand identity from any website — logos, colors, typography, voice, personality, and rules.",
    },
  ];
}

const features = [
  {
    icon: Palette,
    title: "Deep Visual Identity",
    description:
      "Extracts logos, color palettes, gradients, spacing, and visual hierarchy from any website automatically.",
  },
  {
    icon: MessageSquareText,
    title: "Brand Voice Analysis",
    description:
      "AI-powered copy analysis to determine brand tone, personality traits, and communication style.",
  },
  {
    icon: BookOpen,
    title: "Brand Rules",
    description:
      "Auto-generates inferred brand guidelines with clear do's and don'ts for consistent brand usage.",
  },
  {
    icon: Waves,
    title: "Vibe Synthesis",
    description:
      "Creates a holistic brand personality profile by combining visual and verbal identity signals.",
  },
  {
    icon: Sparkles,
    title: "Brand Kit Discovery",
    description:
      "Detects typography, font stacks, icon systems, image treatments, and component patterns.",
  },
  {
    icon: FileDown,
    title: "Multi-Format Export",
    description:
      "Export brand kits as JSON, PDF, or structured data for design tools and AI workflows.",
  },
];

const comparisonRows = [
  { feature: "Logo extraction", us: true, them: true },
  { feature: "Color palette detection", us: true, them: true },
  { feature: "Typography analysis", us: true, them: false },
  { feature: "Brand voice & tone", us: true, them: false },
  { feature: "Personality profiling", us: true, them: false },
  { feature: "Brand rule generation", us: true, them: false },
  { feature: "Multi-format export", us: true, them: false },
  { feature: "API access", us: true, them: false },
  { feature: "Open source", us: true, them: false },
];

const recentlyExtracted = [
  {
    domain: "stripe.com",
    tags: ["premium", "developer-first", "polished"],
  },
  {
    domain: "linear.app",
    tags: ["minimal", "fast", "modern"],
  },
  {
    domain: "vercel.com",
    tags: ["sleek", "dark-mode", "techy"],
  },
];

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function LandingPage() {
  const [url, setUrl] = useState("");
  const navigate = useNavigate();
  const { data: session } = useSession();

  function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    const normalizedUrl = normalizeUrl(url);
    const encoded = encodeURIComponent(normalizedUrl);

    if (session?.user) {
      navigate(`/dashboard/extract?url=${encoded}`);
    } else {
      navigate(
        `/sign-up?redirect=${encodeURIComponent(`/dashboard/extract?url=${encoded}`)}`
      );
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">ExtractVibe</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/sign-in"
              className="text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
            >
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link to="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <div className="h-[600px] w-[600px] rounded-full bg-brand-primary/10 blur-[120px]" />
          </div>
          <div className="absolute right-0 top-1/4">
            <div className="h-[400px] w-[400px] rounded-full bg-brand-accent/10 blur-[100px]" />
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-6 pb-24 pt-20 text-center md:pt-32 md:pb-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4 py-1.5 text-sm text-brand-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Open source brand intelligence
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            The brand kit your{" "}
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
              website already has
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[hsl(var(--muted-foreground))] md:text-xl">
            Extract comprehensive brand identity from any website — logos,
            colors, typography, voice, personality, and rules. Open source.
          </p>
          <form
            onSubmit={handleExtract}
            className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <Input
                type="text"
                placeholder="stripe.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-12 pl-10 text-base"
                required
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8">
              Extract
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>
          <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
            Free to try. No credit card required.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to understand a brand
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[hsl(var(--muted-foreground))]">
              Go beyond surface-level scraping. ExtractVibe uses browser
              rendering and AI analysis to build a complete brand profile.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all hover:border-brand-primary/30 hover:shadow-lg hover:shadow-brand-primary/5"
              >
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              More than just logos and colors
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[hsl(var(--muted-foreground))]">
              Most tools stop at the surface. ExtractVibe digs deep into every
              dimension of brand identity.
            </p>
          </div>
          <div className="mt-12 overflow-hidden rounded-lg border border-[hsl(var(--border))]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-[hsl(var(--muted-foreground))]">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-brand-primary">
                    ExtractVibe
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-[hsl(var(--muted-foreground))]">
                    Others
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={
                      i < comparisonRows.length - 1
                        ? "border-b border-[hsl(var(--border))]"
                        : ""
                    }
                  >
                    <td className="px-6 py-3.5 text-sm">{row.feature}</td>
                    <td className="px-6 py-3.5 text-center">
                      {row.us ? (
                        <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="mx-auto h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {row.them ? (
                        <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="mx-auto h-5 w-5 text-[hsl(var(--muted-foreground))]/40" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Recently Extracted */}
      <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Recently Extracted
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[hsl(var(--muted-foreground))]">
              See what brand kits look like. Explore real extractions from
              popular websites.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {recentlyExtracted.map((brand) => (
              <Link key={brand.domain} to={`/brand/${brand.domain}`}>
                <Card className="group h-full border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all hover:border-brand-primary/30 hover:shadow-lg hover:shadow-brand-primary/5">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <CardTitle className="text-base">{brand.domain}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {brand.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-primary opacity-0 transition-opacity group-hover:opacity-100">
                      View brand kit
                      <ArrowRight className="h-3.5 w-3.5" />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[hsl(var(--border))] bg-gradient-to-b from-brand-primary/5 to-transparent">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to extract your brand?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[hsl(var(--muted-foreground))]">
            Get started in seconds. Paste a URL, hit extract, and watch the
            magic happen.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-8">
              <Link to="/sign-up">
                Get started free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8">
              <a
                href="https://github.com/extractvibe/extractvibe"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-1 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-semibold">ExtractVibe</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[hsl(var(--muted-foreground))]">
              <a
                href="https://github.com/extractvibe/extractvibe"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[hsl(var(--foreground))]"
              >
                GitHub
              </a>
              <Link
                to="/sign-in"
                className="transition-colors hover:text-[hsl(var(--foreground))]"
              >
                Sign in
              </Link>
              <Link
                to="/sign-up"
                className="transition-colors hover:text-[hsl(var(--foreground))]"
              >
                Sign up
              </Link>
            </nav>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              &copy; {new Date().getFullYear()} ExtractVibe. Open source.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
