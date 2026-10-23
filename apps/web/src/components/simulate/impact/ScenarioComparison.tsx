import type { SimulationView } from "@/types/simulation";
import type { SimulationResult } from "@/lib/simulation";
import {
  buildSurfaceMixes,
  type SurfaceMix,
} from "@/lib/simulation/surfaceMix";

type Props = {
  simulation: SimulationResult;
  simulationView: SimulationView;

  baselineImperviousPercent: number;
  baselineGreenPercent: number;

  imperviousPercent: number;
  greenPercent: number;

  permeableSurfacePercent: number;

  hasMitigation: boolean;
};

type Delta = { value: number; against: string };

export default function ScenarioComparison({
  simulation,
  simulationView,
  baselineImperviousPercent,
  baselineGreenPercent,
  imperviousPercent,
  greenPercent,
  permeableSurfacePercent,
  hasMitigation,
}: Props) {
  const mixes = buildSurfaceMixes({
    baselineImperviousPercent,
    baselineGreenPercent,
    imperviousPercent,
    greenPercent,
    permeableSurfacePercent,
  });

  const current = simulation.baselineRunoffPressure;
  const proposed = simulation.scenarioRunoffPressure;
  const mitigated = simulation.mitigatedRunoffPressure;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-600">About your design</p>
        <p className="text-xs text-slate-500">Changes with scenario</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="mb-1 flex justify-between px-2 text-xs text-slate-500">
          <span>Rainwater runoff index</span>
          <span>Change vs today</span>
        </div>

        <div className="space-y-1">
          <ScenarioRow
            label="Current"
            mix={mixes.current}
            runoff={current}
            active={simulationView === "current"}
          />

          <ScenarioRow
            label="Proposed"
            mix={mixes.proposed}
            runoff={proposed}
            active={simulationView === "proposed"}
            deltas={[{ value: percentChange(current, proposed), against: "today" }]}
          />

          {hasMitigation && (
            <ScenarioRow
              label="Mitigated"
              mix={mixes.mitigated}
              runoff={mitigated}
              active={simulationView === "mitigated"}
              deltas={[
                { value: percentChange(current, mitigated), against: "today" },
                { value: percentChange(proposed, mitigated), against: "proposed" },
              ]}
            />
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-2 text-xs text-slate-600">
          <Legend color="bg-slate-600" label="Paved" />
          {hasMitigation && <Legend color="bg-cyan-500" label="Permeable paving" />}
          <Legend color="bg-emerald-500" label="Green" />
          <Legend color="bg-slate-300" label="Other" />
        </div>
      </div>
    </section>
  );
}

function ScenarioRow({
  label,
  mix,
  runoff,
  active,
  deltas = [],
}: {
  label: string;
  mix: SurfaceMix;
  runoff: number;
  active: boolean;
  deltas?: Delta[];
}) {
  const total = mix.impervious + mix.permeable + mix.green + mix.other;
  const width = (value: number) => (total > 0 ? (value / total) * 100 : 0);

  const [primary, ...secondary] = deltas;

  return (
    <div className={`rounded-xl p-2 ${active ? "bg-slate-50" : ""}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={`text-sm ${
            active ? "font-semibold text-slate-950" : "text-slate-700"
          }`}
        >
          {label}
        </span>

        <span className="text-xs text-slate-600">
          {runoff.toFixed(2)}
          {primary && <DeltaText delta={primary} />}
          {secondary.map((delta) => (
            <span key={delta.against} className="text-slate-500">
              {" · "}
              {formatDelta(delta.value)} vs {delta.against}
            </span>
          ))}
        </span>
      </div>

      <div
        role="img"
        aria-label={`${label}: paved ${Math.round(mix.impervious)}%, permeable ${Math.round(mix.permeable)}%, green ${Math.round(mix.green)}%, other ${Math.round(mix.other)}%`}
        className="mt-2 flex h-3 overflow-hidden rounded-full bg-slate-100"
      >
        <Segment width={width(mix.impervious)} className="bg-slate-600" />
        <Segment width={width(mix.permeable)} className="bg-cyan-500" />
        <Segment width={width(mix.green)} className="bg-emerald-500" />
        <Segment width={width(mix.other)} className="bg-slate-300" />
      </div>
    </div>
  );
}

function DeltaText({ delta }: { delta: Delta }) {
  const tone =
    Math.abs(delta.value) < 0.5
      ? "text-slate-500"
      : delta.value < 0
        ? "text-emerald-700"
        : "text-red-700";

  return (
    <span className={`ml-1.5 font-semibold ${tone}`}>
      {formatDelta(delta.value)}
    </span>
  );
}

function formatDelta(value: number) {
  if (Math.abs(value) < 0.5) return "No change";
  return `${value > 0 ? "+" : "-"}${Math.abs(Math.round(value))}%`;
}

function Segment({ width, className }: { width: number; className: string }) {
  if (width <= 0) return null;
  return <div className={className} style={{ width: `${width}%` }} />;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-sm ${color}`} />
      {label}
    </span>
  );
}

function percentChange(baseline: number, value: number) {
  if (baseline === 0) return 0;
  return ((value - baseline) / baseline) * 100;
}