"use client";

import { PieChart } from "./pie-chart";
import { PieSliceStatic } from "./pie-slice-static";
import { PieCenter } from "./pie-center";

interface ColorItem {
  key: string;
  color: { hex?: string; role?: string };
}

export default function ColorDonutChart({ colors }: { colors: ColorItem[] }) {
  const data = colors.map((c) => ({
    label: c.color.role || c.key,
    value: 1,
    color: c.color.hex!,
  }));

  return (
    <PieChart
      data={data}
      size={180}
      innerRadius={55}
      padAngle={0.05}
      cornerRadius={3}
    >
      <PieSliceStatic />
      <PieCenter>
        <text
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[hsl(var(--foreground))]"
          style={{ fontSize: "24px", fontWeight: 700 }}
          dy={-4}
        >
          {colors.length}
        </text>
        <text
          textAnchor="middle"
          className="fill-[hsl(var(--muted-foreground))]"
          style={{ fontSize: "11px" }}
          dy={14}
        >
          colors
        </text>
      </PieCenter>
    </PieChart>
  );
}
