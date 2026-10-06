import RiskMap from "@/components/risk/RiskMap";

export default function RiskPage() {
  return (
    <main className="h-[calc(100vh-73px)]">
      <div className="flex h-full">
        <aside className="w-80 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Risk Intelligence
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Understand long-term hazard and vulnerability at a location.
            </p>
          </div>

          <section className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Study area
            </p>

            <div className="mt-3 rounded-xl border border-slate-200 p-4">
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
              Hazard layers
            </p>

            <div className="mt-3 space-y-3">
              <RiskLayer
                label="Flood hazard"
                description="BNPB / InaRISK"
                checked
              />

              <RiskLayer
                label="Landslide hazard"
                description="Coming next"
              />

              <RiskLayer
                label="Tsunami hazard"
                description="Coming next"
              />

              <RiskLayer
                label="Earthquake hazard"
                description="Coming next"
              />
            </div>
          </section>

          <section className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Site analysis
            </p>

            <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-4">
              <p className="text-sm font-medium text-slate-700">
                No site selected
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Site selection and polygon analysis will be added after the
                hazard layers are working.
              </p>
            </div>
          </section>

          <p className="mt-8 border-t border-slate-200 pt-4 text-[11px] text-slate-400">
            Hazard data source: BNPB InaRISK
          </p>
        </aside>

        <section className="min-w-0 flex-1">
          <RiskMap />
        </section>
      </div>
    </main>
  );
}

function RiskLayer({
  label,
  description,
  checked = false,
}: {
  label: string;
  description: string;
  checked?: boolean;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-3">
      <div>
        <p className="text-sm font-medium text-slate-800">
          {label}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        defaultChecked={checked}
        disabled={!checked}
        className="mt-1 h-4 w-4"
      />
    </label>
  );
}