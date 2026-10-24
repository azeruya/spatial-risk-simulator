import type { ReactNode } from "react";

import { FLOW, type FlowStep } from "@/lib/flow";

/**
 * Header shared by the main (left) rail of every page: step number + verb in
 * the page's accent colour, a title, and an optional description / status.
 */
export default function RailHeader({
  step,
  title,
  description,
  aside,
  children,
}: {
  step: FlowStep;
  title: string;
  description?: string;
  /** Small text on the right of the title, e.g. "Step 2 of 3". */
  aside?: ReactNode;
  /** Status pill etc. under the description. */
  children?: ReactNode;
}) {
  const flow = FLOW[step];

  return (
    <header className="px-5 pb-4 pt-5">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
        <span
          className={`flex h-[18px] w-[18px] items-center justify-center rounded-md text-[10px] ${flow.badge}`}
        >
          {flow.index}
        </span>
        <span className={flow.text}>{flow.verb}</span>
      </p>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <h1 className="text-lg font-semibold leading-6 tracking-tight text-slate-950">
          {title}
        </h1>
        {aside && <span className="shrink-0 text-xs text-slate-500">{aside}</span>}
      </div>

      {description && (
        <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
      )}

      {children && <div className="mt-3">{children}</div>}
    </header>
  );
}

/** Status pill used under the header on every page. */
export function RailStatus({
  step,
  tone = "ok",
  children,
}: {
  step: FlowStep;
  tone?: "ok" | "warn";
  children: ReactNode;
}) {
  const flow = FLOW[step];
  const style =
    tone === "warn" ? "bg-amber-50 text-amber-800" : flow.pill;
  const dot = tone === "warn" ? "bg-amber-500" : flow.dot;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${style}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}
