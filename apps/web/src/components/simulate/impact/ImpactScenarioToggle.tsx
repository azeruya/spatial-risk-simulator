import type { SimulationView } from "@/types/simulation";

type Props = {
  value: SimulationView;

  onChange: (
    value: SimulationView
  ) => void;

  mitigationAvailable: boolean;
};

export default function ImpactScenarioToggle({
  value,
  onChange,
  mitigationAvailable,
}: Props) {
  const options: {
    value: SimulationView;
    label: string;
    disabled?: boolean;
  }[] = [
    {
      value: "current",
      label: "Current",
    },
    {
      value: "proposed",
      label: "Proposed",
    },
    {
      value: "mitigated",
      label: "Mitigated",
      disabled: !mitigationAvailable,
    },
  ];

  return (
    <div className="grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-50 p-1">
      {options.map((option) => {
        const active =
          value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            onClick={() =>
              onChange(option.value)
            }
            className={`
              rounded-lg px-3 py-2
              text-xs font-medium
              transition

              ${
                active
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }

              disabled:cursor-not-allowed
              disabled:text-slate-300
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}