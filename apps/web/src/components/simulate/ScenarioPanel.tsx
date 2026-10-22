"use client";

import { useState } from "react";
import { FootprintMode, AreaUnit, DrawShape, ScenarioType, RetentionLevel } from "@/types/simulation";
import { AccordionSection } from "./scenario/ScenarioControls";
import { SiteSection, formatPanelArea } from "./scenario/SiteSection";
import { ProgramSection } from "./scenario/ProgramSection";
import { MitigationSection } from "./scenario/MitigationSection";

type ScenarioPanelProps = {
  scenarioType: ScenarioType;
  setScenarioType: (
    value: ScenarioType
  ) => void;

  // Derived project area
  projectAreaHa: number;

  // Footprint input mode
  footprintMode: FootprintMode;
  setFootprintMode: (
    value: FootprintMode
  ) => void;

  drawShape: DrawShape;
  setDrawShape: (value: DrawShape) => void;

  // Area mode
  areaValue: number;
  setAreaValue: (
    value: number
  ) => void;

  areaUnit: AreaUnit;
  setAreaUnit: (
    value: AreaUnit
  ) => void;

  // Dimensions mode
  widthM: number;
  setWidthM: (
    value: number
  ) => void;

  lengthM: number;
  setLengthM: (
    value: number
  ) => void;

  // Existing development inputs
  imperviousPercent: number;
  setImperviousPercent: (
    value: number
  ) => void;

  greenPercent: number;
  setGreenPercent: (
    value: number
  ) => void;

  additionalPopulation: number;
  setAdditionalPopulation: (
    value: number
  ) => void;

  // Mitigation
  permeableSurfacePercent: number;
  setPermeableSurfacePercent:
    (value: number) => void;

  greenInfrastructurePercent: number;
  setGreenInfrastructurePercent:
    (value: number) => void;

  retentionLevel: RetentionLevel;
  setRetentionLevel:
    (value: RetentionLevel) => void;

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
}: ScenarioPanelProps) {
  const [openSection, setOpenSection] = useState<
    "site" | "program" | "mitigation" | null
  >("site");

  function toggleSection(
    section: "site" | "program" | "mitigation"
  ) {
    setOpenSection((current) =>
      current === section ? null : section
    );
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200/70 bg-white">
      {/* HEADER */}
      <div className="px-5 pb-4 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">
          Inputs
        </p>

        <h1 className="mt-1.5 text-[19px] font-semibold tracking-tight text-slate-950">
          Build your scenario
        </h1>

        <p className="mt-1.5 max-w-[270px] text-[11px] leading-[1.55] text-slate-500">
          Define the site, development program,
          and mitigation strategy.
        </p>

        {siteImportedFromRisk && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Site imported from Risk
          </div>
        )}
      </div>

      {/* subtle divider */}
      <div className="mx-5 border-t border-slate-100" />

      {/* SCROLLABLE INPUTS */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-5">
        <div className="space-y-4">
          <AccordionSection
            number="1"
            title="Site"
            subtitle={
              hasDrawnFootprint
                ? `${formatPanelArea(projectAreaHa)} footprint defined`
                : "Define the project footprint"
            }
            open={openSection === "site"}
            onToggle={() =>
              toggleSection("site")
            }
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
            subtitle={`${imperviousPercent}% impervious · ${greenPercent}% green · +${additionalPopulation.toLocaleString()} occupants`}
            open={openSection === "program"}
            onToggle={() =>
              toggleSection("program")
            }
          >
            <ProgramSection
              scenarioType={scenarioType}
              setScenarioType={setScenarioType}
              imperviousPercent={imperviousPercent}
              setImperviousPercent={
                setImperviousPercent
              }
              greenPercent={greenPercent}
              setGreenPercent={
                setGreenPercent
              }
              additionalPopulation={
                additionalPopulation
              }
              setAdditionalPopulation={
                setAdditionalPopulation
              }
            />
          </AccordionSection>

          <AccordionSection
            number="3"
            title="Mitigation"
            subtitle={
              permeableSurfacePercent > 0 ||
              greenInfrastructurePercent > 0 ||
              retentionLevel !== "none"
                ? "Mitigation configured"
                : "Optional second-stage controls"
            }
            open={
              openSection === "mitigation"
            }
            onToggle={() =>
              toggleSection("mitigation")
            }
          >
            <MitigationSection
              permeableSurfacePercent={
                permeableSurfacePercent
              }
              setPermeableSurfacePercent={
                setPermeableSurfacePercent
              }
              greenInfrastructurePercent={
                greenInfrastructurePercent
              }
              setGreenInfrastructurePercent={
                setGreenInfrastructurePercent
              }
              retentionLevel={
                retentionLevel
              }
              setRetentionLevel={
                setRetentionLevel
              }
            />
          </AccordionSection>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onReset}
          className="
            w-full rounded-xl
            border border-slate-200
            bg-white
            px-4 py-2
            text-xs font-medium text-slate-600
            transition
            hover:border-slate-300
            hover:bg-slate-50
            hover:text-slate-900
          "
        >
          Reset scenario
        </button>
      </div>
    </aside>
  );
}