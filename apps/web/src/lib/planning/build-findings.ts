// src/lib/planning/build-findings.ts

import type {
  Finding,
  FootprintHazards,
  HazardStatus,
} from "@/types/simulation";

import type {
  TerrainAnalysis,
} from "@/types/terrain";

import {
  buildTerrainContext,
} from "@/lib/planning/terrain-context";

import { isHazardPresent } from "./hazard-status";

type BuildFindingsInput = {
  hazards: FootprintHazards;

  floodStatus: HazardStatus;
  tsunamiStatus: HazardStatus;
  landslideStatus: HazardStatus;

  terrain: TerrainAnalysis | null;

  imperviousPercent: number;
  baselineImperviousPercent: number;

  greenPercent: number;
  baselineGreenPercent: number;

  additionalPopulation: number;

  runoffChangePercent: number;
  mitigationReductionPercent: number;
};

const ORDER = {
  high: 0,
  medium: 1,
  info: 2,
  good: 3,
} as const;

export function buildFindings({
  hazards,

  floodStatus,
  tsunamiStatus,
  landslideStatus,

  terrain,

  imperviousPercent,
  baselineImperviousPercent,

  greenPercent,
  baselineGreenPercent,

  additionalPopulation,

  runoffChangePercent,
  mitigationReductionPercent,
}: BuildFindingsInput): Finding[] {
  const findings: Finding[] = [];

  const floodPresent =
    isHazardPresent(floodStatus);

  const tsunamiPresent =
    isHazardPresent(tsunamiStatus);

  const landslidePresent =
    isHazardPresent(landslideStatus);

  const imperviousChange =
    imperviousPercent -
    baselineImperviousPercent;

  const greenChange =
    greenPercent -
    baselineGreenPercent;

  const terrainContext =
    buildTerrainContext(terrain);

  const {
    lowLying,
    veryLowLying,
    flat: flatTerrain,
    sloping: slopingTerrain,
    steep: steepTerrain,
  } = terrainContext;

  // =========================================================
  // SITE FINDINGS
  // Things the design cannot directly change
  // =========================================================

  if (
    tsunamiPresent &&
    veryLowLying &&
    terrain
  ) {
    findings.push({
      id: "tsunami-low-lying",

      severity: "high",

      scope: "site",

      headline:
        "Tsunami exposure at a low site",

      detail:
        `Ground elevation is about ${Math.round(
          terrain.elevation.mean
        )} m. Prioritize evacuation access and vertical refuge planning.`,
    });
  } else if (tsunamiPresent) {
    findings.push({
      id: "tsunami-present",

      severity: "high",

      scope: "site",

      headline:
        "Tsunami exposure is mapped here",

      detail:
        "Surface design cannot remove tsunami exposure. Review evacuation access and site suitability.",
    });
  }

  if (
    floodPresent &&
    lowLying &&
    flatTerrain
  ) {
    findings.push({
      id: "flood-flat-low",

      severity: "medium",

      scope: "check",

      headline:
        "Low flat ground may drain slowly",

      detail:
        "Mapped flood exposure overlaps relatively low and flat terrain. Review drainage paths and finished-floor elevation.",
    });
  } else if (floodPresent) {
    findings.push({
      id: "flood-present",

      severity: "medium",

      scope: "site",

      headline:
        "Flood exposure is mapped here",

      detail:
        "Flood-hazard values occur within the proposed footprint.",
    });
  }

  if (
    landslidePresent &&
    steepTerrain
  ) {
    findings.push({
      id: "landslide-steep",

      severity: "high",

      scope: "site",

      headline:
        "Landslide exposure overlaps steep terrain",

      detail:
        "Review slope stability, grading, drainage concentration, and geotechnical conditions before detailed design.",
    });
  } else if (
    landslidePresent &&
    slopingTerrain
  ) {
    findings.push({
      id: "landslide-sloping",

      severity: "medium",

      scope: "check",

      headline:
        "Slope conditions need closer review",

      detail:
        "Mapped landslide exposure overlaps sloping terrain. Avoid unnecessary grading and concentrated runoff.",
    });
  }

  // =========================================================
  // DESIGN FINDINGS
  // Things the user can influence
  // =========================================================

  if (runoffChangePercent <= -5) {
    findings.push({
      id: "runoff-improves",

      severity: "good",

      scope: "design",

      headline:
        "Less rainwater runs off",

      detail:
        `Comparative runoff pressure falls ${Math.abs(
          runoffChangePercent
        ).toFixed(
          0
        )}% relative to the current site.`,
    });
  }

  if (runoffChangePercent >= 10) {
    findings.push({
      id: "runoff-increases",

      severity: floodPresent
        ? "high"
        : "medium",

      scope: "design",

      headline:
        "More rainwater may run off",

      detail:
        `Comparative runoff pressure increases ${runoffChangePercent.toFixed(
          0
        )}% relative to the current site.`,
    });
  }

  if (imperviousChange >= 10) {
    findings.push({
      id: "impervious-increase",

      severity: "medium",

      scope: "design",

      headline:
        "More surface becomes sealed",

      detail:
        `Impervious cover increases by about ${imperviousChange.toFixed(
          0
        )} percentage points compared with the mapped baseline.`,
    });
  }

  if (imperviousChange <= -10) {
    findings.push({
      id: "impervious-decrease",

      severity: "good",

      scope: "design",

      headline:
        "Less surface becomes sealed",

      detail:
        `Impervious cover decreases by about ${Math.abs(
          imperviousChange
        ).toFixed(
          0
        )} percentage points compared with the mapped baseline.`,
    });
  }

  if (greenChange >= 10) {
    findings.push({
      id: "green-gain",

      severity: "good",

      scope: "design",

      headline:
        "More green space is retained",

      detail:
        `Green and open space increases by about ${greenChange.toFixed(
          0
        )} percentage points.`,
    });
  }

  if (greenChange <= -15) {
    findings.push({
      id: "green-loss",

      severity: "medium",

      scope: "design",

      headline:
        "Green space is substantially reduced",

      detail:
        `Mapped vegetated cover decreases by about ${Math.abs(
          greenChange
        ).toFixed(
          0
        )} percentage points.`,
    });
  }

  if (
    additionalPopulation > 0 &&
    (
      tsunamiPresent ||
      floodPresent ||
      landslidePresent
    )
  ) {
    findings.push({
      id: "occupancy-exposure",

      severity:
        tsunamiPresent
          ? "high"
          : "medium",

      scope: "site",

      headline:
        "More people would be exposed",

      detail:
        `The proposal adds approximately ${additionalPopulation.toLocaleString()} occupants within a mapped hazard context.`,
    });
  }

  // =========================================================
  // MITIGATION
  // =========================================================

  if (mitigationReductionPercent >= 5) {
    findings.push({
      id: "mitigation-effect",

      severity: "good",

      scope: "design",

      headline:
        "Mitigation further reduces runoff",

      detail:
        `Selected measures reduce comparative runoff pressure by another ${mitigationReductionPercent.toFixed(
          0
        )}%.`,
    });
  }

  // =========================================================
  // FALLBACKS / DATA STATES
  // =========================================================

  const anyHazardPresent =
    floodPresent ||
    tsunamiPresent ||
    landslidePresent;

  if (!anyHazardPresent) {
    const hasMissingData =
      floodStatus === "unavailable" ||
      tsunamiStatus === "unavailable" ||
      landslideStatus === "unavailable" ||
      floodStatus === "no-data" ||
      tsunamiStatus === "no-data" ||
      landslideStatus === "no-data";

    if (hasMissingData) {
      findings.push({
        id: "hazard-data-incomplete",

        severity: "info",

        scope: "check",

        headline:
          "Some hazard data is incomplete",

        detail:
          "A missing hazard value should not be interpreted as proof that no hazard exists.",
      });
    }
  }

  return findings.sort(
    (a, b) =>
      ORDER[a.severity] -
      ORDER[b.severity]
  );
}