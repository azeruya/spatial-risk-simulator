import type {
  SimulationView,
} from "@/types/simulation";

import type {
  SimulationResult,
} from "@/lib/simulation";

type ScenarioData = {
  impervious: number;
  green: number;
  other: number;
  permeable?: number;
  greenInfrastructure?: number;
  runoff: number;
};

type Props = {
  simulation: SimulationResult;

  simulationView: SimulationView;

  baselineImperviousPercent: number;
  baselineGreenPercent: number;

  imperviousPercent: number;
  greenPercent: number;

  permeableSurfacePercent: number;
  greenInfrastructurePercent: number;

  hasMitigation: boolean;
};

export default function ScenarioComparison({
  simulation,
  simulationView,

  baselineImperviousPercent,
  baselineGreenPercent,

  imperviousPercent,
  greenPercent,

  permeableSurfacePercent,
  greenInfrastructurePercent,

  hasMitigation,
}: Props) {
  const proposedOther =
    Math.max(
      0,
      100 -
        imperviousPercent -
        greenPercent
    );

  const current: ScenarioData = {
    impervious:
      baselineImperviousPercent,

    green:
      baselineGreenPercent,

    other: Math.max(
      0,
      100 -
        baselineImperviousPercent -
        baselineGreenPercent
    ),

    runoff:
      simulation.baselineRunoffPressure,
  };

  const proposed: ScenarioData = {
    impervious:
      imperviousPercent,

    green:
      greenPercent,

    other:
      proposedOther,

    runoff:
      simulation.scenarioRunoffPressure,
  };

  const mitigatedImpervious =
    Math.max(
      0,
      imperviousPercent -
        permeableSurfacePercent
    );

  const mitigatedGreen =
    Math.min(
      100,
      greenPercent +
        greenInfrastructurePercent
    );

  const mitigatedOther =
    Math.max(
      0,
      100 -
        mitigatedImpervious -
        mitigatedGreen -
        permeableSurfacePercent
    );

  const mitigated: ScenarioData = {
    impervious:
      mitigatedImpervious,

    green:
      mitigatedGreen,

    other:
      mitigatedOther,

    permeable:
      permeableSurfacePercent,

    greenInfrastructure:
      greenInfrastructurePercent,

    runoff:
      simulation.mitigatedRunoffPressure,
  };

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">
          About your design
        </p>

        <p className="text-[10px] text-slate-400">
          Changes with scenario
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="space-y-4">
          <ScenarioRow
            label="Current"
            data={current}
            active={
              simulationView ===
              "current"
            }
          />

          <ScenarioRow
            label="Proposed"
            data={proposed}
            active={
              simulationView ===
              "proposed"
            }
            comparison={percentChange(
              current.runoff,
              proposed.runoff
            )}
          />

          {hasMitigation && (
            <ScenarioRow
              label="Mitigated"
              data={mitigated}
              active={
                simulationView ===
                "mitigated"
              }
              comparison={percentChange(
                current.runoff,
                mitigated.runoff
              )}
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
          <Legend
            color="bg-slate-600"
            label="Paved"
          />

          <Legend
            color="bg-green-500"
            label="Green"
          />

          <Legend
            color="bg-slate-300"
            label="Other"
          />

          {hasMitigation && (
            <Legend
              color="bg-cyan-500"
              label="Permeable"
            />
          )}
        </div>
      </div>
    </section>
  );
}

function ScenarioRow({
  label,
  data,
  comparison,
  active,
}: {
  label: string;
  data: ScenarioData;
  comparison?: number;
  active: boolean;
}) {
  const total =
    data.impervious +
    data.green +
    data.other +
    (data.permeable ?? 0);

  const normalize = (value: number) =>
    total > 0 ? (value / total) * 100 : 0;

  return (
    <div
      className={
        active
          ? "rounded-xl bg-slate-50 p-2"
          : "px-2"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-800">
          {label}
        </span>

        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-slate-600">
            Runoff {data.runoff.toFixed(2)}
          </span>

          {comparison !== undefined && (
            <span
              className={`text-xs font-semibold ${
                comparison < 0
                  ? "text-green-700"
                  : comparison > 0
                    ? "text-red-700"
                    : "text-slate-500"
              }`}
            >
              {comparison > 0 ? "+" : ""}
              {comparison.toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-slate-100">
        <Segment
          width={normalize(
            data.impervious
          )}
          className="bg-slate-600"
        />

        {data.permeable ? (
          <Segment
            width={normalize(
              data.permeable
            )}
            className="bg-cyan-500"
          />
        ) : null}

        <Segment
          width={normalize(data.green)}
          className="bg-green-500"
        />

        <Segment
          width={normalize(data.other)}
          className="bg-slate-300"
        />
      </div>
    </div>
  );
}

function Segment({
  width,
  className,
}: {
  width: number;
  className: string;
}) {
  if (width <= 0) return null;

  return (
    <div
      className={className}
      style={{
        width: `${width}%`,
      }}
    />
  );
}

function Legend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`h-2 w-2 rounded-full ${color}`}
      />
      {label}
    </span>
  );
}

function percentChange(
  baseline: number,
  value: number
) {
  if (baseline === 0) return 0;

  return (
    ((value - baseline) / baseline) *
    100
  );
}