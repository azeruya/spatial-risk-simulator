"use client";

import { FootprintMode, AreaUnit } from "@/types/simulation";

export type ScenarioType =
  | "new-development"
  | "expansion"
  | "densification"
  | "green-retrofit";

export type RetentionLevel =
  | "none"
  | "low"
  | "moderate"
  | "high";

type ScenarioPanelProps = {
  scenarioType: ScenarioType;
  setScenarioType: (
    value: ScenarioType
  ) => void;

  // Derived project area
  projectAreaHa: number;

  // Footprint input mode
  footprintMode: FootprintMode;
  setFootprintMode: (
    value: FootprintMode
  ) => void;

  // Area mode
  areaValue: number;
  setAreaValue: (
    value: number
  ) => void;

  areaUnit: AreaUnit;
  setAreaUnit: (
    value: AreaUnit
  ) => void;

  // Dimensions mode
  widthM: number;
  setWidthM: (
    value: number
  ) => void;

  lengthM: number;
  setLengthM: (
    value: number
  ) => void;

  // Existing development inputs
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

  // Mitigation
  permeableSurfacePercent: number;
  setPermeableSurfacePercent:
    (value: number) => void;

  greenInfrastructurePercent: number;
  setGreenInfrastructurePercent:
    (value: number) => void;

  retentionLevel: RetentionLevel;
  setRetentionLevel:
    (value: RetentionLevel) => void;

  bearing: number;
  setBearing: (value: number) => void;

  isDrawing: boolean;
  hasDrawnFootprint: boolean;
  drawnAreaM2: number;

  onStartDrawing: () => void;
  onCancelDrawing: () => void;
  onClearDrawing: () => void;
};

