import type {
  AnalysisRow,
  HazardStatus,
} from "@/types/simulation";

import type {
  TerrainAnalysis,
} from "@/types/terrain";

type Input = {
  baselineImperviousPercent: number;
  imperviousPercent: number;

  baselineGreenPercent: number;
  greenPercent: number;

  runoffCurrent: number;
  runoffProposed: number;
  runoffMitigated: number | null;

  floodStatus: HazardStatus;
  tsunamiStatus: HazardStatus;
  landslideStatus: HazardStatus;

  terrain: TerrainAnalysis | null;

  nearbyPopulation: number | null;
  additionalPopulation: number;
};

function formatPointChange(
  value: number
) {
  if (Math.abs(value) < 0.01) {
    return "No change";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(
    0
  )} points`;
}

function formatHazardStatus(
  status: HazardStatus
) {
  switch (status) {
    case "high":
      return "High";

    case "moderate":
      return "Moderate";

    case "low":
      return "Low";

    case "none":
      return "No hazard value";

    case "no-data":
      return "No mapped data";

    case "unavailable":
      return "Unavailable";
  }
}

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

  const imperviousChange =
    imperviousPercent -
    baselineImperviousPercent;

  const greenChange =
    greenPercent -
    baselineGreenPercent;

  // =========================================================
  // SURFACE CHANGE
  // =========================================================

  rows.push({
    label: "Paved surface",

    current:
      `${baselineImperviousPercent.toFixed(
        0
      )}%`,

    proposed:
      `${imperviousPercent.toFixed(
        0
      )}%`,

    change:
      formatPointChange(
        imperviousChange
      ),
  });

  rows.push({
    label: "Green space",

    current:
      `${baselineGreenPercent.toFixed(
        0
      )}%`,

    proposed:
      `${greenPercent.toFixed(
        0
      )}%`,

    change:
      formatPointChange(
        greenChange
      ),
  });

  // =========================================================
  // RUNOFF
  // =========================================================

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

  // =========================================================
  // HAZARDS
  // These do NOT change across scenarios.
  // =========================================================

  rows.push({
    label: "Flood hazard",
    value:
      formatHazardStatus(
        floodStatus
      ),
  });

  rows.push({
    label: "Tsunami hazard",
    value:
      formatHazardStatus(
        tsunamiStatus
      ),
  });

  rows.push({
    label: "Landslide hazard",
    value:
      formatHazardStatus(
        landslideStatus
      ),
  });

  // =========================================================
  // TERRAIN
  // =========================================================

  if (terrain) {
    rows.push({
      label: "Terrain",

      value:
        `${Math.round(
          terrain.elevation.mean
        )} m elevation · ${terrain.slope.mean.toFixed(
          1
        )}° mean slope`,
    });
  }

  // =========================================================
  // POPULATION
  // =========================================================

  rows.push({
    label: "People nearby",

    value:
      nearbyPopulation !== null
        ? additionalPopulation > 0
          ? `${Math.round(
              nearbyPopulation
            ).toLocaleString()} + ${additionalPopulation.toLocaleString()} added`
          : Math.round(
              nearbyPopulation
            ).toLocaleString()
        : additionalPopulation > 0
          ? `Unavailable · +${additionalPopulation.toLocaleString()} added`
          : "Unavailable",
  });

  return rows;
}