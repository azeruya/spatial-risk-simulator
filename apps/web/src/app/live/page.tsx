import BaseMap from "@/components/map/BaseMap";

import {
  getLatestEarthquake,
  getSignificantEarthquakes,
  getFeltEarthquakes,
} from "@/lib/bmkg";

export default async function LivePage() {
  const [
    latest,
    significantEarthquakes,
    feltEarthquakes,
  ] = await Promise.all([
    getLatestEarthquake(),
    getSignificantEarthquakes(),
    getFeltEarthquakes(),
  ]);

  return (
    <main className="h-[calc(100vh-73px)]">
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="w-80 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Live Conditions
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Current disaster and environmental
              information.
            </p>
          </div>

          {/* Latest Earthquake */}
          <section className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Latest earthquake
            </p>

            <div className="mt-3 rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-semibold">
                    M {latest.magnitude}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Depth {latest.depthKm} km
                  </p>
                </div>

                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                  Latest
                </span>
              </div>

              <p className="mt-4 text-sm font-medium leading-5 text-slate-800">
                {latest.region}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {latest.date} · {latest.time}
              </p>

              {latest.potential && (
                <p className="mt-3 text-xs text-slate-600">
                  {latest.potential}
                </p>
              )}
            </div>
          </section>

          {/* Summary */}
          <section className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active feeds
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <SummaryCard
                label="M5.0+"
                value={
                  significantEarthquakes.length
                }
              />

              <SummaryCard
                label="Felt"
                value={feltEarthquakes.length}
              />
            </div>
          </section>

          {/* Recent Events */}
          <section className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Recent significant events
            </p>

            <div className="mt-3 space-y-3">
              {significantEarthquakes
                .slice(0, 5)
                .map((earthquake) => (
                  <div
                    key={earthquake.id}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">
                        M {earthquake.magnitude}
                      </p>

                      <p className="text-xs text-slate-400">
                        {earthquake.depthKm} km
                      </p>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      {earthquake.region}
                    </p>

                    <p className="mt-2 text-[11px] text-slate-400">
                      {earthquake.date}
                      {" · "}
                      {earthquake.time}
                    </p>
                  </div>
                ))}
            </div>
          </section>

          {/* Attribution */}
          <p className="mt-8 border-t border-slate-200 pt-4 text-[11px] leading-4 text-slate-400">
            Earthquake data source: BMKG — Badan
            Meteorologi, Klimatologi, dan
            Geofisika.
          </p>
        </aside>

        {/* Map */}
        <section className="min-w-0 flex-1">
          <BaseMap
            earthquakes={
              significantEarthquakes
            }
          />
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-2xl font-semibold">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {label}
      </p>
    </div>
  );
}