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
  status: "low" | "attention" | "review";

  verdict: {
    headline: string;
    action: string;
  };

  site: SiteAssessmentSummary;

  findings: Finding[];
  topFindings: Finding[];

  recommendations: Recommendation[];
  analysisRows: AnalysisRow[];
  dataSources: DataSourceRow[];

  limitations: string[];
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

export type HazardStatus =
  | "unavailable"
  | "no-data"
  | "none"
  | "low"
  | "moderate"
  | "high";

export type FindingSeverity =
  | "high"
  | "medium"
  | "info"
  | "good";

export type FindingScope =
  | "site"
  | "design"
  | "check";

export type Finding = {
  id: string;
  severity: FindingSeverity;
  scope: FindingScope;
  headline: string;
  detail: string;
};

export type RecommendationGroup =
  | "before-build"
  | "design"
  | "expert-review";

export type Recommendation = {
  id: string;
  group: RecommendationGroup;
  priority: "high" | "medium" | "normal";
  text: string;
};

export type AnalysisRow = {
  label: string;
  current?: string;
  proposed?: string;
  mitigated?: string;
  value?: string;
  change?: string;
};

export type DataSourceRow = {
  source: string;
  measures: string;
  coverage?: string;
};

export type SiteAssessmentSummary = {
  flood: HazardStatus;
  tsunami: HazardStatus;
  landslide: HazardStatus;
};
