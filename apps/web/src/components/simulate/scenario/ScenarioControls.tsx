export function AccordionSection({
  number,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`
        overflow-hidden rounded-2xl
        transition-all duration-200
        ${
          open
            ? "border border-slate-200 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.04)]"
            : "border border-slate-200/80 bg-slate-50/45"
        }
      `}
    >
      <button
        type="button"
        onClick={onToggle}
        className="
          flex w-full items-center gap-3
          px-4 py-3
          text-left
          transition
          hover:bg-slate-50/70
        "
      >
        <span
          className={`
            flex h-7 w-7 shrink-0
            items-center justify-center
            rounded-full
            text-[11px] font-semibold
            ${
              open
                ? "bg-blue-50 text-blue-700"
                : "bg-slate-100 text-slate-500"
            }
          `}
        >
          {number}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            {title}
          </p>

          <p className="mt-0.5 truncate text-[10px] leading-4 text-slate-500">
            {subtitle}
          </p>
        </div>

        <span
          className={`
            text-xs text-slate-400
            transition-transform duration-200
            ${
              open
                ? "rotate-180"
                : ""
            }
          `}
        >
         ⌄
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-4">
          {children}
        </div>
      )}
    </section>
  );
}

export function ScenarioSlider({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-600">
            {label}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {description}
          </p>
        </div>

        <span className="rounded-lg bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-800">
          {value}%
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(event) =>
          onChange(
            Number(event.target.value)
          )
        }
        className="mt-4 w-full cursor-pointer accent-blue-600"
      />

      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}