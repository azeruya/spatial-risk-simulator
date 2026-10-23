"use client";

import { useId, type ReactNode } from "react";

export function AccordionSection({
  number,
  title,
  subtitle,
  open,
  done = false,
  onToggle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  open: boolean;
  /** Finished steps show a check and an Edit label when closed. */
  done?: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const panelId = useId();

  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-white transition-colors ${
        open ? "border-slate-300" : "border-slate-200"
      }`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            open
              ? "bg-blue-50 text-blue-700"
              : done
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          {done && !open ? "✓" : number}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs leading-4 text-slate-500">{subtitle}</p>
        </div>

        {!open && done && (
          <span className="text-xs font-medium text-blue-700">Edit</span>
        )}

        <span
          aria-hidden
          className={`text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          ⌄
        </span>
      </button>

      {open && (
        <div id={panelId} className="border-t border-slate-100 px-4 pb-4 pt-4">
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
  max = 100,
  step = 5,
  unit = "%",
  hint,
  effect,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  step?: number;
  unit?: string;
  /** Derived line under the slider, e.g. "= 29% of the parcel". */
  hint?: string;
  /** Small result chip, e.g. "-9% runoff". */
  effect?: string;
}) {
  const id = useId();

  function handleNumber(raw: string) {
    const next = raw === "" ? 0 : Number(raw);
    if (Number.isNaN(next)) return;
    onChange(Math.min(max, Math.max(0, Math.round(next))));
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <label htmlFor={id} className="text-sm font-medium text-slate-800">
            {label}
          </label>

          {description && (
            <p className="mt-0.5 text-xs leading-4 text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center rounded-lg bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-800">
          <input
            type="number"
            aria-label={`${label} value`}
            min={0}
            max={max}
            step={1}
            value={value}
            onChange={(event) => handleNumber(event.target.value)}
            className="w-9 bg-transparent text-right outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="ml-0.5">{unit}</span>
        </div>
      </div>

      <input
        id={id}
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full cursor-pointer accent-blue-600"
      />

      {(hint || effect) && (
        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>{hint}</span>
          {effect && (
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">
              {effect}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-slate-100 p-1"
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-2 py-2 text-xs font-medium transition disabled:opacity-50 ${
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Shows how the runoff index moves between two scenarios. */
export function LiveResult({
  label,
  comparedTo,
  from,
  to,
}: {
  label: string;
  comparedTo: string;
  from: number;
  to: number;
}) {
  const change = from > 0 ? ((to - from) / from) * 100 : 0;
  const flat = Math.abs(change) < 0.5;
  const worse = change > 0;

  const tone = flat
    ? "bg-slate-50 text-slate-700"
    : worse
      ? "bg-amber-50 text-amber-800"
      : "bg-emerald-50 text-emerald-800";

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs ${tone}`}
      aria-live="polite"
    >
      <span>
        {label} {from.toFixed(2)} → {to.toFixed(2)}
      </span>
      <span className="font-semibold">
        {flat
          ? "No change"
          : `${worse ? "+" : "-"}${Math.abs(Math.round(change))}% vs ${comparedTo}`}
      </span>
    </div>
  );
}