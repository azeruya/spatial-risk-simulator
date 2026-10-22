import { RetentionLevel } from "@/types/simulation";
import { ScenarioSlider } from "./ScenarioControls";

export function MitigationSection({
  permeableSurfacePercent,
  setPermeableSurfacePercent,

  greenInfrastructurePercent,
  setGreenInfrastructurePercent,

  retentionLevel,
  setRetentionLevel,
}: {
  permeableSurfacePercent: number;
  setPermeableSurfacePercent:
    (value: number) => void;

  greenInfrastructurePercent: number;
  setGreenInfrastructurePercent:
    (value: number) => void;

  retentionLevel: RetentionLevel;
  setRetentionLevel:
    (value: RetentionLevel) => void;
}) {
  return (
    <div className="space-y-5">
      <ScenarioSlider
        label="Permeable replacement"
        description="Replace proposed sealed surfaces with permeable materials."
        value={permeableSurfacePercent}
        onChange={
          setPermeableSurfacePercent
        }
      />

      <ScenarioSlider
        label="Green infrastructure"
        description="Rain gardens, bioswales and vegetated drainage."
        value={
          greenInfrastructurePercent
        }
        onChange={
          setGreenInfrastructurePercent
        }
      />

      <div>
        <label className="text-xs font-medium text-slate-700">
          Stormwater retention
        </label>

        <p className="mt-1 text-[11px] text-slate-500">
          Temporary on-site runoff
          storage.
        </p>

        <select
          value={retentionLevel}
          onChange={(event) =>
            setRetentionLevel(
              event.target
                .value as RetentionLevel
            )
          }
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
        >
          <option value="none">
            None
          </option>

          <option value="low">
            Low
          </option>

          <option value="moderate">
            Moderate
          </option>

          <option value="high">
            High
          </option>
        </select>
      </div>
    </div>
  );
}