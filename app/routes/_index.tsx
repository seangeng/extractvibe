import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowUpRight, Github, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useSession } from "~/lib/auth-client";
import { api } from "~/lib/api";
import { MarketingFooter } from "~/components/marketing-layout";

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
    logo: "https://img.loadlogo.com/stripe.com",
    colors: ["#533afd", "#061b31", "#ffffff", "#64748d", "#81b81a"],
  },
  {
    domain: "linear.app",
    logo: "https://img.loadlogo.com/linear.app",
    colors: ["#5e6ad2", "#171717", "#f7f8f8", "#8a8f98", "#ffffff"],
  },
  {
    domain: "vercel.com",
    logo: "https://img.loadlogo.com/vercel.com",
    colors: ["#000000", "#fafafa", "#171717", "#0068d6", "#4d4d4d"],
  },
];

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

type ExtractState =
  | { phase: "idle" }
  | { phase: "extracting"; domain: string; jobId: string; percent: number; step: string }
  | { phase: "complete"; domain: string }
  | { phase: "rate-limited" }
  | { phase: "error"; message: string };

const STEP_LABELS: Record<string, string> = {
  "fetch-render": "Fetching & rendering",
  "parse-assets": "Parsing visual identity",
  "analyze-voice": "Analyzing brand voice",
  "synthesize-vibe": "Synthesizing vibe",
  "score-package": "Packaging results",
};

