import type { HazardStatus } from "@/types/simulation";

export function formatHazardStatus(status: HazardStatus) {
  switch (status) {
    case "low":
      return "Low";
    case "moderate":
      return "Moderate";
    case "high":
      return "High";
    case "none":
      return "No hazard value";
    case "no-data":
      return "No data here";
    case "unavailable":
      return "Unavailable";
  }
}

/** Only the states that need explaining get a second line. */
export function hazardNote(status: HazardStatus) {
  switch (status) {
    case "none":
      return "The map covers this area but the value is zero.";
    case "no-data":
      return "The map has no values here. That does not mean it is safe.";
    case "unavailable":
      return "The check failed. Retry before relying on this result.";
    default:
      return null;
  }
}

/** How many of the three meter segments to fill. */
export function hazardLevel(status: HazardStatus): 0 | 1 | 2 | 3 {
  return status === "low" ? 1 : status === "moderate" ? 2 : status === "high" ? 3 : 0;
}