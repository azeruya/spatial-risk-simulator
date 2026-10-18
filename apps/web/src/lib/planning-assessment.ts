import type {
  FootprintHazardAnalysis,
  FootprintHazards,
  PlanningAssessment,
} from "@/types/simulation";

import type {
  TerrainAnalysis,
} from "@/types/terrain";

import {
  buildTerrainContext,
} from "@/lib/planning/terrain-context";

type PlanningAssessmentInput = {
  projectAreaM2: number;

  imperviousPercent: number;
  baselineImperviousPercent: number;

  greenPercent: number;
  baselineGreenPercent: number;

  additionalPopulation: number;

  runoffChangePercent: number;
  mitigationReductionPercent: number;

  hazards: FootprintHazards;

  terrain: TerrainAnalysis | null;
};

function hasMappedHazard(
  hazard: FootprintHazardAnalysis | null
) {
  return (
    hazard !== null &&
    hazard.validSamples > 0 &&
    hazard.average !== null
  );
}

function formatArea(areaM2: number) {
  if (areaM2 < 10_000) {
    return `${Math.round(areaM2).toLocaleString()} m²`;
  }

  return `${(areaM2 / 10_000).toFixed(2)} ha`;
}

function formatSampleCoverage(
  hazard: FootprintHazardAnalysis
) {
  return `${hazard.validSamples} of ${hazard.totalSamples} sampled locations`;
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

  hazards,
  terrain,
}: PlanningAssessmentInput): PlanningAssessment {
  const floodPresent =
    hasMappedHazard(hazards.flood);

  const tsunamiPresent =
    hasMappedHazard(hazards.tsunami);

  const landslidePresent =
    hasMappedHazard(hazards.landslide);

  const mappedHazardCount = [
    floodPresent,
    tsunamiPresent,
    landslidePresent,
  ].filter(Boolean).length;

  const imperviousChange =
    imperviousPercent -
    baselineImperviousPercent;

  const greenChange =
    greenPercent -
    baselineGreenPercent;

  const terrainContext =
    buildTerrainContext(terrain);

  const {
    available: terrainAvailable,
    lowLying,
    veryLowLying,
    flat: flatTerrain,
    sloping: slopingTerrain,
    steep: steepTerrain,
    highRelief,
  } = terrainContext;

  /*
   * --------------------------------
   * User-facing reasoning sections
   * --------------------------------
   */

  const hazard: string[] = [];
  const change: string[] = [];
  const consequence: string[] = [];

  /*
   * --------------------------------
   * Raw evidence / audit trail
   * --------------------------------
   */

  const evidence: string[] = [];

  /*
   * --------------------------------
   * Planning responses
   * --------------------------------
   */

  const responses: string[] = [];

  /*
   * ==========================================================
   * HAZARD
   * What already exists at the site?
   * ==========================================================
   */

  if (floodPresent && hazards.flood) {
    hazard.push(
      "Mapped flood-hazard values are present within the proposed footprint."
    );

    evidence.push(
      `Flood-hazard data was returned at ${formatSampleCoverage(
        hazards.flood
      )} within the footprint.`
    );
  }

  if (
    tsunamiPresent &&
    hazards.tsunami
  ) {
    hazard.push(
      "Mapped tsunami-hazard values are present within the proposed footprint."
    );

    evidence.push(
      `Tsunami-hazard data was returned at ${formatSampleCoverage(
        hazards.tsunami
      )} within the footprint.`
    );
  }

  if (
    landslidePresent &&
    hazards.landslide
  ) {
    hazard.push(
      "Mapped landslide-hazard values are present within the proposed footprint."
    );

    evidence.push(
      `Landslide-hazard data was returned at ${formatSampleCoverage(
        hazards.landslide
      )} within the footprint.`
    );
  }

  if (mappedHazardCount === 0) {
    hazard.push(
      "No mapped flood, tsunami, or landslide values were returned within the proposed footprint."
    );
  }

  if (terrainAvailable && terrain) {
    hazard.push(
      `The proposed site has a mean elevation of ${Math.round(
        terrain.elevation.mean
      )} m and a mean slope of ${terrain.slope.mean.toFixed(
        1
      )}°.`
    );

    evidence.push(
      `Terrain elevation ranges from ${Math.round(
        terrain.elevation.min
      )} m to ${Math.round(
        terrain.elevation.max
      )} m, with ${Math.round(
        terrain.relief
      )} m of local relief.`
    );
  }

  /*
   * ==========================================================
   * CHANGE
   * What does the proposed development alter?
   * ==========================================================
   */

  if (imperviousChange > 0) {
    change.push(
      `Impervious surface increases from ${baselineImperviousPercent}% to ${imperviousPercent}% (+${imperviousChange.toFixed(
        0
      )} percentage points).`
    );
  } else if (imperviousChange < 0) {
    change.push(
      `Impervious surface decreases from ${baselineImperviousPercent}% to ${imperviousPercent}% (${imperviousChange.toFixed(
        0
      )} percentage points).`
    );
  }

  if (greenChange < 0) {
    change.push(
      `Green and open space decreases from ${baselineGreenPercent}% to ${greenPercent}% (${greenChange.toFixed(
        0
      )} percentage points).`
    );
  } else if (greenChange > 0) {
    change.push(
      `Green and open space increases from ${baselineGreenPercent}% to ${greenPercent}% (+${greenChange.toFixed(
        0
      )} percentage points).`
    );
  }

  if (additionalPopulation > 0) {
    change.push(
      `The proposal introduces approximately ${additionalPopulation.toLocaleString()} additional occupants.`
    );
  }

  /*
   * ==========================================================
   * CONSEQUENCE
   * Why do those changes matter in this context?
   * ==========================================================
   */

  if (
    floodPresent &&
    imperviousChange > 0
  ) {
    consequence.push(
      "Because the site already contains mapped flood-hazard values, increasing impervious coverage may make more rainfall become surface runoff rather than infiltrate into the ground."
    );
  }

  if (
    floodPresent &&
    greenChange < 0
  ) {
    consequence.push(
      "The reduction in green and permeable space further reduces the site's capacity to absorb rainfall."
    );
  }

  if (
    floodPresent &&
    runoffChangePercent > 0
  ) {
    consequence.push(
      `The comparative runoff-pressure indicator increases by ${runoffChangePercent.toFixed(
        1
      )}% under the proposed development scenario.`
    );
  }

  if (
    floodPresent &&
    lowLying
  ) {
    consequence.push(
      "Flood-hazard values occur within a relatively low-elevation site, increasing the importance of drainage pathways, runoff storage, and finished-floor elevation."
    );
  }

  if (
    floodPresent &&
    lowLying &&
    flatTerrain
  ) {
    consequence.push(
      "The low and relatively flat terrain may limit natural drainage gradients, so surface-water management should be reviewed carefully."
    );
  }

  if (
    tsunamiPresent &&
    additionalPopulation > 0
  ) {
    consequence.push(
      "Additional occupants would increase the number of people located within a site where mapped tsunami-hazard values are present."
    );
  }

  if (tsunamiPresent) {
    consequence.push(
      "Stormwater improvements can reduce development-induced runoff, but they do not reduce tsunami exposure."
    );
  }

  if (
    tsunamiPresent &&
    veryLowLying
  ) {
    consequence.push(
      "The proposed site is very low-lying within a mapped tsunami context, which increases the importance of evacuation access and vertical refuge planning."
    );
  }

  if (landslidePresent) {
    consequence.push(
      "Development within mapped landslide-hazard context may require closer review of slope stability, drainage direction, and ground conditions."
    );
  }

  if (
    landslidePresent &&
    slopingTerrain
  ) {
    consequence.push(
      "Mapped landslide hazard coincides with sloping terrain, strengthening the need for slope-stability and drainage review."
    );
  }

  if (
    landslidePresent &&
    steepTerrain
  ) {
    consequence.push(
      "The site includes steep terrain within a mapped landslide context, which may increase sensitivity to cut-and-fill, drainage concentration, and slope disturbance."
    );
  }

  if (
    landslidePresent &&
    highRelief
  ) {
    consequence.push(
      "Substantial elevation variation within the surrounding terrain suggests that local drainage direction and slope transitions should be reviewed before detailed design."
    );
  }

  if (
    !floodPresent &&
    !tsunamiPresent &&
    !landslidePresent &&
    runoffChangePercent > 0
  ) {
    consequence.push(
      `The proposal increases comparative runoff pressure by ${runoffChangePercent.toFixed(
        1
      )}%, even though no mapped hazard values were returned within the footprint.`
    );
  }

  if (
    mitigationReductionPercent > 0
  ) {
    consequence.push(
      `The selected mitigation measures reduce the comparative runoff-pressure indicator by approximately ${mitigationReductionPercent.toFixed(
        1
      )}%.`
    );
  }

  /*
   * ==========================================================
   * PLANNING RESPONSE
   * What should the user consider doing?
   * ==========================================================
   */

  if (
    floodPresent &&
    runoffChangePercent > 0
  ) {
    responses.push(
      "Reduce paved or sealed surfaces where practical and preserve infiltration capacity."
    );

    responses.push(
      "Consider permeable paving, vegetated drainage, rain gardens, or on-site retention to manage development-induced runoff."
    );
  }

  if (
    floodPresent &&
    lowLying
  ) {
    responses.push(
      "Review finished-floor elevation, drainage outfalls, and temporary runoff storage relative to the surrounding terrain."
    );
  }

  if (tsunamiPresent) {
    responses.push(
      "Review site placement, evacuation access, vertical evacuation options, and the suitability of the proposed occupancy for the mapped tsunami context."
    );
  }

  if (
    tsunamiPresent &&
    lowLying
  ) {
    responses.push(
      "Prioritize evacuation-route continuity and assess access to higher ground or vertical evacuation structures."
    );
  }

  if (landslidePresent) {
    responses.push(
      "Review slope conditions and undertake site-specific geotechnical assessment before detailed development."
    );

    responses.push(
      "Avoid concentrating additional runoff toward potentially unstable slopes."
    );
  }

  if (
    landslidePresent &&
    slopingTerrain
  ) {
    responses.push(
      "Minimize unnecessary cut-and-fill and avoid directing concentrated runoff toward steeper terrain."
    );
  }

  if (
    landslidePresent &&
    steepTerrain
  ) {
    responses.push(
      "Require site-specific geotechnical review before finalizing grading or foundation design."
    );
  }

  if (
    mappedHazardCount === 0 &&
    runoffChangePercent <= 0
  ) {
    responses.push(
      "Continue site-specific review and verify local physical conditions before detailed planning."
    );
  }

  /*
  * ==========================================================
  * PRIMARY ASSESSMENT
  * Prioritize compound site conditions, then individual hazards
  * ==========================================================
  */

  let status: PlanningAssessment["status"] = "low";

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

  /*
  * ----------------------------------------------------------
  * 1. LANDSLIDE + STEEP TERRAIN
  * Strong spatial interaction: mapped hazard + terrain evidence
  * ----------------------------------------------------------
  */

  if (
    landslidePresent &&
    steepTerrain &&
    terrain
  ) {
    status = "review";

    headline =
      floodPresent || tsunamiPresent
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

  /*
  * ----------------------------------------------------------
  * 2. TSUNAMI + VERY LOW / LOW TERRAIN
  * ----------------------------------------------------------
  */

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

  /*
  * ----------------------------------------------------------
  * 3. FLOOD + LOW/FLAT TERRAIN + RUNOFF INCREASE
  * ----------------------------------------------------------
  */

  else if (
    floodPresent &&
    runoffChangePercent > 10 &&
    lowLying &&
    flatTerrain &&
    terrain
  ) {
    status = "attention";

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

  /*
  * ----------------------------------------------------------
  * 4. FLOOD + LANDSLIDE ON SLOPING TERRAIN
  * ----------------------------------------------------------
  */

  else if (
    floodPresent &&
    landslidePresent &&
    slopingTerrain &&
    terrain
  ) {
    status = "review";

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

  /*
  * ----------------------------------------------------------
  * 5. FLOOD + TSUNAMI
  * ----------------------------------------------------------
  */

  else if (
    floodPresent &&
    tsunamiPresent
  ) {
    status = "review";

    headline =
      "Flood-sensitive development with tsunami exposure";

    primaryConcern =
      "Stormwater management and evacuation exposure";

    recommendedAction =
      "Reduce development-induced runoff while separately reviewing evacuation access and site suitability for tsunami exposure.";

    summary =
      `The ${formatArea(
        projectAreaM2
      )} proposed footprint contains mapped flood and tsunami hazard values. Stormwater and tsunami exposure require different planning responses.`;
  }

  /*
  * ----------------------------------------------------------
  * 6. GENERIC MULTI-HAZARD
  * ----------------------------------------------------------
  */

  else if (mappedHazardCount >= 2) {
    status = "review";

    const hazardNames = [
      floodPresent && "flood",
      tsunamiPresent && "tsunami",
      landslidePresent && "landslide",
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

  /*
  * ----------------------------------------------------------
  * 7. TSUNAMI ONLY
  * ----------------------------------------------------------
  */

  else if (tsunamiPresent) {
    status = "review";

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

  /*
  * ----------------------------------------------------------
  * 8. FLOOD + RUNOFF INCREASE
  * ----------------------------------------------------------
  */

  else if (
    floodPresent &&
    runoffChangePercent > 10
  ) {
    status = "attention";

    headline =
      "Development may amplify runoff in a mapped flood-hazard area";

    summary =
      `The proposed design increases comparative runoff pressure by ${runoffChangePercent.toFixed(
        1
      )}% while mapped flood-hazard values are already present within the footprint.`;

    primaryConcern =
      "Increased runoff within flood-sensitive context";

    recommendedAction =
      "Reduce paved or sealed surfaces and strengthen infiltration or retention measures.";
  }

  /*
  * ----------------------------------------------------------
  * 9. LANDSLIDE ONLY
  * ----------------------------------------------------------
  */

  else if (landslidePresent) {
    status = "review";

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

  /*
  * ----------------------------------------------------------
  * 10. TERRAIN ONLY
  * ----------------------------------------------------------
  */

  else if (
    mappedHazardCount === 0 &&
    steepTerrain &&
    terrain
  ) {
    status = "review";

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

  /*
  * ----------------------------------------------------------
  * 11. RUNOFF CHANGE WITHOUT MAPPED HAZARD
  * ----------------------------------------------------------
  */

  else if (runoffChangePercent > 10) {
    status = "attention";

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

    headline,
    summary,

    primaryConcern,
    recommendedAction,

    hazard,
    change,
    consequence,

    evidence,

    responses: [...new Set(responses)],
  };
}