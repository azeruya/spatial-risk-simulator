"use client";

import type { SimulationBaseline } from "@/types/simulation";
import { ScenarioInterpretation, SimulationResult, } from "@/lib/simulation";
import { RetentionLevel } from "./ScenarioPanel";

type FootprintHazards = {
  flood: FootprintHazardAnalysis | null;
  tsunami: FootprintHazardAnalysis | null;
  landslide: FootprintHazardAnalysis | null;
};

type ImpactPanelProps = {
  projectAreaHa: number;
  imperviousPercent: number;
  greenPercent: number;
  additionalPopulation: number;

  baseline: SimulationBaseline;
  simulation: SimulationResult;

  permeableSurfacePercent: number;
  greenInfrastructurePercent: number;
  retentionLevel: RetentionLevel;

  interpretation: ScenarioInterpretation;

  footprintHazards: FootprintHazards;
  footprintHazardsLoading: boolean;
};

type FootprintHazardAnalysis = {
  average: number | null;
  maximum: number | null;
  validSamples: number;
  totalSamples: number;
  coveragePercent: number;
};

export default function ImpactPanel({
  projectAreaHa,
  imperviousPercent,
  greenPercent,
  additionalPopulation,

  baseline,
  simulation,

  permeableSurfacePercent,
  greenInfrastructurePercent,
  retentionLevel,

  interpretation,

  footprintHazards,
  footprintHazardsLoading,
}: ImpactPanelProps) {
  const imperviousAreaHa =
    projectAreaHa * (imperviousPercent / 100);

  const greenAreaHa =
    projectAreaHa * (greenPercent / 100);

  const remainingAreaHa = Math.max(
    0,
    projectAreaHa -
      imperviousAreaHa -
      greenAreaHa
  );

  const scenarioPopulation =
  baseline?.population !== null &&
  baseline?.population !== undefined
    ? baseline.population +
      additionalPopulation
    : null;

  return (
    <aside className="overflow-y-auto border-l border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Scenario impact
          </p>

          <p className="mt-1 text-sm font-medium text-slate-900">
            Live development footprint
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700">
          Live
        </span>
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Baseline context
        </p>

        {baseline.status === "idle" && (
          <div className="mt-2 rounded-xl border border-dashed border-slate-300 p-3">
          <p className="text-xs text-slate-500">
              Select a site on the map to load baseline conditions.
          </p>
          </div>
        )}

        {baseline.status === "loading" && (
          <div className="mt-2 rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500">
              Loading site context...
          </p>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-slate-300" />
          </div>
          </div>
        )}

        {baseline.status === "success" && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <MetricCard
              label="Population · 500 m"
              value={
              baseline.population !== null
                ? Math.round(
                    baseline.population
                ).toLocaleString()
                : "—"
              }
            />

            <MetricCard
              label="Density"
              value={
              baseline.populationDensity !==
              null
                ? `${Math.round(
                    baseline.populationDensity
                ).toLocaleString()}/km²`
                : "—"
              }
            />

            <MetricCard
              label="Flood avg."
              value={
              baseline.floodAverage !== null
                ? baseline.floodAverage.toFixed(
                    3
                )
                : "No data"
              }
            />

            <MetricCard
              label="Flood max."
              value={
              baseline.floodMaximum !== null
                ? baseline.floodMaximum.toFixed(
                    3
                )
                : "No data"
              }
            />
            </div>
        )}

        {baseline.status === "error" && (
          <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
          <p className="text-xs text-amber-700">
            Baseline context temporarily unavailable.
          </p>
          </div>
        )}
        </div>

      <div className="mt-5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Proposed site
        </p>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <MetricCard
            label="Project area"
            value={formatProjectArea(projectAreaHa)}
          />

          <MetricCard
            label="New occupants"
            value={`+${additionalPopulation.toLocaleString()}`}
          />

          <MetricCard
            label="Impervious"
            value={formatProjectArea(imperviousAreaHa)}
          />

          <MetricCard
            label="Green space"
            value={formatProjectArea(greenAreaHa)}
          />
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Land allocation
        </p>

        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex h-4 w-full">
            <div
              className="bg-slate-700 transition-all duration-300"
              style={{
                width: `${imperviousPercent}%`,
              }}
            />

            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{
                width: `${greenPercent}%`,
              }}
            />

            <div
              className="bg-slate-200 transition-all duration-300"
              style={{
                width: `${Math.max(
                  0,
                  100 -
                    imperviousPercent -
                    greenPercent
                )}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 p-3">
            <AllocationItem
              label="Impervious"
              value={`${imperviousPercent}%`}
            />

            <AllocationItem
              label="Green"
              value={`${greenPercent}%`}
            />

            <AllocationItem
              label="Other"
              value={`${Math.max(
                0,
                100 -
                  imperviousPercent -
                  greenPercent
              )}%`}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Site hazard overlap
        </p>

        <div className="mt-3 space-y-2">
          {(["flood", "tsunami", "landslide"] as const).map(
            (hazardKey) => {
              const hazard = footprintHazards[hazardKey];

              const label = {
                flood: "Flood",
                tsunami: "Tsunami",
                landslide: "Landslide",
              }[hazardKey];

              return (
                <div
                  key={hazardKey}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">
                      {label} hazard
                    </p>

                    {footprintHazardsLoading && (
                      <span className="text-[10px] text-slate-400">
                        Analysing…
                      </span>
                    )}
                  </div>

                  {!footprintHazardsLoading && hazard ? (
                    <>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-[10px] uppercase text-slate-400">
                            Coverage
                          </p>
                          <p className="mt-1 text-sm font-semibold">
                            {hazard.coveragePercent.toFixed(0)}%
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase text-slate-400">
                            Average
                          </p>
                          <p className="mt-1 text-sm font-semibold">
                            {hazard.average !== null
                              ? hazard.average.toFixed(3)
                              : "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase text-slate-400">
                            Maximum
                          </p>
                          <p className="mt-1 text-sm font-semibold">
                            {hazard.maximum !== null
                              ? hazard.maximum.toFixed(3)
                              : "—"}
                          </p>
                        </div>
                      </div>

                      <p className="mt-2 text-[10px] leading-4 text-slate-400">
                        {hazard.validSamples} of {hazard.totalSamples} samples
                        returned mapped data.
                      </p>
                    </>
                  ) : !footprintHazardsLoading ? (
                    <p className="mt-2 text-xs text-slate-500">
                      No mapped data returned for this footprint.
                    </p>
                  ) : null}
                </div>
              );
            }
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Simulated impact
            </p>

            <ImpactBadge level={simulation.impactLevel} />
        </div>

        <div className="mt-3 space-y-3">
            <ComparisonRow
            label="Runoff pressure"
            baseline={simulation.baselineRunoffPressure.toFixed(3)}
            scenario={simulation.scenarioRunoffPressure.toFixed(3)}
            change={`${simulation.runoffChangePercent >= 0 ? "+" : ""}${simulation.runoffChangePercent.toFixed(1)}%`}
            direction={simulation.runoffDirection}
            />

            <ComparisonRow
            label="Impervious surface"
            baseline={`${(
                (simulation.baselineImperviousAreaHa /
                simulation.projectAreaHa) *
                100
            ).toFixed(0)}%`}
            scenario={`${imperviousPercent}%`}
            change={`${imperviousPercent - 40 >= 0 ? "+" : ""}${
                imperviousPercent - 40
            } pp`}
            />

            <ComparisonRow
            label="Green / open space"
            baseline={`${(
                (simulation.baselineGreenAreaHa /
                simulation.projectAreaHa) *
                100
            ).toFixed(0)}%`}
            scenario={`${greenPercent}%`}
            change={`${greenPercent - 40 >= 0 ? "+" : ""}${
                greenPercent - 40
            } pp`}
            />

            {simulation.baselinePopulation !== null &&
            simulation.scenarioPopulation !== null && (
                <ComparisonRow
                label="Population exposure"
                baseline={Math.round(
                    simulation.baselinePopulation
                ).toLocaleString()}
                scenario={Math.round(
                    simulation.scenarioPopulation
                ).toLocaleString()}
                change={`+${simulation.populationChange.toLocaleString()}`}
                />
            )}
        </div>
        </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Scenario interpretation
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          This proposal develops{" "}
          <span className="font-semibold text-slate-900">
            {formatProjectArea(projectAreaHa)}
          </span>
          , including{" "}
          <span className="font-semibold text-slate-900">
            {formatProjectArea(imperviousAreaHa)}
          </span>{" "}
          of impervious surface and{" "}
          <span className="font-semibold text-slate-900">
            {formatProjectArea(greenAreaHa)}
          </span>{" "}
          of green or open space.
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          The proposal also introduces approximately{" "}
          <span className="font-semibold text-slate-900">
            {additionalPopulation.toLocaleString()}
          </span>{" "}
          additional occupants.
        </p>

        {remainingAreaHa > 0 && (
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Approximately{" "}
            {formatProjectArea(remainingAreaHa)} remains
            classified as other or pervious land.
          </p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Planning interpretation
        </p>

        <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
          {interpretation.headline}
        </p>

        <p className="mt-2 text-xs leading-5 text-slate-600">
          {interpretation.summary}
        </p>

        {interpretation.drivers.length > 0 && (
          <div className="mt-4 space-y-2">
            {interpretation.drivers.map(
              (driver) => (
                <div
                  key={driver}
                  className="flex gap-2 text-xs leading-5 text-slate-600"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />

                  <p>{driver}</p>
                </div>
              )
            )}
          </div>
        )}

        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Planning response
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-700">
            {interpretation.recommendation}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Key impact
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            The proposed scenario{" "}
            <span className="font-semibold text-slate-900">
              {simulation.runoffDirection === "higher"
                ? "increases"
                : simulation.runoffDirection === "lower"
                  ? "reduces"
                  : "maintains"}
            </span>{" "}
            relative runoff pressure by{" "}
            <span className="font-semibold text-slate-900">
              {Math.abs(
                simulation.runoffChangePercent
              ).toFixed(1)}%
            </span>
            .
          </p>

          {simulation.populationChange > 0 && (
            <p className="mt-2 text-sm leading-6 text-slate-700">
              It also introduces approximately{" "}
              <span className="font-semibold text-slate-900">
                {simulation.populationChange.toLocaleString()}
              </span>{" "}
              additional occupants within the surrounding hazard context.
            </p>
          )}

          <p className="mt-3 text-[10px] leading-4 text-slate-400">
            Scenario estimates are comparative planning indicators, not predictions of flood depth or probability.
          </p>
        </div>

      {scenarioPopulation !== null && (
        <div className="mt-6">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Exposure change
            </p>

            <div className="mt-2 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-[10px] text-slate-400">
                    Baseline
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-800">
                    {Math.round(
                    baseline.population ?? 0
                    ).toLocaleString()}
                </p>
                </div>

                <div className="px-3 text-slate-300">
                →
                </div>

                <div className="text-right">
                <p className="text-[10px] text-slate-400">
                    Scenario
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                    {Math.round(
                    scenarioPopulation
                    ).toLocaleString()}
                </p>
                </div>
            </div>

            <p className="mt-3 text-xs font-medium text-blue-700">
                +{additionalPopulation.toLocaleString()} occupants
            </p>
            </div>
        </div>
        )}

      <div className="mt-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Mitigation effect
        </p>

        {permeableSurfacePercent === 0 &&
        greenInfrastructurePercent === 0 &&
        retentionLevel === "none" ? (
          <div className="mt-2 rounded-xl border border-dashed border-slate-300 p-3">
            <p className="text-xs font-medium text-slate-700">
              No mitigation applied
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Adjust the mitigation controls to compare the proposed scenario with an improved design.
            </p>
          </div>
        ) : (
          <div className="mt-2">
            <ComparisonRow
              label="Runoff pressure"
              baseline={simulation.scenarioRunoffPressure.toFixed(
                3
              )}
              scenario={simulation.mitigatedRunoffPressure.toFixed(
                3
              )}
              change={`-${simulation.mitigationReductionPercent.toFixed(
                1
              )}%`}
              direction="lower"
            />
          </div>
        )}
      </div>
    </aside>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function AllocationItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function ComparisonRow({
  label,
  baseline,
  scenario,
  change,
  direction,
}: {
  label: string;
  baseline: string;
  scenario: string;
  change: string;
  direction?: "lower" | "similar" | "higher";
}) {
  const changeStyle =
    direction === "higher"
      ? "text-amber-700 bg-amber-50"
      : direction === "lower"
        ? "text-emerald-700 bg-emerald-50"
        : "text-slate-600 bg-slate-100";

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-xs font-medium text-slate-700">
        {label}
      </p>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Baseline
          </p>

          <p className="mt-1 text-lg font-semibold text-slate-800">
            {baseline}
          </p>
        </div>

        <span className="text-slate-300">
          →
        </span>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Scenario
          </p>

          <p className="mt-1 text-lg font-semibold text-slate-900">
            {scenario}
          </p>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-medium ${changeStyle}`}
        >
          {change}
        </span>
      </div>
    </div>
  );
}

function ImpactBadge({
  level,
}: {
  level: "low" | "moderate" | "high";
}) {
  const styles = {
    low: "bg-emerald-50 text-emerald-700",
    moderate: "bg-amber-50 text-amber-700",
    high: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${styles[level]}`}
    >
      {level.charAt(0).toUpperCase() +
        level.slice(1)}
    </span>
  );
}

function formatProjectArea(areaHa: number) {
  const areaM2 = areaHa * 10_000;

  if (areaM2 < 10_000) {
    return `${Math.round(areaM2).toLocaleString()} m²`;
  }

  return `${areaHa.toFixed(2)} ha`;
}