import type {
  Recommendation,
} from "@/types/simulation";

import ImpactAccordion from "./ImpactAccordion";

type Props = {
  recommendations: Recommendation[];

  open: boolean;
  onToggle: () => void;
};

export default function RecommendationsAccordion({
  recommendations,
  open,
  onToggle,
}: Props) {
  const groups = [
    {
        key: "before-build",
        title: "Before you build",
    },
    {
        key: "design",
        title: "In the design",
    },
    {
        key: "expert-review",
        title: "Check with experts",
    },
    ] as const;

  return (
    <ImpactAccordion
      title="Recommendations"
      open={open}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        {groups.map((group) => {
          const items =
            recommendations.filter(
              (item) =>
                item.group === group.key
            );

          if (items.length === 0) {
            return null;
          }

          return (
            <div key={group.key}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {group.title}
              </p>

              <div className="mt-2 space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2"
                  >
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        item.priority ===
                        "high"
                          ? "bg-red-500"
                          : item.priority ===
                              "medium"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                      }`}
                    />

                    <p className="text-xs leading-5 text-slate-700">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </ImpactAccordion>
  );
}