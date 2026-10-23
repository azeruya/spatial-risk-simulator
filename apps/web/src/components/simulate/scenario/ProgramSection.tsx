import { useState } from "react";
import { ScenarioType } from "@/types/simulation";
import { ScenarioSlider } from "./ScenarioControls";

type PresetId =
  | "residential"
  | "commercial"
  | "industrial";

const PRESETS: {
  id: "residential" | "commercial" | "industrial";
  label: string;
  description: string;
  impervious: number;
  green: number;
}[] = [
  {
    id: "residential",
    label: "Residential",
    description: "Housing with moderate built area and more open space.",
    impervious: 55,
    green: 35,
  },
  {
    id: "commercial",
    label: "Commercial",
    description: "Shops, offices, hotels, and other business-oriented development.",
    impervious: 70,
    green: 20,
  },
  {
    id: "industrial",
    label: "Industrial",
    description: "Warehouses, factories, and logistics sites with large sealed areas.",
    impervious: 85,
    green: 5,
  },
];

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
  setScenarioType: (value: ScenarioType) => void;

  imperviousPercent: number;
  setImperviousPercent: (value: number) => void;

  greenPercent: number;
  setGreenPercent: (value: number) => void;

  additionalPopulation: number;
  setAdditionalPopulation: (value: number) => void;
}) {
  
 const [selectedPreset, setSelectedPreset] =
  useState<PresetId | null>("residential");

const activePreset =
  PRESETS.find(
    (preset) =>
      preset.id === selectedPreset
  ) ?? null;

  const maxGreen = 100 - imperviousPercent;

  function applyPreset(
    preset: (typeof PRESETS)[number]
  ) {
    setSelectedPreset(preset.id);

    setImperviousPercent(
      preset.impervious
    );

    setGreenPercent(
      preset.green
    );
  }

  function handleImpervious(
    value: number
  ) {
    setSelectedPreset(null);

    setImperviousPercent(value);

    if (
      greenPercent >
      100 - value
    ) {
      setGreenPercent(
        100 - value
      );
    }
  }

  function handleGreen(
    value: number
  ) {
    setSelectedPreset(null);
    setGreenPercent(value);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Presets">
          {PRESETS.map((preset) => {
            const active = activePreset?.id === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                onClick={() => applyPreset(preset)}
                className={`rounded-xl border px-1 py-2 text-xs transition ${
                  active
                    ? "border-blue-300 bg-blue-50 font-semibold text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50/40"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="mt-2">
          <p className="text-xs leading-4 text-slate-500">
            {activePreset
              ? activePreset.description
              : "Custom surface mix."}
          </p>

          <p className="mt-1 text-[10px] leading-4 text-slate-400">
            Starting values are illustrative defaults.
            Adjust them to match your project.
          </p>
        </div>
      </div>

      <MixBar impervious={imperviousPercent} green={greenPercent} />

      <ScenarioSlider
        label="Paved surface"
        description="Buildings, roads and paved areas"
        value={imperviousPercent}
        onChange={handleImpervious}
      />

      <ScenarioSlider
        label="Green space"
        description="Vegetated and permeable space"
        value={greenPercent}
        onChange={handleGreen}
        max={maxGreen}
        hint={`Up to ${maxGreen}% with this paved share`}
      />

      <div className="flex items-center justify-between gap-3">
        <div>
          <label
            htmlFor="additional-occupants"
            className="text-sm font-medium text-slate-800"
          >
            Added occupants
          </label>
          <p className="mt-0.5 text-xs leading-4 text-slate-500">
            People living or working here
          </p>
        </div>

        <input
          id="additional-occupants"
          type="number"
          min={0}
          step={10}
          value={additionalPopulation}
          onChange={(event) =>
            setAdditionalPopulation(Math.max(0, Number(event.target.value)))
          }
          className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-right text-sm"
        />
      </div>

    </div>
  );
}

function MixBar({ impervious, green }: { impervious: number; green: number }) {
  const other = Math.max(0, 100 - impervious - green);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-slate-600">
        <span className="font-medium text-slate-800">Surface mix</span>
        <span>
          Paved {impervious}% · Green {green}% · Other {other}%
        </span>
      </div>

      <div
        className="flex h-2.5 overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={`Paved ${impervious}%, green ${green}%, other ${other}%`}
      >
        <span className="bg-slate-600" style={{ width: `${impervious}%` }} />
        <span className="bg-emerald-500" style={{ width: `${green}%` }} />
        <span className="bg-slate-300" style={{ width: `${other}%` }} />
      </div>
    </div>
  );
}