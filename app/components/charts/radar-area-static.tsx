"use client";

import { useMemo } from "react";
import { useRadar } from "./radar-context";

/**
 * Static (non-animated) radar area — no motion dependency.
 * Renders a polygon with data points, works reliably with SSR hydration.
 */
export function RadarAreaStatic({
  index = 0,
  color: colorProp,
}: {
  index?: number;
  color?: string;
}) {
  const { data, metrics, getColor, getPointPosition } = useRadar();

  const areaData = data[index];
  if (!areaData) return null;

  const color = colorProp || areaData.color || getColor(index);

  const points = useMemo(() => {
    return metrics.map((metric, i) => {
      const value = areaData.values[metric.key] ?? 0;
      return getPointPosition(i, value);
    });
  }, [metrics, areaData, getPointPosition]);

  const pathD = `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")} Z`;

  return (
    <g>
      <path
        d={pathD}
        fill={color}
        fillOpacity={0.12}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={4}
          fill={color}
          stroke="var(--chart-background, white)"
          strokeWidth={2}
        />
      ))}
    </g>
  );
}
