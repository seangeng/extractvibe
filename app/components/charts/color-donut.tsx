"use client";

import { PieChart } from "./pie-chart";
import { PieSliceStatic } from "./pie-slice-static";
import { PieCenterStatic } from "./pie-center-static";

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
      <PieCenterStatic defaultLabel="colors" />
    </PieChart>
  );
}
