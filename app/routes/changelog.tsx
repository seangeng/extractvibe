import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { MarketingLayout } from "~/components/marketing-layout";

export function meta() {
  return [
    { title: "Changelog — What's New in ExtractVibe" },
    {
      name: "description",
      content:
        "Follow ExtractVibe development. See the latest features, improvements, and fixes as we build the open-source brand intelligence engine.",
    },
    {
      property: "og:title",
      content: "Changelog — What's New | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "Follow ExtractVibe development. Latest features, improvements, and fixes for the brand extraction engine.",
    },
  ];
}

interface ChangelogEntry {
  date: string;
  version: string;
  title: string;
  type: "feature" | "improvement" | "fix";
  description: string;
  items: string[];
}

const changelog: ChangelogEntry[] = [
  {
    date: "2026-03-18",
    version: "0.3.0",
    title: "SEO pages and marketing site",
    type: "feature",
    description:
      "Launched 20 new SEO-optimized pages covering features, use cases, AI technology, pricing, and more.",
    items: [
      "7 feature pages: colors, typography, voice, buttons, logos, gradients, design system",
      "5 use case pages: design agencies, developers, brand monitoring, competitive analysis, design tokens",
      "3 AI technology pages: overview, voice analysis, vibe synthesis",
      "Pricing page with Free, Starter, and Pro tiers",
      "About, changelog, CLI, and open source pages",
      "Updated sitemap with all new pages",
      "Marketing layout with comprehensive footer navigation",
    ],
  },
  {
    date: "2026-03-17",
    version: "0.2.0",
    title: "Rate limiting and anonymous access",
    type: "feature",
    description:
      "Added rate limiting for API endpoints and anonymous extraction support for the landing page.",
    items: [
      "Rate limiting middleware for all API endpoints",
      "Anonymous extraction: 3 free extractions per day without sign-up",
      "Real-time extraction progress on landing page via WebSocket",
      "Automatic redirect to brand page on extraction completion",
    ],
  },
  {
    date: "2026-03-16",
    version: "0.1.0",
    title: "Initial scaffold",
    type: "feature",
    description:
      "Complete project scaffold with all Cloudflare bindings, API routes, auth, and frontend skeleton.",
    items: [
      "Hono API with CORS, auth, and extraction endpoints",
      "Better Auth with D1 Kysely dialect",
      "React Router v7 SSR on Cloudflare Workers",
      "ExtractBrandWorkflow and JobProgressDO stubs",
      "Credit system with monthly reset via cron trigger",
      "shadcn/ui primitives: Button, Card, Input, Badge",
      "API documentation page with full endpoint reference",
    ],
  },
];

function TypeBadge({ type }: { type: ChangelogEntry["type"] }) {
  switch (type) {
    case "feature":
      return <Badge variant="outline">Feature</Badge>;
    case "improvement":
      return <Badge variant="outline">Improvement</Badge>;
    case "fix":
      return <Badge variant="outline">Fix</Badge>;
  }
}

export default function ChangelogPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-24 md:py-32">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Changelog
          </p>
          <h1 className="mt-5 font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            <span className="font-bold">What's new</span>
            <br />
            <span className="font-normal text-[hsl(var(--muted-foreground))]">
              in ExtractVibe.
            </span>
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-[hsl(var(--muted-foreground))]">
            Follow the development of ExtractVibe. New features, improvements,
            and fixes are documented here as they ship.
          </p>
        </div>
      </section>

      {/* Entries */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <div className="space-y-16">
            {changelog.map((entry) => (
              <article key={entry.version} className="relative">
                <div className="flex flex-wrap items-center gap-3">
                  <time className="font-mono text-sm text-[hsl(var(--muted-foreground))]">
                    {entry.date}
                  </time>
                  <span className="text-[hsl(var(--muted-foreground))]">
                    /
                  </span>
                  <span className="font-mono text-sm font-medium">
                    v{entry.version}
                  </span>
                  <TypeBadge type={entry.type} />
                </div>
                <h2 className="mt-4 text-xl font-semibold tracking-tight">
                  {entry.title}
                </h2>
                <p className="mt-3 leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {entry.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {entry.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-[hsl(var(--muted-foreground))]"
                    >
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--foreground))]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <h2 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
              <span className="font-bold">Stay up to date</span>
            </h2>
            <div className="flex items-center gap-4">
              <Button asChild variant="outline" size="lg" className="h-12 px-8">
                <a
                  href="https://github.com/seangeng/extractvibe"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Watch on GitHub
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" className="h-12 px-8">
                <Link to="/">
                  Try ExtractVibe
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
