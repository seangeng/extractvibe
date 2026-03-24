import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Zap, TrendingUp, Loader2, ArrowUpRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { api } from "~/lib/api";
import type { Extraction } from "~/lib/types";

export function meta() {
  return [{ title: "Usage — ExtractVibe" }];
}

export default function UsagePage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState<string>("free");
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [creditsRes, historyRes] = await Promise.allSettled([
          api.get<{ credits: number; plan: string }>("/api/credits"),
          api.get<{ extractions: Extraction[] }>("/api/extract/history"),
        ]);

        if (creditsRes.status === "fulfilled") {
          setCredits(creditsRes.value.credits);
          setPlan(creditsRes.value.plan || "free");
        }
        if (historyRes.status === "fulfilled") {
          setExtractions(historyRes.value.extractions || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const monthlyAllowance = plan === "free" ? 50 : 500;
  const creditsUsed = credits != null ? monthlyAllowance - credits : 0;

  // Count extractions from this month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const extractionsThisMonth = extractions.filter(
    (e) => new Date(e.createdAt) >= thisMonthStart
  ).length;

  const planLabel = plan === "free" ? "Free" : plan.charAt(0).toUpperCase() + plan.slice(1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">Usage</h1>
        <p className="mt-1 text-[hsl(var(--muted-foreground))]">
          Monitor your credit balance and extraction usage.
        </p>
      </div>

      {/* Plan Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Current Plan</CardTitle>
              <CardDescription className="mt-1">
                Your account plan and credit allocation
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {planLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Credit Balance */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">Credits remaining</span>
              <span className="font-medium">
                {credits != null ? credits : "—"} / {monthlyAllowance}
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
              <div
                className="h-full rounded-full bg-[hsl(var(--foreground))] transition-all duration-500"
                style={{ width: `${credits != null ? Math.round((credits / monthlyAllowance) * 100) : 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
              {creditsUsed} of {monthlyAllowance} credits used this billing period. Credits reset monthly.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-[hsl(var(--muted))] p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Credits Used
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold">{creditsUsed}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">this period</p>
            </div>
            <div className="rounded-lg bg-[hsl(var(--muted))] p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  Extractions
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold">{extractionsThisMonth}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">this month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade CTA */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))]">
              <ArrowUpRight className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Need more credits?</h3>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                Upgrade your plan for higher monthly credit allowances, priority extraction,
                and more. Paid plans coming soon.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/pricing">
                  View Plans
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
