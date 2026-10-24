import Link from "next/link";
import {
  Activity,
  ArrowRight,
  FileText,
  GitCompare,
  Info,
  Layers3,
  ShieldAlert,
} from "lucide-react";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

const EYEBROW =
  "text-[11px] font-semibold uppercase tracking-[0.16em]";

/**
 * Each page already has its own accent: Live is emerald, Risk is amber and
 * Simulate is blue. The landing cards reuse them so the hand-off feels continuous.
 * Class names are written out in full so Tailwind can find them.
 */
const STEPS = [
  {
    href: "/live",
    number: "01",
    name: "Live",
    verb: "Observe",
    icon: Activity,
    description:
      "See what is happening now, from recent earthquakes to local weather conditions.",
    points: [
      "Latest, felt and significant earthquakes",
      "Local weather forecast",
    ],
    source: "BMKG",
    accent: {
      eyebrow: "text-emerald-600",
      tile: "bg-emerald-50 text-emerald-600",
      dot: "bg-emerald-500",
      link: "text-emerald-700",
      card: "border-slate-200 hover:border-emerald-200",
    },
  },
  {
    href: "/risk",
    number: "02",
    name: "Risk",
    verb: "Understand",
    icon: ShieldAlert,
    description:
      "Understand the hazards a site already faces before anything is designed.",
    points: [
      "Flood, tsunami and landslide hazard",
      "Terrain, land cover and people nearby",
    ],
    source: "BNPB InaRISK · WorldPop",
    accent: {
      eyebrow: "text-amber-600",
      tile: "bg-amber-50 text-amber-600",
      dot: "bg-amber-500",
      link: "text-amber-700",
      card: "border-slate-200 hover:border-amber-200",
    },
  },
  {
    href: "/simulate",
    number: "03",
    name: "Simulate",
    verb: "Explore",
    icon: Layers3,
    description:
      "Draw a proposed development and see how it changes the site, before it is built.",
    points: [
      "Compare Current, Proposed and Mitigated",
      "Get a verdict, recommendations and a report",
    ],
    source: "Scenario engine",
    accent: {
      eyebrow: "text-blue-600",
      tile: "bg-blue-50 text-blue-600",
      dot: "bg-blue-500",
      link: "text-blue-700",
      card: "border-blue-200 ring-1 ring-blue-100 hover:border-blue-300",
    },
  },
] as const;

const BENEFITS = [
  {
    icon: GitCompare,
    title: "Three views of one site",
    text: "Compare today's site, your proposal and a mitigated design side by side, with runoff shown for each.",
  },
  {
    icon: FileText,
    title: "Plain-language results",
    text: "A verdict, the hazards at the site and clear next steps, then a report you can download and share.",
  },
  {
    icon: Info,
    title: "Honest about limits",
    text: "Results are screening-level indicators. They show where to look closer, and do not replace AMDAL or an engineering study.",
  },
] as const;

