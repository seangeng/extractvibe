import { Link } from "react-router";
import { ArrowUpRight, Github } from "lucide-react";
import { Button } from "~/components/ui/button";
import { MarketingLayout } from "~/components/marketing-layout";

export function meta() {
  return [
    { title: "About ExtractVibe — Open-Source Brand Intelligence" },
    {
      name: "description",
      content:
        "ExtractVibe is an open-source brand intelligence engine built on Cloudflare. Our mission: democratize brand extraction for designers, developers, and teams.",
    },
    {
      property: "og:title",
      content: "About ExtractVibe — Open-Source Brand Intelligence",
    },
    {
      property: "og:description",
      content:
        "Open-source brand intelligence built on Cloudflare. Democratizing brand extraction for designers, developers, and teams.",
    },
  ];
}

export default function AboutPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-24 md:py-32">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            About
          </p>
          <h1 className="mt-5 font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            <span className="font-bold">Democratizing</span>
            <br />
            <span className="font-normal text-[hsl(var(--muted-foreground))]">
              brand intelligence.
            </span>
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-[hsl(var(--muted-foreground))]">
            ExtractVibe is an open-source brand intelligence engine that
            extracts comprehensive brand identity information from any website.
            We believe brand understanding should be accessible to everyone, not
            locked behind expensive tools and manual processes.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-12">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                01 / Mission
              </p>
              <h3 className="mt-4 font-display text-2xl leading-[1.15] md:text-3xl">
                <span className="font-bold">
                  Brand identity should be extractable, structured, and open.
                </span>
              </h3>
              <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                Every website contains a brand identity expressed through
                colors, typography, voice, and visual patterns. ExtractVibe
                makes that implicit identity explicit and machine-readable. We
                believe this capability should be open source and accessible to
                solo designers, agencies, and enterprise teams alike.
              </p>
            </div>

            <div className="md:mt-16">
              <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                02 / Approach
              </p>
              <h3 className="mt-4 font-display text-2xl leading-[1.15] md:text-3xl">
                <span className="font-bold">
                  AI-powered, edge-native, developer-friendly.
                </span>
              </h3>
              <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                Built entirely on Cloudflare's developer platform, ExtractVibe
                runs at the edge with minimal latency. The dual-AI architecture
                (Workers AI + OpenRouter) keeps costs near zero while delivering
                high-quality brand analysis. Everything is API-first with
                structured JSON output.
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                03 / Open Source
              </p>
              <h3 className="mt-4 font-display text-2xl leading-[1.15] md:text-3xl">
                <span className="font-bold">
                  MIT licensed. Self-host or contribute.
                </span>
              </h3>
              <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                ExtractVibe is fully open source under the MIT license. You can
                self-host on your own Cloudflare account, fork the codebase for
                custom needs, or contribute features and improvements back to
                the community.
              </p>
            </div>

            <div className="md:mt-16">
              <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                04 / Built on Cloudflare
              </p>
              <h3 className="mt-4 font-display text-2xl leading-[1.15] md:text-3xl">
                <span className="font-bold">
                  Workers, D1, R2, AI, and Browser Rendering.
                </span>
              </h3>
              <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                ExtractVibe leverages the full Cloudflare stack: Workers for
                compute, D1 for the database, R2 for asset storage, Workers AI
                for inference, Browser Rendering for page capture, and Durable
                Objects for real-time progress. One platform, zero infrastructure
                to manage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Values
          </p>
          <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-3">
            <div>
              <h4 className="text-lg font-semibold">Transparency</h4>
              <p className="mt-2 leading-relaxed text-[hsl(var(--muted-foreground))]">
                Open source code, open pricing, open roadmap. We build in public
                and share everything we learn about brand extraction.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold">Accessibility</h4>
              <p className="mt-2 leading-relaxed text-[hsl(var(--muted-foreground))]">
                Brand intelligence should not be gated by expensive enterprise
                contracts. Our free tier is generous, and self-hosting is
                always an option.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold">Quality</h4>
              <p className="mt-2 leading-relaxed text-[hsl(var(--muted-foreground))]">
                We prioritize extraction accuracy over feature count. Every
                brand kit should be reliable enough to use in client work and
                production systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <h2 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              <span className="font-bold">Join the community</span>
            </h2>
            <div className="flex items-center gap-4">
              <Button asChild variant="outline" size="lg" className="h-12 px-8">
                <a
                  href="https://github.com/seangeng/extractvibe"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
              <Button asChild size="lg" className="h-12 px-8">
                <Link to="/sign-up">
                  Get started
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
