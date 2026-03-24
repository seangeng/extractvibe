import { Link } from "react-router";
import { ArrowUpRight, Github } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useSession } from "~/lib/auth-client";

const footerColumns: Array<{
  heading: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}> = [
  {
    heading: "Product",
    links: [
      { label: "Color Extraction", href: "/features/colors" },
      { label: "Typography", href: "/features/typography" },
      { label: "Voice Analysis", href: "/features/voice" },
      { label: "Logo Detection", href: "/features/logos" },
      { label: "Button Styles", href: "/features/buttons" },
      { label: "Gradients & Shadows", href: "/features/gradients" },
      { label: "Design System", href: "/features/design-system" },
      { label: "Dark Mode Detection", href: "/features/colors" },
      { label: "CSS Variable Mapping", href: "/features/colors" },
      { label: "Type Scale Analysis", href: "/features/typography" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    heading: "Use Cases",
    links: [
      { label: "Design Agencies", href: "/use-cases/design-agencies" },
      { label: "Developers", href: "/use-cases/developers" },
      { label: "Brand Monitoring", href: "/use-cases/brand-monitoring" },
      { label: "Competitive Analysis", href: "/use-cases/competitive-analysis" },
      { label: "Design Tokens", href: "/use-cases/design-tokens" },
      { label: "Client Onboarding", href: "/use-cases/design-agencies" },
      { label: "Brand Audits", href: "/use-cases/design-agencies" },
      { label: "CI/CD Integration", href: "/use-cases/developers" },
      { label: "Multi-Platform Tokens", href: "/use-cases/design-tokens" },
      { label: "Figma Sync", href: "/use-cases/design-tokens" },
    ],
  },
  {
    heading: "AI",
    links: [
      { label: "AI Technology", href: "/ai" },
      { label: "Voice Analysis AI", href: "/features/voice" },
      { label: "Vibe Synthesis", href: "/features/design-system" },
      { label: "Brand Scoring", href: "/features/design-system" },
      { label: "Tone Spectrum", href: "/features/voice" },
      { label: "Personality Traits", href: "/features/voice" },
      { label: "Copywriting Patterns", href: "/features/voice" },
      { label: "Workers AI", href: "/ai" },
      { label: "OpenRouter Models", href: "/ai" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "API Docs", href: "/docs" },
      { label: "REST API Reference", href: "/docs" },
      { label: "WebSocket API", href: "/docs" },
      { label: "Authentication", href: "/docs" },
      { label: "CLI", href: "/cli" },
      { label: "Open Source", href: "/open-source" },
      { label: "GitHub", href: "https://github.com/extractvibe/extractvibe", external: true },
      { label: "OpenAPI Spec", href: "/docs" },
      { label: "SDKs", href: "/docs" },
      { label: "Self-Hosting Guide", href: "/docs" },
      { label: "Contributing", href: "https://github.com/extractvibe/extractvibe", external: true },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Changelog", href: "/changelog" },
      { label: "Blog", href: "/blog" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Status", href: "/status" },
      { label: "Contact", href: "/about" },
      { label: "Brand Kit", href: "/brand/extractvibe.com" },
      { label: "llms.txt", href: "/llms.txt" },
    ],
  },
];

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
        {heading}
      </p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => {
          const isExternal = link.external || link.href.startsWith("http");
          if (isExternal) {
            return (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
                >
                  {link.label}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
            );
          }
          return (
            <li key={link.label}>
              <Link
                to={link.href}
                className="text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MarketingNav() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/extract-vibe-logo.svg"
              className="h-7 w-7"
              alt="ExtractVibe logo"
            />
            <span className="text-lg font-bold tracking-tight">ExtractVibe</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link
              to="/docs"
              className="nav-link text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
            >
              Docs
            </Link>
            <Link
              to="/pricing"
              className="nav-link text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
            >
              Pricing
            </Link>
            <a
              href="https://github.com/extractvibe/extractvibe"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
            >
              GitHub
            </a>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {session?.user ? (
            <Button asChild size="sm">
              <Link to="/dashboard">
                Dashboard
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-[hsl(var(--border))]">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        {/* Brand description */}
        <div className="max-w-sm">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/extract-vibe-logo.svg"
              className="h-7 w-7"
              alt="ExtractVibe logo"
            />
            <span className="text-lg font-bold tracking-tight">ExtractVibe</span>
          </Link>
          <p className="mt-4 leading-relaxed text-[hsl(var(--muted-foreground))]">
            Open-source brand intelligence engine. Extract comprehensive brand
            kits from any website.
          </p>
        </div>

        {/* Divider */}
        <div className="my-10 h-px bg-[hsl(var(--border))]" />

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:gap-10 sm:grid-cols-3 md:grid-cols-5">
          {footerColumns.map((column) => (
            <FooterColumn
              key={column.heading}
              heading={column.heading}
              links={column.links}
            />
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 h-px bg-[hsl(var(--border))]" />
        <div className="mt-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            &copy; {new Date().getFullYear()} ExtractVibe. Open source.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/extractvibe/extractvibe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://x.com/extractvibe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
              aria-label="X (Twitter)"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <MarketingNav />
      <main className="pt-[65px]">{children}</main>
      <MarketingFooter />
    </div>
  );
}
