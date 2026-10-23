import ImpactAccordion from "./ImpactAccordion";

type Props = {
  limitations: string[];
  open: boolean;
  onToggle: () => void;
  /** Build this from the same constants your runoff function uses, so it can't drift. */
  formula?: string;
};

export default function MethodAccordion({
  limitations,
  open,
  onToggle,
  formula,
}: Props) {
  return (
    <ImpactAccordion title="Method and limits" open={open} onToggle={onToggle}>
      <div className="space-y-4">
        {formula && (
          <div>
            <p className="text-xs font-medium text-slate-600">
              Rainwater runoff index
            </p>

            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700">
              {formula}
            </pre>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-slate-600">Limits</p>

          <ul className="mt-2 space-y-2">
            {limitations.map((limitation) => (
              <li
                key={limitation}
                className="flex gap-2 text-sm leading-5 text-slate-600"
              >
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                <span>{limitation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ImpactAccordion>
  );
}