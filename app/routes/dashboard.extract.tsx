import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router";
import {
  Globe,
  Loader2,
  Sparkles,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { CodeBlock } from "~/components/docs/code-block";
import { api } from "~/lib/api";
import { cn } from "~/lib/utils";

export function meta() {
  return [{ title: "Extract Brand — ExtractVibe" }];
}

type StepStatus = "pending" | "running" | "complete" | "error";

interface ExtractionStep {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
}

const initialSteps: ExtractionStep[] = [
  {
    id: "fetch",
    label: "Fetching & Rendering",
    description: "Loading the website and capturing a full render",
    status: "pending",
  },
  {
    id: "visual",
    label: "Parsing Visual Identity",
    description: "Extracting colors, typography, logos, and visual patterns",
    status: "pending",
  },
  {
    id: "voice",
    label: "Analyzing Brand Voice",
    description: "Analyzing copy and content for tone and personality",
    status: "pending",
  },
  {
    id: "vibe",
    label: "Synthesizing Vibe",
    description: "Combining signals into brand profile, rules, and vibe",
    status: "pending",
  },
  {
    id: "package",
    label: "Packaging Results",
    description: "Compiling the complete brand kit",
    status: "pending",
  },
];

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "complete":
      return <div className="h-3 w-3 rounded-full bg-[hsl(var(--foreground))]" />;
    case "running":
      return <div className="h-3 w-3 rounded-full bg-[hsl(var(--foreground))] animate-pulse-dot" />;
    case "error":
      return <div className="h-3 w-3 rounded-full bg-[hsl(var(--destructive))]" />;
    default:
      return <div className="h-3 w-3 rounded-full border-2 border-[hsl(var(--border))]" />;
  }
}

