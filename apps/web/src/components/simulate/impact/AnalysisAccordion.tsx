"use client";

import type { AnalysisRow, SimulationView } from "@/types/simulation";

import ImpactAccordion from "./ImpactAccordion";

type Props = {
  rows: AnalysisRow[];
  simulationView: SimulationView;
  open: boolean;
  onToggle: () => void;
};

const COLUMNS = [
  { key: "current", label: "Current" },
  { key: "proposed", label: "Proposed" },
  { key: "mitigated", label: "Mitigated" },
] as const;

export default function AnalysisAccordion({
  rows,
  simulationView,
  open,
  onToggle,
}: Props) {
  const scenarioRows = rows.filter(
    (row) => row.current || row.proposed || row.mitigated
  );
  const siteRows = rows.filter(
    (row) => !(row.current || row.proposed || row.mitigated)
  );

  return (
    <ImpactAccordion title="Analysis" open={open} onToggle={onToggle}>
      <p className="mb-3 text-xs text-slate-500">
        How the assessment was worked out
      </p>

      {scenarioRows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-xs">
            <colgroup>
              <col className="w-[34%]" />
              <col />
              <col />
              <col />
            </colgroup>

            <thead>
              <tr>
                <th />
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`rounded-t-lg px-1.5 py-1.5 text-right font-medium ${
                      simulationView === column.key
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {scenarioRows.map((row) => (
                <tr key={row.label} className="border-t border-slate-100 align-top">
                  <th scope="row" className="py-2 pr-2 text-left font-normal text-slate-700">
                    {row.label}
                    {row.change && (
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {row.change}
                      </span>
                    )}
                  </th>

                  {COLUMNS.map((column) => (
                    <td
                      key={column.key}
                      className={`break-words px-1.5 py-2 text-right ${
                        simulationView === column.key
                          ? "bg-slate-100 font-medium text-slate-900"
                          : "text-slate-600"
                      }`}
                    >
                      {row[column.key] ?? "–"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {siteRows.length > 0 && (
        <div className={scenarioRows.length > 0 ? "mt-4" : undefined}>
          <p className="mb-1 text-xs font-medium text-slate-600">
            Same in every scenario
          </p>

          <div className="divide-y divide-slate-100">
            {siteRows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4 py-2 text-xs"
              >
                <span className="text-slate-700">{row.label}</span>
                <span className="text-right font-medium text-slate-900">
                  {row.value ?? "–"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ImpactAccordion>
  );
}