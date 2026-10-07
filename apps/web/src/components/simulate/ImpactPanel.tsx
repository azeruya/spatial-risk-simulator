"use client";

import type { SimulationBaseline } from "@/types/simulation";
import { SimulationResult } from "@/lib/simulation";

type ImpactPanelProps = {
  projectAreaHa: number;
  imperviousPercent: number;
  greenPercent: number;
  additionalPopulation: number;
  baseline: SimulationBaseline;
  simulation: SimulationResult;
};

export default function ImpactPanel({
  projectAreaHa,
  imperviousPercent,
  greenPercent,
  additionalPopulation,
  baseline,
  simulation,
}: ImpactPanelProps) {
  const imperviousAreaHa =
    projectAreaHa * (imperviousPercent / 100);

  const greenAreaHa =
    projectAreaHa * (greenPercent / 100);

  const remainingAreaHa = Math.max(
    0,
    projectAreaHa -
      imperviousAreaHa -
      greenAreaHa
  );

  const scenarioPopulation =
  baseline?.population !== null &&
  baseline?.population !== undefined
    ? baseline.population +
      additionalPopulation
    : null;

  return (
    <aside className="overflow-y-auto border-l border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Scenario impact
          </p>

          <p className="mt-1 text-sm font-medium text-slate-900">
            Live development footprint
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700">
          Live
        </span>
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Baseline context
        </p>

        {baseline.status === "idle" && (
            <div className="mt-2 rounded-xl border border-dashed border-slate-300 p-3">
            <p className="text-xs text-slate-500">
                Select a site on the map to load baseline conditions.
            </p>
            </div>
        )}

        {baseline.status === "loading" && (
            <div className="mt-2 rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500">
                Loading site context...
            </p>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-slate-300" />
            </div>
            </div>
        )}

        {baseline.status === "success" && (
            <div className="mt-2 grid grid-cols-2 gap-2">
            <MetricCard
                label="Population · 500 m"
                value={
                baseline.population !== null
                    ? Math.round(
                        baseline.population
                    ).toLocaleString()
                    : "—"
                }
            />

            <MetricCard
                label="Density"
                value={
                baseline.populationDensity !==
                null
                    ? `${Math.round(
                        baseline.populationDensity
                    ).toLocaleString()}/km²`
                    : "—"
                }
            />

            <MetricCard
                label="Flood avg."
                value={
                baseline.floodAverage !== null
                    ? baseline.floodAverage.toFixed(
                        3
                    )
                    : "No data"
                }
            />

            <MetricCard
                label="Flood max."
                value={
                baseline.floodMaximum !== null
                    ? baseline.floodMaximum.toFixed(
                        3
                    )
                    : "No data"
                }
            />
            </div>
        )}

        {baseline.status === "error" && (
            <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-xs text-amber-700">
                Baseline context temporarily unavailable.
            </p>
            </div>
        )}
        </div>

      <div className="mt-5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Proposed site
        </p>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <MetricCard
            label="Project area"
            value={`${projectAreaHa.toFixed(1)} ha`}
          />

          <MetricCard
            label="New occupants"
            value={`+${additionalPopulation.toLocaleString()}`}
          />

          <MetricCard
            label="Impervious"
            value={`${imperviousAreaHa.toFixed(2)} ha`}
          />

          <MetricCard
            label="Green space"
            value={`${greenAreaHa.toFixed(2)} ha`}
          />
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Land allocation
        </p>

        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex h-4 w-full">
            <div
              className="bg-slate-700 transition-all duration-300"
              style={{
                width: `${imperviousPercent}%`,
              }}
            />

            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{
                width: `${greenPercent}%`,
              }}
            />

            <div
              className="bg-slate-200 transition-all duration-300"
              style={{
                width: `${Math.max(
                  0,
                  100 -
                    imperviousPercent -
                    greenPercent
                )}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 p-3">
            <AllocationItem
              label="Impervious"
              value={`${imperviousPercent}%`}
            />

            <AllocationItem
              label="Green"
              value={`${greenPercent}%`}
            />

            <AllocationItem
              label="Other"
              value={`${Math.max(
                0,
                100 -
                  imperviousPercent -
                  greenPercent
              )}%`}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Scenario interpretation
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          This proposal develops{" "}
          <span className="font-semibold text-slate-900">
            {projectAreaHa.toFixed(1)} ha
          </span>
          , including{" "}
          <span className="font-semibold text-slate-900">
            {imperviousAreaHa.toFixed(2)} ha
          </span>{" "}
          of impervious surface and{" "}
          <span className="font-semibold text-slate-900">
            {greenAreaHa.toFixed(2)} ha
          </span>{" "}
          of green or open space.
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          The proposal also introduces approximately{" "}
          <span className="font-semibold text-slate-900">
            {additionalPopulation.toLocaleString()}
          </span>{" "}
          additional occupants.
        </p>

        {remainingAreaHa > 0 && (
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Approximately{" "}
            {remainingAreaHa.toFixed(2)} ha remains
            classified as other or pervious land.
          </p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-4">
        <p className="text-xs font-medium text-slate-700">
          Next: impact simulation
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          This panel will next compare baseline vs
          scenario runoff, green cover, and population
          exposure using the selected site context.
        </p>
      </div>

      {scenarioPopulation !== null && (
        <div className="mt-6">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Exposure change
            </p>

            <div className="mt-2 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-[10px] text-slate-400">
                    Baseline
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-800">
                    {Math.round(
                    baseline.population ?? 0
                    ).toLocaleString()}
                </p>
                </div>

                <div className="px-3 text-slate-300">
                →
                </div>

                <div className="text-right">
                <p className="text-[10px] text-slate-400">
                    Scenario
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                    {Math.round(
                    scenarioPopulation
                    ).toLocaleString()}
                </p>
                </div>
            </div>

            <p className="mt-3 text-xs font-medium text-blue-700">
                +{additionalPopulation.toLocaleString()} occupants
            </p>
            </div>
        </div>
        )}
    </aside>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function AllocationItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}