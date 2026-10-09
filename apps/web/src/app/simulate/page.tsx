"use client";

import { useMemo, useEffect, useState } from "react";
import { circle } from "@turf/circle";
import { area } from "@turf/area";

import ScenarioPanel, { ScenarioType } from "@/components/simulate/ScenarioPanel";
import SimulationMap, { SelectedSite } from "@/components/simulate/SimulationMap";
import ImpactPanel from "@/components/simulate/ImpactPanel";
import type { AreaUnit, FootprintHazardAnalysis, FootprintHazards, FootprintMode, SimulationBaseline } from "@/types/simulation";
import { areaToM2 } from "@/types/simulation";
import { simulateDevelopment } from "@/lib/simulation";
import { createRectangleFootprint } from "@/lib/geometry";
import { buildPlanningAssessment } from "@/lib/planning-assessment";

const BASELINE_LAND_COVER = {
  imperviousPercent: 40,
  greenPercent: 40,
} as const;

type RetentionLevel =
  | "none"
  | "low"
  | "moderate"
  | "high";

export type SimulationView =
  | "current"
  | "proposed"
  | "mitigated";

async function fetchFootprintHazard(
  endpoint: string,
  polygon: GeoJSON.Feature<GeoJSON.Polygon>
): Promise<FootprintHazardAnalysis | null> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      polygon,
      sampleCount: 25,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  const validSamples =
    typeof data.validSamples === "number"
      ? data.validSamples
      : 0;

  const totalSamples =
    typeof data.totalSamples === "number"
      ? data.totalSamples
      : 0;

  return {
    average:
      typeof data.average === "number"
        ? data.average
        : null,

    maximum:
      typeof data.maximum === "number"
        ? data.maximum
        : null,

    validSamples,
    totalSamples,

    coveragePercent:
      totalSamples > 0
        ? (validSamples / totalSamples) * 100
        : 0,
  };
}

