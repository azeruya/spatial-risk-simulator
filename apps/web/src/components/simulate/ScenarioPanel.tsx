"use client";

import { useEffect, useRef, useState } from "react";
import {
  FootprintMode,
  AreaUnit,
  DrawShape,
  ScenarioType,
  RetentionLevel,
} from "@/types/simulation";
import { AccordionSection, LiveResult } from "./scenario/ScenarioControls";
import { SiteSection, formatPanelArea } from "./scenario/SiteSection";
import { ProgramSection } from "./scenario/ProgramSection";
import {
  MitigationSection,
  type MitigationEffects,
} from "./scenario/MitigationSection";

type Section = "site" | "program" | "mitigation";

const ORDER: Section[] = ["site", "program", "mitigation"];

type ScenarioPanelProps = {
  scenarioType: ScenarioType;
  setScenarioType: (value: ScenarioType) => void;

  projectAreaHa: number;

  footprintMode: FootprintMode;
  setFootprintMode: (value: FootprintMode) => void;

  drawShape: DrawShape;
  setDrawShape: (value: DrawShape) => void;

  areaValue: number;
  setAreaValue: (value: number) => void;

  areaUnit: AreaUnit;
  setAreaUnit: (value: AreaUnit) => void;

  widthM: number;
  setWidthM: (value: number) => void;

  lengthM: number;
  setLengthM: (value: number) => void;

  imperviousPercent: number;
  setImperviousPercent: (value: number) => void;

  greenPercent: number;
  setGreenPercent: (value: number) => void;

  additionalPopulation: number;
  setAdditionalPopulation: (value: number) => void;

  permeableSurfacePercent: number;
  setPermeableSurfacePercent: (value: number) => void;

  greenInfrastructurePercent: number;
  setGreenInfrastructurePercent: (value: number) => void;

  retentionLevel: RetentionLevel;
  setRetentionLevel: (value: RetentionLevel) => void;

  bearing: number;
  setBearing: (value: number) => void;

  isDrawing: boolean;
  hasDrawnFootprint: boolean;
  drawnAreaM2: number;

  onStartDrawing: () => void;
  onCancelDrawing: () => void;
  onClearDrawing: () => void;
  siteImportedFromRisk: boolean;
  onReset: () => void;

  /** Optional. Enables the live result strip above the footer. */
  runoff?: { current: number; proposed: number; mitigated: number };
  /** Optional. Enables the "-9% runoff" chips on the mitigation controls. */
  mitigationEffects?: MitigationEffects;
};

