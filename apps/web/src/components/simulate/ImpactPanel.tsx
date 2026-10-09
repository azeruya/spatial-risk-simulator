"use client";

import { useState } from "react";

import type { PlanningAssessment, SimulationBaseline } from "@/types/simulation";
import type { SimulationResult } from "@/lib/simulation";
import type { RetentionLevel } from "./ScenarioPanel";

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

  footprintHazards: FootprintHazards;
  footprintHazardsLoading: boolean;

  assessment: PlanningAssessment;
  hasValidFootprint: boolean;
  analysisReady: boolean;
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

  footprintHazards,
  footprintHazardsLoading,

  assessment,
  hasValidFootprint,
  analysisReady,
}: ImpactPanelProps) {
  const [showRunoffInfo, setShowRunoffInfo] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

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

  const baselineImperviousPercent =
    simulation.projectAreaHa > 0
      ? (simulation.baselineImperviousAreaHa /
          simulation.projectAreaHa) *
        100
      : 0;

  const baselineGreenPercent =
    simulation.projectAreaHa > 0
      ? (simulation.baselineGreenAreaHa /
          simulation.projectAreaHa) *
        100
      : 0;

  const baselineOtherPercent =
    simulation.baselineOtherPercent;

  const scenarioOtherPercent =
    simulation.scenarioOtherPercent;

  if (!hasValidFootprint) {
    return (
      <aside className="overflow-y-auto border-l border-slate-200 bg-white p-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Scenario impact
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              Site assessment
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">
            Waiting for site
          </span>
        </div>

        {/* Default assessment */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Awaiting site definition
              </p>

              <p className="mt-2 text-base font-semibold leading-6 text-slate-900">
                Define a site to begin assessment
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500">
              Not analysed
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Choose a project area, enter dimensions, or draw a footprint on the map. 
            The simulator will then check mapped hazards and evaluate development impacts.
          </p>

          <div className="mt-4 grid gap-2">
            <div className="rounded-xl bg-white p-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                Primary concern
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Awaiting site analysis
              </p>
            </div>

            <div className="rounded-xl bg-white p-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                Recommended next step
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Define a project area using Area, Dimensions, or Draw mode.
              </p>
            </div>
          </div>
        </section>

        {/* Hazard context placeholders */}
        <section className="mt-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Hazard context
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {["Flood", "Tsunami", "Landslide"].map(
              (label) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  <p className="text-[10px] text-slate-400">
                    {label}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Pending
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        {/* Workflow */}
        <section className="mt-6">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Assessment workflow
          </p>

          <div className="mt-3 space-y-3">
            <EmptyStep
              number="1"
              title="Define development site"
              active
            />

            <EmptyStep
              number="2"
              title="Analyse mapped hazards"
            />

            <EmptyStep
              number="3"
              title="Evaluate development change"
            />

            <EmptyStep
              number="4"
              title="Test mitigation options"
            />
          </div>
        </section>
      </aside>
    );
  }

  if (
    hasValidFootprint &&
    !analysisReady
  ) {
    return (
      <aside className="overflow-y-auto border-l border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Scenario impact
        </p>

        <p className="mt-1 text-sm font-medium text-slate-900">
          Analysing development site
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">
            Building site assessment…
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Checking mapped hazards and evaluating
            development changes within the proposed
            footprint.
          </p>

          <div className="mt-5 space-y-3">
            <LoadingRow label="Flood hazard" />
            <LoadingRow label="Tsunami hazard" />
            <LoadingRow label="Landslide hazard" />
            <LoadingRow label="Development impact" />
          </div>
        </div>
      </aside>
    );
  }

  

  return (
    <aside className="overflow-y-auto border-l border-slate-200 bg-white p-5">
      {/* ============================================================
          HEADER
      ============================================================ */}
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

      {/* ============================================================
          1. SITE ASSESSMENT
      ============================================================ */}
      <AssessmentSummary assessment={assessment} />
      <HazardOverview
        hazards={footprintHazards}
        loading={footprintHazardsLoading}
      />

      {/* ============================================================
          2. WHY THIS MATTERS
          Hazard → Change → Consequence
      ============================================================ */}
      <ReasoningSection assessment={assessment} />

      {/* ============================================================
          3. PROPOSED SITE
      ============================================================ */}
      <section className="mt-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Proposed site
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
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
      </section>

      {/* ============================================================
          4. LAND ALLOCATION
      ============================================================ */}
      <section className="mt-6">
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
      </section>

      {/* ============================================================
          5. KEY CHANGES
      ============================================================ */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Key changes
          </p>

          <ImpactBadge level={simulation.impactLevel} />
        </div>

        <div className="mt-3 space-y-3">
          <ComparisonRow
            label="Runoff tendency"
            baseline={simulation.baselineRunoffPressure.toFixed(
              3
            )}
            scenario={simulation.scenarioRunoffPressure.toFixed(
              3
            )}
            change={`${simulation.runoffChangePercent >= 0 ? "+" : ""}${simulation.runoffChangePercent.toFixed(
              1
            )}%`}
            direction={simulation.runoffDirection}
          />

          <button
            type="button"
            onClick={() =>
              setShowRunoffInfo(
                (current) => !current
              )
            }
            className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
          >
            ⓘ How is runoff tendency calculated?
          </button>

          {showRunoffInfo && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
              <p className="text-xs font-semibold text-slate-800">
                Comparative runoff tendency
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-600">
                The simulator estimates how the
                site's surface composition changes
                its tendency to generate surface
                runoff.
              </p>

              <div className="mt-3 rounded-lg bg-white p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Model
                </p>

                <p className="mt-2 font-mono text-[11px] leading-5 text-slate-700">
                  C = impervious × 0.90
                  <br />
                  + green × 0.20
                  <br />
                  + other × 0.45
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <RunoffBreakdown
                  title="Baseline"
                  impervious={
                    baselineImperviousPercent
                  }
                  green={baselineGreenPercent}
                  other={baselineOtherPercent}
                  coefficient={
                    simulation.baselineRunoffCoefficient
                  }
                />

                <RunoffBreakdown
                  title="Proposed"
                  impervious={imperviousPercent}
                  green={greenPercent}
                  other={scenarioOtherPercent}
                  coefficient={
                    simulation.scenarioRunoffCoefficient
                  }
                />
              </div>

              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-[10px] text-slate-400">
                  Relative change
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {simulation.runoffChangePercent >= 0
                    ? "+"
                    : ""}
                  {simulation.runoffChangePercent.toFixed(
                    1
                  )}
                  %
                </p>
              </div>

              <p className="mt-3 text-[10px] leading-4 text-slate-400">
                This is a comparative planning
                indicator based on simplified
                surface coefficients. It does not
                predict flood depth, discharge, or
                probability. Hazard context is
                assessed separately using mapped
                BNPB data.
              </p>
            </div>
          )}

          <ComparisonRow
            label="Impervious surface"
            baseline={`${baselineImperviousPercent.toFixed(
              0
            )}%`}
            scenario={`${imperviousPercent}%`}
            change={`${
              imperviousPercent -
                baselineImperviousPercent >=
              0
                ? "+"
                : ""
            }${(
              imperviousPercent -
              baselineImperviousPercent
            ).toFixed(0)} pp`}
            direction={
              imperviousPercent >
              baselineImperviousPercent
                ? "higher"
                : imperviousPercent <
                    baselineImperviousPercent
                  ? "lower"
                  : "similar"
            }
          />

          <ComparisonRow
            label="Green / open space"
            baseline={`${baselineGreenPercent.toFixed(
              0
            )}%`}
            scenario={`${greenPercent}%`}
            change={`${
              greenPercent -
                baselineGreenPercent >=
              0
                ? "+"
                : ""
            }${(
              greenPercent -
              baselineGreenPercent
            ).toFixed(0)} pp`}
            direction={
              greenPercent >
              baselineGreenPercent
                ? "lower"
                : greenPercent <
                    baselineGreenPercent
                  ? "higher"
                  : "similar"
            }
          />

          {simulation.baselinePopulation !==
            null &&
            simulation.scenarioPopulation !==
              null && (
              <ComparisonRow
                label="Population exposure"
                baseline={Math.round(
                  simulation.baselinePopulation
                ).toLocaleString()}
                scenario={Math.round(
                  simulation.scenarioPopulation
                ).toLocaleString()}
                change={`+${simulation.populationChange.toLocaleString()}`}
                direction={
                  simulation.populationChange > 0
                    ? "higher"
                    : simulation.populationChange <
                        0
                      ? "lower"
                      : "similar"
                }
              />
            )}
        </div>
      </section>

      {/* ============================================================
          6. SITE EVIDENCE
          Collapsed by default
      ============================================================ */}
      <section className="mt-6 border-t border-slate-100 pt-5">
        <button
          type="button"
          onClick={() =>
            setShowEvidence(
              (current) => !current
            )
          }
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Site evidence
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Baseline context and mapped hazard
              samples
            </p>
          </div>

          <span className="shrink-0 text-xs font-medium text-slate-400">
            {showEvidence ? "Hide ↑" : "Show ↓"}
          </span>
        </button>

        {showEvidence && (
          <div className="mt-4 space-y-5">
            {/* -------------------------------------------------------
                Baseline context
            ------------------------------------------------------- */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Surrounding context · 500 m
              </p>

              {baseline.status === "idle" && (
                <div className="mt-2 rounded-xl border border-dashed border-slate-300 p-3">
                  <p className="text-xs text-slate-500">
                    Select a site on the map to
                    load baseline conditions.
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

              {baseline.status ===
                "success" && (
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
                    Baseline context temporarily
                    unavailable.
                  </p>
                </div>
              )}
            </div>

            {/* -------------------------------------------------------
                Hazard overlap
            ------------------------------------------------------- */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Footprint hazard samples
              </p>

              <div className="mt-2 space-y-2">
                {(
                  [
                    "flood",
                    "tsunami",
                    "landslide",
                  ] as const
                ).map((hazardKey) => {
                  const hazard =
                    footprintHazards[hazardKey];

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
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium text-slate-800">
                          {label}
                        </p>

                        {footprintHazardsLoading && (
                          <span className="text-[10px] text-slate-400">
                            Analysing…
                          </span>
                        )}
                      </div>

                      {!footprintHazardsLoading &&
                      hazard ? (
                        hazard.validSamples > 0 ? (
                          <>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <div>
                                <p className="text-[10px] uppercase text-slate-400">
                                  Mapped
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                  {
                                    hazard.validSamples
                                  }
                                  /
                                  {
                                    hazard.totalSamples
                                  }
                                </p>
                              </div>

                              <div>
                                <p className="text-[10px] uppercase text-slate-400">
                                  Average
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                  {hazard.average !==
                                  null
                                    ? hazard.average.toFixed(
                                        3
                                      )
                                    : "—"}
                                </p>
                              </div>

                              <div>
                                <p className="text-[10px] uppercase text-slate-400">
                                  Maximum
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                  {hazard.maximum !==
                                  null
                                    ? hazard.maximum.toFixed(
                                        3
                                      )
                                    : "—"}
                                </p>
                              </div>
                            </div>

                            <p className="mt-2 text-[10px] leading-4 text-slate-400">
                              {
                                hazard.validSamples
                              }{" "}
                              of{" "}
                              {
                                hazard.totalSamples
                              }{" "}
                              sampled locations
                              returned mapped values.
                            </p>
                          </>
                        ) : (
                          <p className="mt-2 text-xs text-slate-500">
                            No mapped value returned
                            within the sampled
                            footprint.
                          </p>
                        )
                      ) : !footprintHazardsLoading ? (
                        <p className="mt-2 text-xs text-slate-500">
                          Hazard data unavailable for
                          this footprint.
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <p className="mt-2 text-[10px] leading-4 text-slate-400">
                Sample counts indicate where mapped
                raster values were returned. They do
                not represent the percentage of the
                site affected by a hazard.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================
          7. PLANNING RESPONSE
      ============================================================ */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Planning response
        </p>

        <div className="mt-3 space-y-3">
          {assessment.responses.map(
            (response, index) => (
              <div
                key={index}
                className="flex gap-2"
              >
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />

                <p className="text-xs leading-5 text-slate-700">
                  {response}
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* ============================================================
          8. DESIGN RESPONSE / MITIGATION
      ============================================================ */}
      <section className="mt-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Design response
        </p>

        {permeableSurfacePercent === 0 &&
        greenInfrastructurePercent === 0 &&
        retentionLevel === "none" ? (
          <div className="mt-2 rounded-xl border border-dashed border-slate-300 p-3">
            <p className="text-xs font-medium text-slate-700">
              No mitigation applied
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Adjust the mitigation controls to
              compare the proposed scenario with an
              improved design.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <ComparisonRow
              label="Runoff tendency"
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

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Selected interventions
              </p>

              <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                {permeableSurfacePercent > 0 && (
                  <p>
                    • Permeable surface treatment:{" "}
                    {permeableSurfacePercent}%
                  </p>
                )}

                {greenInfrastructurePercent >
                  0 && (
                  <p>
                    • Green infrastructure:{" "}
                    {
                      greenInfrastructurePercent
                    }
                    %
                  </p>
                )}

                {retentionLevel !== "none" && (
                  <p>
                    • Retention capacity:{" "}
                    {retentionLevel}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
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

function AssessmentSummary({
  assessment,
}: {
  assessment: PlanningAssessment;
}) {
  const statusStyle = {
    low: {
      label: "Lower concern",
      badge:
        "bg-emerald-50 text-emerald-700",
      border:
        "border-emerald-100",
    },

    attention: {
      label: "Attention",
      badge:
        "bg-amber-50 text-amber-700",
      border:
        "border-amber-100",
    },

    review: {
      label: "Review",
      badge:
        "bg-red-50 text-red-700",
      border:
        "border-red-100",
    },
  }[assessment.status];

  return (
    <section
      className={`mt-5 rounded-2xl border bg-slate-50 p-4 ${statusStyle.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Site assessment
          </p>

          <p className="mt-2 text-base font-semibold leading-6 text-slate-900">
            {assessment.headline}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${statusStyle.badge}`}
        >
          {statusStyle.label}
        </span>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-600">
        {assessment.summary}
      </p>

      <div className="mt-4 grid gap-2">
        <div className="rounded-xl bg-white p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Primary concern
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-800">
            {assessment.primaryConcern}
          </p>
        </div>

        <div className="rounded-xl bg-white p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Recommended next step
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-700">
            {assessment.recommendedAction}
          </p>
        </div>
      </div>
    </section>
  );
}

function ReasoningCard({
  number,
  title,
  description,
  items,
}: {
  number: string;
  title: string;
  description: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex gap-3">
        <span className="text-[10px] font-semibold text-slate-400">
          {number}
        </span>

        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800">
            {title}
          </p>

          <p className="mt-0.5 text-[10px] text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="flex gap-2"
          >
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />

            <p className="text-xs leading-5 text-slate-600">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReasoningSection({
  assessment,
}: {
  assessment: PlanningAssessment;
}) {
  return (
    <section className="mt-6">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        Why this matters
      </p>

      <div className="mt-3 space-y-2">
        <ReasoningCard
          number="01"
          title="Hazard"
          description="What already exists at this site"
          items={assessment.hazard}
        />

        <ReasoningCard
          number="02"
          title="Change"
          description="What the proposal changes"
          items={assessment.change}
        />

        <ReasoningCard
          number="03"
          title="Consequence"
          description="Why those changes matter here"
          items={assessment.consequence}
        />
      </div>
    </section>
  );
}

function RunoffBreakdown({
  title,
  impervious,
  green,
  other,
  coefficient,
}: {
  title: string;
  impervious: number;
  green: number;
  other: number;
  coefficient: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <p className="text-[10px] font-semibold text-slate-700">
        {title}
      </p>

      <div className="mt-2 space-y-1 text-[10px] text-slate-500">
        <p>
          Impervious{" "}
          {impervious.toFixed(0)}%
        </p>

        <p>
          Green {green.toFixed(0)}%
        </p>

        <p>
          Other {other.toFixed(0)}%
        </p>
      </div>

      <p className="mt-2 border-t border-slate-100 pt-2 text-xs font-semibold text-slate-800">
        C = {coefficient.toFixed(3)}
      </p>
    </div>
  );
}

function EmptyStep({
  number,
  title,
  active = false,
}: {
  number: string;
  title: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
          active
            ? "bg-blue-600 text-white"
            : "bg-slate-200 text-slate-500"
        }`}
      >
        {number}
      </span>

      <p
        className={`text-xs ${
          active
            ? "font-medium text-slate-800"
            : "text-slate-400"
        }`}
      >
        {title}
      </p>
    </div>
  );
}

function HazardOverview({
  hazards,
  loading,
}: {
  hazards: FootprintHazards;
  loading: boolean;
}) {
  const items = [
    {
      key: "flood",
      label: "Flood",
    },
    {
      key: "tsunami",
      label: "Tsunami",
    },
    {
      key: "landslide",
      label: "Landslide",
    },
  ] as const;

  return (
    <section className="mt-5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        Hazard context
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {items.map(({ key, label }) => {
          const hazard = hazards[key];

          const mapped =
            hazard !== null &&
            hazard.validSamples > 0;

          return (
            <div
              key={key}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <p className="text-[10px] text-slate-400">
                {label}
              </p>

              <p
                className={`mt-1 text-xs font-semibold ${
                  loading
                    ? "text-slate-400"
                    : mapped
                      ? "text-amber-700"
                      : "text-slate-500"
                }`}
              >
                {loading
                  ? "Checking…"
                  : mapped
                    ? "Mapped"
                    : "No mapped value"}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LoadingRow({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
      <div>
        <p className="text-xs font-medium text-slate-700">
          {label}
        </p>

        <p className="mt-1 text-[10px] text-slate-400">
          Checking mapped data…
        </p>
      </div>

      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
    </div>
  );
}