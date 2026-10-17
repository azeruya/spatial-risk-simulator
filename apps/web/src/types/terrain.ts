// src/types/terrain.ts

export type TerrainClass =
  | "flat"
  | "gently sloping"
  | "moderately sloping"
  | "steep"
  | "very steep";

export type TerrainAnalysis = {
  elevation: {
    min: number;
    max: number;
    mean: number;
  };

  slope: {
    mean: number;
    max: number;
  };

  relief: number;

  terrainClass: TerrainClass;

  sampleCount: number;

  source: {
    dataset: string;
    resolutionMeters: number;
  };
};