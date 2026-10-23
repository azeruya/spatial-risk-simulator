"use client";

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitSite: () => void;
  onFitContext: () => void;
  onResetNorth: () => void;
  canFitSite: boolean;
  canFitContext: boolean;
  /** Show the compass only when the map is rotated. */
  rotated: boolean;
};

const BUTTON =
  "flex h-9 w-9 items-center justify-center text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent";

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onFitSite,
  onFitContext,
  onResetNorth,
  canFitSite,
  canFitContext,
  rotated,
}: Props) {
  return (
    <div className="pointer-events-auto flex flex-col divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
      <button type="button" aria-label="Zoom in" title="Zoom in" onClick={onZoomIn} className={BUTTON}>
        <Icon>
          <path d="M8 3v10M3 8h10" />
        </Icon>
      </button>

      <button type="button" aria-label="Zoom out" title="Zoom out" onClick={onZoomOut} className={BUTTON}>
        <Icon>
          <path d="M3 8h10" />
        </Icon>
      </button>

      <button
        type="button"
        aria-label="Fit to site"
        title="Fit to site"
        disabled={!canFitSite}
        onClick={onFitSite}
        className={`${BUTTON} ${canFitSite ? "text-blue-700" : ""}`}
      >
        <Icon>
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3" />
        </Icon>
      </button>

      <button
        type="button"
        aria-label="Show analysis area"
        title="Show analysis area"
        disabled={!canFitContext}
        onClick={onFitContext}
        className={BUTTON}
      >
        <Icon>
          <circle cx="8" cy="8" r="6" strokeDasharray="2 2" />
        </Icon>
      </button>

      {rotated && (
        <button
          type="button"
          aria-label="Reset north"
          title="Reset north"
          onClick={onResetNorth}
          className={BUTTON}
        >
          <Icon>
            <path d="M8 2l3 6H5l3-6z" />
            <path d="M8 8v6" />
          </Icon>
        </button>
      )}
    </div>
  );
}