import Link from "next/link";

import { FLOW, type FlowStep } from "@/lib/flow";

/**
 * The "what to do next" card. Same look and wording pattern on every page,
 * tinted with the colour of the step it leads to.
 */
export default function NextStepCard({
  to,
  title,
  description,
  cta,
  href,
  compact = false,
}: {
  to: FlowStep;
  title: string;
  description?: string;
  cta: string;
  href: string;
  /** Tighter version for sticky footers. */
  compact?: boolean;
}) {
  const target = FLOW[to];

  return (
    <section className={`rounded-2xl border p-4 ${target.card}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        Next
        <span aria-hidden>·</span>
        <span className={target.text}>
          {target.index} {target.verb}
        </span>
      </p>

      <p className="mt-1.5 text-sm font-semibold text-slate-950">{title}</p>

      {description && !compact && (
        <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
      )}

      <Link
        href={href}
        className="mt-3 flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        {cta} →
      </Link>
    </section>
  );
}
