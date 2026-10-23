import type {
  FootprintHazards,
  PlanningAssessment,
} from "@/types/simulation";

import type {
  TerrainAnalysis,
} from "@/types/terrain";

import {
  buildTerrainContext,
} from "@/lib/planning/terrain-context";

import {
  buildFindings,
} from "./planning/build-findings";

import {
  getHazardStatus,
  isHazardPresent,
} from "./planning/hazard-status";

import {
  buildRecommendations,
} from "./planning/build-recommendations";

import {
  buildAnalysisRows,
} from "./planning/build-analysis-rows";

import {
  buildDataSources,
} from "./planning/build-data-sources";

type PlanningAssessmentInput = {
  projectAreaM2: number;

  imperviousPercent: number;
  baselineImperviousPercent: number;

  greenPercent: number;
  baselineGreenPercent: number;

  additionalPopulation: number;

  runoffChangePercent: number;
  mitigationReductionPercent: number;

  runoffCurrent: number;
  runoffProposed: number;
  runoffMitigated: number | null;

  nearbyPopulation: number | null;

  hazards: FootprintHazards;

  terrain: TerrainAnalysis | null;
};

function formatArea(
  areaM2: number
) {
  if (areaM2 < 10_000) {
    return `${Math.round(
      areaM2
    ).toLocaleString()} m²`;
  }

  return `${(
    areaM2 / 10_000
  ).toFixed(2)} ha`;
}

