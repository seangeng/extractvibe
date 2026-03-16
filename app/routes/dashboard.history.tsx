import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  History,
  ExternalLink,
  Trash2,
  Sparkles,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
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

export function meta() {
  return [{ title: "Extraction History — ExtractVibe" }];
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

function StatusBadge({ status }: { status: Extraction["status"] }) {
  switch (status) {
    case "complete":
      return (
        <Badge variant="success">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Complete
        </Badge>
      );
    case "running":
      return (
        <Badge variant="default">
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

export default function HistoryPage() {
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await api.get<{ extractions: Extraction[] }>(
          "/api/extract/history"
        );
        setExtractions(data.extractions || []);
      } catch {
        // API not available yet — show empty state
        setExtractions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Extraction History
          </h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            View and manage your past brand extractions
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/extract">
            <Sparkles className="mr-1 h-4 w-4" />
            New Extraction
          </Link>
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--muted-foreground))]" />
            </div>
          ) : extractions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--muted))]">
                <History className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
              </div>
              <h3 className="mt-4 font-medium">No extractions yet</h3>
              <p className="mt-1 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
                Extract your first brand kit to see it appear here.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/dashboard/extract">
                  <Sparkles className="mr-1 h-4 w-4" />
                  Extract your first brand
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {extractions.map((extraction) => (
                    <tr
                      key={extraction.id}
                      className="transition-colors hover:bg-[hsl(var(--muted))]/30"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--muted))]">
                            <Globe className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {extraction.domain}
                            </p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                              {extraction.url}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={extraction.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-[hsl(var(--muted-foreground))]">
                        {extraction.durationMs != null
                          ? `${Math.round(extraction.durationMs / 1000)}s`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-[hsl(var(--muted-foreground))]">
                        {new Date(extraction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {extraction.status === "complete" && (
                            <Button asChild variant="ghost" size="sm">
                              <Link to={`/dashboard/brand/${extraction.id}`}>
                                <ExternalLink className="h-4 w-4" />
                                <span className="hidden sm:inline ml-1">
                                  View
                                </span>
                              </Link>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
