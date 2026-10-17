export type SelectedPoint = {
  longitude: number;
  latitude: number;
};

export type HazardCategory =
  | "low"
  | "moderate"
  | "high"
  | "no-data";

export type HazardStatus =
  | "idle"
  | "loading"
  | "success"
  | "no-data"
  | "unavailable";

export type HazardResult = {
  status: HazardStatus;
  value: number | null;
  category: HazardCategory;
  hasData: boolean;
  resolutionMeters: number | null;
  source: string;
  error?: string;
};

export type SiteHazards = {
  flood: HazardResult;
  tsunami: HazardResult;
  landslide: HazardResult;
  earthquake: HazardResult;
};

export type AreaHazardStatus =
  | "idle"
  | "loading"
  | "success"
  | "no-data"
  | "unavailable";

export type HazardAreaResult = {
  status: AreaHazardStatus;
  average: number | null;
  maximum: number | null;
  minimum: number | null;
  validSamples: number;
  totalSamples: number;
  hasData: boolean;
};

export type AreaHazardType =
  | "flood"
  | "tsunami"
  | "landslide";

export type AreaHazards = Record<
  AreaHazardType,
  HazardAreaResult
>;

export type HazardType = keyof SiteHazards;

export type AnalysisRadius =
  | 250
  | 500
  | 1000;

export type RiskOverlay =
  | "none"
  | "flood"
  | "tsunami"
  | "landslide";

export type PopulationExposure = {
  status:
    | "idle"
    | "loading"
    | "success"
    | "error";

  population: number | null;
  areaKm2: number | null;
  densityPerKm2: number | null;
  year: number | null;
};