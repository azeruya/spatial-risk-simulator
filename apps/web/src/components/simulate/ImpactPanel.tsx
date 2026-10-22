"use client";

import { useState } from "react";

import type { PlanningAssessment, SimulationBaseline, SimulationView, RetentionLevel } from "@/types/simulation";
import type { SimulationResult } from "@/lib/simulation";
import type { TerrainAnalysis } from "@/types/terrain";
import TerrainSummary from "../risk/TerrainSummary";
import { LandCoverAnalysis } from "@/types/land-cover";

import ImpactScenarioToggle from "./impact/ImpactScenarioToggle";
import VerdictCard from "./impact/VerdictCard";
import ImpactKpis from "./impact/ImpactKpis";
import RunoffComparison from "./impact/RunoffComparison";
import ImpactAccordion from "./impact/ImpactAccordion";

import { getHazardStatus } from "@/lib/planning/hazard-status";

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
  analysisRadiusMeters: 250 | 500 | 1000;

  setAnalysisRadiusMeters:
    React.Dispatch<
      React.SetStateAction<
        250 | 500 | 1000
      >
    >;

  terrainAnalysis:
    TerrainAnalysis | null;

  terrainLoading: boolean;

  terrainError: boolean;

  terrainRadiusMeters:
    number | null;

  landCoverAnalysis:
    LandCoverAnalysis | null;

  landCoverLoading: boolean;
  landCoverError: boolean;
  simulationView: SimulationView;

  setSimulationView: (
    value: SimulationView
  ) => void;
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
  analysisRadiusMeters,
  setAnalysisRadiusMeters,

  terrainAnalysis,
  terrainError,
  terrainLoading,
  terrainRadiusMeters,

  landCoverAnalysis,
  landCoverError,
  landCoverLoading,

  simulationView,
  setSimulationView,
}: ImpactPanelProps) {
  const [openSection, setOpenSection] =
    useState<
      | "evidence"
      | "method"
      | "recommendations"
      | null
    >(null);

  const floodPresent =
    (footprintHazards.flood?.maximum ?? 0) > 0;

  const tsunamiPresent =
    (footprintHazards.tsunami?.maximum ?? 0) > 0;

  const landslidePresent =
    (footprintHazards.landslide?.maximum ?? 0) > 0;

  const mappedHazardCount = [
    floodPresent,
    tsunamiPresent,
    landslidePresent,
  ].filter(Boolean).length;

  const displayedRunoff =
  simulationView === "current"
    ? simulation.baselineRunoffPressure
    : simulationView === "mitigated"
      ? simulation.mitigatedRunoffPressure
      : simulation.scenarioRunoffPressure;

  const hasMitigation =
    permeableSurfacePercent > 0 ||
    greenInfrastructurePercent > 0 ||
    retentionLevel !== "none";

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
    <aside className="flex h-full w-full flex-col border-l border-slate-200/70 bg-white">
      {/* HEADER */}
      <div className="px-5 pb-4 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Scenario impact
        </p>

        <h2 className="mt-1.5 text-[17px] font-semibold tracking-tight text-slate-950">
          Site assessment
        </h2>
      </div>

      <div className="mx-5 border-t border-slate-100" />

      {/* EMPTY STATE */}
      <div className="flex flex-1 flex-col px-5 py-6">
        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-600">
            1
          </div>

          <p className="mt-3 text-[16px] font-semibold leading-6 text-slate-950">
            Define a site to begin
          </p>

          <p className="mt-2 max-w-[290px] text-xs leading-5 text-slate-500">
            Draw a project footprint or define its
            area and dimensions. SIVORA will then
            analyse mapped hazards, terrain, and
            development impacts.
          </p>
        </section>

        {/* WORKFLOW */}
        <section className="mt-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Assessment workflow
          </p>

          <div className="mt-4">
            <EmptyWorkflowStep
              number="1"
              title="Define site"
              description="Draw or size the proposed project footprint."
              active
            />

            <EmptyWorkflowStep
              number="2"
              title="Analyse context"
              description="Check mapped hazards, terrain, and existing site cover."
            />

            <EmptyWorkflowStep
              number="3"
              title="Compare proposal"
              description="Measure how the proposed design changes surface conditions."
            />

            <EmptyWorkflowStep
              number="4"
              title="Test mitigation"
              description="Explore measures that can reduce development impacts."
              last
            />
          </div>
        </section>

        {/* FOOTNOTE */}
        <div className="mt-auto pt-8">
          <div className="rounded-xl bg-slate-50 px-3.5 py-3">
            <p className="text-[10px] leading-4 text-slate-500">
              Results are screening-level planning
              indicators and should not be interpreted
              as detailed engineering analysis.
            </p>
          </div>
        </div>
      </div>
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
    <aside className="h-full overflow-y-auto border-l border-slate-200 bg-white p-4">
      <div className="space-y-3">
        {/* ============================================================
            SCENARIO
        ============================================================ */}
        <ImpactScenarioToggle
          value={simulationView}
          onChange={setSimulationView}
          mitigationAvailable={hasMitigation}
        />

        {/* ============================================================
            VERDICT
        ============================================================ */}
        <VerdictCard
          assessment={assessment}
          runoffChangePercent={
            simulation.runoffChangePercent
          }
        />

        {/* ============================================================
            KPIs
        ============================================================ */}
        <ImpactKpis
          runoff={displayedRunoff}
          mappedHazardCount={mappedHazardCount}
          tsunamiPresent={tsunamiPresent}
        />

        {/* ============================================================
            RUNOFF COMPARISON
        ============================================================ */}
        <RunoffComparison
          current={
            simulation.baselineRunoffPressure
          }
          proposed={
            simulation.scenarioRunoffPressure
          }
          mitigated={
            simulation.mitigatedRunoffPressure
          }
          hasMitigation={hasMitigation}
        />

        {/* ============================================================
            EVIDENCE
        ============================================================ */}
        <ImpactAccordion
          title="Evidence"
          open={openSection === "evidence"}
          onToggle={() =>
            setOpenSection(
              openSection === "evidence"
                ? null
                : "evidence"
            )
          }
        >
          <div className="space-y-5">
            {/* EXISTING SITE COVER */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Existing site cover
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Current mapped surface conditions
                    within the proposed footprint.
                  </p>
                </div>

                <span className="text-[9px] text-slate-400">
                  ESA WorldCover 2021
                </span>
              </div>

              <div className="mt-3">
                {landCoverLoading ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                    Analysing existing land cover...
                  </div>
                ) : landCoverError ? (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
                    Existing land-cover data unavailable.
                  </div>
                ) : landCoverAnalysis ? (
                  <div className="grid grid-cols-2 gap-2">
                    <LandCoverMetric
                      label="Built-up proxy"
                      value={`${landCoverAnalysis.planning.builtUpPercent.toFixed(
                        0
                      )}%`}
                    />

                    <LandCoverMetric
                      label="Vegetated"
                      value={`${landCoverAnalysis.planning.vegetatedPercent.toFixed(
                        0
                      )}%`}
                    />

                    <LandCoverMetric
                      label="Water / wetland"
                      value={`${landCoverAnalysis.planning.waterPercent.toFixed(
                        0
                      )}%`}
                    />

                    <LandCoverMetric
                      label="Other"
                      value={`${landCoverAnalysis.planning.otherPercent.toFixed(
                        0
                      )}%`}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* TERRAIN */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Terrain context
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Elevation and slope around the
                    proposed footprint.
                  </p>
                </div>

                <span className="text-[9px] text-slate-400">
                  Copernicus DEM
                </span>
              </div>

              <TerrainSummary
                terrain={terrainAnalysis}
                loading={terrainLoading}
                error={terrainError}
              />
            </div>

            {/* SURROUNDING CONTEXT */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Surrounding context
                </p>

                <div className="flex rounded-lg bg-slate-100 p-0.5">
                  {([250, 500, 1000] as const).map(
                    (radius) => (
                      <button
                        key={radius}
                        type="button"
                        onClick={() =>
                          setAnalysisRadiusMeters(
                            radius
                          )
                        }
                        className={`rounded-md px-2 py-1 text-[10px] font-medium transition ${
                          analysisRadiusMeters ===
                          radius
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {radius === 1000
                          ? "1 km"
                          : `${radius} m`}
                      </button>
                    )
                  )}
                </div>
              </div>

              {baseline.status ===
                "loading" && (
                <p className="mt-3 text-xs text-slate-500">
                  Loading surrounding context...
                </p>
              )}

              {baseline.status ===
                "success" && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <MetricCard
                    label="Population"
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
                <p className="mt-3 text-xs text-amber-700">
                  Surrounding context temporarily
                  unavailable.
                </p>
              )}
            </div>

            {/* FOOTPRINT HAZARDS */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Footprint hazard samples
              </p>

              <div className="mt-3 space-y-2">
                {(
                  [
                    "flood",
                    "tsunami",
                    "landslide",
                  ] as const
                ).map((hazardKey) => {
                  const hazard =
                    footprintHazards[hazardKey];

                  const status =
                    getHazardStatus(hazard);

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
                        <p className="text-xs font-medium text-slate-800">
                          {label}
                        </p>

                        <span
                          className={`text-[10px] font-medium ${
                            status === "hazard-present"
                              ? "text-amber-700"
                              : status === "no-hazard"
                              ? "text-emerald-700"
                              : "text-slate-400"
                          }`}
                        >
                          {status === "hazard-present"
                            ? "Hazard mapped"
                            : status === "no-hazard"
                            ? "No hazard value"
                            : status === "no-data"
                            ? "No mapped data"
                            : "Unavailable"}
                        </span>
                      </div>

                      {hazard &&
                        hazard.validSamples > 0 && (
                          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                            <div>
                              <p className="text-slate-400">
                                Samples
                              </p>

                              <p className="mt-1 font-semibold text-slate-700">
                                {hazard.validSamples}/
                                {hazard.totalSamples}
                              </p>
                            </div>

                            <div>
                              <p className="text-slate-400">
                                Average
                              </p>

                              <p className="mt-1 font-semibold text-slate-700">
                                {hazard.average !== null
                                  ? hazard.average.toFixed(3)
                                  : "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-slate-400">
                                Maximum
                              </p>

                              <p className="mt-1 font-semibold text-slate-700">
                                {hazard.maximum !== null
                                  ? hazard.maximum.toFixed(3)
                                  : "—"}
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>

              <p className="mt-2 text-[10px] leading-4 text-slate-400">
                Sample counts indicate where mapped
                raster values were returned. They do
                not represent the percentage of the
                project affected.
              </p>
            </div>

            {/* REASONING */}
            <div className="border-t border-slate-100 pt-4">
              <ReasoningSection
                assessment={assessment}
              />
            </div>
          </div>
        </ImpactAccordion>

        {/* ============================================================
            METHOD
        ============================================================ */}
        <ImpactAccordion
          title="Method and assumptions"
          open={openSection === "method"}
          onToggle={() =>
            setOpenSection(
              openSection === "method"
                ? null
                : "method"
            )
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Comparative runoff tendency
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Surface composition is converted into
                a comparative runoff coefficient.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="font-mono text-xs leading-5 text-slate-700">
                C = I × 0.90
                <br />
                + G × 0.20
                <br />
                + O × 0.45
              </p>

              <div className="mt-2 space-y-1 text-[10px] text-slate-500">
                <p>I = impervious surface</p>
                <p>G = green / open space</p>
                <p>O = other surface</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <RunoffBreakdown
                title="Current"
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

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
              <p className="text-[10px] leading-5 text-amber-800">
                This is a comparative planning
                indicator based on simplified surface
                coefficients. It is not a prediction
                of runoff volume, discharge, flood
                depth, or flood probability.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Data sources
              </p>

              <div className="mt-2 space-y-1 text-[10px] leading-5 text-slate-500">
                <p>BNPB InaRISK · hazard context</p>
                <p>ESA WorldCover 2021 · land cover</p>
                <p>Copernicus DEM GLO-30 · terrain</p>
                <p>WorldPop 2025 · population context</p>
              </div>
            </div>
          </div>
        </ImpactAccordion>

        {/* ============================================================
            RECOMMENDATIONS
        ============================================================ */}
        <ImpactAccordion
          title="Recommendations"
          open={
            openSection ===
            "recommendations"
          }
          onToggle={() =>
            setOpenSection(
              openSection ===
                "recommendations"
                ? null
                : "recommendations"
            )
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Recommended next step
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-700">
                {assessment.recommendedAction}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Planning response
              </p>

              <div className="mt-3 space-y-3">
                {assessment.responses
                  .slice(0, 3)
                  .map(
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
            </div>

            <div className="border-t border-slate-100 pt-4">
              {!hasMitigation ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-3">
                  <p className="text-xs font-medium text-slate-700">
                    No mitigation applied
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    Add permeable replacement, green
                    infrastructure, or stormwater
                    retention to compare an improved
                    scenario.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-700">
                      Proposed → mitigated runoff
                    </p>

                    <p className="text-xs font-semibold text-emerald-700">
                      -
                      {simulation.mitigationReductionPercent.toFixed(
                        1
                      )}
                      %
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <div>
                      <p className="text-[10px] text-slate-400">
                        Proposed
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {simulation.scenarioRunoffPressure.toFixed(
                          3
                        )}
                      </p>
                    </div>

                    <span className="text-slate-300">
                      →
                    </span>

                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">
                        Mitigated
                      </p>

                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        {simulation.mitigatedRunoffPressure.toFixed(
                          3
                        )}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </ImpactAccordion>

        {/* ============================================================
            EXPORT
        ============================================================ */}
        <button
          type="button"
          disabled
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export report
        </button>
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

function LandCoverMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[9px] uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-base font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function EmptyWorkflowStep({
  number,
  title,
  description,
  active = false,
  last = false,
}: {
  number: string;
  title: string;
  description: string;
  active?: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      {/* Step rail */}
      <div className="flex flex-col items-center">
        <div
          className={`
            flex h-7 w-7 shrink-0
            items-center justify-center
            rounded-full
            text-[10px] font-semibold
            ${
              active
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-400"
            }
          `}
        >
          {number}
        </div>

        {!last && (
          <div className="my-1 h-10 w-px bg-slate-200" />
        )}
      </div>

      {/* Step content */}
      <div className={last ? "pb-0" : "pb-4"}>
        <p
          className={`
            text-xs font-semibold
            ${
              active
                ? "text-slate-900"
                : "text-slate-500"
            }
          `}
        >
          {title}
        </p>

        <p className="mt-1 max-w-[260px] text-[10px] leading-4 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}