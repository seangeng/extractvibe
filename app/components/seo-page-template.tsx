import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CodeBlock } from "~/components/docs/code-block";
import { MarketingLayout } from "~/components/marketing-layout";

export interface SeoPageData {
  heroLabel: string;
  heroTitle: string;
  heroTitleMuted: string;
  heroDescription: string;
  features: Array<{ title: string; description: string }>;
  steps?: Array<{ number: string; title: string; description: string }>;
  codeExample?: { title: string; language: string; code: string };
  faq?: Array<{ question: string; answer: string }>;
  ctaTitle: string;
  ctaDescription: string;
  relatedPages: Array<{ title: string; description: string; href: string }>;
}

function FaqJsonLd({ faq }: { faq: Array<{ question: string; answer: string }> }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function SeoPageTemplate({ data }: { data: SeoPageData }) {
  return (
    <MarketingLayout>
      {data.faq && data.faq.length > 0 && <FaqJsonLd faq={data.faq} />}

      {/* Hero */}
      <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 md:py-32">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            {data.heroLabel}
          </p>
          <h1 className="mt-5 font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            <span className="font-bold">{data.heroTitle}</span>
            <br />
            <span className="font-normal text-[hsl(var(--muted-foreground))]">
              {data.heroTitleMuted}
            </span>
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-[hsl(var(--muted-foreground))]">
            {data.heroDescription}
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Button asChild size="lg" className="h-12 px-8">
              <Link to="/sign-up">
                Get started free
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8">
              <Link to="/docs">View docs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-12">
            {data.features.map((feature, i) => (
              <div key={feature.title} className={i % 2 === 1 ? "md:mt-16" : ""}>
                <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                  {String(i + 1).padStart(2, "0")} / {data.heroLabel}
                </p>
                <h3 className="mt-4 font-display text-2xl leading-[1.15] md:text-3xl">
                  <span className="font-bold">{feature.title}</span>
                </h3>
                <p className="mt-4 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      {data.steps && data.steps.length > 0 && (
        <section className="border-t border-[hsl(var(--border))]">
          <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              How it works
            </p>
            <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-3">
              {data.steps.map((step) => (
                <div key={step.number}>
                  <p className="font-display text-5xl font-bold text-[hsl(var(--border))]">
                    {step.number}
                  </p>
                  <h4 className="mt-4 text-lg font-semibold">{step.title}</h4>
                  <p className="mt-2 leading-relaxed text-[hsl(var(--muted-foreground))]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Code example */}
      {data.codeExample && (
        <section className="border-t border-[hsl(var(--border))]">
          <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Code Example
            </p>
            <h3 className="mt-5 font-display text-2xl font-bold md:text-3xl">
              {data.codeExample.title}
            </h3>
            <div className="mt-8">
              <CodeBlock
                code={data.codeExample.code}
                language={data.codeExample.language}
                title={data.codeExample.title}
              />
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {data.faq && data.faq.length > 0 && (
        <section className="border-t border-[hsl(var(--border))]">
          <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Frequently Asked Questions
            </p>
            <div className="mt-10 divide-y divide-[hsl(var(--border))]">
              {data.faq.map((item) => (
                <details key={item.question} className="group py-5">
                  <summary className="flex cursor-pointer items-center justify-between text-base font-medium transition-colors hover:text-[hsl(var(--muted-foreground))] [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span className="ml-4 shrink-0 text-[hsl(var(--muted-foreground))] transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl leading-relaxed text-[hsl(var(--muted-foreground))]">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
                <span className="font-bold">{data.ctaTitle}</span>
              </h2>
              <p className="mt-4 max-w-md text-[hsl(var(--muted-foreground))]">
                {data.ctaDescription}
              </p>
            </div>
            <Button asChild size="lg" className="h-12 shrink-0 px-8">
              <Link to="/sign-up">
                Get started free
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Related Pages */}
      {data.relatedPages.length > 0 && (
        <section className="border-t border-[hsl(var(--border))]">
          <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
            <p className="mb-10 text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Related
            </p>
            <div className="scrollbar-none -mx-2 flex gap-4 overflow-x-auto pb-4">
              {data.relatedPages.map((page) => (
                <Link
                  key={page.href}
                  to={page.href}
                  className="group flex-shrink-0"
                >
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
      )}
    </MarketingLayout>
  );
}
