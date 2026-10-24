"use client";

import { useMemo, useEffect, useState } from "react";
import { circle } from "@turf/circle";
import { area } from "@turf/area";
import centroid from "@turf/centroid";
import center from "@turf/center";
import { useSearchParams } from "next/navigation";

import ScenarioPanel from "@/components/simulate/ScenarioPanel";
import { ScenarioType } from "@/types/simulation";
import SimulationMap, { SelectedSite } from "@/components/simulate/map/SimulationMap";
import ImpactPanel from "@/components/simulate/ImpactPanel";

import type { AreaUnit, FootprintHazardAnalysis, FootprintHazards, FootprintMode, SimulationBaseline } from "@/types/simulation";
import { areaToM2, SimulationView, DrawShape } from "@/types/simulation";
import type { TerrainAnalysis } from "@/types/terrain";
import { LandCoverAnalysis } from "@/types/land-cover";
import type { Footprint } from "@/types/map";

import { simulateDevelopment } from "@/lib/simulation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { createRectangleFootprint } from "@/lib/geometry";
import { buildPlanningAssessment } from "@/lib/planning-assessment";


type RetentionLevel =
  | "none"
  | "low"
  | "moderate"
  | "high";

type HazardOverlay =
  | "flood"
  | "tsunami"
  | "landslide"
  | null;

type HazardKey = "flood" | "tsunami" | "landslide";
type HazardLoad = "idle" | "loading" | "ok" | "error";

const HAZARD_KEYS: HazardKey[] = ["flood", "tsunami", "landslide"];

const IDLE_HAZARD_STATUS: Record<HazardKey, HazardLoad> = {
  flood: "idle",
  tsunami: "idle",
  landslide: "idle",
};

const EMPTY_HAZARDS: FootprintHazards = {
  flood: null,
  tsunami: null,
  landslide: null,
};

const EMPTY_BASELINE: SimulationBaseline = {
  status: "idle",
  population: null,
  populationDensity: null,
  floodAverage: null,
  floodMaximum: null,
  floodCoveragePercent: null,
};

/** Wait this long after the last edit before calling external services. */
const ANALYSIS_DEBOUNCE_MS = 500;

async function fetchFootprintHazard(
  endpoint: string,
  polygon: Footprint,
  parentSignal?: AbortSignal
): Promise<FootprintHazardAnalysis | null> {
  const controller = new AbortController();

  let timedOut = false;

  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 30_000);

  const abortFromParent = () => {
    controller.abort();
  };

  parentSignal?.addEventListener(
    "abort",
    abortFromParent
  );

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        polygon,
        sampleCount: 16,
      }),
      signal: controller.signal,
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
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      if (timedOut) {
        console.warn(
          `[footprint hazard] timed out: ${endpoint}`
        );
      }

      return null;
    }

    console.error(
      `[footprint hazard] failed: ${endpoint}`,
      error
    );

    return null;
  } finally {
    window.clearTimeout(timeoutId);

    parentSignal?.removeEventListener(
      "abort",
      abortFromParent
    );
  }
}

