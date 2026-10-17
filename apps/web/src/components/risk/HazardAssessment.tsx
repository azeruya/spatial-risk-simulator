import type {
  HazardResult,
  HazardAreaResult,
  AnalysisRadius,
} from "@/types/risk";

type HazardAssessmentProps = {
  name: string;
  point: HazardResult;
  area?: HazardAreaResult;
  radius: AnalysisRadius;
};

export default function HazardAssessment({
  name,
  point,
  area,
  radius,
}: HazardAssessmentProps) {
  const radiusLabel =
    radius === 1000 ? "1 km" : `${radius} m`;

  const coverage =
    area &&
    area.totalSamples > 0
      ? Math.round(
          (area.validSamples / area.totalSamples) * 100
        )
      : null;

  const areaMapped =
    area?.status === "success" &&
    area.hasData;

  const pointMapped =
    point.status === "success" &&
    point.hasData;

  const mapped =
    pointMapped || areaMapped;

  const loading =
    point.status === "loading" ||
    area?.status === "loading";

  const unavailable =
    !mapped &&
    !loading &&
    (
      point.status === "unavailable" ||
      area?.status === "unavailable"
    );

  const noData =
    !mapped &&
    !loading &&
    !unavailable &&
    (
      point.status === "no-data" ||
      area?.status === "no-data"
    );

  return (
    <div className="border-b border-slate-100 py-4 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">
          {name}
        </p>

        <span
          className={`rounded-full px-2 py-1 text-[10px] font-medium ${
            mapped
              ? "bg-blue-50 text-blue-700"
              : unavailable
              ? "bg-amber-50 text-amber-700"
              : loading
              ? "bg-slate-100 text-slate-500"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {mapped
            ? "Mapped"
            : loading
            ? "Loading"
            : unavailable
            ? "Unavailable"
            : "No mapped data"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Point
          </p>

          <p className="mt-1 text-lg font-semibold text-slate-900">
            {pointMapped && point.value !== null
              ? point.value.toFixed(3)
              : "—"}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Within {radiusLabel}
          </p>

          {areaMapped ? (
            <>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Avg {area!.average?.toFixed(3)}
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Max {area!.maximum?.toFixed(3)}
                {" · "}
                {area!.validSamples}/{area!.totalSamples} mapped
                {coverage !== null
                  ? ` (${coverage}%)`
                  : ""}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-400">
              —
            </p>
          )}
        </div>
      </div>
    </div>
  );
}