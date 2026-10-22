"use client";

import type { ReactNode } from "react";

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
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <span className="text-sm font-medium text-slate-700">
          {title}
        </span>

        <span className="text-base text-slate-400">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4">
          {children}
        </div>
      )}
    </section>
  );
}