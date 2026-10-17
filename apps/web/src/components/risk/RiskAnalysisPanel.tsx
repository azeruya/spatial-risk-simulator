import Link from "next/link";

import {
  buildLocationUrl
} from "@/lib/navigation";

import HazardAssessment from "./HazardAssessment";
import TerrainSummary from "./TerrainSummary";

import type {
  SelectedPoint,
  SiteHazards,
  AreaHazards,
  AnalysisRadius,
  PopulationExposure,
} from "@/types/risk";

import type {
  TerrainAnalysis
} from "@/types/terrain";

type RiskAnalysisPanelProps = {
  selectedPoint: SelectedPoint;

  radius: AnalysisRadius;

  setRadius:
    (radius: AnalysisRadius) => void;

  hazards: SiteHazards;

  areaHazards: AreaHazards;

  populationExposure:
    PopulationExposure;

  terrainAnalysis:
    TerrainAnalysis | null;

  terrainLoading: boolean;

  terrainError: boolean;

  hazardSummary: string;

  keyConcern: string;
};

export default function RiskAnalysisPanel({
  selectedPoint,
  radius,
  setRadius,
  hazards,
  areaHazards,
  populationExposure,
  terrainAnalysis,
  terrainLoading,
  terrainError,
  hazardSummary,
  keyConcern,
}: RiskAnalysisPanelProps) {
  return (
    <aside className="risk-analysis-panel w-[350px] shrink-0 overflow-y-auto border-l border-slate-200 bg-white">
      <div className="p-4">
        {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Site analysis
        </p>
    
        <p className="mt-1 text-sm font-medium text-slate-900">
          Multi-hazard profile
        </p>
      </div>
    
      {/* Location */}
      <div className="mt-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Selected location
        </p>
    
        <div className="mt-2 grid grid-cols-2 gap-2">
          <ResultStat
            label="Longitude"
            value={selectedPoint.longitude.toFixed(5)}
          />
    
          <ResultStat
            label="Latitude"
            value={selectedPoint.latitude.toFixed(5)}
          />
        </div>
      </div>
    
      {/* Radius */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-600">
            Surrounding context
          </p>
    
          
        </div>
    
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[250, 500, 1000].map((value) => (
            <button
              key={value}
              onClick={() =>
                setRadius(value as AnalysisRadius)
              }
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                radius === value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {value === 1000
                ? "1 km"
                : `${value} m`}
            </button>
          ))}
        </div>
      </div>
    
      {/* Hazards */}
      <div className="mt-5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Hazard assessment
        </p>
    
        <div className="mt-2 rounded-xl border border-slate-200 px-3">
          <HazardAssessment
            name="Flood"
            point={hazards.flood}
            area={areaHazards.flood}
            radius={radius}
          />
    
          <HazardAssessment
            name="Tsunami"
            point={hazards.tsunami}
            area={areaHazards.tsunami}
            radius={radius}
          />
    
          <HazardAssessment
            name="Landslide"
            point={hazards.landslide}
            area={areaHazards.landslide}
            radius={radius}
          />
    
          <HazardAssessment
            name="Earthquake"
            point={hazards.earthquake}
            radius={radius}
          />
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Terrain context
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Elevation and slope within the selected radius.
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
    
      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Exposure
          </p>
    
          <span className="text-[10px] text-slate-400">
            WorldPop 2025
          </span>
        </div>
    
        {populationExposure.status ===
          "loading" && (
          <div className="mt-2 rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500">
              Estimating population within the selected area...
            </p>
          </div>
        )}
    
        {populationExposure.status ===
          "success" && (
          <div className="mt-2 rounded-xl border border-slate-200 p-3">
            <div className="grid grid-cols-3 gap-3">
              <AreaMetric
                label="Population"
                value={
                  populationExposure.population !==
                  null
                    ? Math.round(
                        populationExposure.population
                      ).toLocaleString()
                    : "—"
                }
              />
    
              <AreaMetric
                label="Density"
                value={
                  populationExposure.densityPerKm2 !==
                  null
                    ? `${Math.round(
                        populationExposure.densityPerKm2
                      ).toLocaleString()}/km²`
                    : "—"
                }
              />
    
              <AreaMetric
                label="Area"
                value={
                  populationExposure.areaKm2 !==
                  null
                    ? `${populationExposure.areaKm2.toFixed(
                        2
                      )} km²`
                    : "—"
                }
              />
            </div>
          </div>
        )}
    
        {populationExposure.status ===
          "error" && (
          <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-xs text-amber-700">
              Population data temporarily unavailable.
            </p>
          </div>
        )}
      </div>
    
      {/* Site summary */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Site summary
        </p>
    
        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Mapped hazard context
            </p>
    
            <p className="mt-1 text-xs leading-5 text-slate-700">
              {hazardSummary}
            </p>
          </div>
    
          <div className="mt-3 border-t border-slate-200 pt-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Key concern
            </p>
    
            <p className="mt-1 text-xs font-medium leading-5 text-slate-800">
              {keyConcern}
            </p>
          </div>
        </div>
      </div>
    
      {/* Continue to simulation */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Next step
        </p>
    
        <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
          <p className="text-xs font-semibold text-slate-800">
            Test a development scenario
          </p>
    
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            Continue with this exact location and explore
            how a proposed development could change runoff,
            green space, and population exposure.
          </p>
    
          <Link
            href={buildLocationUrl(
              "/simulate",
              selectedPoint.latitude,
              selectedPoint.longitude
            )}
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            Simulate development here →
          </Link>
        </div>
      </div>
    
      {/* Source note */}
      <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] leading-4 text-slate-400">
        Source: BNPB InaRISK. Center-point values represent
        the raster cell at the selected location. Area
        statistics summarize valid raster samples within the
        selected radius.
      </p>
      </div>
    </aside>
  );
}

function ResultStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5">
      <p className="text-[11px] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

function AreaMetric({
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

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}