export default function SimulateClient() {
  const [selectedSite, setSelectedSite] =
    useState<SelectedSite | null>(null);

  const [scenarioType, setScenarioType] =
    useState<ScenarioType>("expansion");

  const searchParams =
    useSearchParams();

  const siteImportedFromRisk =
    searchParams.has("lat") &&
    searchParams.has("lon");

  const [footprintMode, setFootprintMode] =
    useState<FootprintMode>("draw");

  const [leftPanelOpen, setLeftPanelOpen] =
    useState(true);

  const [rightPanelOpen, setRightPanelOpen] =
    useState(true);

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
    useState<FootprintHazards>(EMPTY_HAZARDS);

  // Per-hazard load state, so "still loading", "failed" and "no data here"
  // are different things (all three used to be null).
  const [hazardStatus, setHazardStatus] =
    useState<Record<HazardKey, HazardLoad>>(IDLE_HAZARD_STATUS);

  // Which footprint the hazard results belong to. Stops a stale result from
  // looking "ready" for one frame after the site changes.
  const [hazardsFootprint, setHazardsFootprint] =
    useState<GeoJSON.Feature<GeoJSON.Polygon> | null>(null);

  // Bump to re-run every analysis (wired to the Retry buttons).
  const [retryNonce, setRetryNonce] = useState(0);

  const [terrainAnalysis, setTerrainAnalysis] =
    useState<TerrainAnalysis | null>(null);

  const [terrainLoading, setTerrainLoading] =
    useState(false);

  const [terrainError, setTerrainError] =
    useState(false);

  const [landCoverAnalysis, setLandCoverAnalysis] =
    useState<LandCoverAnalysis | null>( null );

  const [landCoverLoading, setLandCoverLoading] =
    useState(false);

  const [landCoverError, setLandCoverError] =
    useState(false);

  const baselineImperviousPercent =
    landCoverAnalysis
      ?.planning
      .builtUpPercent ?? null;

  const baselineGreenPercent =
    landCoverAnalysis
      ?.planning
      .vegetatedPercent ?? null;

  const landCoverReady =
    landCoverAnalysis !== null &&
    !landCoverLoading &&
    !landCoverError;

  const [drawShape, setDrawShape] =
    useState<DrawShape>("rectangle");

  const [
    footprintHazardsLoading,
    setFootprintHazardsLoading,
  ] = useState(false);

  const hazardMapped = {
    flood:
      (footprintHazards.flood?.validSamples ?? 0) > 0,

    tsunami:
      (footprintHazards.tsunami?.validSamples ?? 0) > 0,

    landslide:
      (footprintHazards.landslide?.validSamples ?? 0) > 0,
  };

  const hazardPresent = {
    flood:
      (footprintHazards.flood?.maximum ?? 0) > 0,

    tsunami:
      (footprintHazards.tsunami?.maximum ?? 0) > 0,

    landslide:
      (footprintHazards.landslide?.maximum ?? 0) > 0,
  };

  function handleResetScenario() {
    // Site
    setFootprintMode("draw");
    setDrawShape("rectangle");

    setAreaValue(0);
    setAreaUnit("ha");

    setWidthM(0);
    setLengthM(0);
    setBearing(0);

    setSelectedSite(null);
    setDrawnFootprint(null);
    setIsDrawing(false);

    // Program
    setScenarioType("expansion");
    setImperviousPercent(65);
    setGreenPercent(25);
    setAdditionalPopulation(0);

    // Mitigation
    setPermeableSurfacePercent(0);
    setGreenInfrastructurePercent(0);
    setRetentionLevel("none");

    // Display
    setSimulationView("proposed");
    setHazardOverlay(null);

    // Analysis
    setFootprintHazards({
      flood: null,
      tsunami: null,
      landslide: null,
    });

    setTerrainAnalysis(null);
    setTerrainError(false);
    setTerrainLoading(false);

    setLandCoverAnalysis(null);
    setLandCoverError(false);
    setLandCoverLoading(false);

    setBaseline({
      status: "idle",
      population: null,
      populationDensity: null,
      floodAverage: null,
      floodMaximum: null,
      floodCoveragePercent: null,
    });
  }

  const drawnAreaM2 = useMemo(() => {
    if (!drawnFootprint) return 0;

    return area(drawnFootprint);
  }, [drawnFootprint]);

  const [hazardOverlay, setHazardOverlay] =
    useState<HazardOverlay>(null);

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

  const [baseline, setBaseline] =
    useState<SimulationBaseline>(EMPTY_BASELINE);

  const [
    analysisRadiusMeters,
    setAnalysisRadiusMeters,
  ] = useState<250 | 500 | 1000>(500);


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
      if (
        widthM <= 0 ||
        lengthM <= 0
      ) {
        return null;
      }

      return createRectangleFootprint(
        selectedSite.longitude,
        selectedSite.latitude,
        widthM,
        lengthM,
        bearing
      );
    }

    if (footprintMode === "area") {
      if (projectAreaM2 <= 0) {
        return null;
      }

      const radiusM =
        Math.sqrt(
          projectAreaM2 / Math.PI
        );

      return circle(
        [
          selectedSite.longitude,
          selectedSite.latitude,
        ],
        radiusM / 1000,
        {
          steps: 48,
          units: "kilometers",
        }
      ) as Footprint;
    }

    return null;
  }, [
    footprintMode,
    drawnFootprint,
    selectedSite?.longitude,
    selectedSite?.latitude,
    widthM,
    lengthM,
    bearing,
    projectAreaM2,
  ]);

  // Dragging a slider changes the footprint on every tick. External services
  // only see it once it has settled.
  const analysisFootprint = useDebouncedValue(
    projectFootprint,
    ANALYSIS_DEBOUNCE_MS
  );

  const analysisPending = projectFootprint !== analysisFootprint;

  const analysisAreaM2 = useMemo(
    () => (analysisFootprint ? area(analysisFootprint) : 0),
    [analysisFootprint]
  );

  const projectTerrainCenter = useMemo(() => {
    if (!analysisFootprint) {
      return null;
    }

    const featureCenter =
      center(analysisFootprint);

    return {
      longitude:
        featureCenter.geometry.coordinates[0],
      latitude:
        featureCenter.geometry.coordinates[1],
    };
  }, [analysisFootprint]);

  const projectTerrainRadius =
    useMemo(() => {
      if (!analysisFootprint) {
        return null;
      }

      const equivalentRadiusMeters =
        Math.sqrt(
          analysisAreaM2 / Math.PI
        );

      return Math.max(
        100,
        Math.min(
          equivalentRadiusMeters * 2,
          500
        )
      );
    }, [
      analysisFootprint,
      analysisAreaM2,
    ]);

  const hasDefinedSite =
    projectFootprint !== null;

  const analysisCenter = useMemo(() => {
      if (projectFootprint) {
        const center = centroid(projectFootprint);

        return {
          longitude: center.geometry.coordinates[0],
          latitude: center.geometry.coordinates[1],
        };
      }

      return selectedSite;
    }, [
      projectFootprint,
      selectedSite,
    ]);

  const analysisCircle = useMemo(() => {
    if (!analysisCenter) return null;

    return circle(
      [
        analysisCenter.longitude,
        analysisCenter.latitude,
      ],
      analysisRadiusMeters / 1000,
      {
        steps: 64,
        units: "kilometers",
      }
    );
  }, [
    analysisCenter,
    analysisRadiusMeters,
  ]);

  const debouncedCircle = useDebouncedValue(
    analysisCircle,
    ANALYSIS_DEBOUNCE_MS
  );

  const hasValidFootprint =
    projectAreaM2 > 0 &&
    projectFootprint !== null;

  // Ready once every check has finished, successfully or not. A failed check
  // shows as "Unavailable" with a Retry button instead of an endless spinner
  // (previously, if all three hazard calls failed the panel never appeared).
  const hazardsSettled = HAZARD_KEYS.every(
    (key) =>
      hazardStatus[key] === "ok" ||
      hazardStatus[key] === "error"
  );

  const analysisReady =
    hasValidFootprint &&
    !analysisPending &&
    hazardsFootprint === analysisFootprint &&
    !terrainLoading &&
    !landCoverLoading &&
    hazardsSettled;

  function retryAnalysis() {
    setRetryNonce((n) => n + 1);
  }

  const simulationResult = useMemo(() => {
    return simulateDevelopment({
      baselinePopulation:
        baseline.population,

      projectAreaHa,

      imperviousPercent,
      greenPercent,
      additionalPopulation,

      baselineImperviousPercent:
        baselineImperviousPercent ?? 0,

      baselineGreenPercent:
        baselineGreenPercent ?? 0,

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

    baselineImperviousPercent,
    baselineGreenPercent,

    permeableSurfacePercent,
    greenInfrastructurePercent,
    retentionFactor,
  ]);

  const planningAssessment = useMemo(() => {
    return buildPlanningAssessment({
      projectAreaM2,

      imperviousPercent,
      baselineImperviousPercent:
        baselineImperviousPercent ?? 0,

      greenPercent,
      baselineGreenPercent:
        baselineGreenPercent ?? 0,

      additionalPopulation,

      runoffCurrent:
        simulationResult.baselineRunoffPressure,

      runoffProposed:
        simulationResult.scenarioRunoffPressure,

      runoffMitigated:
        simulationResult.mitigatedRunoffPressure,

      runoffChangePercent:
        simulationResult.runoffChangePercent,

      mitigationReductionPercent:
        simulationResult.mitigationReductionPercent,

      nearbyPopulation: baseline.population,

      hazards: footprintHazards,

      terrain: terrainAnalysis,
    });
  }, [
    projectAreaM2,
    imperviousPercent,
    greenPercent,
    additionalPopulation,

    baselineImperviousPercent,
    baselineGreenPercent,

    simulationResult,
    baseline.population,

    footprintHazards,
    terrainAnalysis,
  ]);

  const hasMitigation =
    permeableSurfacePercent > 0 ||
    greenInfrastructurePercent > 0 ||
    retentionLevel !== "none";

    useEffect(() => {
      if (
        simulationView === "mitigated" &&
        !hasMitigation
      ) {
        setSimulationView("proposed");
      }
    }, [
      simulationView,
      hasMitigation,
    ]);

    useEffect(() => {
      const latParam =
        searchParams.get("lat");

      const lonParam =
        searchParams.get("lon");

      if (
        latParam === null ||
        lonParam === null
      ) {
        return;
      }

      const latitude =
        Number(latParam);

      const longitude =
        Number(lonParam);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return;
      }

      setSelectedSite({
        latitude,
        longitude,
      });
    }, [searchParams]);

    useEffect(() => {
      if (!debouncedCircle) {
        setBaseline(EMPTY_BASELINE);

        return;
      }

      const controller = new AbortController();

      async function loadBaseline() {
        // Clear the previous site's numbers while the new ones load.
        setBaseline({ ...EMPTY_BASELINE, status: "loading" });

        try {
          const [
            populationResult,
            floodResult,
          ] = await Promise.allSettled([
            fetch("/api/population/exposure", {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                polygon: debouncedCircle,
                radiusMeters:
                  analysisRadiusMeters,
              }),
              signal: controller.signal,
            }).then(async (response) => {
              if (!response.ok) {
                throw new Error(
                  "Population request failed"
                );
              }

              return response.json();
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
                  polygon: debouncedCircle,
                  radiusMeters:
                    analysisRadiusMeters,
                }),
                signal: controller.signal,
              }
            ).then(async (response) => {
              if (!response.ok) {
                throw new Error(
                  "Flood context request failed"
                );
              }

              return response.json();
            }),
          ]);

          const populationData =
            populationResult.status ===
            "fulfilled"
              ? populationResult.value
              : null;

          const floodData =
            floodResult.status === "fulfilled"
              ? floodResult.value
              : null;

          const population =
            typeof populationData?.population ===
            "number"
              ? populationData.population
              : null;

          const radiusKm =
            analysisRadiusMeters / 1000;

          const areaKm2 =
            Math.PI *
            radiusKm *
            radiusKm;

          const populationDensity =
            population !== null &&
            areaKm2 > 0
              ? population / areaKm2
              : null;

          setBaseline({
            status:
              populationData || floodData
                ? "success"
                : "error",

            population,

            populationDensity,

            floodAverage:
              typeof floodData?.average ===
              "number"
                ? floodData.average
                : null,

            floodMaximum:
              typeof floodData?.maximum ===
              "number"
                ? floodData.maximum
                : null,

            // The area route reports validSamples / totalSamples, so derive the
            // percentage when coveragePercent is absent. It used to read only
            // coveragePercent, which never existed, so this was always null.
            floodCoveragePercent:
              typeof floodData?.coveragePercent === "number"
                ? floodData.coveragePercent
                : typeof floodData?.validSamples === "number" &&
                    typeof floodData?.totalSamples === "number" &&
                    floodData.totalSamples > 0
                  ? (floodData.validSamples / floodData.totalSamples) * 100
                  : null,
          });
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }

          console.error(
            "Baseline analysis failed:",
            error
          );

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
    }, [
      debouncedCircle,
      analysisRadiusMeters,
      retryNonce,
    ]);

  useEffect(() => {
    if (!analysisFootprint) {
      setFootprintHazards(EMPTY_HAZARDS);
      setHazardStatus(IDLE_HAZARD_STATUS);
      setHazardsFootprint(null);
      setFootprintHazardsLoading(false);
      return;
    }

    const controller = new AbortController();
    const footprint = analysisFootprint;
    let cancelled = false;

    setFootprintHazards(EMPTY_HAZARDS);
    setHazardStatus({
      flood: "loading",
      tsunami: "loading",
      landslide: "loading",
    });
    setHazardsFootprint(footprint);
    setFootprintHazardsLoading(true);

    async function loadHazard(key: HazardKey) {
      const result = await fetchFootprintHazard(
        `/api/bnpb/${key}-hazard/footprint`,
        footprint,
        controller.signal
      );

      if (cancelled) return;

      setFootprintHazards((current) => ({
        ...current,
        [key]: result,
      }));

      setHazardStatus((current) => ({
        ...current,
        [key]: result ? "ok" : "error",
      }));
    }

    Promise.allSettled(HAZARD_KEYS.map(loadHazard)).finally(() => {
      if (!cancelled) {
        setFootprintHazardsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [analysisFootprint, retryNonce]);

  useEffect(() => {
    if (
      !projectTerrainCenter ||
      !projectTerrainRadius
    ) {
      setTerrainAnalysis(null);
      setTerrainLoading(false);
      setTerrainError(false);

      return;
    }

    const controller =
      new AbortController();

    async function loadTerrain() {
      setTerrainLoading(true);
      setTerrainError(false);

      try {
        const response =
          await fetch(
            "/api/terrain/analyse",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                longitude:
                  projectTerrainCenter?.longitude,
                latitude:
                  projectTerrainCenter?.latitude,
                radiusMeters:
                  projectTerrainRadius,
              }),
              signal:
                controller.signal,
            }
          );

        if (!response.ok) {
          throw new Error(
            "Terrain analysis failed"
          );
        }

        const data:
          TerrainAnalysis =
          await response.json();

        setTerrainAnalysis(data);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Simulation terrain analysis failed:",
          error
        );

        setTerrainAnalysis(null);
        setTerrainError(true);
      } finally {
        // An aborted request must not clear the loading flag of the newer one.
        if (!controller.signal.aborted) {
          setTerrainLoading(false);
        }
      }
    }

    loadTerrain();

    return () => {
      controller.abort();
    };
  }, [
    projectTerrainCenter,
    projectTerrainRadius,
    retryNonce,
  ]);

  useEffect(() => {
    if (!analysisFootprint) {
      setLandCoverAnalysis(null);
      setLandCoverError(false);
      setLandCoverLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadLandCover() {
      setLandCoverLoading(true);
      setLandCoverError(false);

      try {
        const response = await fetch("/api/land-cover/analyse",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              polygon: analysisFootprint,
            }),

            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error (
            "Land cover analysis failed!"
          );
        }

        const data: LandCoverAnalysis = await response.json();

        setLandCoverAnalysis(data);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Land cover analysis error:",
          error
        );

        setLandCoverAnalysis(null);
        setLandCoverError(true);
      } finally {
        if (!controller.signal.aborted) {
          setLandCoverLoading(false);
        }
      }
    }

    loadLandCover();

    return () => {
      controller.abort();
    };
  }, [analysisFootprint, retryNonce]);

  return (
    <main className="h-[calc(100vh-64px)] bg-slate-50">
      <div className="flex h-full min-h-0 w-full overflow-hidden">
        {/* Workspace */}
        
        <div
          className={`
            relative shrink-0 border-r border-slate-200 bg-white
            ${leftPanelOpen ? "w-[340px]" : "w-10"}
          `}
        >
          <div className="h-full overflow-y-auto">
            {leftPanelOpen ? (
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

                siteImportedFromRisk={siteImportedFromRisk}
                onReset={handleResetScenario}
              />
            ) : (
              <div className="flex h-full items-start justify-center pt-16">
                <span className="rotate-[-90deg] whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Scenario
                </span>
              </div>
            )}
          </div>
          

          <button
            type="button"
            onClick={() =>
              setLeftPanelOpen((open) => !open)
            }
            className="
              absolute right-[-14px] top-5 z-50
              flex h-7 w-7 items-center justify-center
              rounded-full border border-slate-200
              bg-white text-sm text-slate-600
              shadow-sm transition
              hover:bg-slate-50
            "
            aria-label={
              leftPanelOpen
                ? "Collapse scenario panel"
                : "Expand scenario panel"
            }
          >
            {leftPanelOpen ? "‹" : "›"}
          </button>
        </div>

        {/* Map */}
        <div className="relative min-w-0 flex-1">
          <SimulationMap
            selectedSite={selectedSite}
            onSelectSite={setSelectedSite}
            projectAreaHa={projectAreaHa}
            footprintMode={footprintMode}
            widthM={widthM}
            lengthM={lengthM}
            projectFootprint={projectFootprint}
            setDrawnFootprint={setDrawnFootprint}
            hasDefinedSite={hasDefinedSite}
            isDrawing={isDrawing}
            setIsDrawing={setIsDrawing}
            drawShape={drawShape}
            imperviousPercent={imperviousPercent}
            greenPercent={greenPercent}
            permeableSurfacePercent={permeableSurfacePercent}
            greenInfrastructurePercent={greenInfrastructurePercent}
            retentionLevel={retentionLevel}
            simulationView={simulationView}
            analysisCircle={analysisCircle}
            hazardMapped={hazardMapped}
            hazardPresent={hazardPresent}
            hazardOverlay={hazardOverlay}
            setHazardOverlay={setHazardOverlay}
          />
        </div>

       <div
          className={`
            relative shrink-0 border-l border-slate-200 bg-white
            ${rightPanelOpen ? "w-[380px]" : "w-12"}
          `}
        >
          <div className="h-full overflow-y-auto">
            {rightPanelOpen ? (    
              <ImpactPanel
                projectAreaHa={projectAreaHa}
                imperviousPercent={imperviousPercent}
                greenPercent={greenPercent}
                additionalPopulation={additionalPopulation}

                baseline={baseline}
                simulation={simulationResult}

                baselineImperviousPercent={
                  baselineImperviousPercent ?? 0
                }
                baselineGreenPercent={
                  baselineGreenPercent ?? 0
                }

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
                onRetryAnalysis={retryAnalysis}
                hasValidFootprint={hasValidFootprint}
                analysisReady={analysisReady}

                analysisRadiusMeters={analysisRadiusMeters}
                setAnalysisRadiusMeters={
                  setAnalysisRadiusMeters
                }

                terrainAnalysis={terrainAnalysis}
                terrainLoading={terrainLoading}
                terrainError={terrainError}
                terrainRadiusMeters={
                  projectTerrainRadius
                }

                landCoverAnalysis={landCoverAnalysis}
                landCoverLoading={landCoverLoading}
                landCoverError={landCoverError}
                simulationView={simulationView}
                setSimulationView={setSimulationView}
              />
            ) : (
              <div className="flex h-full items-start justify-center pt-16">
                <span className="rotate-90 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Impact
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setRightPanelOpen((open) => !open)
            }
            className="
              absolute left-[-14px] top-5 z-50
              flex h-7 w-7 items-center justify-center
              rounded-full border border-slate-200
              bg-white text-sm text-slate-600
              shadow-sm transition
              hover:bg-slate-50
            "
            aria-label={
              rightPanelOpen
                ? "Collapse impact panel"
                : "Expand impact panel"
            }
          >
            {rightPanelOpen ? "›" : "‹"}
          </button>
        </div>

      </div>
    </main>
  );
}