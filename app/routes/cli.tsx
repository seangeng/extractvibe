import { Link } from "react-router";
import { ArrowUpRight, Terminal } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CodeBlock } from "~/components/docs/code-block";
import { MarketingLayout } from "~/components/marketing-layout";

export function meta() {
  return [
    { title: "CLI — Extract Brands from the Command Line | ExtractVibe" },
    {
      name: "description",
      content:
        "Coming soon: the ExtractVibe CLI. Extract brand kits from any website directly from your terminal. Install via npm, pipe output to files or other tools.",
    },
    {
      property: "og:title",
      content: "ExtractVibe CLI — Command-Line Brand Extraction",
    },
    {
      property: "og:description",
      content:
        "Coming soon: extract brand kits from your terminal. Install via npm, pipe to files, integrate with CI/CD.",
    },
  ];
}

const installExample = `# Install globally via npm
npm install -g extractvibe

# Or use npx without installing
npx extractvibe extract stripe.com`;

const usageExamples = `# Extract a full brand kit
extractvibe extract stripe.com

# Extract only colors
extractvibe extract stripe.com --only colors

# Extract and save as JSON
extractvibe extract linear.app --output brand-kit.json

# Extract and pipe to jq
extractvibe extract vercel.com --json | jq '.colors'

# Extract multiple sites
extractvibe extract stripe.com linear.app vercel.com

# Generate a Tailwind config from extraction
extractvibe extract notion.so --format tailwind > tailwind.brand.js

# Generate CSS custom properties
extractvibe extract figma.com --format css > brand-tokens.css`;

const ciExample = `# .github/workflows/brand-check.yml
name: Brand Consistency Check
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g extractvibe
      - run: |
          extractvibe extract mysite.com --json > current.json
          extractvibe diff brand-baseline.json current.json
      - name: Alert on changes
        if: failure()
        run: echo "Brand identity has changed!"`;

export default function CliPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-24 md:py-32">
        <div className="mx-auto w-full max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-4 py-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))]">
            <Terminal className="h-4 w-4" />
            Coming Soon
          </div>
          <h1 className="mt-6 font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            <span className="font-bold">Brand extraction</span>
            <br />
            <span className="font-normal text-[hsl(var(--muted-foreground))]">
              from your terminal.
            </span>
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-[hsl(var(--muted-foreground))]">
            The ExtractVibe CLI will let you extract brand kits directly from
            the command line. Install via npm, pipe output to files, and
            integrate with CI/CD pipelines. Currently in development.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Button asChild size="lg" className="h-12 px-8">
              <Link to="/sign-up">
                Get notified at launch
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8">
              <Link to="/docs">Use the API now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Install */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Installation
          </p>
          <h2 className="mt-5 font-display text-2xl font-bold md:text-3xl">
            Install with npm
          </h2>
          <p className="mt-4 leading-relaxed text-[hsl(var(--muted-foreground))]">
            The CLI will be published as an npm package. Install it globally or
            use npx for one-off extractions.
          </p>
          <div className="mt-8">
            <CodeBlock code={installExample} language="bash" title="Installation" />
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Usage
          </p>
          <h2 className="mt-5 font-display text-2xl font-bold md:text-3xl">
            Example commands
          </h2>
          <p className="mt-4 leading-relaxed text-[hsl(var(--muted-foreground))]">
            The CLI supports multiple output formats, filtering by extraction
            type, batch extraction, and piping to other tools.
          </p>
          <div className="mt-8">
            <CodeBlock code={usageExamples} language="bash" title="Usage examples" />
          </div>
        </div>
      </section>

      {/* CI/CD */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            CI/CD Integration
          </p>
          <h2 className="mt-5 font-display text-2xl font-bold md:text-3xl">
            Automate brand consistency checks
          </h2>
          <p className="mt-4 leading-relaxed text-[hsl(var(--muted-foreground))]">
            Use the CLI in GitHub Actions, GitLab CI, or any CI/CD pipeline to
            automatically check for brand identity changes and alert your team.
          </p>
          <div className="mt-8">
            <CodeBlock code={ciExample} language="yaml" title="GitHub Actions workflow" />
          </div>
        </div>
      </section>

      {/* Planned Features */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Planned Features
          </p>
          <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-3">
            <div>
              <h4 className="text-lg font-semibold">Output Formats</h4>
              <p className="mt-2 leading-relaxed text-[hsl(var(--muted-foreground))]">
                JSON, CSS custom properties, Tailwind config, Style Dictionary,
                and W3C Design Tokens. Choose the format that fits your workflow.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold">Diff Command</h4>
              <p className="mt-2 leading-relaxed text-[hsl(var(--muted-foreground))]">
                Compare two brand extractions to see what changed. Useful for
                tracking brand evolution and catching unintended changes.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold">Watch Mode</h4>
              <p className="mt-2 leading-relaxed text-[hsl(var(--muted-foreground))]">
                Run continuous brand monitoring from the terminal. Get notified
                when a site's brand identity changes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
                <span className="font-bold">Can't wait?</span>
              </h2>
              <p className="mt-4 max-w-md text-[hsl(var(--muted-foreground))]">
                The REST API is available now. Start extracting brand kits
                programmatically today.
              </p>
            </div>
            <Button asChild size="lg" className="h-12 shrink-0 px-8">
              <Link to="/docs">
                View API docs
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
