import Link from "next/link";

import RailHeader, { RailStatus } from "@/components/shell/RailHeader";
import { STUDY_AREA } from "@/lib/study-area";

type LayerStatus = "connected" | "limited" | "unavailable";

const LAYERS: { label: string; status: LayerStatus }[] = [
  { label: "Flood hazard", status: "connected" },
  { label: "Tsunami hazard", status: "connected" },
  { label: "Landslide hazard", status: "connected" },
  { label: "Earthquake hazard", status: "limited" },
];

export default function RiskSidebar({
  hasSelection = false,
}: {
  hasSelection?: boolean;
}) {
  const connected = LAYERS.filter((l) => l.status === "connected").length;
  const allConnected = connected === LAYERS.length;

  return (
    <div className="flex h-full flex-col">
      <RailHeader
        step="risk"
        title="Understand the site before you build."
        description="Review mapped hazards and surrounding population exposure."
      >
        <RailStatus step="risk" tone={allConnected ? "ok" : "warn"}>
          {connected} of {LAYERS.length} hazard layers connected
        </RailStatus>
      </RailHeader>

      <div className="ui-rail min-h-0 flex-1 overflow-y-auto border-t border-slate-100 px-5 pb-6">
        <section className="mt-5">
          <p className="ui-eyebrow">Study area</p>

          <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-800">
              {STUDY_AREA.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">{STUDY_AREA.region}</p>
          </div>
        </section>

        <section className="mt-7">
          <p className="ui-eyebrow">Hazard data</p>

          <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {LAYERS.map((layer) => (
              <RiskLayer key={layer.label} {...layer} />
            ))}
          </div>
        </section>

        <section className="mt-7">
          <p className="ui-eyebrow">How to analyse</p>

          {hasSelection ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
              Click another point on the map to analyse a different site.
            </p>
          ) : (
            <ol className="mt-3 space-y-2 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-700">
              <li>
                <span className="font-semibold text-slate-900">1.</span> Click a
                site on the map
              </li>
              <li>
                <span className="font-semibold text-slate-900">2.</span> Choose
                an analysis radius
              </li>
              <li>
                <span className="font-semibold text-slate-900">3.</span> Review
                hazards, exposure and terrain
              </li>
            </ol>
          )}
        </section>

        <p className="mt-6 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-500">
          Hazards: BNPB InaRISK
          <br />
          Population: WorldPop
          <br />
          Terrain: Copernicus DEM GLO-30
        </p>
      </div>

      <div className="border-t border-slate-100 bg-white px-5 py-3">
        <Link
          href="/live"
          className="text-xs font-medium text-slate-600 transition hover:text-slate-900"
        >
          ← Back to live conditions
        </Link>
      </div>
    </div>
  );
}

function RiskLayer({ label, status }: { label: string; status: LayerStatus }) {
  const styles = {
    connected: "bg-emerald-50 text-emerald-700",
    limited: "bg-amber-50 text-amber-800",
    unavailable: "bg-slate-100 text-slate-600",
  };

  const labels = {
    connected: "Connected",
    limited: "Limited",
    unavailable: "Unavailable",
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
          BNPB InaRISK
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    </div>
  );
}
