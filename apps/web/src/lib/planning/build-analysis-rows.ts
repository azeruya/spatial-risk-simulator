// src/lib/planning/build-analysis-rows.ts

import type {
  AnalysisRow,
  FootprintHazards,
} from "@/types/simulation";

import type {
  TerrainAnalysis,
} from "@/types/terrain";

import { HazardStatus } from "@/types/simulation";

type Input = {
  baselineImperviousPercent: number;
  imperviousPercent: number;

  baselineGreenPercent: number;
  greenPercent: number;

  runoffCurrent: number;
  runoffProposed: number;
  runoffMitigated: number;

  floodStatus: HazardStatus;
  tsunamiStatus: HazardStatus;
  landslideStatus: HazardStatus;

  terrain: TerrainAnalysis | null;

  nearbyPopulation: number | null;
  additionalPopulation: number;
};

export function buildAnalysisRows({
  imperviousPercent,
  baselineImperviousPercent,

  greenPercent,
  baselineGreenPercent,

  runoffCurrent,
  runoffProposed,
  runoffMitigated,

  floodStatus,
  tsunamiStatus,
  landslideStatus,

  terrain,

  nearbyPopulation,
  additionalPopulation,
}: Input): AnalysisRow[] {
  const rows: AnalysisRow[] = [];

  rows.push({
    label: "Paved surface",
    current:
      `${baselineImperviousPercent.toFixed(0)}%`,
    proposed:
      `${imperviousPercent.toFixed(0)}%`,
    change:
      `${(
        imperviousPercent -
        baselineImperviousPercent
      ).toFixed(0)} points`,
  });

  rows.push({
    label: "Green space",
    current:
      `${baselineGreenPercent.toFixed(0)}%`,
    proposed:
      `${greenPercent.toFixed(0)}%`,
    change:
      `${(
        greenPercent -
        baselineGreenPercent
      ).toFixed(0)} points`,
  });

  rows.push({
    label: "Runoff index",
    current:
      runoffCurrent.toFixed(2),
    proposed:
      runoffProposed.toFixed(2),
    mitigated:
      runoffMitigated !== null
        ? runoffMitigated.toFixed(2)
        : undefined,
  });

  if (terrain) {
    rows.push({
      label: "Terrain",
      value:
        `${Math.round(
          terrain.elevation.mean
        )} m, slope ${terrain.slope.mean.toFixed(
          1
        )}°`,
    });
  }

  rows.push({
    label: "People nearby",
    value:
        nearbyPopulation !== null &&
        nearbyPopulation !== undefined
        ? `${Math.round(
            nearbyPopulation
            ).toLocaleString()} + ${additionalPopulation.toLocaleString()} added`
        : `Unavailable + ${additionalPopulation.toLocaleString()} added`,
    });

  return rows;
}