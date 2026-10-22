import type {PlanningAssessment} from "@/types/simulation";

type Props = {
  assessment: PlanningAssessment;
  runoffChangePercent: number;
};

export default function VerdictCard({
  assessment,
  runoffChangePercent,
}: Props) {
  const style = {
    low: {
      label: "Lower concern",
      wrapper:
        "border-emerald-200 bg-emerald-50",
      labelStyle:
        "text-emerald-700",
    },

    attention: {
      label: "Attention",
      wrapper:
        "border-amber-200 bg-amber-50",
      labelStyle:
        "text-amber-700",
    },

    review: {
      label: "Review",
      wrapper:
        "border-red-200 bg-red-50",
      labelStyle:
        "text-red-700",
    },
  }[assessment.status];

  const runoffText =
    Math.abs(runoffChangePercent) < 0.1
      ? "Runoff is similar to current."
      : runoffChangePercent > 0
        ? `Runoff increases ${runoffChangePercent.toFixed(
            0
          )}% vs current.`
        : `Runoff decreases ${Math.abs(
            runoffChangePercent
          ).toFixed(0)}% vs current.`;

  return (
    <section
      className={`rounded-2xl border p-4 ${style.wrapper}`}
    >
      <p
        className={`text-xs font-medium ${style.labelStyle}`}
      >
        Verdict · {style.label}
      </p>

      <h2 className="mt-1 text-base font-semibold leading-6 text-slate-900">
        {assessment.headline}
      </h2>

      <p className="mt-1 text-xs leading-5 text-slate-700">
        {runoffText}
      </p>
    </section>
  );
}