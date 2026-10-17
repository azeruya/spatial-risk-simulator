import type {
  RiskOverlay
} from "@/types/risk";

type RiskMapControlsProps = {
  terrainEnabled: boolean;
  setTerrainEnabled:
    (value: boolean) => void;

  riskOverlay: RiskOverlay;
  setRiskOverlay:
    (value: RiskOverlay) => void;
};

export default function RiskMapControls({
  terrainEnabled,
  setTerrainEnabled,
  riskOverlay,
  setRiskOverlay,
}: RiskMapControlsProps) {
  return (
    <div
      className="
        absolute right-4 top-4 z-30
        w-[280px]
        overflow-hidden rounded-2xl
        border border-slate-200/80
        bg-white/95 shadow-lg
        backdrop-blur-md
      "
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          View
        </p>

        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() =>
              setTerrainEnabled(false)
            }
            className={`rounded-lg px-3 py-1.5 text-[11px] font-medium ${
              !terrainEnabled
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            2D
          </button>

          <button
            type="button"
            onClick={() =>
              setTerrainEnabled(true)
            }
            className={`rounded-lg px-3 py-1.5 text-[11px] font-medium ${
              terrainEnabled
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500"
            }`}
          >
            3D
          </button>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      <div className="px-3 py-2.5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Hazard overlay
        </p>

        <div className="grid grid-cols-4 rounded-xl bg-slate-100 p-1">
          {(
            [
              "none",
              "flood",
              "tsunami",
              "landslide",
            ] as const
          ).map((overlay) => (
            <button
              key={overlay}
              type="button"
              onClick={() =>
                setRiskOverlay(overlay)
              }
              className={`rounded-lg px-1.5 py-1.5 text-[10px] font-medium ${
                riskOverlay === overlay
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500"
              }`}
            >
              {overlay === "none"
                ? "None"
                : overlay[0].toUpperCase() +
                  overlay.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}