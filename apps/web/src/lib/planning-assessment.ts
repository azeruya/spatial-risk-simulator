import type {
  FootprintHazardAnalysis,
  FootprintHazards,
  PlanningAssessment,
} from "@/types/simulation";

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

  if (landslidePresent) {
    consequence.push(
      "Development within mapped landslide-hazard context may require closer review of slope stability, drainage direction, and ground conditions."
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
      "Reduce impervious coverage where practical and preserve infiltration capacity."
    );

    responses.push(
      "Consider permeable paving, vegetated drainage, rain gardens, or on-site retention to manage development-induced runoff."
    );
  }

  if (tsunamiPresent) {
    responses.push(
      "Review site placement, evacuation access, vertical evacuation options, and the suitability of the proposed occupancy for the mapped tsunami context."
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
   * The compact answer shown at the top of ImpactPanel
   * ==========================================================
   */

  let status: PlanningAssessment["status"] =
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

  /*
   * Multiple hazards
   */

  if (mappedHazardCount >= 2) {
    status = "review";

    headline =
      "Multiple hazards affect the proposed site";

    const hazardNames = [
      floodPresent && "flood",
      tsunamiPresent && "tsunami",
      landslidePresent && "landslide",
    ].filter(Boolean);

    summary =
      `The ${formatArea(
        projectAreaM2
      )} proposed footprint contains mapped ${hazardNames.join(
        " and "
      )} hazard values. These hazards require different planning responses and should not be treated as a single risk.`;

    if (
      floodPresent &&
      tsunamiPresent
    ) {
      primaryConcern =
        "Flood-sensitive development and tsunami exposure";

      recommendedAction =
        "Reduce development-induced runoff while separately reviewing evacuation access and site suitability for tsunami exposure.";
    } else if (
      floodPresent &&
      landslidePresent
    ) {
      primaryConcern =
        "Runoff-sensitive development and slope stability";

      recommendedAction =
        "Control runoff and drainage while reviewing slope stability and geotechnical conditions.";
    } else {
      primaryConcern =
        "Multiple mapped hazard conditions";

      recommendedAction =
        "Review each mapped hazard separately and apply hazard-specific planning controls.";
    }
  }

  /*
   * Tsunami only
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
   * Flood + substantial runoff increase
   */

  else if (
    floodPresent &&
    runoffChangePercent > 10
  ) {
    status = "attention";

    headline =
      "Development may amplify runoff in a mapped flood-hazard area";

    summary =
      `The proposed design increases relative runoff pressure by ${runoffChangePercent.toFixed(
        1
      )}% while mapped flood-hazard values are already present within the footprint.`;

    primaryConcern =
      "Increased runoff within flood-sensitive context";

    recommendedAction =
      "Reduce impervious coverage and strengthen infiltration or retention measures.";
  }

  /*
   * Flood only
   */

  else if (floodPresent) {
    status = "attention";

    headline =
      "Mapped flood hazard is present within the proposed footprint";

    summary =
      `Flood-hazard values are present within the ${formatArea(
        projectAreaM2
      )} proposed footprint.`;

    primaryConcern =
      "Stormwater and drainage performance";

    recommendedAction =
      "Preserve infiltration capacity and review site drainage before detailed planning.";
  }

  /*
   * Landslide only
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
   * No mapped hazard but runoff worsens
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
      "Reduce impervious coverage or introduce mitigation measures that improve infiltration and retention.";
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