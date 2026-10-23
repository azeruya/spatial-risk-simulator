import type {
  FootprintHazardAnalysis,
  HazardStatus,
} from "@/types/simulation";

export function isHazardPresent(
  status: HazardStatus
) {
  return (
    status === "low" ||
    status === "moderate" ||
    status === "high"
  );
}

export function getHazardStatus(
  hazard: FootprintHazardAnalysis | null
): HazardStatus {
  if (!hazard) {
    return "unavailable";
  }

  if (
    hazard.validSamples <= 0 ||
    hazard.average === null ||
    hazard.maximum === null
  ) {
    return "no-data";
  }

  if (hazard.maximum <= 0) {
    return "none";
  }

  // TEMPORARY:
  // Do not add low/moderate/high until thresholds are verified.
  return "high";
}