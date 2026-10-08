export type SimulationInput = {
  baselinePopulation: number | null;
  floodHazardAverage: number | null;

  projectAreaHa: number;
  imperviousPercent: number;
  greenPercent: number;
  additionalPopulation: number;

  baselineImperviousPercent: number;
  baselineGreenPercent: number;

  mitigation: MitigationInput;
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

  mitigatedRunoffPressure: number;
  mitigationReductionPercent: number;
};

export type MitigationInput = {
  permeableSurfacePercent: number;
  greenInfrastructurePercent: number;
  retentionFactor: number;
};

export type ScenarioInterpretation = {
  headline: string;
  summary: string;
  drivers: string[];
  recommendation: string;
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
    mitigation,   
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

  const permeableReduction =
    mitigation.permeableSurfacePercent / 100;

  const greenReduction =
    mitigation.greenInfrastructurePercent / 100;

  const effectiveScenarioRunoffCoefficient =
    scenarioRunoffCoefficient *
    (1 - permeableReduction * 0.35) *
    (1 - greenReduction * 0.25);

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

  const mitigatedRunoffPressure =
    effectiveScenarioRunoffCoefficient *
    (0.5 + floodContext * 0.5) *
    (1 - mitigation.retentionFactor);

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

  const mitigationReductionPercent =
    scenarioRunoffPressure > 0
      ? ((scenarioRunoffPressure -
          mitigatedRunoffPressure) /
          scenarioRunoffPressure) *
        100
      : 0;

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

    mitigatedRunoffPressure,
    mitigationReductionPercent,
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

export function generateScenarioInterpretation(
  simulation: SimulationResult,
  input: SimulationInput
): ScenarioInterpretation {
  const imperviousChange =
    input.imperviousPercent -
    input.baselineImperviousPercent;

  const greenChange =
    input.greenPercent -
    input.baselineGreenPercent;

  const floodHazard =
    input.floodHazardAverage;

  const drivers: string[] = [];

  if (imperviousChange > 5) {
    drivers.push(
      `Impervious surface increases by ${imperviousChange.toFixed(
        0
      )} percentage points, reducing the area available for rainfall infiltration.`
    );
  }

  if (greenChange < -5) {
    drivers.push(
      `Green and open space decreases by ${Math.abs(
        greenChange
      ).toFixed(
        0
      )} percentage points, reducing vegetation and permeable surface within the development footprint.`
    );
  }

  if (input.additionalPopulation > 0) {
    drivers.push(
      `The proposal introduces approximately ${input.additionalPopulation.toLocaleString()} additional occupants within the surrounding hazard context.`
    );
  }

  if (
    floodHazard !== null &&
    floodHazard >= 0.33
  ) {
    drivers.push(
      "The selected area already contains mapped flood hazard, so additional runoff may place greater pressure on local drainage and flood-management capacity."
    );
  }

  let headline: string;

  if (simulation.runoffChangePercent >= 25) {
    headline =
      "Development substantially increases runoff pressure";
  } else if (
    simulation.runoffChangePercent >= 10
  ) {
    headline =
      "Development moderately increases runoff pressure";
  } else if (
    simulation.runoffChangePercent > 5
  ) {
    headline =
      "Development slightly increases runoff pressure";
  } else if (
    simulation.runoffChangePercent < -5
  ) {
    headline =
      "Development reduces runoff pressure";
  } else {
    headline =
      "Development has limited effect on runoff pressure";
  }

  const summary =
    simulation.runoffDirection === "higher"
      ? `The proposed scenario increases relative runoff pressure by ${simulation.runoffChangePercent.toFixed(
          1
        )}% compared with the baseline scenario. Increased impervious coverage means more rainfall is expected to become surface runoff rather than infiltrating into the ground.`
      : simulation.runoffDirection === "lower"
        ? `The proposed scenario reduces relative runoff pressure by ${Math.abs(
            simulation.runoffChangePercent
          ).toFixed(
            1
          )}% compared with the baseline scenario, mainly because the proposed land mix provides more permeable or vegetated surface.`
        : "The proposed scenario produces little change in relative runoff pressure compared with the baseline scenario.";

  let recommendation: string;

  if (
    simulation.mitigationReductionPercent >= 15
  ) {
    recommendation =
      `The selected mitigation measures reduce scenario runoff pressure by ${simulation.mitigationReductionPercent.toFixed(
        1
      )}%. Maintaining these measures would improve the development's stormwater performance.`;
  } else if (
    simulation.runoffDirection === "higher"
  ) {
    recommendation =
      "Consider increasing permeable surfaces, green infrastructure, or retention capacity to offset the increase in runoff pressure.";
  } else {
    recommendation =
      "Maintain the current balance of permeable and green surfaces and review site-specific drainage requirements before implementation.";
  }

  return {
    headline,
    summary,
    drivers,
    recommendation,
  };
}