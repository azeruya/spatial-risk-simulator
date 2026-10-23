"use client";

import { useState } from "react";

import type {
  PlanningAssessment,
  SimulationBaseline,
  SimulationView,
  RetentionLevel,
} from "@/types/simulation";

import type { SimulationResult } from "@/lib/simulation";
import type { TerrainAnalysis } from "@/types/terrain";
import type { LandCoverAnalysis } from "@/types/land-cover";

import ImpactScenarioToggle from "./impact/ImpactScenarioToggle";
import VerdictCard from "./impact/VerdictCard";
import SiteContextGrid from "./impact/SiteContextGrid";
import ScenarioComparison from "./impact/ScenarioComparison";
import FindingsSummary from "./impact/FindingsSummary";
import RecommendationsAccordion from "./impact/RecommendationsAccordion";
import AnalysisAccordion from "./impact/AnalysisAccordion";
import DataAccordion from "./impact/DataAccordion";
import MethodAccordion from "./impact/MethodAccordion";

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

  baselineImperviousPercent: number;
  baselineGreenPercent: number;

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

  baselineImperviousPercent,
  baselineGreenPercent,

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
  type OpenSection =
    | "recommendations"
    | "analysis"
    | "data"
    | "method"
    | null;

  const [openSection, setOpenSection] =
    useState<OpenSection>("recommendations");

  function toggleSection(
    section: Exclude<OpenSection, null>
  ) {
    setOpenSection((current) =>
      current === section
        ? null
        : section
    );
  }

  const hasMitigation =
    permeableSurfacePercent > 0 ||
    greenInfrastructurePercent > 0 ||
    retentionLevel !== "none";

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
    <aside className="h-full overflow-y-auto border-l border-slate-200 bg-white">
      <div className="space-y-4 px-4 py-4">

        {/* =====================================================
            SCENARIO VIEW
        ===================================================== */}
        <ImpactScenarioToggle
          value={simulationView}
          onChange={setSimulationView}
          mitigationAvailable={hasMitigation}
        />

        {/* =====================================================
            VERDICT
        ===================================================== */}
        <VerdictCard
          assessment={assessment}
          simulationView={simulationView}
        />

        {/* =====================================================
            ABOUT THE SITE
            Does not change between Current / Proposed / Mitigated
        ===================================================== */}
        <SiteContextGrid
          assessment={assessment}
          terrain={terrainAnalysis}
          nearbyPopulation={baseline.population}
          additionalPopulation={
            additionalPopulation
          }
          radiusMeters={
            analysisRadiusMeters
          }
          onRadiusChange={
            setAnalysisRadiusMeters
          }
        />

        {/* =====================================================
            ABOUT YOUR DESIGN
            Changes with Current / Proposed / Mitigated
        ===================================================== */}
        <ScenarioComparison
          simulation={simulation}
          simulationView={simulationView}

          baselineImperviousPercent={
            baselineImperviousPercent
          }

          baselineGreenPercent={
            baselineGreenPercent
          }

          imperviousPercent={
            imperviousPercent
          }

          greenPercent={
            greenPercent
          }

          permeableSurfacePercent={
            permeableSurfacePercent
          }

          greenInfrastructurePercent={
            greenInfrastructurePercent
          }

          hasMitigation={
            hasMitigation
          }
        />

        {/* =====================================================
            PLAIN LANGUAGE SUMMARY
        ===================================================== */}
        <FindingsSummary
          findings={assessment.topFindings}
          totalFindings={
            assessment.findings.length
          }
          onShowAll={() =>
            setOpenSection("analysis")
          }
        />

        {/* =====================================================
            ACTIONS
        ===================================================== */}
        <RecommendationsAccordion
          recommendations={
            assessment.recommendations
          }
          open={
            openSection ===
            "recommendations"
          }
          onToggle={() =>
            toggleSection(
              "recommendations"
            )
          }
        />

        {/* =====================================================
            DETAILED ANALYSIS
        ===================================================== */}
        <AnalysisAccordion
          rows={assessment.analysisRows}
          open={
            openSection === "analysis"
          }
          onToggle={() =>
            toggleSection("analysis")
          }
        />

        {/* =====================================================
            DATA / EVIDENCE
        ===================================================== */}
        <DataAccordion
          sources={assessment.dataSources}
          open={
            openSection === "data"
          }
          onToggle={() =>
            toggleSection("data")
          }
        />

        {/* =====================================================
            METHOD + LIMITATIONS
        ===================================================== */}
        <MethodAccordion
          limitations={
            assessment.limitations
          }
          open={
            openSection === "method"
          }
          onToggle={() =>
            toggleSection("method")
          }
        />

        {/* =====================================================
            EXPORT
        ===================================================== */}
        <button
          type="button"
          disabled
          className="
            w-full rounded-xl
            bg-slate-950
            px-4 py-3
            text-sm font-semibold text-white
            transition
            hover:bg-slate-800
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
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