export default function ExtractPage() {
  const [searchParams] = useSearchParams();
  const prefillUrl = searchParams.get("url") || "";

  const [url, setUrl] = useState(prefillUrl);
  const [extracting, setExtracting] = useState(false);
  const [steps, setSteps] = useState<ExtractionStep[]>(initialSteps);
  const [jobId, setJobId] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [percent, setPercent] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed time counter
  useEffect(() => {
    if (extracting && !complete) {
      const start = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [extracting, complete]);

  const handleProgressMessage = useCallback((data: unknown) => {
    if (!data || typeof data !== "object") return;
    const msg = data as Record<string, unknown>;
    const type = msg.type;

    if (type === "progress") {
      const stepId =
        (typeof msg.stepId === "string" ? msg.stepId : null)
        || (typeof msg.step === "string" ? msg.step : null)
        || "";
      const msgStatus = typeof msg.status === "string" ? msg.status as StepStatus : undefined;

      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === stepId && msgStatus) {
            return { ...step, status: msgStatus };
          }
          const stepOrder = ["fetch", "visual", "voice", "vibe", "package"];
          const currentIdx = stepOrder.indexOf(stepId);
          const thisIdx = stepOrder.indexOf(step.id);
          if (
            msgStatus === "running" &&
            thisIdx < currentIdx &&
            step.status !== "complete"
          ) {
            return { ...step, status: "complete" };
          }
          return step;
        })
      );

      if (typeof msg.percent === "number") {
        setPercent(msg.percent);
      }
    }

    if (type === "complete") {
      setComplete(true);
      setExtracting(false);
      setPercent(100);
      setSteps((prev) =>
        prev.map((step) => ({ ...step, status: "complete" as StepStatus }))
      );
    }

    if (type === "error") {
      setError(typeof msg.message === "string" ? msg.message : "Extraction failed.");
      setExtracting(false);
    }
  }, []);

  const connectWebSocket = useCallback(
    (id: string) => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/ws/${id}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleProgressMessage(data);
          } catch {
            // ignore parse errors
          }
        };

        ws.onerror = () => {
          // WebSocket failed — fall back to polling
          startPolling(id);
        };

        ws.onclose = () => {
          wsRef.current = null;
        };

        // Keep alive — store ref so cleanup can clear it
        if (pingRef.current) clearInterval(pingRef.current);
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          } else if (pingRef.current) {
            clearInterval(pingRef.current);
            pingRef.current = null;
          }
        }, 30000);
      } catch {
        startPolling(id);
      }
    },
    [handleProgressMessage]
  );

  function startPolling(id: string) {
    const MAX_POLLS = 300; // ~15 minutes at 3s intervals
    let pollCount = 0;

    pollRef.current = setInterval(async () => {
      pollCount++;
      if (pollCount > MAX_POLLS) {
        if (pollRef.current) clearInterval(pollRef.current);
        setError("Extraction timed out.");
        setExtracting(false);
        return;
      }
      try {
        const result = await api.get<{
          jobId: string;
          status: { status: string; error?: { message?: string }; output?: unknown };
        }>(`/api/extract/${id}`);

        if (result.status.status === "complete") {
          setComplete(true);
          setExtracting(false);
          setPercent(100);
          setSteps((prev) =>
            prev.map((s) => ({ ...s, status: "complete" as StepStatus }))
          );
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (result.status.status === "errored") {
          setError(
            result.status.error?.message || "Extraction failed."
          );
          setExtracting(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // ignore transient polling errors
      }
    }, 3000);
  }

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setError("");
    setExtracting(true);
    setComplete(false);
    setPercent(0);
    setElapsed(0);
    setSteps(initialSteps.map((s) => ({ ...s, status: "pending" })));

    try {
      let inputUrl = url.trim();
      if (!inputUrl.startsWith("http")) {
        inputUrl = `https://${inputUrl}`;
      }

      const result = await api.post<{ jobId: string; domain: string }>(
        "/api/extract",
        { url: inputUrl }
      );
      setJobId(result.jobId);
      setDomain(result.domain);
      connectWebSocket(result.jobId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start extraction."
      );
      setExtracting(false);
    }
  }

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      if (pollRef.current) clearInterval(pollRef.current);
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Extract Brand</h1>
        <p className="mt-1 text-[hsl(var(--muted-foreground))]">
          Enter a URL to extract a comprehensive brand kit
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleExtract} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="url"
                className="text-sm font-medium leading-none"
              >
                Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <Input
                  id="url"
                  type="text"
                  placeholder="stripe.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-12 pl-10 text-base"
                  required
                  disabled={extracting}
                />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Enter a domain or full URL — we'll handle the rest
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-[hsl(var(--destructive))]/10 px-4 py-3 text-sm text-[hsl(var(--destructive))]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={extracting}
            >
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extract Brand Kit
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {(extracting || complete) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {domain && (
                    <span className="text-[hsl(var(--foreground))]">{domain}</span>
                  )}
                  {!domain && "Extraction Progress"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {complete
                    ? `Completed in ${elapsed}s`
                    : `Analyzing... ${elapsed}s elapsed`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {!complete && (
                  <span className="text-sm font-medium tabular-nums text-[hsl(var(--foreground))]">
                    {percent}%
                  </span>
                )}
                {complete && (
                  <Badge variant="success">
                    Complete
                  </Badge>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
              <div
                className="h-full rounded-full bg-[hsl(var(--foreground))] transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {steps.map((step, index) => (
                <div key={step.id}>
                  <div
                    className={cn(
                      "flex items-start gap-4 rounded-lg p-3 transition-colors",
                      step.status === "running" && "bg-[hsl(var(--muted))]",
                      step.status === "complete" && "opacity-70"
                    )}
                  >
                    <div className="mt-0.5">
                      <StepIcon status={step.status} />
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          step.status === "pending" &&
                            "text-[hsl(var(--muted-foreground))]"
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                        {step.description}
                      </p>
                    </div>
                    <div className="text-xs tabular-nums text-[hsl(var(--muted-foreground))]">
                      {index + 1}/{steps.length}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="ml-[1.6rem] h-4 w-px bg-[hsl(var(--border))]" />
                  )}
                </div>
              ))}
            </div>

            {complete && jobId && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link to={`/dashboard/brand/${jobId}`}>
                    <ExternalLink className="mr-1 h-4 w-4" />
                    View Brand Kit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setUrl("");
                    setComplete(false);
                    setJobId(null);
                    setDomain(null);
                    setPercent(0);
                    setElapsed(0);
                    setSteps(
                      initialSteps.map((s) => ({
                        ...s,
                        status: "pending",
                      }))
                    );
                  }}
                >
                  Extract Another
                </Button>
              </div>
            )}

            {complete && jobId && (
              <details className="mt-6 rounded-xl border border-[hsl(var(--border))] p-4">
                <summary className="cursor-pointer text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                  Retrieve via API
                </summary>
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Fetch this same result programmatically:
                  </p>
                  <CodeBlock
                    code={`# Get the full brand kit JSON
curl https://extractvibe.com/api/extract/${jobId}/result \\
  -H "x-api-key: ev_your_key"

# Export as CSS variables
curl https://extractvibe.com/api/extract/${jobId}/export/css \\
  -H "x-api-key: ev_your_key"

# Export as Tailwind theme
curl https://extractvibe.com/api/extract/${jobId}/export/tailwind \\
  -H "x-api-key: ev_your_key"

# Export as design tokens (W3C format)
curl https://extractvibe.com/api/extract/${jobId}/export/tokens \\
  -H "x-api-key: ev_your_key"`}
                    language="bash"
                    title="Retrieve result"
                  />
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
