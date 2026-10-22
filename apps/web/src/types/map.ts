export type MapView = "map" | "satellite" | "terrain";

export type HazardKey = "flood" | "tsunami" | "landslide";
export type HazardOverlay = HazardKey | null;
export type HazardMapped = Record<HazardKey, boolean>;

export type RetentionLevel = "none" | "low" | "moderate" | "high";

export type Footprint = GeoJSON.Feature<GeoJSON.Polygon>;

export type SelectedSite = {
  longitude: number;
  latitude: number;
};