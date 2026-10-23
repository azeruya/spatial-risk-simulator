import type {
  Finding,
  HazardStatus,
} from "@/types/simulation";

import type {
  TerrainAnalysis,
} from "@/types/terrain";

import {
  buildTerrainContext,
} from "@/lib/planning/terrain-context";

import {
  isHazardPresent,
} from "./hazard-status";

type BuildFindingsInput = {
  floodStatus: HazardStatus;
  tsunamiStatus: HazardStatus;
  landslideStatus: HazardStatus;

  terrain: TerrainAnalysis | null;

  imperviousPercent: number;
  baselineImperviousPercent: number;

  greenPercent: number;
  baselineGreenPercent: number;

  runoffCurrent: number;
  runoffProposed: number;
  runoffMitigated: number | null;

  nearbyPopulation: number | null;
  additionalPopulation: number;
};

const ORDER = {
  high: 0,
  medium: 1,
  info: 2,
  good: 3,
} as const;

function percentChange(
  from: number,
  to: number
) {
  if (from <= 0) return 0;

  return ((to - from) / from) * 100;
}

export function buildFindings({
  floodStatus,
  tsunamiStatus,
  landslideStatus,

  terrain,

  imperviousPercent,
  baselineImperviousPercent,

  greenPercent,
  baselineGreenPercent,

  runoffCurrent,
  runoffProposed,
  runoffMitigated,

  nearbyPopulation,
  additionalPopulation,
}: BuildFindingsInput): Finding[] {
  const findings: Finding[] = [];

  // =========================================================
  // DERIVED VALUES
  // =========================================================

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

  const runoffChangePercent =
    percentChange(
      runoffCurrent,
      runoffProposed
    );

  const mitigationReductionPercent =
    runoffMitigated !== null
      ? percentChange(
          runoffProposed,
          runoffMitigated
        )
      : 0;

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
  // Conditions the design cannot directly remove
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
  } else if (landslidePresent) {
    findings.push({
      id: "landslide-present",
      severity: "medium",
      scope: "site",
      headline:
        "Landslide exposure is mapped here",
      detail:
        "Review terrain, drainage, grading, and geotechnical conditions before detailed design.",
    });
  }

  // =========================================================
  // DESIGN FINDINGS
  // Conditions caused or improved by the proposal
  // =========================================================

  if (runoffChangePercent <= -5) {
    findings.push({
      id: "runoff-improves",
      severity: "good",
      scope: "design",
      headline:
        "Less rainwater may run off",
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
      severity:
        floodPresent
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
        `Paved or impervious cover increases by about ${imperviousChange.toFixed(
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
        `Paved or impervious cover decreases by about ${Math.abs(
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
        )} percentage points compared with the mapped baseline.`,
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

  // =========================================================
  // PEOPLE / EXPOSURE
  // =========================================================

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
        nearbyPopulation !== null
          ? `The proposal adds approximately ${additionalPopulation.toLocaleString()} occupants near an existing population context of about ${Math.round(
              nearbyPopulation
            ).toLocaleString()} people.`
          : `The proposal adds approximately ${additionalPopulation.toLocaleString()} occupants within a mapped hazard context.`,
    });
  }

  // =========================================================
  // MITIGATION
  // Compare mitigated against proposed
  // =========================================================

  if (
    runoffMitigated !== null &&
    mitigationReductionPercent <= -5
  ) {
    findings.push({
      id: "mitigation-effect",
      severity: "good",
      scope: "design",
      headline:
        "Mitigation reduces runoff further",
      detail:
        `Selected measures reduce comparative runoff pressure by another ${Math.abs(
          mitigationReductionPercent
        ).toFixed(
          0
        )}% compared with the proposal.`,
    });
  }

  // =========================================================
  // DATA AVAILABILITY
  // Unavailable / no-data must not be interpreted as safe
  // =========================================================

  const missingHazards: string[] = [];

  if (
    tsunamiStatus === "unavailable" ||
    tsunamiStatus === "no-data"
  ) {
    missingHazards.push("tsunami");
  }

  if (
    floodStatus === "unavailable" ||
    floodStatus === "no-data"
  ) {
    missingHazards.push("flood");
  }

  if (
    landslideStatus === "unavailable" ||
    landslideStatus === "no-data"
  ) {
    missingHazards.push("landslide");
  }

  if (missingHazards.length > 0) {
    findings.push({
      id: "hazard-data-incomplete",
      severity: "info",
      scope: "check",
      headline:
        "Some hazard data is unavailable",
      detail:
        `No reliable mapped value was returned for ${missingHazards.join(
          ", "
        )}. Missing data should not be interpreted as no hazard.`,
    });
  }

  return findings.sort(
    (a, b) =>
      ORDER[a.severity] -
      ORDER[b.severity]
  );
}