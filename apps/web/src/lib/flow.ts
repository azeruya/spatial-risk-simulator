/**
 * The three-step workflow: Live -> Risk -> Simulate.
 * One place defines each step's number, wording and accent so the navbar,
 * rail headers and "next step" cards always agree.
 *
 * Class names are written out in full so Tailwind can see them.
 */
export type FlowStep = "live" | "risk" | "simulate";

type StepStyle = {
  href: string;
  index: 1 | 2 | 3;
  label: string;
  verb: string;
  /** Eyebrow / accent text */
  text: string;
  /** Number badge */
  badge: string;
  /** Solid dot */
  dot: string;
  /** Soft status pill */
  pill: string;
  /** Tinted card used for "next step" */
  card: string;
};

export const FLOW: Record<FlowStep, StepStyle> = {
  live: {
    href: "/live",
    index: 1,
    label: "Live",
    verb: "Observe",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700",
    card: "border-emerald-100 bg-emerald-50/50",
  },
  risk: {
    href: "/risk",
    index: 2,
    label: "Risk",
    verb: "Understand",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-700",
    card: "border-amber-100 bg-amber-50/50",
  },
  simulate: {
    href: "/simulate",
    index: 3,
    label: "Simulate",
    verb: "Explore",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    pill: "bg-blue-50 text-blue-700",
    card: "border-blue-100 bg-blue-50/50",
  },
};

export const FLOW_ORDER: FlowStep[] = ["live", "risk", "simulate"];