export default function ScenarioPanel({
  scenarioType,
  setScenarioType,

  projectAreaHa,

  footprintMode,
  setFootprintMode,

  areaValue,
  setAreaValue,

  areaUnit,
  setAreaUnit,

  widthM,
  setWidthM,

  lengthM,
  setLengthM,

  imperviousPercent,
  setImperviousPercent,

  greenPercent,
  setGreenPercent,

  additionalPopulation,
  setAdditionalPopulation,

  permeableSurfacePercent,
  setPermeableSurfacePercent,

  greenInfrastructurePercent,
  setGreenInfrastructurePercent,

  retentionLevel,
  setRetentionLevel,

  bearing,
  setBearing,
  isDrawing,
  hasDrawnFootprint,
  drawnAreaM2,

  onStartDrawing,
  onCancelDrawing,
  onClearDrawing,
}: ScenarioPanelProps) {
  console.log("bearing:", bearing);
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

      {/* Project footprint */}
      <div className="mt-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-slate-600">
              Project footprint
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              Define the physical size of the proposed site
            </p>
          </div>

          <div className="text-right">
            <p className="text-lg font-semibold text-slate-900">
              {projectAreaHa.toFixed(2)}
            </p>

            <p className="text-[10px] text-slate-400">
              hectares
            </p>
          </div>
        </div>

        {/* Mode selector */}
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
          {(
            [
              "area",
              "dimensions",
              "draw",
            ] as const
          ).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() =>
                setFootprintMode(mode)
              }
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${
                footprintMode === mode
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* AREA MODE */}
        {footprintMode === "area" && (
          <div className="mt-4">
            <label className="text-[11px] text-slate-400">
              Site area
            </label>

            <div className="mt-1 flex gap-2">
              <input
                type="number"
                min={0.01}
                step={
                  areaUnit === "ha"
                    ? 0.1
                    : 100
                }
                value={areaValue}
                onChange={(event) =>
                  setAreaValue(
                    Math.max(
                      0,
                      Number(
                        event.target.value
                      )
                    )
                  )
                }
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />

              <select
                value={areaUnit}
                onChange={(event) =>
                  setAreaUnit(
                    event.target
                      .value as AreaUnit
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="m2">
                  m²
                </option>

                <option value="ha">
                  ha
                </option>
              </select>
            </div>

            <p className="mt-2 text-[11px] text-slate-400">
              Equivalent to{" "}
              {Math.round(
                projectAreaHa * 10_000
              ).toLocaleString()}{" "}
              m²
            </p>
          </div>
        )}

        {/* DIMENSIONS MODE */}
        {footprintMode ===
          "dimensions" && (
          <div className="mt-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <div>
                <label className="text-[11px] text-slate-400">
                  Width
                </label>

                <div className="relative mt-1">
                  <input
                    type="number"
                    min={1}
                    value={widthM}
                    onChange={(event) =>
                      setWidthM(
                        Math.max(
                          1,
                          Number(
                            event.target
                              .value
                          )
                        )
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-8 text-sm outline-none focus:border-blue-500"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    m
                  </span>
                </div>
              </div>

              <span className="pb-3 text-slate-300">
                ×
              </span>

              <div>
                <label className="text-[11px] text-slate-400">
                  Length
                </label>

                <div className="relative mt-1">
                  <input
                    type="number"
                    min={1}
                    value={lengthM}
                    onChange={(event) =>
                      setLengthM(
                        Math.max(
                          1,
                          Number(
                            event.target
                              .value
                          )
                        )
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-8 text-sm outline-none focus:border-blue-500"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    m
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">
                      Orientation
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Rotate the footprint relative to the map
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {bearing}°
                  </div>

                </div>

                <input
                  type="range"
                  min={0}
                  max={180}
                  step={5}
                  value={bearing}
                  onChange={(event) =>
                    setBearing(Number(event.target.value))
                  }
                  className="mt-3 w-full"
                />

                <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                  <span>0°</span>
                  <span>90°</span>
                  <span>180°</span>
                </div>
              </div>

            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">
                  Calculated area
                </span>

                <span className="font-medium text-slate-700">
                  {(
                    widthM * lengthM
                  ).toLocaleString()}{" "}
                  m²
                </span>
              </div>

              <div className="mt-1 flex justify-between text-xs">
                <span className="text-slate-400">
                  Equivalent
                </span>

                <span className="font-medium text-slate-700">
                  {(
                    (widthM *
                      lengthM) /
                    10_000
                  ).toFixed(2)}{" "}
                  ha
                </span>
              </div>
            </div>
          </div>
        )}

        {/* DRAW MODE */}
        {footprintMode === "draw" && (
          <div
            className={`mt-4 rounded-xl border p-4 ${
              isDrawing
                ? "border-blue-300 bg-blue-50"
                : "border-dashed border-blue-200 bg-blue-50/50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-700">
                  {isDrawing
                    ? "Drawing project boundary"
                    : hasDrawnFootprint
                      ? "Project boundary defined"
                      : "Draw project boundary"}
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  {isDrawing
                    ? "Click points on the map to trace the proposed development. Close the polygon to finish."
                    : hasDrawnFootprint
                      ? "The proposed footprint has been calculated from the boundary you drew."
                      : "Draw the proposed development footprint directly on the map. Site area will be calculated automatically."}
                </p>
              </div>

              {isDrawing && (
                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-700">
                  Drawing
                </span>
              )}
            </div>

            {hasDrawnFootprint && !isDrawing && (
              <div className="mt-3 rounded-lg border border-blue-100 bg-white p-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                  Calculated footprint
                </p>

                <div className="mt-1 flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    {Math.round(drawnAreaM2).toLocaleString()} m²
                  </p>

                  <p className="text-xs text-slate-500">
                    {(drawnAreaM2 / 10_000).toFixed(2)} ha
                  </p>
                </div>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              {isDrawing ? (
                <button
                  type="button"
                  onClick={onCancelDrawing}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel drawing
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onStartDrawing}
                    className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    {hasDrawnFootprint
                      ? "Redraw boundary"
                      : "Start drawing"}
                  </button>

                  {hasDrawnFootprint && (
                    <button
                      type="button"
                      onClick={onClearDrawing}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Clear
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {footprintMode === "area" && (
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min={1}
            value={areaValue}
            onChange={(event) =>
              setAreaValue(
                Number(event.target.value)
              )
            }
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />

          <select
            value={areaUnit}
            onChange={(event) =>
              setAreaUnit(
                event.target.value as AreaUnit
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="m2">m²</option>
            <option value="ha">ha</option>
          </select>
        </div>
      )}

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

            <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Mitigation
            </p>

            <div className="mt-4 space-y-5">
                <ScenarioSlider
                label="Permeable surface"
                description="Replace part of paved area with permeable materials"
                value={permeableSurfacePercent}
                onChange={setPermeableSurfacePercent}
                />

                <ScenarioSlider
                label="Green infrastructure"
                description="Rain gardens, bioswales and vegetated surfaces"
                value={greenInfrastructurePercent}
                onChange={
                    setGreenInfrastructurePercent
                }
                />

                <div>
                <label className="text-xs font-medium text-slate-600">
                    Retention capacity
                </label>

                <select
                    value={retentionLevel}
                    onChange={(event) =>
                    setRetentionLevel(
                        event.target
                        .value as RetentionLevel
                    )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-blue-500"
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
        </div>
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