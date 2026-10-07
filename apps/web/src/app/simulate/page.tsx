"use client";

import { useMemo, useEffect, useState } from "react";
import { circle } from "@turf/circle";

import ScenarioPanel, { ScenarioType } from "@/components/simulate/ScenarioPanel";
import SimulationMap, { SelectedSite } from "@/components/simulate/SimulationMap";
import ImpactPanel from "@/components/simulate/ImpactPanel";
import { SimulationBaseline } from "@/types/simulation";
import { simulateDevelopment, SimulationResult } from "@/lib/simulation";

type RetentionLevel =
  | "none"
  | "low"
  | "moderate"
  | "high";

export default function SimulatePage() {
  const [selectedSite, setSelectedSite] =
    useState<SelectedSite | null>(null);

  const [scenarioType, setScenarioType] =
    useState<ScenarioType>("expansion");

  const [projectAreaHa, setProjectAreaHa] =
    useState(2);

  const [
    imperviousPercent,
    setImperviousPercent,
  ] = useState(65);

  const [greenPercent, setGreenPercent] =
    useState(25);

  const [
    additionalPopulation,
    setAdditionalPopulation,
  ] = useState(1500);

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

  const simulationResult = useMemo(() => {
    return simulateDevelopment({
      baselinePopulation:
        baseline.population,

      floodHazardAverage:
        baseline.floodAverage,

      projectAreaHa,
      imperviousPercent,
      greenPercent,
      additionalPopulation,

      baselineImperviousPercent: 40,
      baselineGreenPercent: 40,

      mitigation: {
        permeableSurfacePercent,
        greenInfrastructurePercent,
        retentionFactor,
      },
    });
  }, [
    baseline.population,
    baseline.floodAverage,
    projectAreaHa,
    imperviousPercent,
    greenPercent,
    additionalPopulation,
    permeableSurfacePercent,
    greenInfrastructurePercent,
    retentionFactor,
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
        <div className="grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)_320px]">
          <ScenarioPanel
            scenarioType={scenarioType}
            setScenarioType={setScenarioType}

            projectAreaHa={projectAreaHa}
            setProjectAreaHa={setProjectAreaHa}

            imperviousPercent={imperviousPercent}
            setImperviousPercent={setImperviousPercent}

            greenPercent={greenPercent}
            setGreenPercent={setGreenPercent}

            additionalPopulation={additionalPopulation}
            setAdditionalPopulation={setAdditionalPopulation}

            permeableSurfacePercent={permeableSurfacePercent}
            setPermeableSurfacePercent={
              setPermeableSurfacePercent
            }

            greenInfrastructurePercent={
              greenInfrastructurePercent
            }
            setGreenInfrastructurePercent={
              setGreenInfrastructurePercent
            }

            retentionLevel={retentionLevel}
            setRetentionLevel={setRetentionLevel}
          />

          {/* Map */}
          <div className="relative min-w-0">
            <SimulationMap
              selectedSite={selectedSite}
              onSelectSite={setSelectedSite}
              projectAreaHa={projectAreaHa}
              imperviousPercent={imperviousPercent}
              greenPercent={greenPercent}
            />
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
          />
        </div>
      </div>
    </main>
  );
}