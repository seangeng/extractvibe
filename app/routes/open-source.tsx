import { Link } from "react-router";
import { ArrowUpRight, Github, GitFork, Star, Code } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CodeBlock } from "~/components/docs/code-block";
import { MarketingLayout } from "~/components/marketing-layout";

export function meta() {
  return [
    { title: "Open Source — MIT Licensed Brand Intelligence | ExtractVibe" },
    {
      name: "description",
      content:
        "ExtractVibe is open source under the MIT license. Self-host, fork, or contribute. Built on Cloudflare Workers with full transparency.",
    },
    {
      property: "og:title",
      content: "Open Source — MIT Licensed | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "ExtractVibe is open source. Self-host on Cloudflare, fork for custom needs, or contribute to the project.",
    },
  ];
}

const quickStartCode = `# Clone the repository
git clone https://github.com/extractvibe/extractvibe.git
cd extractvibe

# Install dependencies
npm install

# Set up local environment
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your secrets

# Create D1 database
npx wrangler d1 create extractvibe-db

# Run migrations
npx wrangler d1 execute extractvibe-db --local --file=server/db/migrations/0001_initial.sql

# Start development server
npm run dev`;

const contributingGuide = `# Fork and clone
git clone https://github.com/YOUR_USERNAME/extractvibe.git
cd extractvibe

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes, then run checks
npm run typecheck
npm run build

# Commit and push
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name

# Open a pull request on GitHub`;

export default function OpenSourcePage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-24 md:py-32">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Open Source
          </p>
          <h1 className="mt-5 font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            <span className="font-bold">Built in the open,</span>
            <br />
            <span className="font-normal text-[hsl(var(--muted-foreground))]">
              MIT licensed.
            </span>
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-[hsl(var(--muted-foreground))]">
            ExtractVibe is fully open source under the MIT license. View the
            source code, self-host on your own Cloudflare account, or contribute
            features and improvements to the community.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Button asChild size="lg" className="h-12 px-8">
              <a
                href="https://github.com/extractvibe/extractvibe"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8">
              <Link to="/docs">Read the docs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Open Source */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Why Open Source
          </p>
          <div className="mt-12 grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-12">
            <div>
              <div className="flex items-center gap-3">
                <Code className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                <h3 className="text-xl font-semibold">Full Transparency</h3>
              </div>
              <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                See exactly how brand data is extracted, what AI prompts are
                used, and how your data flows through the system. No black boxes.
              </p>
            </div>

            <div className="md:mt-16">
              <div className="flex items-center gap-3">
                <GitFork className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                <h3 className="text-xl font-semibold">Self-Host Anywhere</h3>
              </div>
              <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                Deploy ExtractVibe on your own Cloudflare account. Keep brand
                data under your control with your own database, storage, and AI
                credits.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                <h3 className="text-xl font-semibold">Community-Driven</h3>
              </div>
              <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                Feature requests, bug reports, and pull requests are welcome.
                The roadmap is public and prioritized by community feedback.
              </p>
            </div>

            <div className="md:mt-16">
              <div className="flex items-center gap-3">
                <Github className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                <h3 className="text-xl font-semibold">MIT License</h3>
              </div>
              <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                Use ExtractVibe in commercial projects, modify it, redistribute
                it. The MIT license gives you maximum freedom with minimal
                restrictions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Self-Host
          </p>
          <h2 className="mt-5 font-display text-2xl font-bold md:text-3xl">
            Get running in 5 minutes
          </h2>
          <p className="mt-4 leading-relaxed text-[hsl(var(--muted-foreground))]">
            ExtractVibe is built on Cloudflare Workers. You need a Cloudflare
            account (free tier works) and Node.js installed.
          </p>
          <div className="mt-8">
            <CodeBlock code={quickStartCode} language="bash" title="Quick start" />
          </div>
        </div>
      </section>

      {/* Contributing */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Contributing
          </p>
          <h2 className="mt-5 font-display text-2xl font-bold md:text-3xl">
            How to contribute
          </h2>
          <p className="mt-4 leading-relaxed text-[hsl(var(--muted-foreground))]">
            We welcome contributions of all kinds: bug fixes, new features,
            documentation improvements, and extraction accuracy enhancements.
          </p>
          <div className="mt-8">
            <CodeBlock
              code={contributingGuide}
              language="bash"
              title="Contributing workflow"
            />
          </div>

          <div className="mt-10 rounded-2xl border border-[hsl(var(--border))] p-8">
            <h3 className="text-lg font-semibold">Good first issues</h3>
            <p className="mt-2 leading-relaxed text-[hsl(var(--muted-foreground))]">
              Look for issues labeled{" "}
              <code className="rounded-md bg-[hsl(var(--muted))] px-1.5 py-0.5 font-mono text-sm">
                good first issue
              </code>{" "}
              on GitHub. These are curated for new contributors and include clear
              descriptions of what needs to be done.
            </p>
            <Button asChild variant="outline" className="mt-6" size="sm">
              <a
                href="https://github.com/extractvibe/extractvibe/labels/good%20first%20issue"
                target="_blank"
                rel="noopener noreferrer"
              >
                Browse good first issues
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Tech Stack
          </p>
          <h2 className="mt-5 font-display text-2xl font-bold md:text-3xl">
            Built on Cloudflare
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { name: "Workers", desc: "Compute" },
              { name: "D1", desc: "Database" },
              { name: "R2", desc: "Storage" },
              { name: "Workers AI", desc: "Inference" },
              { name: "Browser Rendering", desc: "Page capture" },
              { name: "Durable Objects", desc: "Real-time" },
              { name: "Workflows", desc: "Pipelines" },
              { name: "KV", desc: "Cache" },
            ].map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-[hsl(var(--border))] p-5"
              >
                <p className="font-semibold">{item.name}</p>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <h2 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              <span className="font-bold">Star us on GitHub</span>
            </h2>
            <Button asChild size="lg" className="h-12 shrink-0 px-8">
              <a
                href="https://github.com/extractvibe/extractvibe"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                extractvibe/extractvibe
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
