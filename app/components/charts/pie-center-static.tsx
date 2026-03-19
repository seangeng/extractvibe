"use client";

import { cn } from "~/lib/utils";
import { usePie } from "./pie-context";

/**
 * Static PieCenter — no NumberFlow dependency.
 * Displays the total value and label in the donut center.
 */
export function PieCenterStatic({
  defaultLabel = "Total",
  className = "",
}: {
  defaultLabel?: string;
  className?: string;
}) {
  const { data, hoveredIndex, totalValue, innerRadius } = usePie();

  const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null;
  const displayValue = hoveredData ? hoveredData.value : totalValue;
  const displayLabel = hoveredData ? hoveredData.label : defaultLabel;

  const centerSize = innerRadius * 2 - 16;

  if (innerRadius <= 0) return null;

  return (
    <div
      className={cn("flex flex-col items-center justify-center text-center", className)}
      style={{ width: centerSize, height: centerSize }}
    >
      <span className="text-2xl font-bold tabular-nums text-[hsl(var(--foreground))]">
        {Math.round(displayValue)}
      </span>
      <span className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
        {displayLabel}
      </span>
    </div>
  );
}

PieCenterStatic.displayName = "PieCenter";
