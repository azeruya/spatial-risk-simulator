"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type {
  PlanningAssessment,
  SimulationBaseline,
  SimulationView,
  RetentionLevel,
} from "@/types/simulation";

import type { SimulationResult } from "@/lib/simulation";
import { buildReportMarkdown, downloadTextFile } from "@/lib/simulation/report";
import type { TerrainAnalysis } from "@/types/terrain";

import ImpactScenarioToggle from "./impact/ImpactScenarioToggle";
import VerdictCard from "./impact/VerdictCard";
import SiteContextGrid, { type AnalysisRadius } from "./impact/SiteContextGrid";
import ScenarioComparison from "./impact/ScenarioComparison";
import FindingsSummary from "./impact/FindingsSummary";
import RecommendationsAccordion from "./impact/RecommendationsAccordion";
import AnalysisAccordion from "./impact/AnalysisAccordion";
import DataAccordion from "./impact/DataAccordion";
import MethodAccordion from "./impact/MethodAccordion";
import {
  ImpactEmptyState,
  ImpactLoadingState,
} from "./impact/ImpactPanelStates";

/** Land-cover pixel size (ESA WorldCover) and elevation cell size (Copernicus GLO-30). */
const LAND_COVER_PIXEL_M = 10;
const DEM_CELL_M = 30;

type OpenSection = "recommendations" | "analysis" | "data" | "method" | null;

type ImpactPanelProps = {
  /** Where "back to Risk" goes (keeps the chosen site). */
  riskHref?: string;

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

  assessment: PlanningAssessment;
  hasValidFootprint: boolean;
  analysisReady: boolean;

  analysisRadiusMeters: AnalysisRadius;
  setAnalysisRadiusMeters: (value: AnalysisRadius) => void;

  terrainAnalysis: TerrainAnalysis | null;
  terrainLoading: boolean;
  terrainError: boolean;

  simulationView: SimulationView;
  setSimulationView: (value: SimulationView) => void;

  /** Optional. Build it from the constants your runoff function uses. */
  runoffFormula?: string;
  /** Optional. Shows a Retry link next to any hazard whose check failed. */
  onRetryAnalysis?: () => void;
  /** Optional. Replaces the built-in Markdown download (for a PDF export, say). */
  onExportReport?: () => void;

  /** @deprecated Not used by the panel. Safe to stop passing. */
  footprintHazards?: unknown;
  /** @deprecated */
  footprintHazardsLoading?: boolean;
  /** @deprecated */
  terrainRadiusMeters?: number | null;
  /** @deprecated */
  landCoverAnalysis?: unknown;
  /** @deprecated */
  landCoverLoading?: boolean;
  /** @deprecated */
  landCoverError?: boolean;
};

