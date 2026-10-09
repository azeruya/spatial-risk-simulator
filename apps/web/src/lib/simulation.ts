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
   * Mitigation
   */

  mitigationFactor: number;

  mitigatedRunoffPressure: number;
  mitigationReductionPercent: number;

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
  impervious: 0.9,
  green: 0.2,
  other: 0.45,
} as const;

/*
 * Approximate effectiveness assumptions for the
 * simplified mitigation model.
 */
export const MITIGATION_EFFECTIVENESS = {
  permeableSurface: 0.35,
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
   * Simplified mitigation model:
   *
   * mitigationFactor =
   *
   * (1 - permeableTreatment × 0.35)
   * ×
   * (1 - greenInfrastructure × 0.25)
   * ×
   * (1 - retentionFactor)
   *
   * The coefficients are scenario assumptions and should
   * be visible to the user through the methodology panel.
   */

  const permeableTreatment = clamp(
    mitigation.permeableSurfacePercent /
      100,
    0,
    1
  );

  const greenInfrastructureTreatment =
    clamp(
      mitigation.greenInfrastructurePercent /
        100,
      0,
      1
    );

  const retentionFactor = clamp(
    mitigation.retentionFactor,
    0,
    1
  );

  const mitigationFactor =
    (1 -
      permeableTreatment *
        MITIGATION_EFFECTIVENESS.permeableSurface) *
    (1 -
      greenInfrastructureTreatment *
        MITIGATION_EFFECTIVENESS.greenInfrastructure) *
    (1 - retentionFactor);

  const mitigatedRunoffPressure =
    scenarioRunoffPressure *
    mitigationFactor;

  const mitigationReductionPercent =
    scenarioRunoffPressure > 0
      ? ((scenarioRunoffPressure -
          mitigatedRunoffPressure) /
          scenarioRunoffPressure) *
        100
      : 0;

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