export function buildPlanningAssessment({
  projectAreaM2,

  imperviousPercent,
  baselineImperviousPercent,

  greenPercent,
  baselineGreenPercent,

  additionalPopulation,

  runoffChangePercent,
  mitigationReductionPercent,

  runoffCurrent,
  runoffProposed,
  runoffMitigated,

  nearbyPopulation,

  hazards,
  terrain,
}: PlanningAssessmentInput): PlanningAssessment {
  // =========================================================
  // HAZARD STATUS
  // =========================================================

  const floodStatus =
    getHazardStatus(
      hazards.flood
    );

  const tsunamiStatus =
    getHazardStatus(
      hazards.tsunami
    );

  const landslideStatus =
    getHazardStatus(
      hazards.landslide
    );

  const floodPresent =
    isHazardPresent(
      floodStatus
    );

  const tsunamiPresent =
    isHazardPresent(
      tsunamiStatus
    );

  const landslidePresent =
    isHazardPresent(
      landslideStatus
    );

  const mappedHazardCount = [
    floodPresent,
    tsunamiPresent,
    landslidePresent,
  ].filter(Boolean).length;

  // =========================================================
  // SURFACE CHANGE
  // =========================================================

  const imperviousChange =
    imperviousPercent -
    baselineImperviousPercent;

  const greenChange =
    greenPercent -
    baselineGreenPercent;

  const improvesSurfaceCondition =
    imperviousChange <= -10 ||
    greenChange >= 10;

  const worsensSurfaceCondition =
    imperviousChange >= 10 ||
    greenChange <= -10;

  // =========================================================
  // TERRAIN
  // =========================================================

  const terrainContext =
    buildTerrainContext(
      terrain
    );

  const {
    lowLying,
    veryLowLying,
    flat: flatTerrain,
    sloping: slopingTerrain,
    steep: steepTerrain,
  } = terrainContext;

  // =========================================================
  // FINDINGS
  // =========================================================

  const findings =
    buildFindings({
      baselineImperviousPercent,
      imperviousPercent,

      baselineGreenPercent,
      greenPercent,

      runoffCurrent,
      runoffProposed,
      runoffMitigated,

      floodStatus,
      tsunamiStatus,
      landslideStatus,

      terrain,

      nearbyPopulation,
      additionalPopulation,
    });

  const topFindings =
    findings.slice(0, 3);

  // =========================================================
  // RECOMMENDATIONS
  // =========================================================

  const recommendations =
  buildRecommendations({
    floodStatus,
    tsunamiStatus,
    landslideStatus,

    terrain,

    runoffChangePercent,
    mitigationReductionPercent,

    imperviousPercent,
    greenPercent,
  });

  // =========================================================
  // ANALYSIS ROWS
  // =========================================================

  const analysisRows =
    buildAnalysisRows({
      baselineImperviousPercent,
      imperviousPercent,

      baselineGreenPercent,
      greenPercent,

      runoffCurrent,
      runoffProposed,
      runoffMitigated,

      floodStatus,
      tsunamiStatus,
      landslideStatus,

      terrain,

      nearbyPopulation,
      additionalPopulation,
    });

  // =========================================================
  // DATA SOURCES
  // =========================================================

  const dataSources =
    buildDataSources(
      hazards
    );

  // =========================================================
  // PRIMARY ASSESSMENT
  // =========================================================

  let status:
    PlanningAssessment["status"] =
    "low";

  let headline =
    "No major mapped hazard signal identified";

  let summary =
    `The ${formatArea(
      projectAreaM2
    )} proposed footprint has no mapped flood, tsunami, or landslide values in the sampled hazard datasets.`;

  let primaryConcern =
    "Development configuration";

  let recommendedAction =
    "Review the proposed land allocation and maintain adequate green and permeable surface.";

  // =========================================================
  // 1. LANDSLIDE + STEEP TERRAIN
  // =========================================================

  if (
    landslidePresent &&
    steepTerrain &&
    terrain
  ) {
    status = "review";

    headline =
      floodPresent ||
      tsunamiPresent
        ? "Steep terrain strengthens landslide sensitivity within a multi-hazard site"
        : "Mapped landslide exposure coincides with steep terrain";

    summary =
      `The ${formatArea(
        projectAreaM2
      )} footprint contains mapped landslide-hazard values on terrain with a mean slope of ${terrain.slope.mean.toFixed(
        1
      )}° and a maximum sampled slope of ${terrain.slope.max.toFixed(
        1
      )}°. ${
        mappedHazardCount > 1
          ? "Other mapped hazards are also present and require separate planning responses."
          : ""
      }`;

    primaryConcern =
      "Slope stability, grading, and concentrated drainage";

    recommendedAction =
      "Limit unnecessary cut-and-fill, control concentrated runoff, and undertake site-specific geotechnical assessment before detailed design.";
  }

  // =========================================================
  // 2. TSUNAMI + VERY LOW TERRAIN
  // =========================================================

  else if (
    tsunamiPresent &&
    veryLowLying &&
    terrain
  ) {
    status = "review";

    headline =
      "Low-lying tsunami-exposed site requires evacuation review";

    summary =
      `Mapped tsunami-hazard values are present within the ${formatArea(
        projectAreaM2
      )} footprint, which has a mean elevation of approximately ${Math.round(
        terrain.elevation.mean
      )} m.${
        floodPresent
          ? " Mapped flood-hazard values are also present."
          : ""
      }`;

    primaryConcern =
      "Low elevation and evacuation exposure";

    recommendedAction =
      "Review site suitability, evacuation-route continuity, access to higher ground, and vertical evacuation options.";
  }

  // =========================================================
  // 3. FLOOD + LOW / FLAT + RUNOFF INCREASE
  // =========================================================

  else if (
    floodPresent &&
    runoffChangePercent > 10 &&
    lowLying &&
    flatTerrain &&
    terrain
  ) {
    status =
      "attention";

    headline =
      "Development may amplify runoff on a low-lying flood-sensitive site";

    summary =
      `The proposed design increases comparative runoff pressure by ${runoffChangePercent.toFixed(
        1
      )}%. Mapped flood-hazard values are present while the site has a mean elevation of approximately ${Math.round(
        terrain.elevation.mean
      )} m and a mean slope of ${terrain.slope.mean.toFixed(
        1
      )}°.`;

    primaryConcern =
      "Runoff increase on low, flat terrain";

    recommendedAction =
      "Reduce paved surfaces, preserve infiltration capacity, and review drainage gradients, finished-floor elevation, and on-site retention.";
  }

  // =========================================================
  // 4. FLOOD + LANDSLIDE
  // =========================================================

  else if (
    floodPresent &&
    landslidePresent &&
    slopingTerrain &&
    terrain
  ) {
    status =
      "review";

    headline =
      "Runoff and slope stability require coordinated review";

    summary =
      `Mapped flood and landslide hazards occur within the ${formatArea(
        projectAreaM2
      )} footprint. The surrounding terrain has a mean slope of ${terrain.slope.mean.toFixed(
        1
      )}°, so drainage changes and slope stability should be considered together.`;

    primaryConcern =
      "Runoff concentration and slope stability";

    recommendedAction =
      "Control runoff pathways, minimize unnecessary grading, and review geotechnical and drainage conditions together.";
  }

  // =========================================================
  // 5. FLOOD + TSUNAMI + IMPROVING DESIGN
  // =========================================================

  else if (
    floodPresent &&
    tsunamiPresent &&
    improvesSurfaceCondition &&
    runoffChangePercent < 0
  ) {
    status =
      "review";

    headline =
      "Surface design improves runoff conditions, but tsunami exposure remains";

    summary =
      `The ${formatArea(
        projectAreaM2
      )} proposed footprint contains mapped flood and tsunami hazard values. The proposed surface design reduces comparative runoff pressure by ${Math.abs(
        runoffChangePercent
      ).toFixed(
        1
      )}% relative to the existing mapped land-cover baseline, but tsunami exposure remains unaffected by stormwater improvements.`;

    primaryConcern =
      "Residual tsunami exposure and flood-sensitive site conditions";

    recommendedAction =
      "Retain the improved surface design while separately reviewing evacuation access, site suitability, and vertical evacuation options for tsunami exposure.";
  }

  // =========================================================
  // 6. FLOOD + TSUNAMI
  // =========================================================

  else if (
    floodPresent &&
    tsunamiPresent
  ) {
    status =
      "review";

    headline =
      "Flood-sensitive development with tsunami exposure";

    summary =
      `The ${formatArea(
        projectAreaM2
      )} proposed footprint contains mapped flood and tsunami hazard values. Stormwater and tsunami exposure require different planning responses.`;

    primaryConcern =
      "Stormwater management and evacuation exposure";

    recommendedAction =
      "Reduce development-induced runoff while separately reviewing evacuation access and site suitability for tsunami exposure.";
  }

  // =========================================================
  // 7. GENERIC MULTI-HAZARD
  // =========================================================

  else if (
    mappedHazardCount >= 2
  ) {
    status =
      "review";

    const hazardNames = [
      floodPresent && "flood",
      tsunamiPresent &&
        "tsunami",
      landslidePresent &&
        "landslide",
    ].filter(Boolean);

    headline =
      "Multiple hazards affect the proposed site";

    summary =
      `The ${formatArea(
        projectAreaM2
      )} proposed footprint contains mapped ${hazardNames.join(
        " and "
      )} hazard values. These conditions require separate hazard-specific planning responses.`;

    primaryConcern =
      "Multiple mapped hazard conditions";

    recommendedAction =
      "Review each mapped hazard separately and apply hazard-specific planning controls.";
  }

  // =========================================================
  // 8. TSUNAMI ONLY
  // =========================================================

  else if (
    tsunamiPresent
  ) {
    status =
      "review";

    headline =
      "Tsunami exposure requires siting and evacuation review";

    summary =
      `Mapped tsunami-hazard values are present within the ${formatArea(
        projectAreaM2
      )} proposed footprint.`;

    primaryConcern =
      "Occupancy and evacuation exposure";

    recommendedAction =
      "Review evacuation access, vertical evacuation options, and whether the proposed use is appropriate for the site.";
  }

  // =========================================================
  // 9. FLOOD + IMPROVED DESIGN
  // =========================================================

  else if (
    floodPresent &&
    improvesSurfaceCondition &&
    runoffChangePercent < 0
  ) {
    status =
      "attention";

    headline =
      "Proposal improves surface conditions within a flood-sensitive site";

    summary =
      `The ${formatArea(
        projectAreaM2
      )} footprint contains mapped flood-hazard values, but the proposed design reduces comparative runoff pressure by ${Math.abs(
        runoffChangePercent
      ).toFixed(
        1
      )}% relative to the existing mapped surface baseline.`;

    primaryConcern =
      "Residual flood exposure despite improved surface design";

    recommendedAction =
      "Retain the proposed reduction in sealed surface and increased green space while continuing to review drainage, finished-floor elevation, and residual flood exposure.";
  }

  // =========================================================
  // 10. NO HAZARD + IMPROVED DESIGN
  // =========================================================

  else if (
    mappedHazardCount === 0 &&
    improvesSurfaceCondition &&
    runoffChangePercent < -5
  ) {
    status =
      "low";

    headline =
      "Proposal improves surface conditions relative to the existing site";

    summary =
      `The proposed design reduces comparative runoff pressure by ${Math.abs(
        runoffChangePercent
      ).toFixed(
        1
      )}% relative to the mapped existing land-cover baseline.`;

    primaryConcern =
      "Preserving the proposed permeability and green-space gains";

    recommendedAction =
      "Retain the proposed reduction in sealed surface and protect planned green and permeable areas through detailed design.";
  }

  // =========================================================
  // 11. FLOOD + RUNOFF INCREASE
  // =========================================================

  else if (
    floodPresent &&
    runoffChangePercent > 10
  ) {
    status =
      "attention";

    headline =
      "Development may amplify runoff in a mapped flood-hazard area";

    summary =
      `The proposed design increases impervious cover from an existing mapped built-up proxy of approximately ${baselineImperviousPercent.toFixed(
        0
      )}% to ${imperviousPercent}%, contributing to a ${runoffChangePercent.toFixed(
        1
      )}% increase in comparative runoff pressure within a mapped flood-hazard footprint.`;

    primaryConcern =
      "Increased runoff within flood-sensitive context";

    recommendedAction =
      "Reduce paved or sealed surfaces and strengthen infiltration or retention measures.";
  }

  // =========================================================
  // 12. LANDSLIDE ONLY
  // =========================================================

  else if (
    landslidePresent
  ) {
    status =
      "review";

    headline =
      "Landslide exposure requires slope-sensitive review";

    summary =
      `Mapped landslide-hazard values are present within the ${formatArea(
        projectAreaM2
      )} proposed footprint.`;

    primaryConcern =
      "Slope stability and drainage";

    recommendedAction =
      "Review slope conditions, drainage pathways, and geotechnical requirements before development.";
  }

  // =========================================================
  // 13. TERRAIN ONLY
  // =========================================================

  else if (
    mappedHazardCount === 0 &&
    steepTerrain &&
    terrain
  ) {
    status =
      "review";

    headline =
      "Steep terrain warrants additional site review";

    summary =
      `No mapped flood, tsunami, or landslide values were returned within the footprint, but the site has a mean slope of ${terrain.slope.mean.toFixed(
        1
      )}° and a maximum sampled slope of ${terrain.slope.max.toFixed(
        1
      )}°.`;

    primaryConcern =
      "Terrain sensitivity";

    recommendedAction =
      "Review grading, drainage, access, and geotechnical conditions before detailed development.";
  }

  // =========================================================
  // 14. WORSENED SURFACE CONDITION
  // =========================================================

  else if (
    mappedHazardCount === 0 &&
    worsensSurfaceCondition &&
    runoffChangePercent > 5
  ) {
    status =
      "attention";

    headline =
      "Proposal intensifies surface development relative to the existing site";

    summary =
      `The proposed design increases impervious cover relative to the mapped built-up baseline and raises comparative runoff pressure by ${runoffChangePercent.toFixed(
        1
      )}%.`;

    primaryConcern =
      "Loss of existing infiltration and vegetated cover";

    recommendedAction =
      "Reduce unnecessary sealed surface, preserve existing vegetation where feasible, and introduce infiltration or retention measures.";
  }

  // =========================================================
  // 15. RUNOFF CHANGE WITHOUT MAPPED HAZARD
  // =========================================================

  else if (
    runoffChangePercent > 10
  ) {
    status =
      "attention";

    headline =
      "Development substantially increases runoff pressure";

    summary =
      `No mapped hazard values were returned within the footprint, but the proposed design increases comparative runoff pressure by ${runoffChangePercent.toFixed(
        1
      )}%.`;

    primaryConcern =
      "Loss of infiltration capacity";

    recommendedAction =
      "Reduce paved or sealed surfaces or introduce mitigation measures that improve infiltration and retention.";
  }

  return {
    status,

    verdict: {
      headline,
      action:
        recommendedAction,
    },

    site: {
      flood:
        floodStatus,
      tsunami:
        tsunamiStatus,
      landslide:
        landslideStatus,
    },

    findings,
    topFindings,

    recommendations,
    analysisRows,
    dataSources,

    limitations: [
      "Results are screening-level planning indicators.",
      "Runoff is a comparative index, not predicted runoff volume, flood depth, or probability.",
      "Regional hazard layers do not replace site-specific engineering assessment.",
    ],
  };
}