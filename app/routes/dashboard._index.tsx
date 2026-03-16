import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Zap,
  BarChart3,
  Key,
  ArrowRight,
  Globe,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { api } from "~/lib/api";

export function meta() {
  return [{ title: "Dashboard — ExtractVibe" }];
}

interface Extraction {
  id: string;
  url: string;
  domain: string;
  status: "queued" | "running" | "complete" | "failed";
  durationMs: number | null;
  createdAt: string;
  completedAt: string | null;
}

interface ApiKeyItem {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

function StatusBadge({ status }: { status: Extraction["status"] }) {
  switch (status) {
    case "complete":
      return (
        <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Complete
        </Badge>
      );
    case "running":
      return (
        <Badge className="border-brand-primary/20 bg-brand-primary/10 text-brand-primary">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Running
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      );
    case "queued":
      return (
        <Badge variant="secondary">
          <Clock className="mr-1 h-3 w-3" />
          Queued
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          <Clock className="mr-1 h-3 w-3" />
          Unknown
        </Badge>
      );
  }
}

export default function DashboardIndex() {
  const [url, setUrl] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [keyCount, setKeyCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const [creditsRes, historyRes, keysRes] = await Promise.allSettled([
          api.get<{ credits: number }>("/api/credits"),
          api.get<{ extractions: Extraction[] }>("/api/extract/history"),
          api.get<{ keys: ApiKeyItem[] }>("/api/keys"),
        ]);

        if (creditsRes.status === "fulfilled") {
          setCredits(creditsRes.value.credits);
        }
        if (historyRes.status === "fulfilled") {
          setExtractions(historyRes.value.extractions || []);
        }
        if (keysRes.status === "fulfilled") {
          setKeyCount(keysRes.value.keys?.length ?? 0);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    {
      label: "Credits Remaining",
      value: credits != null ? String(credits) : "—",
      description: "available credits",
      icon: Zap,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Extractions This Month",
      value: String(extractions.length),
      description: "brand kits extracted",
      icon: BarChart3,
      color: "text-brand-primary",
      bgColor: "bg-brand-primary/10",
    },
    {
      label: "API Keys Active",
      value: keyCount != null ? String(keyCount) : "—",
      description: "keys created",
      icon: Key,
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10",
    },
  ];

  const recentExtractions = extractions.slice(0, 5);

  function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    const encoded = encodeURIComponent(url.trim());
    navigate(`/dashboard/extract?url=${encoded}`);
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-[hsl(var(--muted-foreground))]">
          Welcome back. Extract brand kits from any website.
        </p>
      </div>

      {/* Quick Extract */}
      <Card className="border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-brand-secondary/5 to-brand-accent/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold">Quick Extract</h2>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                Paste any URL to extract a complete brand kit
              </p>
              <form
                onSubmit={handleExtract}
                className="mt-4 flex flex-col gap-3 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <Button type="submit">
                  Extract
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {stat.label}
              </CardDescription>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-md ${stat.bgColor}`}
              >
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Extractions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Extractions</CardTitle>
              <CardDescription className="mt-1">
                Your latest brand kit extractions
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/history">View all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--muted-foreground))]" />
            </div>
          ) : recentExtractions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--muted))]">
                <BarChart3 className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
              </div>
              <h3 className="mt-4 font-medium">No extractions yet</h3>
              <p className="mt-1 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
                Extract your first brand kit by entering a URL above or visiting
                the Extract page.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/dashboard/extract">
                  <Sparkles className="mr-1 h-4 w-4" />
                  Start extracting
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {recentExtractions.map((extraction) => (
                <div
                  key={extraction.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--muted))]">
                      <Globe className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {extraction.domain}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(extraction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={extraction.status} />
                    {extraction.status === "complete" && (
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/dashboard/brand/${extraction.id}`}>
                          <ExternalLink className="h-4 w-4" />
                          <span className="ml-1">View</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
