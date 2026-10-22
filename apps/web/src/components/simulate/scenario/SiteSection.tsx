import { FootprintMode, DrawShape, AreaUnit } from "@/types/simulation";

type SiteSectionProps = {
  projectAreaHa: number;

  footprintMode: FootprintMode;
  setFootprintMode: (
    value: FootprintMode
  ) => void;

  drawShape: DrawShape;
  setDrawShape: (
    value: DrawShape
  ) => void;

  areaValue: number;
  setAreaValue: (
    value: number
  ) => void;

  areaUnit: AreaUnit;
  setAreaUnit: (
    value: AreaUnit
  ) => void;

  widthM: number;
  setWidthM: (
    value: number
  ) => void;

  lengthM: number;
  setLengthM: (
    value: number
  ) => void;

  bearing: number;
  setBearing: (
    value: number
  ) => void;

  isDrawing: boolean;
  hasDrawnFootprint: boolean;
  drawnAreaM2: number;

  onStartDrawing: () => void;
  onCancelDrawing: () => void;
  onClearDrawing: () => void;
};

export function SiteSection({
  projectAreaHa,

  footprintMode,
  setFootprintMode,

  drawShape,
  setDrawShape,

  areaValue,
  setAreaValue,

  areaUnit,
  setAreaUnit,

  widthM,
  setWidthM,

  lengthM,
  setLengthM,

  bearing,
  setBearing,

  isDrawing,
  hasDrawnFootprint,
  drawnAreaM2,

  onStartDrawing,
  onCancelDrawing,
  onClearDrawing,
}: SiteSectionProps) {
  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-slate-700">
            Project footprint
          </p>

          <p className="mt-1 text-[11px] text-slate-500">
            Draw the site or define its dimensions.
          </p>
        </div>

        <p className="text-sm font-semibold text-slate-900">
          {formatPanelArea(projectAreaHa)}
        </p>
      </div>

      {/* Draw first */}
      <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
        {(
          [
            {
              value: "draw",
              label: "Draw",
            },
            {
              value: "dimensions",
              label: "Dimensions",
            },
            {
              value: "area",
              label: "Area",
            },
          ] as const
        ).map((option) => {
          const active =
            footprintMode === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setFootprintMode(
                  option.value
                )
              }
              className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
                active
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {footprintMode === "draw" && (
        <DrawFootprintControls
          drawShape={drawShape}
          setDrawShape={setDrawShape}
          isDrawing={isDrawing}
          hasDrawnFootprint={
            hasDrawnFootprint
          }
          drawnAreaM2={drawnAreaM2}
          onStartDrawing={
            onStartDrawing
          }
          onCancelDrawing={
            onCancelDrawing
          }
          onClearDrawing={
            onClearDrawing
          }
        />
      )}

      {footprintMode ===
        "dimensions" && (
        <DimensionsControls
          widthM={widthM}
          setWidthM={setWidthM}
          lengthM={lengthM}
          setLengthM={setLengthM}
          bearing={bearing}
          setBearing={setBearing}
        />
      )}

      {footprintMode === "area" && (
        <AreaControls
          areaValue={areaValue}
          setAreaValue={setAreaValue}
          areaUnit={areaUnit}
          setAreaUnit={setAreaUnit}
          projectAreaHa={projectAreaHa}
        />
      )}
    </div>
  );
}


function DrawFootprintControls({
  drawShape,
  setDrawShape,
  isDrawing,
  hasDrawnFootprint,
  drawnAreaM2,
  onStartDrawing,
  onCancelDrawing,
  onClearDrawing,
}: {
  drawShape: DrawShape;
  setDrawShape: (
    value: DrawShape
  ) => void;

  isDrawing: boolean;
  hasDrawnFootprint: boolean;
  drawnAreaM2: number;

  onStartDrawing: () => void;
  onCancelDrawing: () => void;
  onClearDrawing: () => void;
}) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200/60 p-1">
        <button
          type="button"
          onClick={() =>
            setDrawShape("rectangle")
          }
          className={`rounded-lg px-3 py-2 text-xs font-medium ${
            drawShape === "rectangle"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500"
          }`}
        >
          Rectangle
        </button>

        <button
          type="button"
          onClick={() =>
            setDrawShape("polygon")
          }
          className={`rounded-lg px-3 py-2 text-xs font-medium ${
            drawShape === "polygon"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500"
          }`}
        >
          Free draw
        </button>
      </div>

      {hasDrawnFootprint &&
        !isDrawing && (
          <div className="mt-3 rounded-xl bg-white p-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Calculated area
            </p>

            <div className="mt-1 flex items-baseline justify-between">
              <p className="text-sm font-semibold text-slate-900">
                {Math.round(
                  drawnAreaM2
                ).toLocaleString()}{" "}
                m²
              </p>

              <p className="text-xs text-slate-500">
                {(
                  drawnAreaM2 / 10_000
                ).toFixed(2)}{" "}
                ha
              </p>
            </div>
          </div>
        )}

      <p className="mt-3 text-[11px] leading-5 text-slate-500">
        {isDrawing
          ? drawShape === "rectangle"
            ? "Click one corner, move to the opposite corner, then click again."
            : "Click around the site boundary and close the polygon."
          : "Draw the project parcel directly on the map."}
      </p>

      <div className="mt-3 flex gap-2">
        {isDrawing ? (
          <button
            type="button"
            onClick={
              onCancelDrawing
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            Cancel drawing
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={
                onStartDrawing
              }
              className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              {hasDrawnFootprint
                ? "Redraw parcel"
                : "Draw parcel"}
            </button>

            {hasDrawnFootprint && (
              <button
                type="button"
                onClick={
                  onClearDrawing
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"
              >
                Clear
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DimensionsControls({
  widthM,
  setWidthM,
  lengthM,
  setLengthM,
  bearing,
  setBearing,
}: {
  widthM: number;
  setWidthM: (
    value: number
  ) => void;

  lengthM: number;
  setLengthM: (
    value: number
  ) => void;

  bearing: number;
  setBearing: (
    value: number
  ) => void;
}) {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Width"
          value={widthM}
          suffix="m"
          onChange={setWidthM}
        />

        <NumberField
          label="Length"
          value={lengthM}
          suffix="m"
          onChange={setLengthM}
        />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-700">
              Orientation
            </p>

            <p className="mt-1 text-[11px] text-slate-500">
              Rotate relative to the map.
            </p>
          </div>

          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {bearing}°
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={180}
          step={5}
          value={bearing}
          onChange={(event) =>
            setBearing(
              Number(
                event.target.value
              )
            )
          }
          className="mt-3 w-full accent-blue-600"
        />
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">
            Calculated area
          </span>

          <span className="font-medium text-slate-800">
            {(
              widthM * lengthM
            ).toLocaleString()}{" "}
            m²
          </span>
        </div>
      </div>
    </div>
  );
}

function AreaControls({
  areaValue,
  setAreaValue,
  areaUnit,
  setAreaUnit,
  projectAreaHa,
}: {
  areaValue: number;
  setAreaValue: (
    value: number
  ) => void;

  areaUnit: AreaUnit;
  setAreaUnit: (
    value: AreaUnit
  ) => void;

  projectAreaHa: number;
}) {
  return (
    <div className="mt-4">
      <label className="text-[11px] text-slate-500">
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
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="m2">
            m²
          </option>

          <option value="ha">
            ha
          </option>
        </select>
      </div>

      <p className="mt-2 text-[11px] text-slate-500">
        Equivalent to{" "}
        {Math.round(
          projectAreaHa * 10_000
        ).toLocaleString()}{" "}
        m²
      </p>
    </div>
  );
}

function NumberField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  onChange: (
    value: number
  ) => void;
}) {
  return (
    <div>
      <label className="text-[11px] text-slate-500">
        {label}
      </label>

      <div className="relative mt-1">
        <input
          type="number"
          min={1}
          value={value}
          onChange={(event) =>
            onChange(
              Math.max(
                1,
                Number(
                  event.target.value
                )
              )
            )
          }
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-8 text-sm"
        />

        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function formatPanelArea(
  areaHa: number
) {
  const areaM2 =
    areaHa * 10_000;

  if (areaM2 < 10_000) {
    return `${Math.round(
      areaM2
    ).toLocaleString()} m²`;
  }

  return `${areaHa.toFixed(
    2
  )} ha`;
}