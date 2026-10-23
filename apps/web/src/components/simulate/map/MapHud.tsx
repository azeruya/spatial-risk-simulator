import type { HazardKey } from "@/types/map";
import type { SimulationView } from "@/types/simulation";
import { HAZARD_STYLE, SURFACE_COLORS } from "./mapStyles";

export function formatArea(projectAreaHa: number) {
  const areaM2 = projectAreaHa * 10_000;

  if (areaM2 < 10_000) {
    return `${Math.round(areaM2).toLocaleString()} m²`;
  }

  return `${projectAreaHa.toFixed(2)} ha`;
}

const CARD =
  "pointer-events-auto rounded-xl border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur";

export function MapHint({ text }: { text: string }) {
  return <div className={`${CARD} px-4 py-2 text-sm text-slate-700`}>{text}</div>;
}

export function FootprintChip({
  area,
  caption,
}: {
  area: string;
  caption: string;
}) {
  return (
    <div className={`${CARD} flex items-baseline gap-2 px-3.5 py-2`}>
      <span className="text-base font-semibold text-slate-900">{area}</span>
      <span className="text-xs text-slate-500">{caption}</span>
    </div>
  );
}

/** Small label that sits on the top edge of the analysis circle. */
export function AnalysisAreaLabel({ radiusM }: { radiusM: number }) {
  return (
    <div className="pointer-events-none mb-1 whitespace-nowrap rounded-lg border border-slate-200/80 bg-white/95 px-2 py-0.5 text-xs font-medium text-blue-700 shadow-sm">
      {radiusM.toLocaleString()} m analysis area
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-700">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

/** One compact row. Hide it when the parcel is off screen. */
export function MapLegend({
  view,
  hasPermeable,
  hasGreenInfrastructure,
}: {
  view: SimulationView;
  hasPermeable: boolean;
  hasGreenInfrastructure: boolean;
}) {
  return (
    <div
      className={`${CARD} flex max-w-full flex-wrap items-center gap-x-3.5 gap-y-1 px-3 py-2`}
    >
      {view === "current" ? (
        <span className="flex items-center gap-2 text-xs text-slate-700">
          <span className="w-4 border-t-2 border-dashed border-slate-500" />
          Site boundary
        </span>
      ) : (
        <>
          <LegendItem color={SURFACE_COLORS.impervious} label="Paved" />
          <LegendItem color={SURFACE_COLORS.green} label="Green" />
          <LegendItem color={SURFACE_COLORS.other} label="Other" />

          {view === "mitigated" && hasPermeable && (
            <LegendItem color={SURFACE_COLORS.permeable} label="Permeable paving" />
          )}

          {view === "mitigated" && hasGreenInfrastructure && (
            <LegendItem
              color={SURFACE_COLORS.greenInfrastructure}
              label="Green infrastructure"
            />
          )}

          <span className="text-xs text-slate-500">Illustrative</span>
        </>
      )}
    </div>
  );
}

export type HazardNoteLevel =
  | "high"
  | "moderate"
  | "medium"
  | "low"
  | "none"
  | "no-data"
  | "no-coverage"
  | "unavailable";

type Resolved =
  | "high"
  | "moderate"
  | "low"
  | "none"
  | "no-data"
  | "unavailable"
  | "mapped";

const COPY: Record<
  Resolved,
  { label: string; tone: string; segments: number; bar: string; note?: string }
> = {
  high: { label: "High at site", tone: "text-red-700", segments: 3, bar: "bg-red-500" },
  moderate: { label: "Moderate at site", tone: "text-amber-700", segments: 2, bar: "bg-amber-500" },
  low: { label: "Low at site", tone: "text-emerald-700", segments: 1, bar: "bg-emerald-500" },
  none: {
    label: "None mapped",
    tone: "text-slate-600",
    segments: 0,
    bar: "",
    note: "The map covers this area but shows no hazard value.",
  },
  "no-data": {
    label: "No data here",
    tone: "text-slate-600",
    segments: 0,
    bar: "",
    note: "The hazard map has no values for this area. That does not mean it is safe.",
  },
  unavailable: {
    label: "Unavailable",
    tone: "text-slate-600",
    segments: 0,
    bar: "",
    note: "The hazard check failed. Retry before relying on this result.",
  },
  mapped: {
    label: "Mapped",
    tone: "text-slate-700",
    segments: 0,
    bar: "",
    note: "Mapped BNPB InaRISK hazard is present in the analysis area.",
  },
};

function resolveLevel(
  level: HazardNoteLevel | undefined,
  hasData: boolean,
  hasHazard: boolean
): Resolved {
  if (level) {
    if (level === "medium") return "moderate";
    if (level === "no-coverage") return "no-data";
    return level;
  }

  if (!hasData) return "no-data";
  if (!hasHazard) return "none";
  return "mapped";
}

export function HazardNote({
  hazard,
  hasData,
  hasHazard,
  level,
}: {
  hazard: HazardKey;
  hasData: boolean;
  hasHazard: boolean;
  /** Optional. When given, shows the level and a Low to High scale. */
  level?: HazardNoteLevel;
}) {
  const style = HAZARD_STYLE[hazard];
  const copy = COPY[resolveLevel(level, hasData, hasHazard)];

  return (
    <div className={`${CARD} w-56 px-3.5 py-3`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-900">{style.label}</p>
        <p className={`text-xs font-medium ${copy.tone}`}>{copy.label}</p>
      </div>

      {copy.segments > 0 && (
        <>
          <div className="mt-2 flex gap-1" aria-hidden>
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={`h-1.5 flex-1 rounded-full ${
                  index < copy.segments ? copy.bar : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>Low</span>
            <span>High</span>
          </div>
        </>
      )}

      {copy.note && (
        <p className="mt-1.5 text-xs leading-4 text-slate-500">{copy.note}</p>
      )}
    </div>
  );
}