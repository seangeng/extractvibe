import { CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "./ui/badge";
import type { ExtractionStatus } from "../lib/types";

export function StatusBadge({ status }: { status: ExtractionStatus }) {
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
