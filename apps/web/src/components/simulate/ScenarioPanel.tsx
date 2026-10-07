"use client";

import { useMemo, useState } from "react";

export type ScenarioType =
  | "new-development"
  | "expansion"
  | "densification"
  | "green-retrofit";

type ScenarioPanelProps = {
  scenarioType: ScenarioType;
  setScenarioType: (
    value: ScenarioType
  ) => void;

  projectAreaHa: number;
  setProjectAreaHa: (
    value: number
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
};

export default function ScenarioPanel({
  scenarioType,
  setScenarioType,
  projectAreaHa,
  setProjectAreaHa,
  imperviousPercent,
  setImperviousPercent,
  greenPercent,
  setGreenPercent,
  additionalPopulation,
  setAdditionalPopulation,
}: ScenarioPanelProps) {
  return (
    <aside className="overflow-y-auto border-r border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Proposed scenario
      </p>

      {/* Scenario type */}
      <div className="mt-5">
        <label className="text-xs font-medium text-slate-600">
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
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500"
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
      </div>

      {/* Project area */}
      <div className="mt-6">
        <div className="flex items-end justify-between">
          <label className="text-xs font-medium text-slate-600">
            Project area
          </label>

          <p className="text-lg font-semibold text-slate-900">
            {projectAreaHa.toFixed(1)}
            <span className="ml-1 text-xs font-normal text-slate-400">
              ha
            </span>
          </p>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[0.5, 1, 2, 5].map(
            (value) => (
              <button
                key={value}
                onClick={() =>
                  setProjectAreaHa(value)
                }
                className={`rounded-lg border py-2 text-xs transition ${
                  projectAreaHa === value
                    ? "border-blue-500 bg-blue-50 font-medium text-blue-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {value} ha
              </button>
            )
          )}
        </div>

        <input
          type="number"
          min={0.1}
          max={100}
          step={0.1}
          value={projectAreaHa}
          onChange={(event) =>
            setProjectAreaHa(
              Math.max(
                0.1,
                Number(event.target.value)
              )
            )
          }
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </div>

      <div className="my-6 border-t border-slate-100" />

      <ScenarioSlider
        label="Impervious surface"
        description="Buildings, roads and paved surfaces"
        value={imperviousPercent}
        onChange={setImperviousPercent}
      />

      <div className="mt-6">
        <ScenarioSlider
          label="Green / open space"
          description="Vegetated and permeable space"
          value={greenPercent}
          onChange={setGreenPercent}
        />
      </div>

      <div className="mt-6">
        <div className="flex items-end justify-between">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Additional occupants
            </label>

            <p className="mt-1 text-[11px] text-slate-400">
              Expected population introduced
              by the project
            </p>
          </div>
        </div>

        <input
          type="number"
          min={0}
          step={100}
          value={additionalPopulation}
          onChange={(event) =>
            setAdditionalPopulation(
              Math.max(
                0,
                Number(event.target.value)
              )
            )
          }
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
        />
      </div>
    </aside>
  );
}

function ScenarioSlider({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-600">
            {label}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {description}
          </p>
        </div>

        <span className="rounded-lg bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-800">
          {value}%
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(event) =>
          onChange(
            Number(event.target.value)
          )
        }
        className="mt-4 w-full cursor-pointer accent-blue-600"
      />

      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}