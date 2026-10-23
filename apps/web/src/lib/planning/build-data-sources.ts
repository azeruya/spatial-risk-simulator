// src/lib/planning/build-data-sources.ts

import type {
  DataSourceRow,
  FootprintHazards,
} from "@/types/simulation";

function coverage(
  hazard:
    | FootprintHazards["flood"]
    | FootprintHazards["tsunami"]
    | FootprintHazards["landslide"]
) {
  if (!hazard) {
    return "Unavailable";
  }

  return `${hazard.validSamples}/${hazard.totalSamples} samples`;
}

export function buildDataSources(
  hazards: FootprintHazards
): DataSourceRow[] {
  return [
    {
      source: "BNPB InaRISK",
      measures:
        "Flood, tsunami, landslide",
      coverage:
        `Flood ${coverage(
          hazards.flood
        )} · Tsunami ${coverage(
          hazards.tsunami
        )} · Landslide ${coverage(
          hazards.landslide
        )}`,
    },

    {
      source: "ESA WorldCover 2021",
      measures:
        "Existing land cover",
    },

    {
      source: "Copernicus DEM GLO-30",
      measures:
        "Elevation and slope",
    },

    {
      source: "WorldPop 2025",
      measures:
        "Nearby population",
    },
  ];
}