export type EarthquakeCategory = "latest" | "significant" | "felt";

export type Earthquake = {
  id: string;
  category: EarthquakeCategory;
  
  date: string;
  time: string;
  dateTime: string;

  latitude: number;
  longitude: number;

  magnitude: number;
  depthKm: number;

  region: string;

  potential?: string;
  felt?: string;

  shakemapUrl?: string;
};