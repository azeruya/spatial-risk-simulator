import type { HazardStatus, PlanningAssessment } from "@/types/simulation";
import Segmented from "@/components/ui/Segmented";
import type { TerrainAnalysis } from "@/types/terrain";
import {
  formatHazardStatus,
  hazardLevel,
  hazardNote,
} from "@/lib/simulation/hazardLabels";

export type AnalysisRadius = 250 | 500 | 1000;

/** Copernicus GLO-30 cell size. A parcel smaller than one cell has a very rough height. */
const DEM_CELL_M = 30;

type Props = {
  assessment: PlanningAssessment;

  terrain: TerrainAnalysis | null;
  terrainLoading?: boolean;
  terrainError?: boolean;

  nearbyPopulation: number | null;
  additionalPopulation: number;

  projectAreaM2: number;

  radiusMeters: AnalysisRadius;
  onRadiusChange: (value: AnalysisRadius) => void;

  /** Shown next to any hazard whose check failed. */
  onRetry?: () => void;
};

const RADII: AnalysisRadius[] = [250, 500, 1000];

const formatRadius = (radius: AnalysisRadius) =>
  radius === 1000 ? "1 km" : `${radius} m`;

export default function SiteContextGrid({
  assessment,
  terrain,
  terrainLoading = false,
  terrainError = false,
  nearbyPopulation,
  additionalPopulation,
  projectAreaM2,
  radiusMeters,
  onRadiusChange,
  onRetry,
}: Props) {
  const site = assessment.site as Partial<
    Record<"tsunami" | "flood" | "landslide", HazardStatus>
  >;

  const hazards: { label: string; status: HazardStatus }[] = [];

  if (site.tsunami) hazards.push({ label: "Tsunami", status: site.tsunami });
  if (site.flood) hazards.push({ label: "Flood", status: site.flood });
  if (site.landslide) hazards.push({ label: "Landslide", status: site.landslide });

  const elevationM = terrain?.elevation.mean ?? null;

  const heightValue = terrainLoading
    ? "Loading…"
    : elevationM !== null && !terrainError
      ? `${Math.round(elevationM)} m`
      : "Unavailable";

  const heightHelper =
    elevationM === null || terrainError || terrainLoading
      ? undefined
      : projectAreaM2 < DEM_CELL_M * DEM_CELL_M
        ? `Site is smaller than one ${DEM_CELL_M} m grid cell`
        : "Approximate elevation";

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-600">About the site</p>
        <p className="text-xs text-slate-500">Same in every scenario</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-4">
        {hazards.map((hazard) => (
          <HazardRow
            key={hazard.label}
            label={hazard.label}
            status={hazard.status}
            onRetry={onRetry}
          />
        ))}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <MetricCard label="Ground height" value={heightValue} helper={heightHelper} />

        <MetricCard
          label={`People within ${formatRadius(radiusMeters)}`}
          value={
            nearbyPopulation !== null
              ? Math.round(nearbyPopulation).toLocaleString()
              : "Unavailable"
          }
          helper={
            additionalPopulation > 0
              ? `+${additionalPopulation.toLocaleString()} from your proposal`
              : "Existing population"
          }
        >
          <Segmented
            label="Analysis radius"
            options={RADII.map((radius) => ({
              value: radius,
              label: formatRadius(radius),
            }))}
            value={radiusMeters}
            onChange={onRadiusChange}
            className="mt-2"
          />
        </MetricCard>
      </div>
    </section>
  );
}

const TONE: Record<HazardStatus, string> = {
  high: "text-red-700",
  moderate: "text-amber-700",
  low: "text-emerald-700",
  none: "text-slate-600",
  "no-data": "text-slate-600",
  unavailable: "text-slate-600",
};

function HazardRow({
  label,
  status,
  onRetry,
}: {
  label: string;
  status: HazardStatus;
  onRetry?: () => void;
}) {
  const level = hazardLevel(status);
  const note = hazardNote(status);

  return (
    <div className="border-t border-slate-100 py-2.5 first:border-t-0">
      <div className="flex items-center gap-3">
        <span className="flex-1 text-sm text-slate-800">{label}</span>

        <div className="grid w-[72px] grid-cols-3 gap-1" aria-hidden>
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={`h-1.5 rounded-full ${
                step <= level
                  ? status === "high"
                    ? "bg-red-600"
                    : status === "moderate"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <span
          className={`min-w-[7rem] text-right text-xs font-medium ${TONE[status]}`}
        >
          {formatHazardStatus(status)}
          {status === "unavailable" && onRetry && (
            <>
              {" · "}
              <button
                type="button"
                onClick={onRetry}
                className="font-medium text-blue-700 hover:underline"
              >
                Retry
              </button>
            </>
          )}
        </span>
      </div>

      {note && <p className="mt-1 text-xs leading-4 text-slate-500">{note}</p>}
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  children,
}: {
  label: string;
  value: string;
  helper?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-600">{label}</p>

      <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>

      {helper && (
        <p className="mt-0.5 text-xs leading-4 text-slate-500">{helper}</p>
      )}

      {children}
    </div>
  );
}