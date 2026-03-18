import { Link } from "react-router";
import { ArrowUpRight, Cpu, Zap, Brain } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CodeBlock } from "~/components/docs/code-block";
import { MarketingLayout } from "~/components/marketing-layout";

export function meta() {
  return [
    { title: "AI Technology — Dual-AI Brand Extraction Engine | ExtractVibe" },
    {
      name: "description",
      content:
        "Learn how ExtractVibe uses a dual-AI architecture with Cloudflare Workers AI and OpenRouter to extract brand identity at speed and quality.",
    },
    {
      property: "og:title",
      content: "AI Technology — Dual-AI Brand Extraction | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "Dual-AI architecture: Workers AI for speed, OpenRouter for depth. See how ExtractVibe's extraction pipeline works.",
    },
  ];
}

const pipelineDiagram = `
  URL Input
     |
     v
+-------------------+
| 1. FETCH & RENDER |  Cloudflare Browser Rendering
|   Puppeteer        |  Full-page screenshot + DOM
+-------------------+
     |
     v
+-------------------+
| 2. PARSE ASSETS   |  Workers AI (Llama 3.1 8B)
|   HTML/CSS/Images  |  Extract colors, fonts, logos
+-------------------+
     |
     v
+-------------------+
| 3. ANALYZE VOICE  |  OpenRouter (Gemini Flash 2.0)
|   Copy & Content   |  Tone, personality, style
+-------------------+
     |
     v
+-------------------+
| 4. SYNTHESIZE     |  OpenRouter (Gemini Flash 2.0)
|   Brand Profile    |  Combine visual + verbal
+-------------------+
     |
     v
+-------------------+
| 5. SCORE & PACK   |  Workers AI (Llama 3.1 8B)
|   Brand Kit JSON   |  Quality score + export
+-------------------+
     |
     v
  Brand Kit Output
`.trim();