export default function SimulatePage() {
  const [selectedSite, setSelectedSite] =
    useState<SelectedSite | null>(null);

  const [scenarioType, setScenarioType] =
    useState<ScenarioType>("expansion");

  const [footprintMode, setFootprintMode] =
    useState<FootprintMode>("area");

  const [areaValue, setAreaValue] =
    useState(0);

  const [areaUnit, setAreaUnit] =
    useState<AreaUnit>("ha");

  const [widthM, setWidthM] =
    useState(0);

  const [lengthM, setLengthM] =
    useState(0);

  const [bearing, setBearing] = useState(0);

  const [isDrawing, setIsDrawing] = useState(false);

  const [drawnFootprint, setDrawnFootprint] =
    useState<GeoJSON.Feature<GeoJSON.Polygon> | null>(null);

  const [footprintHazards, setFootprintHazards] =
    useState<FootprintHazards>({
      flood: null,
      tsunami: null,
      landslide: null,
    });

  const [
    footprintHazardsLoading,
    setFootprintHazardsLoading,
  ] = useState(false);

  const drawnAreaM2 = useMemo(() => {
    if (!drawnFootprint) return 0;

    return area(drawnFootprint);
  }, [drawnFootprint]);

  const projectAreaM2 =
    footprintMode === "dimensions"
      ? widthM * lengthM
      : footprintMode === "draw"
        ? drawnAreaM2
        : areaToM2(areaValue, areaUnit);

  const projectAreaHa =
    projectAreaM2 / 10_000;

  const [
    imperviousPercent,
    setImperviousPercent,
  ] = useState(65);

  const [greenPercent, setGreenPercent] =
    useState(25);

  const [
    additionalPopulation,
    setAdditionalPopulation,
  ] = useState(0);

  const [
    permeableSurfacePercent,
    setPermeableSurfacePercent,
  ] = useState(0);

  const [
    greenInfrastructurePercent,
    setGreenInfrastructurePercent,
  ] = useState(0);

  const [
    retentionLevel,
    setRetentionLevel,
  ] = useState<RetentionLevel>("none");

  const [simulationView, setSimulationView] =
  useState<SimulationView>("proposed");

  const analysisCircle = useMemo(() => {
    if (!selectedSite) return null;

    return circle(
      [
        selectedSite.longitude,
        selectedSite.latitude,
      ],
      0.5,
      {
        steps: 64,
        units: "kilometers",
      }
    );
  }, [selectedSite]);

  const [baseline, setBaseline] =
    useState<SimulationBaseline>({
      status: "idle",
      population: null,
      populationDensity: null,
      floodAverage: null,
      floodMaximum: null,
      floodCoveragePercent: null,
    });

  const retentionFactor = {
    none: 0,
    low: 0.1,
    moderate: 0.2,
    high: 0.3,
  }[retentionLevel];

  const projectFootprint = useMemo(() => {
    if (footprintMode === "draw") {
      return drawnFootprint;
    }

    if (!selectedSite) {
      return null;
    }

    if (footprintMode === "dimensions") {
      return createRectangleFootprint(
        selectedSite.longitude,
        selectedSite.latitude,
        widthM,
        lengthM,
        bearing
      );
    }

    const radiusMeters = Math.sqrt(
      (projectAreaHa * 10_000) / Math.PI
    );

    return circle(
      [
        selectedSite.longitude,
        selectedSite.latitude,
      ],
      radiusMeters / 1000,
      {
        steps: 64,
        units: "kilometers",
      }
    );
  }, [
    footprintMode,
    drawnFootprint,
    selectedSite,
    widthM,
    lengthM,
    bearing,
    projectAreaHa,
  ]);

  const hasValidFootprint =
    projectAreaM2 > 0 &&
    projectFootprint !== null;

  const analysisReady =
    hasValidFootprint &&
    !footprintHazardsLoading;

  const simulationResult = useMemo(() => {
    return simulateDevelopment({
      baselinePopulation:
        baseline.population,

      projectAreaHa,

      imperviousPercent,
      greenPercent,
      additionalPopulation,

      baselineImperviousPercent:
        BASELINE_LAND_COVER.imperviousPercent,

      baselineGreenPercent:
        BASELINE_LAND_COVER.greenPercent,

      mitigation: {
        permeableSurfacePercent,
        greenInfrastructurePercent,
        retentionFactor,
      },
    });
  }, [
    baseline.population,
    projectAreaHa,
    imperviousPercent,
    greenPercent,
    additionalPopulation,
    permeableSurfacePercent,
    greenInfrastructurePercent,
    retentionFactor,
  ]);

  const planningAssessment = useMemo(() => {
    return buildPlanningAssessment({
      projectAreaM2,

      imperviousPercent,
      baselineImperviousPercent:
        BASELINE_LAND_COVER.imperviousPercent,

      greenPercent,
      baselineGreenPercent:
        BASELINE_LAND_COVER.greenPercent,

      additionalPopulation,

      runoffChangePercent:
        simulationResult.runoffChangePercent,

      mitigationReductionPercent:
        simulationResult.mitigationReductionPercent,

      hazards: footprintHazards,
    });
  }, [
    projectAreaM2,
    imperviousPercent,
    greenPercent,
    additionalPopulation,
    simulationResult.runoffChangePercent,
    simulationResult.mitigationReductionPercent,
    footprintHazards,
  ]);

    useEffect(() => {
      if (!analysisCircle) {
        setBaseline({
          status: "idle",
          population: null,
          populationDensity: null,
          floodAverage: null,
          floodMaximum: null,
          floodCoveragePercent: null,
        });

        return;
      }

      const controller = new AbortController();

      async function loadBaseline() {
        setBaseline((current) => ({
          ...current,
          status: "loading",
        }));

        try {
          const [populationResponse, floodResponse] =
            await Promise.all([
              fetch("/api/population/exposure", {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  polygon: analysisCircle,
                  year: 2025,
                }),
                signal: controller.signal,
              }),

              fetch(
                "/api/bnpb/flood-hazard/area",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    polygon: analysisCircle,
                    sampleCount: 25,
                  }),
                  signal: controller.signal,
                }
              ),
            ]);

          if (
            !populationResponse.ok ||
            !floodResponse.ok
          ) {
            throw new Error(
              "Unable to load baseline"
            );
          }

          const populationData =
            await populationResponse.json();

          const floodData =
            await floodResponse.json();

          const population =
            typeof populationData.population ===
            "number"
              ? populationData.population
              : null;

          const areaKm2 =
            Math.PI * 0.5 * 0.5;

          const density =
            population !== null
              ? population / areaKm2
              : null;

          const coverage =
            floodData.totalSamples > 0
              ? Math.round(
                  (floodData.validSamples /
                    floodData.totalSamples) *
                    100
                )
              : null;

          setBaseline({
            status: "success",

            population,

            populationDensity: density,

            floodAverage:
              typeof floodData.average ===
              "number"
                ? floodData.average
                : null,

            floodMaximum:
              typeof floodData.maximum ===
              "number"
                ? floodData.maximum
                : null,

            floodCoveragePercent: coverage,
          });
        } catch (error) {
          if (
            error instanceof Error &&
            error.name === "AbortError"
          ) {
            return;
          }

          setBaseline((current) => ({
            ...current,
            status: "error",
          }));
        }
      }

      loadBaseline();

      return () => {
        controller.abort();
      };
    }, [analysisCircle]);

    useEffect(() => {
      if (!projectFootprint) {
        setFootprintHazards({
          flood: null,
          tsunami: null,
          landslide: null,
        });

        return;
      }

      const footprint = projectFootprint;

      let cancelled = false;

      async function analyseFootprint() {
        setFootprintHazardsLoading(true);

        try {
          const [flood, tsunami, landslide] =
            await Promise.all([
              fetchFootprintHazard(
                "/api/bnpb/flood-hazard/footprint",
                footprint
              ),

              fetchFootprintHazard(
                "/api/bnpb/tsunami-hazard/footprint",
                footprint
              ),

              fetchFootprintHazard(
                "/api/bnpb/landslide-hazard/footprint",
                footprint
              ),
            ]);

          if (cancelled) return;

          setFootprintHazards({
            flood,
            tsunami,
            landslide,
          });
        } catch (error) {
          console.error(
            "Footprint hazard analysis failed",
            error
          );

          if (!cancelled) {
            setFootprintHazards({
              flood: null,
              tsunami: null,
              landslide: null,
            });
          }
        } finally {
          if (!cancelled) {
            setFootprintHazardsLoading(false);
          }
        }
      }

      analyseFootprint();

      return () => {
        cancelled = true;
      };
    }, [projectFootprint]);

  return (
    <main className="h-[calc(100vh-73px)] bg-slate-50">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Scenario simulator
          </p>

          <div className="mt-1 flex items-end justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Shape the site. See the impact.
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Explore how development choices may
                change runoff, green space, and
                population exposure.
              </p>
            </div>

            <div className="hidden items-center gap-2 text-xs text-slate-400 md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live scenario
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)_360px]">
          <ScenarioPanel
            scenarioType={scenarioType}
            setScenarioType={
              setScenarioType
            }

            projectAreaHa={
              projectAreaHa
            }

            footprintMode={
              footprintMode
            }
            setFootprintMode={
              setFootprintMode
            }

            areaValue={areaValue}
            setAreaValue={setAreaValue}

            areaUnit={areaUnit}
            setAreaUnit={setAreaUnit}

            widthM={widthM}
            setWidthM={setWidthM}

            lengthM={lengthM}
            setLengthM={setLengthM}

            imperviousPercent={
              imperviousPercent
            }
            setImperviousPercent={
              setImperviousPercent
            }

            greenPercent={
              greenPercent
            }
            setGreenPercent={
              setGreenPercent
            }

            additionalPopulation={
              additionalPopulation
            }
            setAdditionalPopulation={
              setAdditionalPopulation
            }

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

            bearing = {bearing}
            setBearing= {setBearing}
            isDrawing={isDrawing}
            hasDrawnFootprint={drawnFootprint !== null}
            drawnAreaM2={drawnAreaM2}

            onStartDrawing={() => {
              setDrawnFootprint(null);
              setFootprintMode("draw");
              setIsDrawing(true);
            }}

            onCancelDrawing={() => {
              setIsDrawing(false);
            }}

            onClearDrawing={() => {
              setIsDrawing(false);
              setDrawnFootprint(null);
            }}
          />

          {/* Map */}
          <div className="relative min-w-0">
            <SimulationMap
              selectedSite={selectedSite}
              onSelectSite={setSelectedSite}

              projectAreaHa={projectAreaHa}

              footprintMode={footprintMode}

              widthM={widthM}
              lengthM={lengthM}
              bearing={bearing}

              projectFootprint={projectFootprint}

              setDrawnFootprint={setDrawnFootprint}

              isDrawing={isDrawing}
              setIsDrawing={setIsDrawing}

              imperviousPercent={imperviousPercent}
              greenPercent={greenPercent}

              simulationView={simulationView}
            />
            <div className="absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
              <div className="flex gap-1">
                {(["current", "proposed", "mitigated"] as const).map(
                  (view) => (
                    <button
                      key={view}
                      onClick={() => setSimulationView(view)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${
                        simulationView === view
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {view}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <ImpactPanel
            projectAreaHa={projectAreaHa}
            imperviousPercent={imperviousPercent}
            greenPercent={greenPercent}
            additionalPopulation={additionalPopulation}

            baseline={baseline}
            simulation={simulationResult}

            permeableSurfacePercent={
              permeableSurfacePercent
            }
            greenInfrastructurePercent={
              greenInfrastructurePercent
            }
            retentionLevel={retentionLevel}

            footprintHazards={footprintHazards}
            footprintHazardsLoading={
              footprintHazardsLoading
            }

            assessment={planningAssessment}
            hasValidFootprint={hasValidFootprint}
            analysisReady={analysisReady}

          />
        </div>
      </div>
    </main>
  );
}