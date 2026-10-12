import RiskMap from "@/components/risk/RiskMap";

export default function RiskPage() {
  return (
    <main className="h-[calc(100vh-73px)]">
      <div className="flex h-full">
        <aside className="w-80 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-5 shadow-[6px_0_18px_rgba(15,23,42,0.05)]">
          <div>
            <p className="ui-section-label text-amber-600">
              Risk
            </p>

            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
              Understand the site before you build.
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Review mapped hazards and surrounding population exposure.
            </p>
          </div>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            BNPB InaRISK layers connected
          </div>

          <section className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Study area
            </p>

            <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-slate-800">
                Padang
              </p>

              <p className="mt-1 text-xs text-slate-500">
                West Sumatra, Indonesia
              </p>
            </div>
          </section>

          <section className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hazard data
            </p>

            <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
              <RiskLayer
                label="Flood hazard"
                description="BNPB InaRISK"
                status="available"
              />

              <RiskLayer
                label="Tsunami hazard"
                description="BNPB InaRISK"
                status="available"
              />

              <RiskLayer
                label="Landslide hazard"
                description="BNPB InaRISK"
                status="available"
              />

              <RiskLayer
                label="Earthquake hazard"
                description="BNPB InaRISK"
                status="limited"
              />
            </div>
          </section>

          <section className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              How to analyse
            </p>

            <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-slate-800">
                Select a site on the map
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Click a location, choose an analysis radius, then review center-point hazard values,
                surrounding area statistics, and population exposure.
              </p>
            </div>
          </section>

          <div className="mt-8 border-t border-slate-200 pt-4">
            <p className="text-[11px] leading-5 text-slate-400">
              Hazard source: BNPB InaRISK
              <br />
              Population source: WorldPop
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <RiskMap />
        </section>
      </div>
    </main>
  );
}

type RiskLayerStatus =
  | "available"
  | "limited"
  | "unavailable";

function RiskLayer({
  label,
  description,
  status,
}: {
  label: string;
  description: string;
  status: RiskLayerStatus;
}) {
  const statusStyles = {
    available:
      "bg-emerald-50 text-emerald-700",
    limited:
      "bg-amber-50 text-amber-700",
    unavailable:
      "bg-slate-100 text-slate-500",
  };

  const statusLabels = {
    available: "Available",
    limited: "Limited",
    unavailable: "Unavailable",
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-800">
          {label}
        </p>

        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
          {description}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${statusStyles[status]}`}
      >
        {statusLabels[status]}
      </span>
    </div>
  );
}