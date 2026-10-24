"use client";

import { useEffect, useState, type ReactNode } from "react";

import { RAIL } from "./dimensions";

type WorkspaceProps = {
  /** Left rail content. Should fill its height and manage its own scrolling. */
  left: ReactNode;
  leftLabel: string;

  /** Right rail content. Pass null/undefined to hide the rail entirely. */
  right?: ReactNode | null;
  rightLabel?: string;

  defaultLeftOpen?: boolean;
  defaultRightOpen?: boolean;

  /** The map. */
  children: ReactNode;
};

/**
 * The frame used by Live, Risk and Simulate: [left rail | map | right rail].
 *
 * Why a grid instead of flex + fixed widths:
 *  - The rail tracks are fixed pixel values and the map track is minmax(0, 1fr),
 *    so the map can never push a rail wider or be measured at the wrong width.
 *  - Width changes animate with one CSS transition, but only after first paint,
 *    so nothing visibly slides or "snaps" on load.
 *  - Rail content stays mounted when collapsed, so form state isn't lost.
 */
export default function Workspace({
  left,
  leftLabel,
  right,
  rightLabel = "Details",
  defaultLeftOpen = true,
  defaultRightOpen = true,
  children,
}: WorkspaceProps) {
  const [leftOpen, setLeftOpen] = useState(defaultLeftOpen);
  const [rightOpen, setRightOpen] = useState(defaultRightOpen);

  // Transitions stay off until after the first paint.
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setAnimate(true));
    });

    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);

  const hasRight = right !== undefined && right !== null;

  const leftWidth = leftOpen ? RAIL.left : RAIL.leftCollapsed;
  const rightWidth = hasRight
    ? rightOpen
      ? RAIL.right
      : RAIL.rightCollapsed
    : 0;

  const transition = animate
    ? "240ms cubic-bezier(0.22, 1, 0.36, 1)"
    : "0ms";

  return (
    <main
      className="relative grid h-[calc(100vh-var(--nav-h))] overflow-hidden bg-slate-50 supports-[height:100dvh]:h-[calc(100dvh-var(--nav-h))]"
      style={{
        gridTemplateColumns: `${leftWidth}px minmax(0, 1fr) ${rightWidth}px`,
        gridTemplateRows: "minmax(0, 1fr)",
        transition: `grid-template-columns ${transition}`,
      }}
    >
      <Rail
        side="left"
        open={leftOpen}
        width={RAIL.left}
        label={leftLabel}
        onExpand={() => setLeftOpen(true)}
      >
        {left}
      </Rail>

      <div className="relative min-h-0 min-w-0 overflow-hidden">{children}</div>

      {hasRight ? (
        <Rail
          side="right"
          open={rightOpen}
          width={RAIL.right}
          label={rightLabel}
          onExpand={() => setRightOpen(true)}
        >
          {right}
        </Rail>
      ) : (
        <div aria-hidden />
      )}

      <EdgeToggle
        side="left"
        open={leftOpen}
        label={leftLabel}
        offset={leftWidth}
        transition={transition}
        onClick={() => setLeftOpen((open) => !open)}
      />

      {hasRight && (
        <EdgeToggle
          side="right"
          open={rightOpen}
          label={rightLabel}
          offset={rightWidth}
          transition={transition}
          onClick={() => setRightOpen((open) => !open)}
        />
      )}
    </main>
  );
}

function Rail({
  side,
  open,
  width,
  label,
  onExpand,
  children,
}: {
  side: "left" | "right";
  open: boolean;
  width: number;
  label: string;
  onExpand: () => void;
  children: ReactNode;
}) {
  return (
    <aside
      aria-label={label}
      className={`relative min-h-0 min-w-0 overflow-hidden bg-white ${
        side === "left" ? "border-r" : "border-l"
      } border-slate-200`}
    >
      {/* Fixed-width inner box: content never reflows while the rail animates. */}
      <div
        inert={!open}
        aria-hidden={!open}
        className={`h-full transition-opacity duration-150 ${
          side === "right" ? "ml-auto" : ""
        } ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        style={{ width }}
      >
        {children}
      </div>

      {!open && (
        <button
          type="button"
          onClick={onExpand}
          aria-label={`Expand ${label}`}
          className="absolute inset-0 flex items-start justify-center pt-20 hover:bg-slate-50"
        >
          <span className="-rotate-90 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </span>
        </button>
      )}
    </aside>
  );
}

function EdgeToggle({
  side,
  open,
  label,
  offset,
  transition,
  onClick,
}: {
  side: "left" | "right";
  open: boolean;
  label: string;
  offset: number;
  transition: string;
  onClick: () => void;
}) {
  // The arrow points the way the rail will move.
  const arrow = side === "left" ? (open ? "‹" : "›") : open ? "›" : "‹";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${open ? "Collapse" : "Expand"} ${label}`}
      className="absolute top-1/2 z-40 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
      style={{
        [side]: offset - 14,
        transition: `${side} ${transition}, background-color 150ms`,
      }}
    >
      {arrow}
    </button>
  );
}
