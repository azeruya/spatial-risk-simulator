"use client";

import NextStepCard from "@/components/shell/NextStepCard";
import Segmented from "@/components/ui/Segmented";
import { buildLocationUrl } from "@/lib/navigation";

import HazardAssessment from "./HazardAssessment";
import TerrainSummary from "./TerrainSummary";

import type {
  SelectedPoint,
  SiteHazards,
  AreaHazards,
  AnalysisRadius,
  PopulationExposure,
} from "@/types/risk";

import type { TerrainAnalysis } from "@/types/terrain";

type RiskAnalysisPanelProps = {
  selectedPoint: SelectedPoint;

  radius: AnalysisRadius;
  setRadius: (radius: AnalysisRadius) => void;

  hazards: SiteHazards;
  areaHazards: AreaHazards;

  populationExposure: PopulationExposure;

  terrainAnalysis: TerrainAnalysis | null;
  terrainLoading: boolean;
  terrainError: boolean;

  hazardSummary: string;
  keyConcern: string;

  /** Re-run every check for the selected site. */
  onRetry: () => void;
};

const RADIUS_OPTIONS: { value: AnalysisRadius; label: string }[] = [
  { value: 250, label: "250 m" },
  { value: 500, label: "500 m" },
  { value: 1000, label: "1 km" },
];

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
  onRetry,
}: RiskAnalysisPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="px-5 pb-4 pt-5">
        <p className="ui-eyebrow">Site analysis</p>

        <h2 className="mt-1 text-lg font-semibold leading-6 tracking-tight text-slate-950">
          Multi-hazard profile
        </h2>

        <p className="mt-1 font-mono text-xs text-slate-600">
          {selectedPoint.latitude.toFixed(5)}, {selectedPoint.longitude.toFixed(5)}
        </p>

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium text-slate-700">
            Surrounding context
          </p>

          <Segmented
            label="Analysis radius"
            options={RADIUS_OPTIONS}
            value={radius}
            onChange={setRadius}
          />
        </div>
      </header>

      <div className="ui-rail min-h-0 flex-1 overflow-y-auto border-t border-slate-100 px-5 pb-6">
        <section className="mt-5">
          <p className="ui-eyebrow">Hazard assessment</p>

          <p className="mt-1 text-[11px] leading-4 text-slate-500">
            InaRISK index values. Bars show position on a 0–1 scale; the tick
            marks the maximum nearby. No risk class is implied.
          </p>

          <div className="mt-2 rounded-xl border border-slate-200 px-3">
            <HazardAssessment
              name="Flood"
              point={hazards.flood}
              area={areaHazards.flood}
              radius={radius}
              onRetry={onRetry}
            />
            <HazardAssessment
              name="Tsunami"
              point={hazards.tsunami}
              area={areaHazards.tsunami}
              radius={radius}
              onRetry={onRetry}
            />
            <HazardAssessment
              name="Landslide"
              point={hazards.landslide}
              area={areaHazards.landslide}
              radius={radius}
              onRetry={onRetry}
            />
            <HazardAssessment
              name="Earthquake"
              point={hazards.earthquake}
              radius={radius}
              onRetry={onRetry}
            />
          </div>
        </section>

        <section className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex items-baseline justify-between">
            <p className="ui-eyebrow">Terrain context</p>
            <span className="text-[11px] text-slate-500">Copernicus DEM</span>
          </div>

          <div className="mt-2">
            <TerrainSummary
              terrain={terrainAnalysis}
              loading={terrainLoading}
              error={terrainError}
            />
          </div>
        </section>

        <section className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex items-baseline justify-between">
            <p className="ui-eyebrow">Exposure</p>
            <span className="text-[11px] text-slate-500">WorldPop 2025</span>
          </div>

          {populationExposure.status === "loading" && (
            <div className="mt-2 rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-600">
                Estimating population within the selected area…
              </p>
            </div>
          )}

          {populationExposure.status === "success" && (
            <div className="mt-2 rounded-xl border border-slate-200 p-3">
              <div className="grid grid-cols-3 gap-3">
                <AreaMetric
                  label="Population"
                  value={
                    populationExposure.population !== null
                      ? Math.round(populationExposure.population).toLocaleString()
                      : "—"
                  }
                />
                <AreaMetric
                  label="Density"
                  value={
                    populationExposure.densityPerKm2 !== null
                      ? `${Math.round(populationExposure.densityPerKm2).toLocaleString()}/km²`
                      : "—"
                  }
                />
                <AreaMetric
                  label="Area"
                  value={
                    populationExposure.areaKm2 !== null
                      ? `${populationExposure.areaKm2.toFixed(2)} km²`
                      : "—"
                  }
                />
              </div>
            </div>
          )}

          {populationExposure.status === "error" && (
            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs text-amber-900">
                Population data temporarily unavailable.
              </p>

              <button
                type="button"
                onClick={onRetry}
                className="shrink-0 text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
              >
                Retry
              </button>
            </div>
          )}
        </section>

        <section className="mt-6 border-t border-slate-100 pt-5">
          <p className="ui-eyebrow">Site summary</p>

          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Mapped hazard context
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-800">{hazardSummary}</p>

            <div className="mt-3 border-t border-slate-200 pt-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Key concern
              </p>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-900">
                {keyConcern}
              </p>
            </div>
          </div>
        </section>

        <p className="mt-5 border-t border-slate-100 pt-4 text-[11px] leading-4 text-slate-500">
          Source: BNPB InaRISK. Point values are the raster cell at the selected
          location. Area statistics summarise valid raster samples within the
          selected radius.
        </p>
      </div>

      {/* Always visible, so the next step never needs a long scroll. */}
      <div className="border-t border-slate-100 bg-white p-4">
        <NextStepCard
          to="simulate"
          title="Test a development scenario here"
          description="Use this exact location to see how development changes runoff, green space and exposure."
          cta="Simulate development here"
          href={buildLocationUrl(
            "/simulate",
            selectedPoint.latitude,
            selectedPoint.longitude
          )}
          compact
        />
      </div>
    </div>
  );
}

function AreaMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
