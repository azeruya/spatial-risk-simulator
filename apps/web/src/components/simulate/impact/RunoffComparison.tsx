type Props = {
  current: number;
  proposed: number;
  mitigated: number;
  hasMitigation: boolean;
};

export default function RunoffComparison({
  current,
  proposed,
  mitigated,
  hasMitigation,
}: Props) {
  const maxValue = Math.max(
    current,
    proposed,
    hasMitigation
      ? mitigated
      : 0,
    0.01
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Runoff by scenario
          </p>

          <p className="mt-0.5 text-[10px] text-slate-400">
            Comparative planning indicator
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Bar
          label="Current"
          value={current}
          max={maxValue}
        />

        <Bar
          label="Proposed"
          value={proposed}
          max={maxValue}
        />

        {hasMitigation && (
          <Bar
            label="Mitigated"
            value={mitigated}
            max={maxValue}
          />
        )}
      </div>
    </section>
  );
}

function Bar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const width =
    Math.max(
      4,
      Math.min(
        100,
        (value / max) * 100
      )
    );

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          {label}
        </span>

        <span className="text-xs font-semibold text-slate-800">
          {value.toFixed(3)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{
            width: `${width}%`,
          }}
        />
      </div>
    </div>
  );
}