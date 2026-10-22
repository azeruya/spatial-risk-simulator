type MapView =
  | "map"
  | "satellite"
  | "terrain";

type HazardOverlay =
  | "flood"
  | "tsunami"
  | "landslide"
  | null;

type Props = {
  mapView: MapView;
  onMapViewChange: (
    value: MapView
  ) => void;

  hazardOverlay: HazardOverlay;
  onHazardOverlayChange: (
    value: HazardOverlay
  ) => void;
};

export default function MapTopBar({
  mapView,
  onMapViewChange,
  hazardOverlay,
  onHazardOverlayChange,
}: Props) {
  return (
    <div className="pointer-events-none absolute left-4 right-4 top-4 z-30 flex items-start justify-between gap-4">
      {/* VIEW */}
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/95 p-1 shadow-sm backdrop-blur">
        {(
          [
            ["map", "Map"],
            ["satellite", "Satellite"],
            ["terrain", "3D"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              onMapViewChange(value)
            }
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              mapView === value
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* HAZARD */}
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/95 p-1 shadow-sm backdrop-blur">
        {(
          [
            [null, "None"],
            ["flood", "Flood"],
            ["tsunami", "Tsunami"],
            ["landslide", "Landslide"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value ?? "none"}
            type="button"
            onClick={() =>
              onHazardOverlayChange(value)
            }
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              hazardOverlay === value
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}