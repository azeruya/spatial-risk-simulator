import bbox from "@turf/bbox";
import bboxPolygon from "@turf/bbox-polygon";
import difference from "@turf/difference";
import intersect from "@turf/intersect";
import { featureCollection } from "@turf/helpers";

import type { Footprint } from "@/types/map";

type Region = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function getBounds(feature: Footprint) {
  const [west, south, east, north] = bbox(feature);
  return { west, south, east, north };
}

function clipToBox(
  footprint: Footprint,
  west: number,
  south: number,
  east: number,
  north: number
): Region | null {
  try {
    return intersect(
      featureCollection([footprint, bboxPolygon([west, south, east, north])])
    );
  } catch {
    return null;
  }
}

/** Dims everything outside the analysis circle. */
export function buildAnalysisMask(circle: Footprint): Region | null {
  const { west, south, east, north } = getBounds(circle);
  const lonPad = (east - west) * 3;
  const latPad = (north - south) * 3;

  const outer = bboxPolygon([
    west - lonPad,
    south - latPad,
    east + lonPad,
    north + latPad,
  ]);

  try {
    return difference(featureCollection([outer, circle]));
  } catch {
    return null;
  }
}

/**
 * Splits the footprint into vertical bands (west to east):
 * impervious, green, other. Illustrative only, not a site plan.
 */
export function buildSurfaceAllocation(
  footprint: Footprint,
  imperviousPercent: number,
  greenPercent: number
) {
  const { west, south, east, north } = getBounds(footprint);
  const width = east - west;

  const imperviousShare = clamp01(imperviousPercent / 100);
  const greenShare = Math.min(clamp01(greenPercent / 100), 1 - imperviousShare);

  const imperviousEnd = west + width * imperviousShare;
  const greenEnd = imperviousEnd + width * greenShare;

  return {
    impervious:
      imperviousShare > 0
        ? clipToBox(footprint, west, south, imperviousEnd, north)
        : null,
    green:
      greenShare > 0
        ? clipToBox(footprint, imperviousEnd, south, greenEnd, north)
        : null,
    other:
      greenEnd < east ? clipToBox(footprint, greenEnd, south, east, north) : null,
  };
}

/** Striped overlay used to show mitigation treatments. */
export function createTreatmentBands(
  footprint: Footprint,
  direction: "vertical" | "horizontal",
  count = 11
) {
  const { west, south, east, north } = getBounds(footprint);
  const vertical = direction === "vertical";
  const step = (vertical ? east - west : north - south) / count;

  const bands: Region[] = [];

  for (let i = 0; i < count; i += 2) {
    const start = i * step;
    const end = start + step * 0.32;

    const clipped = vertical
      ? clipToBox(footprint, west + start, south, west + end, north)
      : clipToBox(footprint, west, south + start, east, south + end);

    if (clipped) bands.push(clipped);
  }

  return featureCollection(bands);
}