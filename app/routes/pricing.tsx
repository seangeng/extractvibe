import { Link } from "react-router";
import { ArrowUpRight, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { MarketingLayout } from "~/components/marketing-layout";
import { cn } from "~/lib/utils";

export function meta() {
  return [
    { title: "Pricing — Free Brand Extraction to Start | ExtractVibe" },
    {
      name: "description",
      content:
        "Extract brand kits for free. 50 extractions per month on the free plan. Starter and Pro plans for agencies and teams that need more.",
    },
    {
      property: "og:title",
      content: "Pricing — Free Brand Extraction | ExtractVibe",
    },
    {
      property: "og:description",
      content:
        "Start extracting brand kits for free. 50/mo free, 500/mo Starter, unlimited Pro. No credit card required.",
    },
  ];
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  ctaHref: string;
  highlighted: boolean;
  features: PlanFeature[];
}

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "For individuals exploring brand extraction.",
    cta: "Get started free",
    ctaHref: "/sign-up",
    highlighted: false,
    features: [
      { text: "50 extractions per month", included: true },
      { text: "Full brand kit output", included: true },
      { text: "JSON export", included: true },
      { text: "API access (1 key)", included: true },
      { text: "Community support", included: true },
      { text: "Batch extraction", included: false },
      { text: "Scheduled monitoring", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Starter",
    price: "$19",
    period: "/month",
    description: "For freelancers and small teams with regular needs.",
    cta: "Start free trial",
    ctaHref: "/sign-up",
    highlighted: true,
    features: [
      { text: "500 extractions per month", included: true },
      { text: "Full brand kit output", included: true },
      { text: "JSON + CSS + Tailwind export", included: true },
      { text: "API access (5 keys)", included: true },
      { text: "Email support", included: true },
      { text: "Batch extraction", included: true },
      { text: "Scheduled monitoring", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For agencies and teams that need unlimited access.",
    cta: "Start free trial",
    ctaHref: "/sign-up",
    highlighted: false,
    features: [
      { text: "Unlimited extractions", included: true },
      { text: "Full brand kit output", included: true },
      { text: "All export formats", included: true },
      { text: "API access (unlimited keys)", included: true },
      { text: "Priority support", included: true },
      { text: "Batch extraction", included: true },
      { text: "Scheduled monitoring", included: true },
      { text: "Custom webhook integrations", included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-24 md:py-32">
        <div className="mx-auto w-full max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Pricing
          </p>
          <h1 className="mt-5 font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            <span className="font-bold">Start free,</span>
            <br />
            <span className="font-normal text-[hsl(var(--muted-foreground))]">
              scale as you grow.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-md leading-relaxed text-[hsl(var(--muted-foreground))]">
            50 extractions per month on the free plan. No credit card required.
            Upgrade when you need more capacity or advanced features.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "flex flex-col rounded-2xl border p-8",
                  plan.highlighted
                    ? "border-[hsl(var(--foreground))] shadow-lg"
                    : "border-[hsl(var(--border))]"
                )}
              >
                {plan.highlighted && (
                  <p className="mb-4 text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                    Most Popular
                  </p>
                )}
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    {plan.period}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {plan.description}
                </p>

                <Button
                  asChild
                  variant={plan.highlighted ? "default" : "outline"}
                  className="mt-8 h-12 w-full"
                >
                  <Link to={plan.ctaHref}>
                    {plan.cta}
                    <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>

                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.text}
                      className={cn(
                        "flex items-start gap-3 text-sm",
                        feature.included
                          ? "text-[hsl(var(--foreground))]"
                          : "text-[hsl(var(--muted-foreground))] line-through"
                      )}
                    >
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          feature.included
                            ? "text-[hsl(var(--foreground))]"
                            : "text-[hsl(var(--muted-foreground))]"
                        )}
                      />
                      {feature.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Frequently Asked Questions
          </p>
          <div className="mt-10 divide-y divide-[hsl(var(--border))]">
            {[
              {
                q: "What counts as one extraction?",
                a: "Each URL you submit for brand analysis counts as one extraction, regardless of how many data points are returned.",
              },
              {
                q: "Can I self-host for free?",
                a: "Yes. ExtractVibe is open source under the MIT license. Self-host on your own Cloudflare account with your own AI credits.",
              },
              {
                q: "Do unused extractions roll over?",
                a: "No. Monthly extraction credits reset at the beginning of each billing cycle. Unused credits do not carry over.",
              },
              {
                q: "Is there an annual discount?",
                a: "Annual plans are coming soon with a 20% discount. Sign up for the monthly plan today and we will migrate you when annual pricing launches.",
              },
            ].map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between text-base font-medium transition-colors hover:text-[hsl(var(--muted-foreground))] [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="ml-4 shrink-0 text-[hsl(var(--muted-foreground))] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <h2 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              <span className="font-bold">Start extracting</span>{" "}
              <span className="font-normal text-[hsl(var(--muted-foreground))]">
                for free.
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
    </MarketingLayout>
  );
}
