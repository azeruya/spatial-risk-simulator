"use client";

import type {
  Finding,
} from "@/types/simulation";

type Props = {
  findings: Finding[];
  totalFindings?: number;
  onShowAll?: () => void;
};

export default function FindingsSummary({
  findings,
  totalFindings,
  onShowAll,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-500">
        What this means
      </p>

      <div className="mt-3 space-y-3">
        {findings.map((finding) => (
          <FindingRow
            key={finding.id}
            finding={finding}
          />
        ))}
      </div>

      {totalFindings !== undefined &&
        totalFindings > findings.length &&
        onShowAll && (
          <button
            type="button"
            onClick={onShowAll}
            className="mt-4 text-xs font-medium text-blue-700 transition hover:text-blue-800"
          >
            Show all findings
          </button>
        )}
    </section>
  );
}

function FindingRow({
  finding,
}: {
  finding: Finding;
}) {
  const scopeStyle = {
    site: {
      label: "Site",
      className:
        "bg-red-100 text-red-800",
    },

    design: {
      label: "Design",
      className:
        "bg-emerald-100 text-emerald-800",
    },

    check: {
      label: "Check",
      className:
        "bg-amber-100 text-amber-800",
    },
  }[finding.scope];

  return (
    <div className="flex items-start gap-2.5">
      <span
        className={`
          shrink-0 rounded-md
          px-2 py-1
          text-[10px] font-semibold
          ${scopeStyle.className}
        `}
      >
        {scopeStyle.label}
      </span>

      <p className="text-xs leading-5 text-slate-600">
        <span className="font-semibold text-slate-900">
          {finding.headline}.
        </span>{" "}
        {finding.detail}
      </p>
    </div>
  );
}