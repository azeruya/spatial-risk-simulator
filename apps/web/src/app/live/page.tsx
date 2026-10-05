import BaseMap from "@/components/map/BaseMap";

export default function LivePage() {
  return (
    <main className="h-[calc(100vh-73px)]">
      <div className="flex h-full">
        <aside className="w-80 border-r border-slate-200 bg-white p-5">
          <h1 className="text-2xl font-semibold">Live Conditions</h1>

          <p className="mt-1 text-sm text-slate-500">
            Current disaster and environmental information.
          </p>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active now
            </p>

            <div className="mt-4 space-y-3">
              <LiveItem
                label="Recent earthquakes"
                value="Loading..."
              />

              <LiveItem
                label="Weather warnings"
                value="Loading..."
              />

              <LiveItem
                label="Flood reports"
                value="Coming soon"
              />
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Layers
            </p>

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" defaultChecked />
                Earthquakes
              </label>

              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" />
                Weather
              </label>

              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" />
                Flood reports
              </label>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <BaseMap />
        </section>
      </div>
    </main>
  );
}

function LiveItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{value}</p>
    </div>
  );
}