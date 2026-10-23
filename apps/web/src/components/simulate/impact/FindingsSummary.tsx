"use client";

import { useState } from "react";
import type { Finding } from "@/types/simulation";

type Props = {
  /** The top findings shown by default. */
  findings: Finding[];
  /** Every finding. Shown when the user taps "Show all findings". */
  allFindings?: Finding[];
};

const SCOPE_STYLE = {
  site: { label: "Site", className: "bg-red-100 text-red-800" },
  // Blue, not green: a design finding can be bad news too.
  design: { label: "Design", className: "bg-blue-100 text-blue-800" },
  check: { label: "Check", className: "bg-amber-100 text-amber-800" },
} as const;

export default function FindingsSummary({ findings, allFindings }: Props) {
  const [showAll, setShowAll] = useState(false);

  const hasMore = !!allFindings && allFindings.length > findings.length;
  const visible = showAll && allFindings ? allFindings : findings;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-600">What this means</p>

      <ul className="mt-3 space-y-3">
        {visible.map((finding) => {
          const scope = SCOPE_STYLE[finding.scope];

          return (
            <li key={finding.id} className="flex items-start gap-2.5">
              <span
                className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${scope.className}`}
              >
                {scope.label}
              </span>

              <p className="text-sm leading-5 text-slate-600">
                <span className="font-semibold text-slate-900">
                  {finding.headline}.
                </span>{" "}
                {finding.detail}
              </p>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="mt-3 text-xs font-medium text-blue-700 transition hover:text-blue-800"
        >
          {showAll
            ? "Show fewer"
            : `Show all findings (${allFindings.length})`}
        </button>
      )}
    </section>
  );
}