export default function ScenarioPanel({
  scenarioType,
  setScenarioType,

  projectAreaHa,

  footprintMode,
  setFootprintMode,
  drawShape,
  setDrawShape,

  areaValue,
  setAreaValue,

  areaUnit,
  setAreaUnit,

  widthM,
  setWidthM,

  lengthM,
  setLengthM,

  imperviousPercent,
  setImperviousPercent,

  greenPercent,
  setGreenPercent,

  additionalPopulation,
  setAdditionalPopulation,

  permeableSurfacePercent,
  setPermeableSurfacePercent,

  greenInfrastructurePercent,
  setGreenInfrastructurePercent,

  retentionLevel,
  setRetentionLevel,

  bearing,
  setBearing,
  isDrawing,
  hasDrawnFootprint,
  drawnAreaM2,

  onStartDrawing,
  onCancelDrawing,
  onClearDrawing,
  siteImportedFromRisk,
  onReset,

  runoff,
  mitigationEffects,
}: ScenarioPanelProps) {
  const [openSection, setOpenSection] = useState<Section | null>("site");
  const [visited, setVisited] = useState<Record<Section, boolean>>({
    site: false,
    program: false,
    mitigation: false,
  });

  const siteDefined =
    footprintMode === "draw" ? hasDrawnFootprint : projectAreaHa > 0;

  function goTo(next: Section | null) {
    if (openSection) {
      setVisited((current) => ({ ...current, [openSection]: true }));
    }
    setOpenSection(next);
  }

  function toggleSection(section: Section) {
    goTo(openSection === section ? null : section);
  }

  // Move on to Program once a parcel has been drawn, and back to Site if it is cleared.
  const advancedRef = useRef(false);

  useEffect(() => {
    if (hasDrawnFootprint && !isDrawing && !advancedRef.current) {
      advancedRef.current = true;

      if (openSection === "site") {
        setVisited((current) => ({ ...current, site: true }));
        setOpenSection("program");
      }
    }

    if (!hasDrawnFootprint && advancedRef.current) {
      advancedRef.current = false;
      setOpenSection("site");
    }
  }, [hasDrawnFootprint, isDrawing, openSection]);

  const stepIndex = openSection ? ORDER.indexOf(openSection) + 1 : null;

  const mitigationParts = [
    permeableSurfacePercent > 0 && `${permeableSurfacePercent}% permeable`,
    greenInfrastructurePercent > 0 &&
      `${greenInfrastructurePercent}% green infra`,
    retentionLevel !== "none" && `${retentionLevel} retention`,
  ].filter(Boolean);

  const liveResult =
    runoff && siteDefined
      ? openSection === "program"
        ? { from: runoff.current, to: runoff.proposed, comparedTo: "current" }
        : openSection === "mitigation"
          ? { from: runoff.proposed, to: runoff.mitigated, comparedTo: "proposed" }
          : null
      : null;

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200/70 bg-white">
      <div className="px-5 pb-3 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
          Inputs
        </p>

        <div className="mt-1 flex items-baseline justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">
            Build your scenario
          </h1>

          {stepIndex && (
            <span className="shrink-0 text-xs text-slate-500">
              Step {stepIndex} of {ORDER.length}
            </span>
          )}
        </div>

        {siteImportedFromRisk && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Site imported from Risk
          </div>
        )}
      </div>

      <div className="mx-5 border-t border-slate-100" />

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <div className="space-y-3">
          <AccordionSection
            number="1"
            title="Site"
            subtitle={
              siteDefined
                ? `${formatPanelArea(projectAreaHa)} ${
                    footprintMode === "draw" ? "drawn" : "defined"
                  }`
                : "Define the project area"
            }
            open={openSection === "site"}
            done={siteDefined}
            onToggle={() => toggleSection("site")}
          >
            <SiteSection
              projectAreaHa={projectAreaHa}
              footprintMode={footprintMode}
              setFootprintMode={setFootprintMode}
              drawShape={drawShape}
              setDrawShape={setDrawShape}
              areaValue={areaValue}
              setAreaValue={setAreaValue}
              areaUnit={areaUnit}
              setAreaUnit={setAreaUnit}
              widthM={widthM}
              setWidthM={setWidthM}
              lengthM={lengthM}
              setLengthM={setLengthM}
              bearing={bearing}
              setBearing={setBearing}
              isDrawing={isDrawing}
              hasDrawnFootprint={hasDrawnFootprint}
              drawnAreaM2={drawnAreaM2}
              onStartDrawing={onStartDrawing}
              onCancelDrawing={onCancelDrawing}
              onClearDrawing={onClearDrawing}
            />
          </AccordionSection>

          <AccordionSection
            number="2"
            title="Program"
            subtitle={`${imperviousPercent}% paved · ${greenPercent}% green · +${additionalPopulation.toLocaleString()} people`}
            open={openSection === "program"}
            done={visited.program}
            onToggle={() => toggleSection("program")}
          >
            <ProgramSection
              scenarioType={scenarioType}
              setScenarioType={setScenarioType}
              imperviousPercent={imperviousPercent}
              setImperviousPercent={setImperviousPercent}
              greenPercent={greenPercent}
              setGreenPercent={setGreenPercent}
              additionalPopulation={additionalPopulation}
              setAdditionalPopulation={setAdditionalPopulation}
            />
          </AccordionSection>

          <AccordionSection
            number="3"
            title="Mitigation"
            subtitle={
              mitigationParts.length > 0
                ? mitigationParts.join(" · ")
                : "Optional. Nothing applied yet"
            }
            open={openSection === "mitigation"}
            done={visited.mitigation}
            onToggle={() => toggleSection("mitigation")}
          >
            <MitigationSection
              imperviousPercent={imperviousPercent}
              permeableSurfacePercent={permeableSurfacePercent}
              setPermeableSurfacePercent={setPermeableSurfacePercent}
              greenInfrastructurePercent={greenInfrastructurePercent}
              setGreenInfrastructurePercent={setGreenInfrastructurePercent}
              retentionLevel={retentionLevel}
              setRetentionLevel={setRetentionLevel}
              effects={mitigationEffects}
            />
          </AccordionSection>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 bg-white px-4 py-3">
        {liveResult && <LiveResult label="Runoff index" {...liveResult} />}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Reset
          </button>

          {openSection === "site" && (
            <button
              type="button"
              disabled={!siteDefined}
              onClick={() => goTo("program")}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next: Program
            </button>
          )}

          {openSection === "program" && (
            <button
              type="button"
              onClick={() => goTo("mitigation")}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Next: Mitigation
            </button>
          )}

          {openSection === "mitigation" && (
            <button
              type="button"
              onClick={() => goTo("program")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}