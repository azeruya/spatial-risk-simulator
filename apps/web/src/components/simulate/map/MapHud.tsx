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

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-xs text-slate-700">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

export function MapLegend({
  view,
  hasPermeable,
  hasGreenInfrastructure,
}: {
  view: SimulationView;
  hasPermeable: boolean;
  hasGreenInfrastructure: boolean;
}) {
  const showSurfaces = view !== "current";

  return (
    <div className={`${CARD} w-52 space-y-1.5 p-3`}>
      <p className="text-xs font-medium text-slate-900">
        {view === "current"
          ? "Existing site"
          : view === "proposed"
            ? "Proposed surfaces"
            : "Mitigated design"}
      </p>

      {showSurfaces ? (
        <>
          <LegendItem color={SURFACE_COLORS.impervious} label="Impervious" />
          <LegendItem color={SURFACE_COLORS.green} label="Green space" />
          <LegendItem color={SURFACE_COLORS.other} label="Other" />
          {view === "mitigated" && hasPermeable && (
            <LegendItem color={SURFACE_COLORS.permeable} label="Permeable replacement" />
          )}
          {view === "mitigated" && hasGreenInfrastructure && (
            <LegendItem
              color={SURFACE_COLORS.greenInfrastructure}
              label="Green infrastructure"
            />
          )}
          <p className="pt-1 text-[11px] leading-4 text-slate-500">
            Illustrative split, not a site plan.
          </p>
        </>
      ) : (
        <p className="text-[11px] leading-4 text-slate-500">
          Dashed outline shows the site boundary over current imagery.
        </p>
      )}
    </div>
  );
}

export function HazardNote({
  hazard,
  hasData,
  hasHazard,
}: {
  hazard: HazardKey;
  hasData: boolean;
  hasHazard: boolean;
}) {
  const style =
    HAZARD_STYLE[hazard];

  const message =
    !hasData
      ? "No mapped raster data returned within this analysis area."
      : !hasHazard
        ? "Mapped data is available, but no non-zero hazard value was detected."
        : "Mapped BNPB InaRISK hazard is present within this analysis area.";

  return (
    <div
      className={`${CARD} flex max-w-[240px] items-start gap-2.5 px-3.5 py-3`}
    >
      <span
        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{
          backgroundColor:
            hasHazard
              ? style.tint
              : "#94a3b8",
        }}
      />

      <div>
        <p className="text-xs font-medium text-slate-900">
          {style.label}
        </p>

        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
          {message}
        </p>
      </div>
    </div>
  );
}