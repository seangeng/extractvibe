"use client";

import { arc as arcGenerator } from "@visx/shape";
import { usePie } from "./pie-context";

/**
 * Static (non-animated) pie slice that works reliably in SSR + hydration.
 * Replaces PieSlice which uses motion springs that can fail to hydrate.
 */
export function PieSliceStatic() {
  const {
    arcs,
    outerRadius,
    innerRadius,
    cornerRadius,
    padAngle,
    hoveredIndex,
    setHoveredIndex,
    getColor,
    getFill,
  } = usePie();

  return (
    <>
      {arcs.map((arc, i) => {
        const generator = arcGenerator<unknown>({
          innerRadius,
          outerRadius: hoveredIndex === i ? outerRadius + 6 : outerRadius,
          cornerRadius,
          padAngle,
        });

        const path = generator({
          startAngle: arc.startAngle,
          endAngle: arc.endAngle,
        } as unknown as null) || "";

        const fill = getFill(i) || getColor(i);

        return (
          <path
            key={i}
            d={path}
            fill={fill}
            opacity={hoveredIndex !== null && hoveredIndex !== i ? 0.5 : 1}
            style={{ transition: "opacity 0.2s, d 0.3s" }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        );
      })}
    </>
  );
}
