"use client";

import { useElapsed } from "@/hooks/useElapsed";
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
  /** Re-run the checks. Shown when a layer didn't respond. */
  onRetry?: () => void;
};

/** After this long, say so instead of showing silent dashes. */
const SLOW_AFTER_SECONDS = 8;

const clampPercent = (value: number) => Math.min(Math.max(value * 100, 0), 100);

export default function HazardAssessment({
  name,
  point,
  area,
  radius,
  onRetry,
}: HazardAssessmentProps) {
  const radiusLabel = radius === 1000 ? "1 km" : `${radius} m`;

  const coverage =
    area && area.totalSamples > 0
      ? Math.round((area.validSamples / area.totalSamples) * 100)
      : null;

  const areaMapped = area?.status === "success" && area.hasData;
  const pointMapped = point.status === "success" && point.hasData;
  const mapped = pointMapped || areaMapped;

  const loading = point.status === "loading" || area?.status === "loading";

  // "error" is what the point request used to report on failure.
  const failed = (status: string | undefined) =>
    status === "unavailable" || status === "error";

  const unavailable =
    !mapped && !loading && (failed(point.status) || failed(area?.status));

  const noData =
    !mapped &&
    !loading &&
    !unavailable &&
    (point.status === "no-data" || area?.status === "no-data");

  const elapsed = useElapsed(loading);
  const slow = loading && elapsed >= SLOW_AFTER_SECONDS;

  const badge = mapped
    ? { text: "Mapped", style: "bg-blue-50 text-blue-700" }
    : loading
      ? { text: slow ? "Slow" : "Loading", style: "bg-slate-100 text-slate-600" }
      : unavailable
        ? { text: "Unavailable", style: "bg-amber-50 text-amber-800" }
        : { text: noData ? "No mapped data" : "Not checked", style: "bg-slate-100 text-slate-600" };

  return (
    <div className="border-b border-slate-100 py-4 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">{name}</p>

        <span
          className={`rounded-full px-2 py-1 text-[11px] font-medium ${badge.style}`}
        >
          {badge.text}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Point
          </p>

          {loading ? (
            <Skeleton className="mt-2 h-5 w-14" />
          ) : (
            <>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {pointMapped && point.value !== null
                  ? point.value.toFixed(3)
                  : "—"}
              </p>

              {pointMapped && point.value !== null && (
                <IndexBar value={point.value} />
              )}
            </>
          )}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Within {radiusLabel}
          </p>

          {loading ? (
            <Skeleton className="mt-2 h-5 w-20" />
          ) : areaMapped ? (
            <>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Avg {area!.average?.toFixed(3)}
              </p>

              {area!.average !== null && (
                <IndexBar value={area!.average} max={area!.maximum} />
              )}

              <p className="mt-1.5 text-[11px] text-slate-500">
                Max {area!.maximum?.toFixed(3)}
                {" · "}
                {area!.validSamples}/{area!.totalSamples} mapped
                {coverage !== null ? ` (${coverage}%)` : ""}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-500">—</p>
          )}
        </div>
      </div>

      {slow && (
        <p className="mt-3 text-xs leading-5 text-slate-600">
          BNPB is responding slowly. Still waiting ({elapsed}s).
        </p>
      )}

      {unavailable && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-900">BNPB didn’t respond.</p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="shrink-0 text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-slate-100 ${className}`} />;
}

/**
 * Position of a value on the raw 0–1 InaRISK index. Deliberately neutral:
 * no Low/Moderate/High label, because class thresholds aren't applied here.
 */
function IndexBar({ value, max }: { value: number; max?: number | null }) {
  return (
    <div
      role="img"
      aria-label={`Index ${value.toFixed(3)} on a 0 to 1 scale`}
      className="relative mt-2 h-1.5 w-full rounded-full bg-slate-100"
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-amber-400"
        style={{ width: `${Math.max(clampPercent(value), 2)}%` }}
      />

      {typeof max === "number" && (
        <div
          className="absolute -top-0.5 h-2.5 w-0.5 rounded bg-slate-600"
          style={{ left: `calc(${clampPercent(max)}% - 1px)` }}
        />
      )}
    </div>
  );
}
