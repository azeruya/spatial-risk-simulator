"use client";

import type {
  AnalysisRow,
} from "@/types/simulation";

import ImpactAccordion from "./ImpactAccordion";

type Props = {
  rows: AnalysisRow[];
  open: boolean;
  onToggle: () => void;
};

export default function AnalysisAccordion({
  rows,
  open,
  onToggle,
}: Props) {
  return (
    <ImpactAccordion
      title="Analysis"
      open={open}
      onToggle={onToggle}
    >
      <p className="mb-3 text-xs text-slate-500">
        How the assessment was worked out
      </p>

      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className="py-2 first:pt-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="text-xs text-slate-600">
                {row.label}
              </span>

              {row.value && (
                <span className="text-right text-xs font-medium text-slate-900">
                  {row.value}
                </span>
              )}
            </div>

            {(row.current ||
              row.proposed ||
              row.mitigated) && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {row.current && (
                  <ScenarioValue
                    label="Current"
                    value={row.current}
                  />
                )}

                {row.proposed && (
                  <ScenarioValue
                    label="Proposed"
                    value={row.proposed}
                  />
                )}

                {row.mitigated && (
                  <ScenarioValue
                    label="Mitigated"
                    value={row.mitigated}
                  />
                )}
              </div>
            )}

            {row.change && (
              <p className="mt-2 text-[10px] font-medium text-emerald-700">
                {row.change}
              </p>
            )}
          </div>
        ))}
      </div>
    </ImpactAccordion>
  );
}

function ScenarioValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
      <p className="text-[9px] uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 text-[11px] font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}