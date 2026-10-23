export type SurfaceMix = {
  /** Paved surface that stays sealed. */
  impervious: number;
  green: number;
  other: number;
  /** Paved surface that was switched to permeable paving. */
  permeable: number;
};

const clamp = (value: number) => Math.min(100, Math.max(0, value));

function baseMix(imperviousPercent: number, greenPercent: number): SurfaceMix {
  const impervious = clamp(imperviousPercent);
  const green = clamp(greenPercent);

  return {
    impervious,
    green,
    other: Math.max(0, 100 - impervious - green),
    permeable: 0,
  };
}

/**
 * Surface mix for each scenario, as percentages of the whole parcel (always sums to 100).
 *
 * "Permeable replacement" is a share of the proposed paved surface, not points of the
 * parcel: 45% replacement of a 65% paved site converts 29.25 points of the parcel.
 * Green infrastructure is a treatment, so it does not change the area split.
 */
export function buildSurfaceMixes(input: {
  baselineImperviousPercent: number;
  baselineGreenPercent: number;
  imperviousPercent: number;
  greenPercent: number;
  permeableSurfacePercent: number;
}) {
  const current = baseMix(
    input.baselineImperviousPercent,
    input.baselineGreenPercent
  );

  const proposed = baseMix(input.imperviousPercent, input.greenPercent);

  const permeable =
    (proposed.impervious * clamp(input.permeableSurfacePercent)) / 100;

  const mitigated: SurfaceMix = {
    impervious: proposed.impervious - permeable,
    green: proposed.green,
    other: proposed.other,
    permeable,
  };

  return { current, proposed, mitigated };
}