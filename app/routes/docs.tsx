import { useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { CodeBlock } from "~/components/docs/code-block";
import { cn } from "~/lib/utils";
import {
  endpoints,
  sidebarSections,
  authGuide,
  rateLimitTiers,
  errorCodes,
  type CodeExample,
  type EndpointDoc,
} from "~/lib/docs-data";

export function meta() {
  return [
    { title: "API Documentation - ExtractVibe" },
    {
      name: "description",
      content:
        "Complete API reference for ExtractVibe. Extract brand kits programmatically with curl, JavaScript, or Python.",
    },
  ];
}

// ---------------------------------------------------------------------------
// Code tabs — lightweight, no external deps
// ---------------------------------------------------------------------------
function CodeTabs({ examples }: { examples: CodeExample[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800">
      <div className="flex gap-1 border-b border-neutral-800 bg-neutral-950 px-1">
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              active === i
                ? "border-b-2 border-neutral-200 text-neutral-200"
                : "text-neutral-500 hover:text-neutral-400"
            )}
          >
            {ex.label}
          </button>
        ))}
      </div>
      <CodeBlock
        code={examples[active].code}
        language={examples[active].language}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Method badge
// ---------------------------------------------------------------------------
function MethodBadge({ method }: { method: EndpointDoc["method"] }) {
  switch (method) {
    case "GET":
      return (
        <Badge variant="outline" className="font-mono text-xs">
          GET
        </Badge>
      );
    case "POST":
      return (
        <Badge className="bg-[hsl(var(--foreground))] font-mono text-xs text-[hsl(var(--background))]">
          POST
        </Badge>
      );
    case "DELETE":
      return (
        <Badge className="bg-red-600 font-mono text-xs text-white">
          DELETE
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
function Sidebar({
  activeHash,
  onLinkClick,
}: {
  activeHash: string;
  onLinkClick?: () => void;
}) {
  return (
    <nav className="space-y-8">
      {sidebarSections.map((section) => (
        <div key={section.title}>
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
            {section.title}
          </p>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={onLinkClick}
                  className={cn(
                    "block rounded-md px-3 py-1.5 text-sm transition-colors",
                    activeHash === item.href
                      ? "bg-[hsl(var(--muted))] font-medium text-[hsl(var(--foreground))]"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Endpoint section
// ---------------------------------------------------------------------------
function EndpointSection({ endpoint }: { endpoint: EndpointDoc }) {
  return (
    <section id={endpoint.slug} className="scroll-mt-24 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <MethodBadge method={endpoint.method} />
        <code className="font-mono text-sm text-[hsl(var(--foreground))]">
          {endpoint.path}
        </code>
      </div>
      <h3 className="mt-3 text-xl font-semibold tracking-tight">
        {endpoint.title}
      </h3>
      <p className="mt-2 leading-relaxed text-[hsl(var(--muted-foreground))]">
        {endpoint.description}
      </p>

      {/* Meta */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="text-[hsl(var(--muted-foreground))]">Auth: </span>
          <span
            className={cn(
              "font-medium",
              endpoint.auth === "required"
                ? "text-[hsl(var(--foreground))]"
                : "text-[hsl(var(--muted-foreground))]"
            )}
          >
            {endpoint.auth}
          </span>
        </div>
        <div>
          <span className="text-[hsl(var(--muted-foreground))]">
            Rate limit:{" "}
          </span>
          <span className="text-[hsl(var(--muted-foreground))]">
            {endpoint.rateLimit}
          </span>
        </div>
      </div>

      {/* Path params */}
      {endpoint.pathParams && endpoint.pathParams.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">Path parameters</p>
          <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))]">
            <table className="w-full text-sm">
              <tbody>
                {endpoint.pathParams.map((param) => (
                  <tr key={param.name} className="border-b border-[hsl(var(--border))] last:border-b-0">
                    <td className="px-4 py-2.5 font-mono text-xs font-medium">
                      {param.name}
                    </td>
                    <td className="px-4 py-2.5 text-[hsl(var(--muted-foreground))]">
                      {param.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request body */}
      {endpoint.requestBody && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">Request body</p>
          <p className="mb-3 text-sm text-[hsl(var(--muted-foreground))]">
            {endpoint.requestBody.description}
          </p>
          <CodeBlock
            code={endpoint.requestBody.example}
            language="json"
            title="application/json"
          />
        </div>
      )}

      {/* Responses */}
      <div className="mt-6">
        <p className="mb-3 text-sm font-medium">Responses</p>
        <div className="space-y-3">
          {endpoint.responses.map((res, i) => (
            <div key={i}>
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-medium",
                    res.status < 300
                      ? "bg-emerald-500/10 text-emerald-600"
                      : res.status < 500
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-red-500/10 text-red-600"
                  )}
                >
                  {res.status}
                </span>
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  {res.description}
                </span>
              </div>
              <CodeBlock code={res.body} language="json" />
            </div>
          ))}
        </div>
      </div>

      {/* Code examples */}
      <div className="mt-6">
        <p className="mb-3 text-sm font-medium">Examples</p>
        <CodeTabs examples={endpoint.codeExamples} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main docs page
// ---------------------------------------------------------------------------
export default function DocsPage() {
  const [activeHash, setActiveHash] = useState("#introduction");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleHashClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/extract-vibe-logo.svg"
                className="h-7 w-7"
                alt="ExtractVibe logo"
              />
              <span className="text-lg font-bold tracking-tight">
                ExtractVibe
              </span>
            </Link>
            <span className="hidden text-sm text-[hsl(var(--muted-foreground))] sm:inline">
              /
            </span>
            <span className="hidden text-sm font-medium sm:inline">
              API Docs
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="hidden text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))] sm:inline"
            >
              Dashboard
              <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-md p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))] lg:hidden"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Layout */}
      <div className="mx-auto max-w-7xl px-6 pt-20">
        <div className="flex gap-10">
          {/* Sidebar — desktop: sticky, mobile: slide-over */}
          <aside
            className={cn(
              "fixed top-[65px] z-40 h-[calc(100vh-65px)] w-[260px] shrink-0 overflow-y-auto border-r border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-8 transition-transform lg:sticky lg:z-0 lg:translate-x-0 lg:border-r-0 lg:bg-transparent lg:px-0",
              sidebarOpen
                ? "left-0 translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            )}
          >
            <Sidebar
              activeHash={activeHash}
              onLinkClick={handleHashClick}
            />
          </aside>

          {/* Main content */}
          <main className="min-w-0 max-w-3xl flex-1 py-8 lg:pl-4">
            {/* Introduction */}
            <section id="introduction" className="scroll-mt-24 pb-16">
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                API Reference
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
                The ExtractVibe API lets you extract comprehensive brand kits
                from any website programmatically. All endpoints are served from{" "}
                <code className="rounded-md bg-[hsl(var(--muted))] px-1.5 py-0.5 font-mono text-sm">
                  https://extractvibe.com/api
                </code>
                .
              </p>

              <div className="mt-8 rounded-xl border border-[hsl(var(--border))] p-6">
                <p className="text-sm font-medium">Base URL</p>
                <code className="mt-2 block font-mono text-sm text-[hsl(var(--muted-foreground))]">
                  https://extractvibe.com/api
                </code>
              </div>

              <div className="mt-6 rounded-xl border border-[hsl(var(--border))] p-6">
                <p className="text-sm font-medium">Quick start</p>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  Extract a brand kit in three steps: start an extraction, poll
                  for completion, then fetch the result.
                </p>
                <div className="mt-4">
                  <CodeBlock
                    code={`# 1. Start extraction
JOB=$(curl -s -X POST https://extractvibe.com/api/extract \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ev_your_api_key_here" \\
  -d '{"url": "https://stripe.com"}')

JOB_ID=$(echo $JOB | jq -r '.jobId')

# 2. Poll until complete (typically 15-25 seconds)
curl -s https://extractvibe.com/api/extract/$JOB_ID \\
  -H "x-api-key: ev_your_api_key_here"

# 3. Get the brand kit
curl -s https://extractvibe.com/api/extract/$JOB_ID/result \\
  -H "x-api-key: ev_your_api_key_here" | jq .`}
                    language="bash"
                    title="Quick start"
                  />
                </div>
              </div>
            </section>

            {/* Authentication */}
            <section
              id="authentication"
              className="scroll-mt-24 border-t border-[hsl(var(--border))] py-16"
            >
              <h2 className="text-2xl font-semibold tracking-tight">
                {authGuide.title}
              </h2>
              <div className="mt-4 space-y-4">
                {authGuide.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="leading-relaxed text-[hsl(var(--muted-foreground))]"
                  >
                    {p}
                  </p>
                ))}
              </div>

              <div className="mt-8 space-y-4">
                <p className="text-sm font-medium">Session cookie</p>
                <CodeBlock
                  code={`# Session cookies are set automatically after sign-in.
# Include credentials in browser requests:
fetch("/api/credits", { credentials: "include" });`}
                  language="javascript"
                  title="Browser (session)"
                />

                <p className="text-sm font-medium">API key</p>
                <CodeBlock
                  code={`curl https://extractvibe.com/api/credits \\
  -H "x-api-key: ev_your_api_key_here"`}
                  language="bash"
                  title="Server (API key)"
                />
              </div>
            </section>

            {/* Rate Limits */}
            <section
              id="rate-limits"
              className="scroll-mt-24 border-t border-[hsl(var(--border))] py-16"
            >
              <h2 className="text-2xl font-semibold tracking-tight">
                Rate Limits
              </h2>
              <p className="mt-4 leading-relaxed text-[hsl(var(--muted-foreground))]">
                All endpoints are rate limited. Limits vary by authentication
                tier. Rate limit information is included in response headers:{" "}
                <code className="rounded-md bg-[hsl(var(--muted))] px-1.5 py-0.5 font-mono text-xs">
                  X-RateLimit-Limit
                </code>
                ,{" "}
                <code className="rounded-md bg-[hsl(var(--muted))] px-1.5 py-0.5 font-mono text-xs">
                  X-RateLimit-Remaining
                </code>
                , and{" "}
                <code className="rounded-md bg-[hsl(var(--muted))] px-1.5 py-0.5 font-mono text-xs">
                  X-RateLimit-Reset
                </code>
                .
              </p>

              <div className="mt-8 overflow-hidden rounded-xl border border-[hsl(var(--border))]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        Tier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        Reads
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        Writes
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        Window
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateLimitTiers.map((tier) => (
                      <tr
                        key={tier.tier}
                        className="border-b border-[hsl(var(--border))] last:border-b-0"
                      >
                        <td className="px-4 py-3 font-medium">{tier.tier}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[hsl(var(--muted-foreground))]">
                          {tier.reads}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[hsl(var(--muted-foreground))]">
                          {tier.writes}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[hsl(var(--muted-foreground))]">
                          {tier.window}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Error Codes */}
            <section
              id="error-codes"
              className="scroll-mt-24 border-t border-[hsl(var(--border))] py-16"
            >
              <h2 className="text-2xl font-semibold tracking-tight">
                Error Codes
              </h2>
              <p className="mt-4 leading-relaxed text-[hsl(var(--muted-foreground))]">
                The API uses standard HTTP status codes. All error responses
                include a JSON body with an{" "}
                <code className="rounded-md bg-[hsl(var(--muted))] px-1.5 py-0.5 font-mono text-xs">
                  error
                </code>{" "}
                field describing the problem.
              </p>

              <div className="mt-8 overflow-hidden rounded-xl border border-[hsl(var(--border))]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorCodes.map((err) => (
                      <tr
                        key={err.status}
                        className="border-b border-[hsl(var(--border))] last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-medium",
                              err.status < 500
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-red-500/10 text-red-600"
                            )}
                          >
                            {err.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{err.name}</td>
                        <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                          {err.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-medium">Error response format</p>
                <CodeBlock
                  code={JSON.stringify(
                    {
                      error: "Rate limit exceeded",
                      limit: 30,
                      retryAfter: 45,
                    },
                    null,
                    2
                  )}
                  language="json"
                  title="429 Too Many Requests"
                />
              </div>
            </section>

            {/* Endpoint sections */}
            <div className="border-t border-[hsl(var(--border))]">
              <div className="py-16">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Endpoints
                </h2>
                <p className="mt-4 leading-relaxed text-[hsl(var(--muted-foreground))]">
                  Complete reference for all {endpoints.length} API endpoints.
                  Each endpoint includes authentication requirements, rate
                  limits, request/response schemas, and code examples in cURL,
                  JavaScript, and Python.
                </p>
              </div>

              {endpoints.map((endpoint) => (
                <div
                  key={endpoint.slug}
                  className="border-t border-[hsl(var(--border))]"
                >
                  <EndpointSection endpoint={endpoint} />
                </div>
              ))}
            </div>

            {/* Footer */}
            <footer className="border-t border-[hsl(var(--border))] py-16">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Need help? Open an issue on{" "}
                  <a
                    href="https://github.com/extractvibe/extractvibe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[hsl(var(--foreground))] underline underline-offset-4"
                  >
                    GitHub
                  </a>
                  .
                </p>
                <Link
                  to="/"
                  className="text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
                >
                  Back to ExtractVibe
                </Link>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