export default function Home() {
  return (
    <main className="flex-1 bg-slate-50 text-slate-900">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Disaster-aware spatial intelligence
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.5rem]">
              Understand risk.
              <br />
              <span className="text-blue-600">Simulate before you build.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              SIVORA shows what is happening now, which hazards a site already
              faces, and what a proposed development would change, so planners
              can test an idea before anything is built.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/simulate"
                className={`inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 ${FOCUS}`}
              >
                Start a simulation
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>

              <Link
                href="/live"
                className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${FOCUS}`}
              >
                Explore live data
              </Link>
            </div>

            <p className="mt-8 text-xs leading-5 text-slate-500">
              Built on BNPB InaRISK, BMKG, WorldPop and Copernicus DEM data.
            </p>
          </div>

          <ProductPreview />
        </div>
      </section>

      {/* Workflow */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className={`${EYEBROW} text-slate-500`}>How it works</p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            From what is happening now to what could happen next.
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            Three connected steps, from watching conditions, to understanding a
            site, to testing a design.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <StepCard key={step.href} step={step} />
          ))}
        </div>
      </section>

      {/* Value */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <p className={`${EYEBROW} text-blue-600`}>Beyond disaster monitoring</p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Other tools show where risk is. SIVORA shows what your design
              does to it.
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Paving over a site changes how much rain runs off, and building on
              it changes how many people are exposed to hazards that are already
              there. Seeing both early is cheaper than finding out later.
            </p>
          </div>

          <ul className="space-y-3">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit.title}
                className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <benefit.icon className="h-5 w-5" aria-hidden />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {benefit.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-24">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-8 sm:p-12">
          <p className={`${EYEBROW} text-blue-600`}>Try it</p>

          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            What happens if we build here?
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            Choose a location, check what the site already faces, then test a
            development scenario in a few minutes.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/simulate"
              className={`inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 ${FOCUS}`}
            >
              Create a scenario
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>

            <Link
              href="/risk"
              className={`rounded-md text-sm font-medium text-blue-700 transition hover:text-blue-800 ${FOCUS}`}
            >
              Check a site's risk first
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-xs leading-5 text-slate-500 sm:flex-row sm:items-start sm:justify-between lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-[11px] font-bold text-white">
              S
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">SIVORA</p>
              <p>Spatial intelligence platform</p>
            </div>
          </div>

          <div className="max-w-md sm:text-right">
            <p>
              Data: BNPB InaRISK · BMKG · WorldPop · Copernicus DEM · ESA
              WorldCover
            </p>
            <p className="mt-1">
              Screening-level planning indicators. Not a substitute for AMDAL or
              an engineering assessment.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function StepCard({ step }: { step: (typeof STEPS)[number] }) {
  const Icon = step.icon;

  return (
    <Link
      href={step.href}
      className={`group flex flex-col rounded-2xl border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] ${step.accent.card} ${FOCUS}`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${step.accent.tile}`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>

        <span className="text-xs font-medium text-slate-400">
          {step.number}
        </span>
      </div>

      <p className={`${EYEBROW} mt-6 ${step.accent.eyebrow}`}>{step.verb}</p>

      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
        {step.name}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {step.description}
      </p>

      <ul className="mt-5 space-y-2 text-sm text-slate-700">
        {step.points.map((point) => (
          <li key={point} className="flex items-start gap-2.5">
            <span
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${step.accent.dot}`}
            />
            {point}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between pt-8">
        <span className="text-xs text-slate-500">{step.source}</span>

        <span
          className={`flex items-center gap-1.5 text-sm font-medium ${step.accent.link}`}
        >
          Open {step.name}
          <ArrowRight
            className="h-4 w-4 transition group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}

/**
 * A static picture of the Simulate screen. The numbers are an example, not live data,
 * and the card says so. It is hidden from screen readers for the same reason.
 */
function ProductPreview() {
  return (
    <figure aria-hidden="true">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className={`${EYEBROW} text-blue-600`}>Simulate</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-950">
              Site assessment
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            Example
          </span>
        </div>

        <div className="space-y-4 p-5">
          <MiniMap />

          <div className="grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-50 p-1 text-center text-xs font-medium">
            <span className="rounded-lg px-3 py-2 text-slate-500">Current</span>
            <span className="rounded-lg bg-white px-3 py-2 text-slate-950 shadow-sm">
              Proposed
            </span>
            <span className="rounded-lg px-3 py-2 text-slate-500">
              Mitigated
            </span>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-medium text-amber-800">
              Verdict · Attention
            </p>
            <p className="mt-1.5 text-[17px] font-semibold leading-6 text-slate-950">
              This design adds about 24% more runoff on a flood-prone site.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-3">
            <div className="mb-1 flex justify-between px-2 text-xs text-slate-500">
              <span>Rainwater runoff index</span>
              <span>Change vs today</span>
            </div>

            <RunoffRow
              label="Current"
              value="0.55"
              segments={[
                [50, "bg-slate-600"],
                [50, "bg-emerald-500"],
              ]}
            />

            <RunoffRow
              active
              label="Proposed"
              value="0.68"
              delta="+24%"
              deltaClass="text-red-700"
              segments={[
                [65, "bg-slate-600"],
                [25, "bg-emerald-500"],
                [10, "bg-slate-300"],
              ]}
            />

            <RunoffRow
              label="Mitigated"
              value="0.52"
              delta="-5%"
              deltaClass="text-emerald-700"
              segments={[
                [36, "bg-slate-600"],
                [29, "bg-cyan-500"],
                [25, "bg-emerald-500"],
                [10, "bg-slate-300"],
              ]}
            />
          </div>
        </div>
      </div>

      <figcaption className="mt-3 text-center text-xs text-slate-500">
        Illustrative example, not live data.
      </figcaption>
    </figure>
  );
}

function MiniMap() {
  return (
    <div className="relative h-36 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      <div className="absolute left-0 top-0 h-[55%] w-[38%] bg-emerald-100" />
      <div className="absolute right-0 top-0 h-[42%] w-[30%] bg-amber-100" />
      <div className="absolute bottom-0 right-0 h-[45%] w-[40%] bg-emerald-100" />
      <div className="absolute -left-4 top-[58%] h-3 w-[120%] -rotate-12 bg-white" />
      <div className="absolute left-[38%] top-0 h-full w-2 rotate-12 bg-white" />

      <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-blue-500/70 bg-amber-400/25" />
      <div className="absolute left-1/2 top-1/2 h-3.5 w-5 -translate-x-1/2 -translate-y-1/2 border-2 border-blue-600 bg-white/70" />

      <span className="absolute bottom-2 left-2 rounded-md border border-slate-200 bg-white/95 px-2 py-0.5 text-xs text-slate-600">
        Flood layer
      </span>
    </div>
  );
}

function RunoffRow({
  label,
  value,
  delta,
  deltaClass,
  segments,
  active = false,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaClass?: string;
  segments: ReadonlyArray<readonly [number, string]>;
  active?: boolean;
}) {
  return (
    <div className={`rounded-xl p-2 ${active ? "bg-slate-50" : ""}`}>
      <div className="flex items-baseline justify-between text-xs">
        <span
          className={
            active ? "text-sm font-semibold text-slate-950" : "text-sm text-slate-700"
          }
        >
          {label}
        </span>

        <span className="text-slate-600">
          {value}
          {delta && (
            <span className={`ml-1.5 font-semibold ${deltaClass}`}>{delta}</span>
          )}
        </span>
      </div>

      <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-slate-100">
        {segments.map(([width, color], index) => (
          <div
            key={index}
            className={color}
            style={{ width: `${width}%` }}
          />
        ))}
      </div>
    </div>
  );
}