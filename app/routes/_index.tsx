import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowUpRight, Github } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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
  const [hoveredBrand, setHoveredBrand] = useState<string | null>(null);
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
      <nav className="fixed top-0 z-50 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/extract-vibe-logo.svg" className="h-7 w-7" alt="ExtractVibe logo" />
            <span className="text-lg font-bold tracking-tight">ExtractVibe</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              to="/sign-in"
              className="nav-link text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
            >
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link to="/sign-up">
                Get started
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero — Asymmetric Grid */}
      <section className="pt-32 md:pt-44">
        <div className="mx-auto max-w-7xl px-6 pb-24 md:pb-32">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
            {/* Headline column */}
            <div className="md:col-span-7">
              <h1 className="animate-fade-up font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
                <span className="font-bold">The brand kit</span>{" "}
                <span className="font-normal text-[hsl(var(--muted-foreground))]">
                  your website already has.
                </span>
              </h1>
              <p className="animate-fade-up animation-delay-100 mt-6 max-w-lg text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
                Extract comprehensive brand identity from any website — logos,
                colors, typography, voice, personality, and rules. Open source.
              </p>
            </div>

            {/* Form column */}
            <div className="animate-fade-up animation-delay-200 md:col-span-5 md:self-end">
              <form onSubmit={handleExtract} className="relative">
                <Input
                  type="text"
                  placeholder="Enter any website URL..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-14 rounded-2xl pr-14 text-base"
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="icon"
                  className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-xl"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </form>
              <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                Free to try. No credit card required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features — Staggered Editorial Blocks */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-12">
            {/* Feature 01 */}
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                01 / Visual Identity
              </p>
              <h3 className="mt-4 font-serif text-3xl leading-[1.1] md:text-4xl">
                <span className="font-bold">Deep extraction</span>{" "}
                <span className="font-normal text-[hsl(var(--muted-foreground))]">
                  beyond logos and colors.
                </span>
              </h3>
              <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                Captures logos, color palettes, gradients, spacing, typography
                stacks, icon systems, and visual hierarchy from any website
                automatically.
              </p>
            </div>

            {/* Feature 02 — stagger offset */}
            <div className="md:mt-16">
              <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                02 / Brand Voice
              </p>
              <h3 className="mt-4 font-serif text-3xl leading-[1.1] md:text-4xl">
                <span className="font-bold">AI-powered analysis</span>{" "}
                <span className="font-normal text-[hsl(var(--muted-foreground))]">
                  of tone, style, and personality.
                </span>
              </h3>
              <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                Uses advanced language models to determine brand tone,
                personality traits, communication patterns, and writing style
                from real copy.
              </p>
            </div>

            {/* Feature 03 */}
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                03 / Vibe Synthesis
              </p>
              <h3 className="mt-4 font-serif text-3xl leading-[1.1] md:text-4xl">
                <span className="font-bold">Holistic brand profile</span>{" "}
                <span className="font-normal text-[hsl(var(--muted-foreground))]">
                  with actionable rules.
                </span>
              </h3>
              <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                Combines visual and verbal identity signals into a single,
                coherent brand profile with inferred guidelines, do's and
                don'ts, and export-ready data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                50+ fields extracted
              </span>
            </div>
            <div className="hidden h-4 w-px bg-[hsl(var(--border))] sm:block" />
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                5 export formats
              </span>
            </div>
            <div className="hidden h-4 w-px bg-[hsl(var(--border))] sm:block" />
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                ~20s per domain
              </span>
            </div>
            <div className="hidden h-4 w-px bg-[hsl(var(--border))] sm:block" />
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                Open source
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Extracted — Horizontal Scroll Strip */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="mb-10 text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
            Recently Extracted
          </p>
          <div className="scrollbar-none -mx-2 flex gap-4 overflow-x-auto pb-4">
            {recentlyExtracted.map((brand) => (
              <Link
                key={brand.domain}
                to={`/brand/${brand.domain}`}
                className="group flex-shrink-0"
                onMouseEnter={() => setHoveredBrand(brand.domain)}
                onMouseLeave={() => setHoveredBrand(null)}
              >
                <div className="flex min-w-[280px] flex-col rounded-2xl border border-[hsl(var(--border))] px-8 py-10 transition-colors duration-200 hover:bg-[hsl(var(--muted))]">
                  <span className="font-serif text-2xl">{brand.domain}</span>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {brand.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p
                    className={`mt-6 flex items-center gap-1.5 text-sm font-medium transition-opacity duration-200 ${
                      hoveredBrand === brand.domain ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    View brand kit
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Asymmetric */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <h2 className="font-serif text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              <span className="font-bold">Ready to extract</span>{" "}
              <span className="font-normal text-[hsl(var(--muted-foreground))]">
                your brand?
              </span>
            </h2>
            <Button asChild size="lg" className="h-12 shrink-0 px-8">
              <Link to="/sign-up">
                Get started free
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/extract-vibe-logo.svg" className="h-6 w-6" alt="ExtractVibe logo" />
              <span className="text-sm font-semibold">ExtractVibe</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-[hsl(var(--muted-foreground))]">
              <a
                href="https://github.com/extractvibe/extractvibe"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link transition-colors hover:text-[hsl(var(--foreground))]"
              >
                GitHub
              </a>
              <Link
                to="/docs"
                className="nav-link transition-colors hover:text-[hsl(var(--foreground))]"
              >
                Docs
              </Link>
              <Link
                to="/api"
                className="nav-link transition-colors hover:text-[hsl(var(--foreground))]"
              >
                API
              </Link>
            </nav>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              &copy; {new Date().getFullYear()} ExtractVibe
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
