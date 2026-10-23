import ImpactAccordion from "./ImpactAccordion";

type Props = {
  limitations: string[];

  open: boolean;
  onToggle: () => void;

  formula?: string;
};

export default function MethodAccordion({
  limitations,
  open,
  onToggle,
  formula,
}: Props) {
  return (
    <ImpactAccordion
      title="Method and limits"
      open={open}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        {formula && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Comparative runoff tendency
            </p>

            <div className="mt-2 rounded-xl bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700">
              {formula}
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Important limitations
          </p>

          <ul className="mt-2 space-y-2">
            {limitations.map(
              (limitation) => (
                <li
                  key={limitation}
                  className="flex gap-2 text-xs leading-5 text-slate-600"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />

                  <span>
                    {limitation}
                  </span>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </ImpactAccordion>
  );
}