export default function LandingPage() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<ExtractState>({ phase: "idle" });
  const navigate = useNavigate();
  const { data: session } = useSession();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Navigate to brand page on completion
  useEffect(() => {
    if (state.phase === "complete") {
      const timer = setTimeout(() => {
        navigate(`/brand/${state.domain}`);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [state, navigate]);

  const handleProgress = useCallback((data: unknown) => {
    if (!data || typeof data !== "object") return;
    const msg = data as Record<string, unknown>;
    const type = msg.type;

    if (type === "progress") {
      setState((prev) => {
        if (prev.phase !== "extracting") return prev;
        return {
          ...prev,
          percent: typeof msg.percent === "number" ? msg.percent : prev.percent,
          step: (typeof msg.step === "string" ? msg.step : null)
            || (typeof msg.stepId === "string" ? msg.stepId : null)
            || prev.step,
        };
      });
    }
    if (type === "complete") {
      setState((prev) => {
        if (prev.phase !== "extracting") return prev;
        return { phase: "complete", domain: prev.domain };
      });
    }
    if (type === "error") {
      setState({
        phase: "error",
        message: typeof msg.message === "string" ? msg.message : "Extraction failed.",
      });
    }
  }, []);

  function connectWebSocket(jobId: string) {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws/${jobId}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          handleProgress(JSON.parse(event.data));
        } catch { /* ignore */ }
      };
      ws.onerror = () => startPolling(jobId);
      ws.onclose = () => { wsRef.current = null; };
    } catch {
      startPolling(jobId);
    }
  }

  function startPolling(jobId: string) {
    const MAX_POLLS = 300; // ~15 minutes at 3s intervals
    let pollCount = 0;

    pollRef.current = setInterval(async () => {
      pollCount++;
      if (pollCount > MAX_POLLS) {
        if (pollRef.current) clearInterval(pollRef.current);
        setState({ phase: "error", message: "Extraction timed out." });
        return;
      }
      try {
        const result = await api.get<{
          jobId: string;
          status: { status: string; error?: { message?: string }; output?: unknown };
        }>(`/api/extract/${jobId}`);

        if (result.status.status === "complete") {
          setState((prev) =>
            prev.phase === "extracting" ? { phase: "complete", domain: prev.domain } : prev
          );
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (result.status.status === "errored") {
          setState({
            phase: "error",
            message: result.status.error?.message || "Extraction failed.",
          });
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch { /* ignore transient polling errors */ }
    }, 3000);
  }

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    if (state.phase === "extracting") return;

    const normalizedUrl = normalizeUrl(url);

    // If logged in, go to the dashboard extract page for the full experience
    if (session?.user) {
      navigate(`/dashboard/extract?url=${encodeURIComponent(normalizedUrl)}`);
      return;
    }

    // Anonymous: call API directly
    setState({ phase: "extracting", domain: "", jobId: "", percent: 0, step: "fetch-render" });

    try {
      const result = await api.post<{ jobId: string; domain: string }>(
        "/api/extract",
        { url: normalizedUrl }
      );
      setState({
        phase: "extracting",
        domain: result.domain,
        jobId: result.jobId,
        percent: 5,
        step: "fetch-render",
      });
      connectWebSocket(result.jobId);
    } catch (err: any) {
      if (err?.status === 429) {
        setState({ phase: "rate-limited" });
      } else {
        setState({
          phase: "error",
          message: err?.message || "Failed to start extraction.",
        });
      }
    }
  }

  const isExtracting = state.phase === "extracting";
  const isRateLimited = state.phase === "rate-limited";
  const isComplete = state.phase === "complete";
  const isError = state.phase === "error";

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

      {/* Hero — Centered, input-first */}
      <section className="flex min-h-[85vh] flex-col items-center justify-center px-6 pt-20">
        <div className="mx-auto w-full max-w-2xl text-center">
          <h1 className="animate-fade-up font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            <span className="font-bold">The brand kit</span>
            <br />
            <span className="font-normal text-[hsl(var(--muted-foreground))]">
              your website already has.
            </span>
          </h1>
          <p className="animate-fade-up animation-delay-100 mx-auto mt-5 max-w-md text-[hsl(var(--muted-foreground))]">
            Extract colors, typography, voice, and personality from any
            website. Open source.
          </p>

          {/* The input — the focal point */}
          <div className="animate-fade-up animation-delay-200 mx-auto mt-10 w-full max-w-xl">
            <form onSubmit={handleExtract} className="relative">
              <label htmlFor="url-input" className="sr-only">Website URL to extract brand from</label>
              <Input
                id="url-input"
                type="text"
                placeholder="stripe.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-16 rounded-2xl border-[hsl(var(--border))] pl-4 sm:pl-6 pr-14 sm:pr-16 text-lg shadow-sm transition-shadow focus:shadow-md"
                required
                disabled={isExtracting}
              />
              <Button
                type="submit"
                variant="primary"
                size="icon"
                className="absolute right-2.5 top-1/2 h-11 w-11 -translate-y-1/2 rounded-xl"
                disabled={isExtracting}
                aria-label="Extract brand"
              >
                {isExtracting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </Button>
            </form>

            {/* Status area — fixed height to prevent layout shift */}
            <div className="mt-4 min-h-[3.5rem]">
              {state.phase === "idle" && (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Paste any URL. No signup required.
                </p>
              )}

              {isExtracting && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--foreground))] animate-pulse" />
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">
                      {STEP_LABELS[state.step] || "Processing..."}
                    </span>
                  </div>
                  <div className="mx-auto h-1 max-w-xs overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                    <div
                      className="h-full rounded-full bg-[hsl(var(--foreground))] transition-all duration-700 ease-out"
                      style={{ width: `${state.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {isComplete && (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--success))]" />
                  <span className="text-sm font-medium">
                    Done — opening brand kit...
                  </span>
                </div>
              )}

              {isRateLimited && (
                <div className="mx-auto max-w-sm space-y-3 rounded-xl border border-[hsl(var(--border))] p-4 text-left">
                  <p className="text-sm font-medium">
                    You&apos;ve used your 3 free extractions today
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Create a free account for 500 extractions/month.
                  </p>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link to="/sign-up">
                        Sign up free
                        <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/sign-in">Sign in</Link>
                    </Button>
                  </div>
                </div>
              )}

              {isError && (
                <div className="mx-auto max-w-sm rounded-xl border border-[hsl(var(--destructive))]/20 bg-[hsl(var(--destructive))]/5 p-3 text-left">
                  <p className="text-sm text-[hsl(var(--destructive))]">
                    {state.message}
                  </p>
                  <button
                    onClick={() => setState({ phase: "idle" })}
                    className="mt-1 text-xs underline text-[hsl(var(--muted-foreground))]"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Social proof — recently extracted with logos + colors */}
          <div className="animate-fade-up animation-delay-300 mt-14">
            <p className="mb-5 text-xs uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              Recently extracted
            </p>
            <div className="scrollbar-none flex justify-center gap-4 overflow-x-auto pb-2">
              {recentlyExtracted.map((brand) => (
                <Link
                  key={brand.domain}
                  to={`/brand/${brand.domain}`}
                  className="group flex w-32 shrink-0 flex-col items-center gap-3 rounded-xl border border-[hsl(var(--border))] p-3 transition-all duration-200 hover:border-[hsl(var(--foreground))]/20 hover:bg-[hsl(var(--muted))]/50 sm:w-40 sm:p-4"
                >
                  <img
                    src={brand.logo}
                    alt={brand.domain}
                    className="h-7 w-auto"
                    loading="lazy"
                  />
                  <div className="flex gap-1">
                    {brand.colors.slice(0, 5).map((color, i) => (
                      <div
                        key={i}
                        className="h-3 w-3 rounded-full border border-[hsl(var(--border))]/50"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))] transition-colors group-hover:text-[hsl(var(--foreground))]">
                    {brand.domain}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features — Staggered Editorial Blocks */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="sr-only">Features</h2>
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-12">
            {/* Feature 01 */}
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                01 / Visual Identity
              </p>
              <h3 className="mt-4 font-display text-3xl leading-[1.1] md:text-4xl">
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
              <h3 className="mt-4 font-display text-3xl leading-[1.1] md:text-4xl">
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
              <h3 className="mt-4 font-display text-3xl leading-[1.1] md:text-4xl">
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
          <div className="flex flex-col flex-wrap items-center justify-between gap-3 sm:gap-6 sm:flex-row">
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
            <a
              href="https://github.com/seangeng/extractvibe"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-[hsl(var(--foreground))]"
            >
              <Github className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
              <span className="font-mono text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                Open source
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* CTA — Asymmetric */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <h2 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              <span className="font-bold">Ready to extract</span>{" "}
              <span className="font-normal text-[hsl(var(--muted-foreground))]">
                your brand?
              </span>
            </h2>
            <div className="flex items-center gap-4">
              <Button asChild size="lg" className="h-12 shrink-0 px-8">
                <Link to="/sign-up">
                  Get started free
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <a
                href="https://github.com/seangeng/extractvibe"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:border-[hsl(var(--foreground))]/20 hover:text-[hsl(var(--foreground))] sm:inline-flex"
              >
                <Github className="h-4 w-4" />
                Star on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
