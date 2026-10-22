type Props = {
  runoff: number;

  mappedHazardCount: number;

  tsunamiPresent: boolean;
};

export default function ImpactKpis({
  runoff,
  mappedHazardCount,
  tsunamiPresent,
}: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <KpiCard
        label="Runoff"
        value={runoff.toFixed(3)}
      />

      <KpiCard
        label="Hazards"
        value={
          mappedHazardCount === 0
            ? "None mapped"
            : `${mappedHazardCount} mapped`
        }
      />

      <KpiCard
        label="Evacuation"
        value={
          tsunamiPresent
            ? "Review"
            : "—"
        }
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}