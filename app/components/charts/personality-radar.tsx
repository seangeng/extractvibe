"use client";

import { RadarChart } from "./radar-chart";
import { RadarAreaStatic } from "./radar-area-static";
import { RadarGrid } from "./radar-grid";
import { RadarLabels } from "./radar-labels";

interface ToneSpectrum {
  formalCasual?: number;
  playfulSerious?: number;
  enthusiasticMatterOfFact?: number;
  respectfulIrreverent?: number;
  technicalAccessible?: number;
}

export default function PersonalityRadarChart({ spectrum }: { spectrum: ToneSpectrum }) {
  const metrics: Array<{ key: string; label: string }> = [];
  const values: Record<string, number> = {};

  if (spectrum.formalCasual != null) {
    metrics.push({ key: "formality", label: "Casual" });
    values.formality = spectrum.formalCasual * 10;
  }
  if (spectrum.playfulSerious != null) {
    metrics.push({ key: "mood", label: "Serious" });
    values.mood = spectrum.playfulSerious * 10;
  }
  if (spectrum.enthusiasticMatterOfFact != null) {
    metrics.push({ key: "energy", label: "Direct" });
    values.energy = spectrum.enthusiasticMatterOfFact * 10;
  }
  if (spectrum.respectfulIrreverent != null) {
    metrics.push({ key: "attitude", label: "Bold" });
    values.attitude = spectrum.respectfulIrreverent * 10;
  }
  if (spectrum.technicalAccessible != null) {
    metrics.push({ key: "complexity", label: "Accessible" });
    values.complexity = spectrum.technicalAccessible * 10;
  }

  if (metrics.length < 3) return null;

  const data = [
    { label: "Brand Personality", color: "hsl(var(--foreground))", values },
  ];

  return (
    <RadarChart data={data} metrics={metrics} size={280} levels={4} margin={55}>
      <RadarGrid />
      <RadarLabels />
      <RadarAreaStatic />
    </RadarChart>
  );
}
