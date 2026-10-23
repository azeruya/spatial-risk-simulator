import type {
  PlanningAssessment,
  SimulationView,
} from "@/types/simulation";

type Props = {
  assessment: PlanningAssessment;
  simulationView: SimulationView;
};

export default function VerdictCard({
  assessment,
}: Props) {
  const style = {
    low: {
      label: "Lower concern",
      wrapper:
        "border-emerald-200 bg-emerald-50",
      text:
        "text-emerald-800",
    },

    attention: {
      label: "Attention",
      wrapper:
        "border-amber-200 bg-amber-50",
      text:
        "text-amber-800",
    },

    review: {
      label: "Review",
      wrapper:
        "border-red-200 bg-red-50",
      text:
        "text-red-800",
    },
  }[assessment.status];

  return (
    <section
      className={`
        rounded-2xl border p-4
        ${style.wrapper}
      `}
    >
      <p
        className={`
          text-xs font-medium
          ${style.text}
        `}
      >
        Verdict · {style.label}
      </p>

      <h2 className="mt-1.5 text-[17px] font-semibold leading-6 text-slate-950">
        {assessment.verdict.headline}
      </h2>

      <p className="mt-1.5 text-sm leading-5 text-slate-700">
        {assessment.verdict.action}
      </p>
    </section>
  );
}