export default function ImpactPanel({
  riskHref = "/risk",
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

  assessment,
  hasValidFootprint,
  analysisReady,

  analysisRadiusMeters,
  setAnalysisRadiusMeters,

  terrainAnalysis,
  terrainLoading,
  terrainError,

  simulationView,
  setSimulationView,

  runoffFormula,
  onRetryAnalysis,
  onExportReport,
}: ImpactPanelProps) {
  const [openSection, setOpenSection] =
    useState<OpenSection>("recommendations");

  const hasMitigation =
    permeableSurfacePercent > 0 ||
    greenInfrastructurePercent > 0 ||
    retentionLevel !== "none";

  // If mitigation is removed while the Mitigated view is selected, fall back to Proposed.
  useEffect(() => {
    if (!hasMitigation && simulationView === "mitigated") {
      setSimulationView("proposed");
    }
  }, [hasMitigation, simulationView, setSimulationView]);

  if (!hasValidFootprint) return <ImpactEmptyState />;
  if (!analysisReady) return <ImpactLoadingState />;

  const projectAreaM2 = projectAreaHa * 10_000;
  const smallSite = projectAreaM2 < DEM_CELL_M * DEM_CELL_M;

  const dataNotice = smallSite
    ? `Small site. About ${Math.max(
        1,
        Math.round(projectAreaM2 / (LAND_COVER_PIXEL_M * LAND_COVER_PIXEL_M))
      )} land-cover pixels and less than one ${DEM_CELL_M} m elevation cell cover this parcel, so the current cover and ground height are rough.`
    : undefined;

  function toggleSection(section: Exclude<OpenSection, null>) {
    setOpenSection((current) => (current === section ? null : section));
  }

  function handleExport() {
    if (onExportReport) {
      onExportReport();
      return;
    }

    const markdown = buildReportMarkdown({
      assessment,
      simulation,
      simulationView,
      projectAreaHa,
      radiusMeters: analysisRadiusMeters,
      nearbyPopulation: baseline.population,
      additionalPopulation,
      elevationM: terrainAnalysis?.elevation.mean ?? null,
      hasMitigation,
      runoffFormula,
    });

    downloadTextFile(
      `sivora-assessment-${new Date().toISOString().slice(0, 10)}.md`,
      markdown
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        {/* Stays in view so the scenario is always clear while scrolling. */}
        <div className="sticky top-0 z-10 bg-white/95 px-4 pb-2 pt-4 backdrop-blur">
          <ImpactScenarioToggle
            value={simulationView}
            onChange={setSimulationView}
            mitigationAvailable={hasMitigation}
          />

          {!hasMitigation && (
            <p className="mt-1.5 text-[11px] leading-4 text-slate-500">
              Add a mitigation measure in the inputs to compare “Mitigated”.
            </p>
          )}
        </div>

        <div className="space-y-4 px-4 pb-4 pt-2">
          <VerdictCard assessment={assessment} />

          <ScenarioComparison
            simulation={simulation}
            simulationView={simulationView}
            baselineImperviousPercent={baselineImperviousPercent}
            baselineGreenPercent={baselineGreenPercent}
            imperviousPercent={imperviousPercent}
            greenPercent={greenPercent}
            permeableSurfacePercent={permeableSurfacePercent}
            hasMitigation={hasMitigation}
          />

          <SiteContextGrid
            assessment={assessment}
            terrain={terrainAnalysis}
            terrainLoading={terrainLoading}
            terrainError={terrainError}
            nearbyPopulation={baseline.population}
            additionalPopulation={additionalPopulation}
            projectAreaM2={projectAreaM2}
            radiusMeters={analysisRadiusMeters}
            onRadiusChange={setAnalysisRadiusMeters}
            onRetry={onRetryAnalysis}
          />

          <FindingsSummary
            findings={assessment.topFindings}
            allFindings={assessment.findings}
          />

          <RecommendationsAccordion
            recommendations={assessment.recommendations}
            open={openSection === "recommendations"}
            onToggle={() => toggleSection("recommendations")}
          />

          <AnalysisAccordion
            rows={assessment.analysisRows}
            simulationView={simulationView}
            open={openSection === "analysis"}
            onToggle={() => toggleSection("analysis")}
          />

          <DataAccordion
            sources={assessment.dataSources}
            notice={dataNotice}
            open={openSection === "data"}
            onToggle={() => toggleSection("data")}
          />

          <MethodAccordion
            limitations={assessment.limitations}
            formula={runoffFormula}
            open={openSection === "method"}
            onToggle={() => toggleSection("method")}
          />
        </div>
      </div>

      {/* Always visible, so exporting never needs a long scroll. */}
      <div className="border-t border-slate-100 bg-white px-4 py-3">
        <button
          type="button"
          onClick={handleExport}
          className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Export report
        </button>

        <Link
          href={riskHref}
          className="mt-2 block text-center text-xs font-medium text-slate-600 transition hover:text-slate-900"
        >
          ← Back to risk at this site
        </Link>
      </div>
    </div>
  );
}