export default function AiPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 md:py-32">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            AI Technology
          </p>
          <h1 className="mt-5 font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            <span className="font-bold">Dual-AI architecture</span>
            <br />
            <span className="font-normal text-[hsl(var(--muted-foreground))]">
              for speed and depth.
            </span>
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-[hsl(var(--muted-foreground))]">
            ExtractVibe uses two AI systems working together: Cloudflare Workers
            AI for fast, free bulk analysis, and OpenRouter for deep brand voice
            and personality understanding. The result is near-zero AI cost with
            high-quality output.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Button asChild size="lg" className="h-12 px-8">
              <Link to="/sign-up">
                Try it free
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8">
              <Link to="/docs">API docs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Dual-AI Section */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Architecture
          </p>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Two AI systems, one extraction
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-[hsl(var(--muted-foreground))]">
            Each AI system handles what it does best. Workers AI runs free models
            at the edge for structured data extraction. OpenRouter connects to
            frontier models for nuanced language analysis.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Workers AI */}
            <div className="rounded-2xl border border-[hsl(var(--border))] p-8">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                  Primary
                </p>
              </div>
              <h3 className="mt-4 text-xl font-semibold">
                Cloudflare Workers AI
              </h3>
              <p className="mt-3 leading-relaxed text-[hsl(var(--muted-foreground))]">
                Runs Meta Llama 3.1 8B Instruct at the edge with zero additional
                cost. Handles structured extraction tasks: parsing HTML/CSS,
                extracting color values, detecting font families, and identifying
                component patterns.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-[hsl(var(--muted-foreground))]">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--foreground))]" />
                  Free tier with generous limits
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--foreground))]" />
                  Edge execution for low latency
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--foreground))]" />
                  Handles 80% of extraction tasks
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--foreground))]" />
                  Structured JSON output
                </li>
              </ul>
            </div>

            {/* OpenRouter */}
            <div className="rounded-2xl border border-[hsl(var(--border))] p-8">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                  Fallback
                </p>
              </div>
              <h3 className="mt-4 text-xl font-semibold">
                OpenRouter
              </h3>
              <p className="mt-3 leading-relaxed text-[hsl(var(--muted-foreground))]">
                Connects to high-quality models like Gemini Flash 2.0 for tasks
                requiring nuanced language understanding. Used for brand voice
                analysis, personality profiling, and vibe synthesis where depth
                matters more than speed.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-[hsl(var(--muted-foreground))]">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--foreground))]" />
                  Access to frontier models
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--foreground))]" />
                  Deep language understanding
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--foreground))]" />
                  Used for voice and vibe analysis
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--foreground))]" />
                  Cost-optimized model selection
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Diagram */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Extraction Pipeline
          </p>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Five-step extraction pipeline
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-[hsl(var(--muted-foreground))]">
            Every brand extraction follows a durable, multi-step workflow. Each
            step runs independently with automatic retries, ensuring reliable
            results even on complex websites.
          </p>
          <div className="mt-10">
            <CodeBlock
              code={pipelineDiagram}
              language="text"
              title="Extraction Pipeline"
            />
          </div>
        </div>
      </section>

      {/* How Each Step Works */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-12">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                01 / Fetch & Render
              </p>
              <h3 className="mt-4 font-display text-2xl leading-[1.15] md:text-3xl">
                <span className="font-bold">Browser rendering</span>
              </h3>
              <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                Cloudflare Browser Rendering launches a headless browser to
                render the full page, execute JavaScript, and capture a
                screenshot. The complete DOM with computed styles is then
                available for analysis.
              </p>
            </div>

            <div className="md:mt-16">
              <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                02 / Parse Assets
              </p>
              <h3 className="mt-4 font-display text-2xl leading-[1.15] md:text-3xl">
                <span className="font-bold">Visual identity extraction</span>
              </h3>
              <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                Workers AI analyzes computed styles on every DOM element to
                extract colors, fonts, spacing, gradients, border radii, and
                shadow values. Logos and icons are identified and downloaded to
                R2 storage.
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                03 / Analyze Voice
              </p>
              <h3 className="mt-4 font-display text-2xl leading-[1.15] md:text-3xl">
                <span className="font-bold">Brand voice analysis</span>
              </h3>
              <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                OpenRouter sends the extracted text content to Gemini Flash 2.0
                for deep language analysis. The model classifies tone,
                identifies personality traits, and generates writing style
                guidelines.
              </p>
            </div>

            <div className="md:mt-16">
              <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                04 / Synthesize
              </p>
              <h3 className="mt-4 font-display text-2xl leading-[1.15] md:text-3xl">
                <span className="font-bold">Vibe synthesis</span>
              </h3>
              <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                Visual and verbal data are combined into a holistic brand
                profile. The AI synthesizes a "vibe" description capturing the
                overall brand feel, and generates actionable do's and don'ts.
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
              <h2 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
                <span className="font-bold">See AI extraction in action</span>
              </h2>
              <p className="mt-4 max-w-md text-[hsl(var(--muted-foreground))]">
                Extract a brand kit from any website in under 30 seconds. Free
                to start, no credit card required.
              </p>
            </div>
            <Button asChild size="lg" className="h-12 shrink-0 px-8">
              <Link to="/">
                Try it now
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Related Pages */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="mb-10 text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Related
          </p>
          <div className="scrollbar-none -mx-2 flex gap-4 overflow-x-auto pb-4">
            {[
              {
                title: "Brand Voice Analysis",
                description: "Deep dive on how AI analyzes brand tone and personality.",
                href: "/ai/brand-voice-analysis",
              },
              {
                title: "Vibe Synthesis",
                description: "How AI creates holistic brand personality profiles.",
                href: "/ai/vibe-synthesis",
              },
              {
                title: "API Documentation",
                description: "Complete API reference with code examples.",
                href: "/docs",
              },
            ].map((page) => (
              <Link key={page.href} to={page.href} className="group flex-shrink-0">
                <div className="flex min-w-[280px] flex-col rounded-2xl border border-[hsl(var(--border))] px-8 py-10 transition-colors duration-200 hover:bg-[hsl(var(--muted))]">
                  <span className="font-display text-xl font-semibold">
                    {page.title}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                    {page.description}
                  </p>
                  <p className="mt-6 flex items-center gap-1.5 text-sm font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    Learn more
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
