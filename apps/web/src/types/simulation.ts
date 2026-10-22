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

export type SimulationView =
  | "current"
  | "proposed"
  | "mitigated";

export type MapView =
  | "map"
  | "satellite"
  | "terrain";

export type HazardKey =
  | "flood"
  | "tsunami"
  | "landslide";

export type HazardOverlay =
  | "flood"
  | "tsunami"
  | "landslide"
  | null;

export const HAZARD_STYLE = {
  flood: {
    opacity: 0.22,
    tintOpacity: 0.08,
    tint: "#f59e0b",
    label: "Flood",
  },

  tsunami: {
    opacity: 0.18,
    tintOpacity: 0.10,
    tint: "#06b6d4",
    label: "Tsunami",
  },

  landslide: {
    opacity: 0.22,
    tintOpacity: 0.08,
    tint: "#f97316",
    label: "Landslide",
  },
} as const;

export type FootprintMode =
  | "area"
  | "dimensions"
  | "draw";

export type DrawShape =
  | "rectangle"
  | "polygon";
  
export type ProjectFootprint = {
  geometry: GeoJSON.Polygon;
  areaM2: number;
};

export type AreaUnit =
  | "m2"
  | "ha";

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

export type FootprintHazardAnalysis = {
  average: number | null;
  maximum: number | null;
  validSamples: number;
  totalSamples: number;
  coveragePercent: number;
};

export type FootprintHazards = {
  flood: FootprintHazardAnalysis | null;
  tsunami: FootprintHazardAnalysis | null;
  landslide: FootprintHazardAnalysis | null;
};

export type PlanningAssessmentStatus =
  | "low"
  | "attention"
  | "review";

export type PlanningAssessmentSection = {
  title: string;
  items: string[];
};

export type PlanningAssessment = {
  status: PlanningAssessmentStatus;

  headline: string;
  summary: string;

  primaryConcern: string;
  recommendedAction: string;

  hazard: string[];
  change: string[];
  consequence: string[];

  evidence: string[];
  responses: string[];
};

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
