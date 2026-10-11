export type MitigationInput = {
  /**
   * Percent of paved / impervious surface treated
   * with permeable materials.
   */
  permeableSurfacePercent: number;

  /**
   * Relative coverage/intensity of green infrastructure
   * such as rain gardens, bioswales, or vegetated drainage.
   */
  greenInfrastructurePercent: number;

  /**
   * 0–1 fractional reduction representing retention/storage.
   *
   * Example:
   * 0.10 = 10% runoff reduction
   * 0.25 = 25% runoff reduction
   */
  retentionFactor: number;
};

export type SimulationInput = {
  baselinePopulation: number | null;

  projectAreaHa: number;

  imperviousPercent: number;
  greenPercent: number;

  additionalPopulation: number;

  baselineImperviousPercent: number;
  baselineGreenPercent: number;

  mitigation: MitigationInput;
};

export type SimulationResult = {
  /*
   * --------------------------------
   * Land allocation
   * --------------------------------
   */

  projectAreaHa: number;

  baselineImperviousAreaHa: number;
  scenarioImperviousAreaHa: number;

  baselineGreenAreaHa: number;
  scenarioGreenAreaHa: number;

  imperviousChangeHa: number;
  greenChangeHa: number;

  baselineOtherPercent: number;
  scenarioOtherPercent: number;

  /*
   * --------------------------------
   * Runoff model
   * --------------------------------
   */

  baselineRunoffCoefficient: number;
  scenarioRunoffCoefficient: number;

  baselineRunoffPressure: number;
  scenarioRunoffPressure: number;

  runoffChangePercent: number;

  /*
  * --------------------------------
  * Mitigation
  * --------------------------------
  */

  /**
   * Portion of the total project site
   * converted from conventional impervious
   * surface to permeable treatment.
   */
  permeableTreatedSitePercent: number;

  /**
   * Conventional impervious surface remaining
   * after permeable replacement.
   */
  remainingImperviousPercent: number;

  /**
   * Runoff tendency after replacing part of
   * the impervious surface with permeable material.
   */
  runoffAfterPermeableTreatment: number;

  /**
   * Runoff tendency after green infrastructure
   * is applied.
   */
  runoffAfterGreenInfrastructure: number;

  /**
   * Final runoff tendency after retention/storage.
   */
  mitigatedRunoffPressure: number;

  /**
   * Contribution of each intervention relative
   * to the original proposed scenario.
   */
  permeableReductionPercent: number;
  greenInfrastructureReductionPercent: number;
  retentionReductionPercent: number;

  /**
   * Overall reduction:
   * proposed → mitigated.
   */
  mitigationReductionPercent: number;

  /**
   * Kept for backwards compatibility.
   */
  mitigationFactor: number;

  /*
   * --------------------------------
   * Exposure
   * --------------------------------
   */

  baselinePopulation: number | null;
  scenarioPopulation: number | null;
  populationChange: number;

  /*
   * --------------------------------
   * Interpretation
   * --------------------------------
   */

  runoffDirection:
    | "lower"
    | "similar"
    | "higher";

  impactLevel:
    | "low"
    | "moderate"
    | "high";
};

/*
 * ============================================================
 * Model assumptions
 * ============================================================
 *
 * These are simplified scenario coefficients used for
 * comparative planning analysis.
 *
 * They are NOT calibrated flood-model parameters.
 */

export const RUNOFF_COEFFICIENTS = {
  /**
   * Conventional hard surface:
   * roofs, asphalt, concrete.
   */
  impervious: 0.9,

  /**
   * Vegetated / open surface.
   */
  green: 0.2,

  /**
   * Intermediate / unspecified surface.
   */
  other: 0.45,

  /**
   * Simplified MVP assumption for an
   * impervious surface converted to
   * permeable treatment.
   *
   * This is a comparative assumption,
   * not a calibrated hydrologic value.
   */
  permeable: 0.45,
} as const;

/*
 * Approximate effectiveness assumptions for the
 * simplified mitigation model.
 */
export const MITIGATION_EFFECTIVENESS = {
  /**
   * Fractional reduction applied to the
   * runoff tendency remaining after
   * permeable replacement.
   *
   * Example:
   * 20% GI × 0.25 effectiveness
   * = 5% reduction of remaining tendency.
   */
  greenInfrastructure: 0.25,
} as const;

