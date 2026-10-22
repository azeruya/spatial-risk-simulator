import type {
  FootprintHazardAnalysis,
} from "@/types/simulation";

export type HazardStatus =
  | "unavailable"
  | "no-data"
  | "no-hazard"
  | "hazard-present";

export function getHazardStatus(
  hazard:
    | FootprintHazardAnalysis
    | null
    | undefined
): HazardStatus {
  if (!hazard) {
    return "unavailable";
  }

  if (hazard.validSamples === 0) {
    return "no-data";
  }

  if ((hazard.maximum ?? 0) <= 0) {
    return "no-hazard";
  }

  return "hazard-present";
}