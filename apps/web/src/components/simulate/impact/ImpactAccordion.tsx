"use client";

import { useId, type ReactNode } from "react";

type ImpactAccordionProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export default function ImpactAccordion({
  title,
  open,
  onToggle,
  children,
}: ImpactAccordionProps) {
  const panelId = useId();

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <span className="text-sm font-semibold text-slate-900">{title}</span>

        <span aria-hidden className="text-base text-slate-400">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div id={panelId} className="border-t border-slate-100 p-4">
          {children}
        </div>
      )}
    </section>
  );
}