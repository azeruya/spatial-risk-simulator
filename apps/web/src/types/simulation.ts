export type SimulationBaseline = {
  status:
    | "idle"
    | "loading"
    | "success"
    | "error";

  population: number | null;
  populationDensity: number | null;

  floodAverage: number | null;
  floodMaximum: number | null;
  floodCoveragePercent: number | null;
};

export type FootprintMode =
  | "area"
  | "dimensions"
  | "draw";

export type ProjectFootprint = {
  geometry: GeoJSON.Polygon;
  areaM2: number;
};

export type AreaUnit =
  | "m2"
  | "ha";

export function areaToM2(
  value: number,
  unit: AreaUnit
) {
  if (unit === "ha") {
    return value * 10_000;
  }

  return value;
}

export function formatProjectArea(areaM2: number) {
  if (areaM2 < 10_000) {
    return `${areaM2.toLocaleString()} m²`;
  }

  return `${(areaM2 / 10_000).toFixed(2)} ha`;
}