export function simulateDevelopment(
  input: SimulationInput
): SimulationResult {
  const {
    baselinePopulation,

    projectAreaHa,

    imperviousPercent,
    greenPercent,

    additionalPopulation,

    baselineImperviousPercent,
    baselineGreenPercent,

    mitigation,
  } = input;

  /*
   * ============================================================
   * 1. LAND ALLOCATION
   * ============================================================
   */

  const baselineImperviousAreaHa =
    projectAreaHa *
    (baselineImperviousPercent / 100);

  const scenarioImperviousAreaHa =
    projectAreaHa *
    (imperviousPercent / 100);

  const baselineGreenAreaHa =
    projectAreaHa *
    (baselineGreenPercent / 100);

  const scenarioGreenAreaHa =
    projectAreaHa *
    (greenPercent / 100);

  const imperviousChangeHa =
    scenarioImperviousAreaHa -
    baselineImperviousAreaHa;

  const greenChangeHa =
    scenarioGreenAreaHa -
    baselineGreenAreaHa;

  const baselineOtherPercent = Math.max(
    0,
    100 -
      baselineImperviousPercent -
      baselineGreenPercent
  );

  const scenarioOtherPercent = Math.max(
    0,
    100 -
      imperviousPercent -
      greenPercent
  );

  /*
   * ============================================================
   * 2. SURFACE RUNOFF TENDENCY
   * ============================================================
   *
   * Weighted runoff coefficient:
   *
   * C =
   *   imperviousShare × 0.90
   * + greenShare      × 0.20
   * + otherShare      × 0.45
   *
   * Larger values represent a surface configuration
   * more likely to convert rainfall into surface runoff.
   *
   * This is a comparative planning indicator,
   * NOT predicted flood depth or probability.
   */

  const baselineRunoffCoefficient =
    calculateRunoffCoefficient(
      baselineImperviousPercent,
      baselineGreenPercent
    );

  const scenarioRunoffCoefficient =
    calculateRunoffCoefficient(
      imperviousPercent,
      greenPercent
    );

  /*
   * For the MVP, runoff pressure is simply the normalized
   * runoff tendency produced by the land-cover configuration.
   *
   * Hazard context is deliberately NOT included here.
   * Hazard is combined with this result later in
   * planning-assessment.ts.
   */

  const baselineRunoffPressure =
    baselineRunoffCoefficient;

  const scenarioRunoffPressure =
    scenarioRunoffCoefficient;

  /*
   * ============================================================
   * 3. DEVELOPMENT-INDUCED CHANGE
   * ============================================================
   */

  const runoffChangePercent =
    baselineRunoffPressure > 0
      ? ((scenarioRunoffPressure -
          baselineRunoffPressure) /
          baselineRunoffPressure) *
        100
      : 0;

  /*
  * ============================================================
  * 4. MITIGATION
  * ============================================================
  *
  * Mitigation is applied sequentially:
  *
  * Proposed surface
  *   ↓
  * 1. Permeable replacement
  *   ↓
  * 2. Green infrastructure
  *   ↓
  * 3. Retention / storage
  *   ↓
  * Mitigated runoff tendency
  *
  * This makes each intervention explainable
  * instead of combining everything into one
  * opaque multiplier.
  */

  /*
  * ------------------------------------------------------------
  * 4A. PERMEABLE REPLACEMENT
  * ------------------------------------------------------------
  *
  * permeableSurfacePercent means:
  *
  * "What percentage of the proposed conventional
  * impervious area is replaced with permeable treatment?"
  *
  * Example:
  *
  * Impervious = 60%
  * Permeable replacement = 20%
  *
  * Treated site share:
  * 60% × 20% = 12% of total site
  *
  * Remaining conventional impervious:
  * 60% - 12% = 48%
  */

  const permeableTreatmentRate = clamp(
    mitigation.permeableSurfacePercent / 100,
    0,
    1
  );

  const permeableTreatedSitePercent =
    imperviousPercent *
    permeableTreatmentRate;

  const remainingImperviousPercent =
    Math.max(
      0,
      imperviousPercent -
        permeableTreatedSitePercent
    );

  /*
  * Green and other land remain unchanged.
  */
  const mitigatedOtherPercent =
    Math.max(
      0,
      100 -
        imperviousPercent -
        greenPercent
    );

  /*
  * Calculate surface runoff tendency after
  * conventional impervious surface has been
  * partially converted to permeable treatment.
  */

  const runoffAfterPermeableTreatment =
    (remainingImperviousPercent / 100) *
      RUNOFF_COEFFICIENTS.impervious +
    (permeableTreatedSitePercent / 100) *
      RUNOFF_COEFFICIENTS.permeable +
    (greenPercent / 100) *
      RUNOFF_COEFFICIENTS.green +
    (mitigatedOtherPercent / 100) *
      RUNOFF_COEFFICIENTS.other;

  /*
  * Reduction attributable specifically
  * to permeable replacement.
  */

  const permeableReductionPercent =
    scenarioRunoffPressure > 0
      ? ((scenarioRunoffPressure -
          runoffAfterPermeableTreatment) /
          scenarioRunoffPressure) *
        100
      : 0;

  /*
  * ------------------------------------------------------------
  * 4B. GREEN INFRASTRUCTURE
  * ------------------------------------------------------------
  *
  * Green infrastructure is treated as a site-level
  * runoff-management intervention rather than as
  * additional land-cover allocation.
  *
  * This avoids incorrectly claiming that we know
  * where rain gardens / bioswales are physically located.
  */

  const greenInfrastructureTreatment =
    clamp(
      mitigation.greenInfrastructurePercent /
        100,
      0,
      1
    );

  const greenInfrastructureFactor =
    1 -
    greenInfrastructureTreatment *
      MITIGATION_EFFECTIVENESS
        .greenInfrastructure;

  const runoffAfterGreenInfrastructure =
    runoffAfterPermeableTreatment *
    greenInfrastructureFactor;

  /*
  * Contribution of GI relative to the
  * original proposed scenario.
  */

  const greenInfrastructureReductionPercent =
    scenarioRunoffPressure > 0
      ? ((runoffAfterPermeableTreatment -
          runoffAfterGreenInfrastructure) /
          scenarioRunoffPressure) *
        100
      : 0;

  /*
  * ------------------------------------------------------------
  * 4C. RETENTION / STORAGE
  * ------------------------------------------------------------
  *
  * retentionFactor comes from the selected
  * retention level:
  *
  * none     = 0
  * low      = 0.10
  * moderate = 0.20
  * high     = 0.30
  */

  const retentionFactor = clamp(
    mitigation.retentionFactor,
    0,
    1
  );

  const mitigatedRunoffPressure =
    runoffAfterGreenInfrastructure *
    (1 - retentionFactor);

  const retentionReductionPercent =
    scenarioRunoffPressure > 0
      ? ((runoffAfterGreenInfrastructure -
          mitigatedRunoffPressure) /
          scenarioRunoffPressure) *
        100
      : 0;

  /*
  * ------------------------------------------------------------
  * TOTAL MITIGATION EFFECT
  * ------------------------------------------------------------
  */

  const mitigationReductionPercent =
    scenarioRunoffPressure > 0
      ? ((scenarioRunoffPressure -
          mitigatedRunoffPressure) /
          scenarioRunoffPressure) *
        100
      : 0;

  /*
  * Retained so existing UI code does not break.
  */
  const mitigationFactor =
    scenarioRunoffPressure > 0
      ? mitigatedRunoffPressure /
        scenarioRunoffPressure
      : 1;

  /*
   * ============================================================
   * 5. POPULATION EXPOSURE
   * ============================================================
   */

  const scenarioPopulation =
    baselinePopulation !== null
      ? baselinePopulation +
        additionalPopulation
      : null;

  /*
   * ============================================================
   * 6. SIMPLE INTERPRETATION
   * ============================================================
   */

  const runoffDirection =
    runoffChangePercent > 5
      ? "higher"
      : runoffChangePercent < -5
        ? "lower"
        : "similar";

  const impactLevel =
    classifyRunoffImpact(
      runoffChangePercent
    );

  return {
    projectAreaHa,

    baselineImperviousAreaHa,
    scenarioImperviousAreaHa,

    baselineGreenAreaHa,
    scenarioGreenAreaHa,

    imperviousChangeHa,
    greenChangeHa,

    baselineOtherPercent,
    scenarioOtherPercent,

    baselineRunoffCoefficient,
    scenarioRunoffCoefficient,

    baselineRunoffPressure,
    scenarioRunoffPressure,

    runoffChangePercent,

    permeableTreatedSitePercent,
    remainingImperviousPercent,

    runoffAfterPermeableTreatment,
    runoffAfterGreenInfrastructure,

    permeableReductionPercent,
    greenInfrastructureReductionPercent,
    retentionReductionPercent,

    mitigationFactor,
    mitigatedRunoffPressure,
    mitigationReductionPercent,

    baselinePopulation,
    scenarioPopulation,
    populationChange:
      additionalPopulation,

    runoffDirection,
    impactLevel,
  };
}

/*
 * ============================================================
 * Weighted surface runoff coefficient
 * ============================================================
 */

export function calculateRunoffCoefficient(
  imperviousPercent: number,
  greenPercent: number
) {
  const safeImpervious = clamp(
    imperviousPercent,
    0,
    100
  );

  const safeGreen = clamp(
    greenPercent,
    0,
    100 - safeImpervious
  );

  const otherPercent =
    100 -
    safeImpervious -
    safeGreen;

  return (
    (safeImpervious / 100) *
      RUNOFF_COEFFICIENTS.impervious +
    (safeGreen / 100) *
      RUNOFF_COEFFICIENTS.green +
    (otherPercent / 100) *
      RUNOFF_COEFFICIENTS.other
  );
}

/*
 * This classification is based ONLY on the magnitude
 * of development-induced runoff change.
 *
 * Hazard severity is assessed separately in
 * planning-assessment.ts.
 */

function classifyRunoffImpact(
  runoffChangePercent: number
): "low" | "moderate" | "high" {
  const absoluteChange = Math.abs(
    runoffChangePercent
  );

  if (absoluteChange >= 25) {
    return "high";
  }

  if (absoluteChange >= 10) {
    return "moderate";
  }

  return "low";
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    Math.max(value, min),
    max
  );
}