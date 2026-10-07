export type SimulationInput = {
  // Context from Risk / baseline APIs
  baselinePopulation: number | null;
  floodHazardAverage: number | null;

  // Proposed development
  projectAreaHa: number;
  imperviousPercent: number;
  greenPercent: number;
  additionalPopulation: number;

  // Current-site assumptions for MVP
  baselineImperviousPercent: number;
  baselineGreenPercent: number;
};

export type SimulationResult = {
  // Land allocation
  projectAreaHa: number;

  baselineImperviousAreaHa: number;
  scenarioImperviousAreaHa: number;

  baselineGreenAreaHa: number;
  scenarioGreenAreaHa: number;

  imperviousChangeHa: number;
  greenChangeHa: number;

  // Runoff
  baselineRunoffCoefficient: number;
  scenarioRunoffCoefficient: number;

  baselineRunoffPressure: number;
  scenarioRunoffPressure: number;

  runoffChangePercent: number;

  // Exposure
  baselinePopulation: number | null;
  scenarioPopulation: number | null;
  populationChange: number;

  // Interpretation
  runoffDirection:
    | "lower"
    | "similar"
    | "higher";

  impactLevel:
    | "low"
    | "moderate"
    | "high";
};

export function simulateDevelopment(
  input: SimulationInput
): SimulationResult {
  const {
    baselinePopulation,
    floodHazardAverage,
    projectAreaHa,
    imperviousPercent,
    greenPercent,
    additionalPopulation,
    baselineImperviousPercent,
    baselineGreenPercent,
  } = input;

  /*
   * Convert percentages into actual hectares.
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

  /*
   * Simplified runoff coefficients.
   *
   * Impervious surfaces contribute strongly
   * to runoff.
   *
   * Green/open surfaces contribute less.
   *
   * Remaining land gets an intermediate value.
   *
   * These are scenario-model assumptions,
   * NOT a hydraulic flood model.
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
   * Existing mapped flood hazard acts as
   * contextual sensitivity.
   *
   * If no flood value exists, use 0.5 only
   * as a neutral model context, but the UI
   * should disclose that mapped hazard data
   * was unavailable.
   */
  const floodContext =
    floodHazardAverage ?? 0.5;

  /*
   * Normalized scenario pressure index.
   *
   * This is NOT flood probability or depth.
   *
   * It is useful for relative comparison:
   * baseline vs proposed scenario.
   */
  const baselineRunoffPressure =
    baselineRunoffCoefficient *
    (0.5 + floodContext * 0.5);

  const scenarioRunoffPressure =
    scenarioRunoffCoefficient *
    (0.5 + floodContext * 0.5);

  const runoffChangePercent =
    baselineRunoffPressure > 0
      ? ((scenarioRunoffPressure -
          baselineRunoffPressure) /
          baselineRunoffPressure) *
        100
      : 0;

  const scenarioPopulation =
    baselinePopulation !== null
      ? baselinePopulation +
        additionalPopulation
      : null;

  const runoffDirection =
    runoffChangePercent > 5
      ? "higher"
      : runoffChangePercent < -5
        ? "lower"
        : "similar";

  const impactLevel =
    classifyImpact(
      runoffChangePercent,
      additionalPopulation,
      floodContext
    );

  return {
    projectAreaHa,

    baselineImperviousAreaHa,
    scenarioImperviousAreaHa,

    baselineGreenAreaHa,
    scenarioGreenAreaHa,

    imperviousChangeHa,
    greenChangeHa,

    baselineRunoffCoefficient,
    scenarioRunoffCoefficient,

    baselineRunoffPressure,
    scenarioRunoffPressure,

    runoffChangePercent,

    baselinePopulation,
    scenarioPopulation,
    populationChange:
      additionalPopulation,

    runoffDirection,
    impactLevel,
  };
}

function calculateRunoffCoefficient(
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

  /*
   * Simplified coefficients:
   *
   * impervious = 0.90
   * green      = 0.20
   * other      = 0.45
   */
  return (
    (safeImpervious / 100) * 0.9 +
    (safeGreen / 100) * 0.2 +
    (otherPercent / 100) * 0.45
  );
}

function classifyImpact(
  runoffChangePercent: number,
  additionalPopulation: number,
  floodContext: number
): "low" | "moderate" | "high" {
  let score = 0;

  if (runoffChangePercent >= 25) {
    score += 2;
  } else if (runoffChangePercent >= 10) {
    score += 1;
  }

  if (additionalPopulation >= 2000) {
    score += 2;
  } else if (additionalPopulation >= 500) {
    score += 1;
  }

  if (floodContext >= 0.66) {
    score += 2;
  } else if (floodContext >= 0.33) {
    score += 1;
  }

  if (score >= 5) {
    return "high";
  }

  if (score >= 2) {
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