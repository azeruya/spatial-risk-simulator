import type { Recommendation } from "@/types/simulation";

import ImpactAccordion from "./ImpactAccordion";

type Props = {
  recommendations: Recommendation[];
  open: boolean;
  onToggle: () => void;
};

const GROUPS = [
  { key: "before-build", title: "Before you build" },
  { key: "design", title: "In the design" },
  { key: "expert-review", title: "Check with experts" },
] as const;

const PRIORITY_ORDER = { high: 0, medium: 1, normal: 2 } as const;

export default function RecommendationsAccordion({
  recommendations,
  open,
  onToggle,
}: Props) {
  return (
    <ImpactAccordion title="Recommendations" open={open} onToggle={onToggle}>
      <div className="space-y-4">
        {GROUPS.map((group) => {
          const items = recommendations
            .filter((item) => item.group === group.key)
            .sort(
              (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
            );

          if (items.length === 0) return null;

          return (
            <div key={group.key}>
              <p className="text-xs font-medium text-slate-600">{group.title}</p>

              <ul className="mt-2 space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <p className="text-sm leading-5 text-slate-700">
                      {item.text}
                    </p>

                    {item.priority === "high" && (
                      <span className="shrink-0 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700">
                        Priority
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </ImpactAccordion>
  );
}