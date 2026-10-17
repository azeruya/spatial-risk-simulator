import type { TerrainAnalysis } from "@/types/terrain";

type TerrainSummaryProps = {
  terrain: TerrainAnalysis | null;
  loading: boolean;
  error: boolean;
};

export default function TerrainSummary({
  terrain,
  loading,
  error,
}: TerrainSummaryProps) {
  if (loading) {
    return (
      <div className="mt-2 rounded-xl border border-slate-200 p-3">
        <p className="text-xs text-slate-500">
          Analysing terrain...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
        <p className="text-xs text-amber-700">
          Terrain data temporarily unavailable.
        </p>
      </div>
    );
  }

  if (!terrain) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="grid grid-cols-2 gap-2">
        <TerrainMetric
          label="Mean elevation"
          value={`${Math.round(terrain.elevation.mean)} m`}
        />

        <TerrainMetric
          label="Mean slope"
          value={`${terrain.slope.mean.toFixed(1)}°`}
        />

        <TerrainMetric
          label="Relief"
          value={`${Math.round(terrain.relief)} m`}
        />

        <TerrainMetric
          label="Elevation range"
          value={`${Math.round(terrain.elevation.min)}–${Math.round(
            terrain.elevation.max
          )} m`}
        />
        <p className="mt-2 text-[10px] text-slate-400">
          Maximum sampled slope: {terrain.slope.max.toFixed(1)}°
        </p>
      </div>

      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] uppercase tracking-wide text-slate-400">
          Terrain character
        </p>

        <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
          {terrain.terrainClass}
        </p>

        <p className="mt-1 text-[10px] leading-4 text-slate-500">
        Elevation ranges from{" "}
        {Math.round(terrain.elevation.min)} m to{" "}
        {Math.round(terrain.elevation.max)} m.
        The mean slope is{" "}
        {terrain.slope.mean.toFixed(1)}° within the selected context.
        </p>
      </div>

      <p className="mt-2 text-[9px] leading-4 text-slate-400">
        Copernicus DEM GLO-30 · approximately
        30 m resolution
      </p>
    </div>
  );
}

function TerrainMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[9px] uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-base font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}