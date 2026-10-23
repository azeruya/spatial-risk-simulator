import type {
  DataSourceRow,
} from "@/types/simulation";

import ImpactAccordion from "./ImpactAccordion";

type Props = {
  sources: DataSourceRow[];

  open: boolean;
  onToggle: () => void;
};

export default function DataAccordion({
  sources,
  open,
  onToggle,
}: Props) {
  return (
    <ImpactAccordion
      title="Data"
      open={open}
      onToggle={onToggle}
    >
      <p className="mb-3 text-xs text-slate-500">
        Where the numbers come from
      </p>

      <div className="divide-y divide-slate-100">
        {sources.map((source) => (
            <div
            key={source.source}
            className="py-2 first:pt-0 last:pb-0"
            >
            <div className="flex items-start justify-between gap-4">
                <span className="text-xs font-medium text-slate-800">
                {source.source}
                </span>

                <span className="max-w-[55%] text-right text-xs text-slate-500">
                {source.measures}
                </span>
            </div>

            {source.coverage && (
                <p className="mt-1 text-[10px] leading-4 text-slate-400">
                {source.coverage}
                </p>
            )}
            </div>
        ))}
        </div>
    </ImpactAccordion>
  );
}