import { ScenarioType } from "@/types/simulation";
import { ScenarioSlider } from "./ScenarioControls";

const PROGRAM_PRESETS = {
  housing: {
    scenarioType:
      "new-development",
    imperviousPercent: 55,
    greenPercent: 35,
    occupants: 250,
  },

  redevelopment: {
    scenarioType:
      "green-retrofit",
    imperviousPercent: 60,
    greenPercent: 30,
    occupants: 100,
  },

  commercial: {
    scenarioType: "expansion",
    imperviousPercent: 80,
    greenPercent: 10,
    occupants: 150,
  },
} as const;

export function ProgramSection({
  scenarioType,
  setScenarioType,

  imperviousPercent,
  setImperviousPercent,

  greenPercent,
  setGreenPercent,

  additionalPopulation,
  setAdditionalPopulation,
}: {
  scenarioType: ScenarioType;
  setScenarioType: (
    value: ScenarioType
  ) => void;

  imperviousPercent: number;
  setImperviousPercent: (
    value: number
  ) => void;

  greenPercent: number;
  setGreenPercent: (
    value: number
  ) => void;

  additionalPopulation: number;
  setAdditionalPopulation: (
    value: number
  ) => void;
}) {
  function applyPreset(
    type:
      | "housing"
      | "redevelopment"
      | "commercial"
  ) {
    if (type === "housing") {
      setScenarioType(
        "new-development"
      );
      setImperviousPercent(55);
      setGreenPercent(35);
      setAdditionalPopulation(250);
    }

    if (type === "redevelopment") {
      setScenarioType(
        "green-retrofit"
      );
      setImperviousPercent(60);
      setGreenPercent(30);
      setAdditionalPopulation(100);
    }

    if (type === "commercial") {
      setScenarioType("expansion");
      setImperviousPercent(80);
      setGreenPercent(10);
      setAdditionalPopulation(150);
    }
  }

  return (
    <div>
      <p className="text-xs font-medium text-slate-700">
        Quick presets
      </p>

      <div className="mt-2 grid grid-cols-1 gap-2">
        <PresetButton
          label="Greenfield housing"
          description="Balanced housing with open space"
          onClick={() =>
            applyPreset("housing")
          }
        />

        <PresetButton
          label="Urban redevelopment"
          description="Reduce sealed surface in an existing built-up site"
          onClick={() =>
            applyPreset(
              "redevelopment"
            )
          }
        />

        <PresetButton
          label="Commercial"
          description="Higher-intensity developed surface"
          onClick={() =>
            applyPreset(
              "commercial"
            )
          }
        />
      </div>

      <div className="my-5 border-t border-slate-100" />

      <label className="text-xs font-medium text-slate-700">
        Development type
      </label>

      <select
        value={scenarioType}
        onChange={(event) =>
          setScenarioType(
            event.target
              .value as ScenarioType
          )
        }
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800"
      >
        <option value="new-development">
          New development
        </option>

        <option value="expansion">
          Expansion
        </option>

        <option value="densification">
          Densification
        </option>

        <option value="green-retrofit">
          Green retrofit
        </option>
      </select>

      <div className="mt-5">
        <ScenarioSlider
          label="Impervious surface"
          description="Buildings, roads and paved surfaces"
          value={imperviousPercent}
          onChange={
            setImperviousPercent
          }
        />
      </div>

      <div className="mt-5">
        <ScenarioSlider
          label="Green / open space"
          description="Vegetated and permeable space"
          value={greenPercent}
          onChange={setGreenPercent}
        />
      </div>

      <div className="mt-5">
        <label className="text-xs font-medium text-slate-700">
          Additional occupants
        </label>

        <p className="mt-1 text-[11px] text-slate-500">
          Expected people introduced by
          the project.
        </p>

        <input
          type="number"
          min={0}
          step={10}
          value={additionalPopulation}
          onChange={(event) =>
            setAdditionalPopulation(
              Math.max(
                0,
                Number(
                  event.target.value
                )
              )
            )
          }
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
        />
      </div>
    </div>
  );
}

function PresetButton({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
    >
      <p className="text-xs font-semibold text-slate-800">
        {label}
      </p>

      <p className="mt-1 text-[10px] leading-4 text-slate-500">
        {description}
      </p>
    </button>
  );
}