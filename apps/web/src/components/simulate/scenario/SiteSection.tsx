import { FootprintMode, DrawShape, AreaUnit } from "@/types/simulation";
import { ScenarioSlider, SegmentedControl } from "./ScenarioControls";

type SiteSectionProps = {
  projectAreaHa: number;

  footprintMode: FootprintMode;
  setFootprintMode: (value: FootprintMode) => void;

  drawShape: DrawShape;
  setDrawShape: (value: DrawShape) => void;

  areaValue: number;
  setAreaValue: (value: number) => void;

  areaUnit: AreaUnit;
  setAreaUnit: (value: AreaUnit) => void;

  widthM: number;
  setWidthM: (value: number) => void;

  lengthM: number;
  setLengthM: (value: number) => void;

  bearing: number;
  setBearing: (value: number) => void;

  isDrawing: boolean;
  hasDrawnFootprint: boolean;
  drawnAreaM2: number;

  onStartDrawing: () => void;
  onCancelDrawing: () => void;
  onClearDrawing: () => void;
};

export function SiteSection(props: SiteSectionProps) {
  if (props.footprintMode === "draw") {
    return (
      <DrawFootprintControls
        drawShape={props.drawShape}
        setDrawShape={props.setDrawShape}
        isDrawing={props.isDrawing}
        hasDrawnFootprint={props.hasDrawnFootprint}
        drawnAreaM2={props.drawnAreaM2}
        onStartDrawing={props.onStartDrawing}
        onCancelDrawing={props.onCancelDrawing}
        onClearDrawing={props.onClearDrawing}
        onEnterManually={() => props.setFootprintMode("dimensions")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <SegmentedControl
        label="Size input"
        options={[
          { value: "dimensions", label: "Dimensions" },
          { value: "area", label: "Area" },
        ]}
        value={props.footprintMode as "dimensions" | "area"}
        onChange={props.setFootprintMode}
      />

      {props.footprintMode === "dimensions" ? (
        <DimensionsControls
          widthM={props.widthM}
          setWidthM={props.setWidthM}
          lengthM={props.lengthM}
          setLengthM={props.setLengthM}
          bearing={props.bearing}
          setBearing={props.setBearing}
        />
      ) : (
        <AreaControls
          areaValue={props.areaValue}
          setAreaValue={props.setAreaValue}
          areaUnit={props.areaUnit}
          setAreaUnit={props.setAreaUnit}
          projectAreaHa={props.projectAreaHa}
        />
      )}

      <button
        type="button"
        onClick={() => props.setFootprintMode("draw")}
        className="text-xs font-medium text-blue-700 hover:underline"
      >
        Draw on the map instead
      </button>
    </div>
  );
}

function RectangleIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="2.5" y="3.5" width="11" height="9" rx="1" />
    </svg>
  );
}

function PolygonIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
      <path d="M3 12 5 4l6-1 2.5 6L8 13z" />
    </svg>
  );
}

function ShapeToggle({
  drawShape,
  setDrawShape,
  disabled,
}: {
  drawShape: DrawShape;
  setDrawShape: (value: DrawShape) => void;
  disabled?: boolean;
}) {
  const items = [
    { value: "rectangle" as const, label: "Rectangle", icon: <RectangleIcon /> },
    { value: "polygon" as const, label: "Free draw", icon: <PolygonIcon /> },
  ];

  return (
    <div className="flex gap-1" role="group" aria-label="Parcel shape">
      {items.map((item) => {
        const active = drawShape === item.value;

        return (
          <button
            key={item.value}
            type="button"
            disabled={disabled}
            aria-label={item.label}
            aria-pressed={active}
            title={item.label}
            onClick={() => setDrawShape(item.value)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:opacity-50 ${
              active
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-500 hover:text-slate-800"
            }`}
          >
            {item.icon}
          </button>
        );
      })}
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
  onEnterManually,
}: {
  drawShape: DrawShape;
  setDrawShape: (value: DrawShape) => void;
  isDrawing: boolean;
  hasDrawnFootprint: boolean;
  drawnAreaM2: number;
  onStartDrawing: () => void;
  onCancelDrawing: () => void;
  onClearDrawing: () => void;
  onEnterManually: () => void;
}) {
  if (isDrawing) {
    return (
      <div className="space-y-3">
        <p className="text-xs leading-5 text-slate-600">
          {drawShape === "rectangle"
            ? "Click one corner, move to the opposite corner, then click again."
            : "Click around the site boundary and close the polygon."}
        </p>

        <button
          type="button"
          onClick={onCancelDrawing}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel drawing
        </button>
      </div>
    );
  }

  if (hasDrawnFootprint) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {Math.round(drawnAreaM2).toLocaleString()} m²
            </p>
            <p className="text-xs text-slate-500">
              {(drawnAreaM2 / 10_000).toFixed(2)} ha · drawn
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onStartDrawing}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Redraw
            </button>

            <button
              type="button"
              onClick={onClearDrawing}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Redraw as</span>
          <ShapeToggle drawShape={drawShape} setDrawShape={setDrawShape} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onStartDrawing}
          className="flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Draw parcel on map
        </button>

        <ShapeToggle drawShape={drawShape} setDrawShape={setDrawShape} />
      </div>

      <p className="text-xs text-slate-500">
        No parcel yet?{" "}
        <button
          type="button"
          onClick={onEnterManually}
          className="font-medium text-blue-700 hover:underline"
        >
          Enter dimensions or area
        </button>
      </p>
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
  setWidthM: (value: number) => void;
  lengthM: number;
  setLengthM: (value: number) => void;
  bearing: number;
  setBearing: (value: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Width" value={widthM} suffix="m" onChange={setWidthM} />
        <NumberField label="Length" value={lengthM} suffix="m" onChange={setLengthM} />
      </div>

      <ScenarioSlider
        label="Orientation"
        description="Rotate relative to the map."
        value={bearing}
        onChange={setBearing}
        max={180}
        step={5}
        unit="°"
      />

      <p className="text-xs text-slate-500">
        Area: {(widthM * lengthM).toLocaleString()} m²
      </p>
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
  setAreaValue: (value: number) => void;
  areaUnit: AreaUnit;
  setAreaUnit: (value: AreaUnit) => void;
  projectAreaHa: number;
}) {
  return (
    <div>
      <label className="text-xs text-slate-600">Site area</label>

      <div className="mt-1 flex gap-2">
        <input
          type="number"
          min={0.01}
          step={areaUnit === "ha" ? 0.1 : 100}
          value={areaValue}
          onChange={(event) =>
            setAreaValue(Math.max(0, Number(event.target.value)))
          }
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        />

        <select
          value={areaUnit}
          onChange={(event) => setAreaUnit(event.target.value as AreaUnit)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="m2">m²</option>
          <option value="ha">ha</option>
        </select>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Equivalent to {Math.round(projectAreaHa * 10_000).toLocaleString()} m²
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
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-slate-600">{label}</label>

      <div className="relative mt-1">
        <input
          type="number"
          min={1}
          value={value}
          onChange={(event) =>
            onChange(Math.max(1, Number(event.target.value)))
          }
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-8 text-sm"
        />

        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function formatPanelArea(areaHa: number) {
  const areaM2 = areaHa * 10_000;

  if (areaM2 < 10_000) {
    return `${Math.round(areaM2).toLocaleString()} m²`;
  }

  return `${areaHa.toFixed(2)} ha`;
}