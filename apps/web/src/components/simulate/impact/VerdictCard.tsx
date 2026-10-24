import type { PlanningAssessment } from "@/types/simulation";

type Props = {
  assessment: PlanningAssessment;
};

const STYLES = {
  low: {
    label: "Lower concern",
    wrapper: "border-emerald-200 bg-emerald-50",
    text: "text-emerald-800",
  },
  attention: {
    label: "Attention",
    wrapper: "border-amber-200 bg-amber-50",
    text: "text-amber-800",
  },
  review: {
    label: "Review",
    wrapper: "border-red-200 bg-red-50",
    text: "text-red-800",
  },
} as const;

export default function VerdictCard({ assessment }: Props) {
  const style = STYLES[assessment.status];

  return (
    <section
      aria-live="polite"
      className={`rounded-2xl border p-3.5 ${style.wrapper}`}
    >
      <p className={`text-xs font-medium ${style.text}`}>
        Verdict · {style.label}
      </p>

      <h2 className="mt-1 text-[15px] font-semibold leading-5 text-slate-950">
        {assessment.verdict.headline}
      </h2>

      <p className="mt-1 text-xs leading-5 text-slate-700">
        {assessment.verdict.action}
      </p>
    </section>
  );
}