import { useState } from "react";
import { Link, redirect, useLoaderData } from "react-router";
import { Loader2, CheckCircle2, AlertCircle, LinkIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { api } from "~/lib/api";
import type { Route } from "./+types/claim.$token";

export function meta() {
  return [
    { title: "Claim Account — ExtractVibe" },
    {
      name: "description",
      content: "Link an AI-agent-created API key to your ExtractVibe account.",
    },
  ];
}

export async function loader({ context, request, params }: Route.LoaderArgs) {
  const { createAuth } = await import("../../server/lib/auth");
  const auth = createAuth(context.cloudflare.env as any);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    const token = params.token;
    throw redirect(`/sign-in?redirect=/claim/${token}`);
  }

  return { user: session.user, token: params.token };
}

export default function ClaimTokenPage() {
  const { user, token } = useLoaderData<typeof loader>();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<{ keysTransferred: number; creditsTransferred: number } | null>(null);
  const [error, setError] = useState("");

  async function handleClaim() {
    setStatus("loading");
    setError("");

    try {
      const data = await api.post<{
        ok: boolean;
        keysTransferred: number;
        creditsTransferred: number;
      }>(`/api/claim/${token}`);

      setResult(data);
      setStatus("success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to claim account. Please try again."
      );
      setStatus("error");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img src="/extract-vibe-logo.svg" className="h-8 w-8" alt="ExtractVibe logo" />
            <span className="text-xl font-bold tracking-tight">ExtractVibe</span>
          </Link>
        </div>

        <Card className="rounded-2xl">
          {status === "success" && result ? (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <CardTitle className="text-xl">Account Claimed</CardTitle>
                <CardDescription>
                  The agent&apos;s resources have been linked to your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-[hsl(var(--muted))] p-4 text-sm">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[hsl(var(--muted-foreground))]">API keys transferred</span>
                    <span className="font-medium">{result.keysTransferred}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[hsl(var(--muted-foreground))]">Credits transferred</span>
                    <span className="font-medium">{result.creditsTransferred}</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--muted))]">
                  <LinkIcon className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
                </div>
                <CardTitle className="text-xl">Claim Agent Account</CardTitle>
                <CardDescription>
                  An AI agent created an API key for you. Claim it to link the
                  key, credits, and extraction history to your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-[hsl(var(--muted))] p-4 text-sm">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[hsl(var(--muted-foreground))]">Signed in as</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                </div>

                {status === "error" && error && (
                  <div className="rounded-md bg-[hsl(var(--destructive))]/10 px-4 py-3 text-sm text-[hsl(var(--destructive))]">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleClaim}
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    "Claim Account"
                  )}
                </Button>

                <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
                  This will transfer the agent&apos;s API keys, credits, and extraction
                  history to your account.
                </p>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
