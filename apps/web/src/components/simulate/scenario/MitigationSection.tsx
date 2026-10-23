import { RetentionLevel } from "@/types/simulation";
import { ScenarioSlider, SegmentedControl } from "./ScenarioControls";

/** Percent change in the runoff index when only this control is applied. Negative means less runoff. */
export type MitigationEffects = {
  permeable?: number;
  greenInfrastructure?: number;
  retention?: number;
};

function formatEffect(value?: number) {
  if (value === undefined || Math.abs(value) < 0.5) return undefined;
  return `${value > 0 ? "+" : "-"}${Math.abs(Math.round(value))}% runoff`;
}

const RETENTION_OPTIONS: { value: RetentionLevel; label: string }[] = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
];

export function MitigationSection({
  imperviousPercent,

  permeableSurfacePercent,
  setPermeableSurfacePercent,

  greenInfrastructurePercent,
  setGreenInfrastructurePercent,

  retentionLevel,
  setRetentionLevel,

  effects,
}: {
  /** Used to show how much of the whole parcel the permeable paving covers. */
  imperviousPercent: number;

  permeableSurfacePercent: number;
  setPermeableSurfacePercent: (value: number) => void;

  greenInfrastructurePercent: number;
  setGreenInfrastructurePercent: (value: number) => void;

  retentionLevel: RetentionLevel;
  setRetentionLevel: (value: RetentionLevel) => void;

  effects?: MitigationEffects;
}) {
  const permeableOfParcel = Math.round(
    (imperviousPercent * permeableSurfacePercent) / 100
  );

  const retentionEffect = formatEffect(effects?.retention);

  return (
    <div className="space-y-5">
      <ScenarioSlider
        label="Permeable paving"
        description="Share of the paved surface switched to permeable materials."
        value={permeableSurfacePercent}
        onChange={setPermeableSurfacePercent}
        hint={
          imperviousPercent > 0
            ? `= ${permeableOfParcel}% of the parcel`
            : "No paved surface to replace"
        }
        effect={formatEffect(effects?.permeable)}
      />

      <ScenarioSlider
        label="Green infrastructure"
        description="Rain gardens, bioswales and vegetated drainage."
        value={greenInfrastructurePercent}
        onChange={setGreenInfrastructurePercent}
        effect={formatEffect(effects?.greenInfrastructure)}
      />

      <div>
        <p className="text-sm font-medium text-slate-800">
          Stormwater retention
        </p>

        <p className="mb-2 mt-0.5 text-xs leading-4 text-slate-500">
          Temporary on-site storage. Applied after the surface mix.
        </p>

        <SegmentedControl
          label="Stormwater retention"
          options={RETENTION_OPTIONS}
          value={retentionLevel}
          onChange={setRetentionLevel}
        />

        {retentionEffect && (
          <div className="mt-1.5 flex justify-end">
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
              {retentionEffect}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}