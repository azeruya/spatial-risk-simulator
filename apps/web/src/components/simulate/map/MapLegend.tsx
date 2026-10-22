import type {
  SimulationView,
} from "@/types/simulation";

type MapLegendProps = {
  simulationView: SimulationView;

  imperviousPercent: number;
  greenPercent: number;

  permeableSurfacePercent: number;
  greenInfrastructurePercent: number;

  hasMitigation: boolean;
};

export default function MapLegend({
  simulationView,
  imperviousPercent,
  greenPercent,
  permeableSurfacePercent,
  greenInfrastructurePercent,
  hasMitigation,
}: MapLegendProps) {
  const otherPercent = Math.max(
    0,
    100 -
      imperviousPercent -
      greenPercent
  );

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-20">
      <div className="min-w-[180px] rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Legend
          </p>

          <span className="text-[9px] font-medium capitalize text-slate-400">
            {simulationView}
          </span>
        </div>

        {simulationView ===
        "current" ? (
          <CurrentLegend />
        ) : (
          <div className="mt-2 space-y-2">
            <LegendItem
              colorClass="bg-slate-600"
              label="Impervious"
              value={`${imperviousPercent}%`}
            />

            <LegendItem
              colorClass="bg-emerald-500"
              label="Green / open"
              value={`${greenPercent}%`}
            />

            <LegendItem
              colorClass="bg-amber-300"
              label="Other"
              value={`${otherPercent}%`}
            />

            {simulationView ===
              "mitigated" &&
              hasMitigation && (
                <>
                  <div className="my-2 border-t border-slate-100" />

                  {permeableSurfacePercent >
                    0 && (
                    <LegendItem
                      colorClass="bg-sky-400"
                      label="Permeable treatment"
                      value={`${permeableSurfacePercent}%`}
                    />
                  )}

                  {greenInfrastructurePercent >
                    0 && (
                    <LegendItem
                      colorClass="bg-lime-500"
                      label="Green infrastructure"
                      value={`${greenInfrastructurePercent}%`}
                    />
                  )}
                </>
              )}

            <p className="pt-1 text-[9px] leading-4 text-slate-400">
              Illustrative spatial split
              for scenario comparison,
              not a detailed site plan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CurrentLegend() {
  return (
    <div className="mt-2">
      <LegendItem
        colorClass="border-2 border-dashed border-slate-500 bg-transparent"
        label="Project footprint"
      />

      <p className="mt-2 text-[9px] leading-4 text-slate-400">
        Current view shows the
        existing mapped site condition.
      </p>
    </div>
  );
}

function LegendItem({
  colorClass,
  label,
  value,
}: {
  colorClass: string;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-sm ${colorClass}`}
        />

        <span className="truncate text-[10px] text-slate-600">
          {label}
        </span>
      </div>

      {value && (
        <span className="text-[10px] font-semibold text-slate-700">
          {value}
        </span>
      )}
    </div>
  );
}