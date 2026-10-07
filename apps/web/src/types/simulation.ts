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