// src/lib/planning/build-recommendations.ts

import type {
  Recommendation,
  HazardStatus,
} from "@/types/simulation";

import type {
  TerrainAnalysis,
} from "@/types/terrain";

import {
  buildTerrainContext,
} from "./terrain-context";

import { isHazardPresent } from "./hazard-status";

type Input = {
  floodStatus: HazardStatus;
  tsunamiStatus: HazardStatus;
  landslideStatus: HazardStatus;

  terrain: TerrainAnalysis | null;

  runoffChangePercent: number;
  mitigationReductionPercent: number;

  imperviousPercent: number;
  greenPercent: number;
};

export function buildRecommendations({
  floodStatus,
  tsunamiStatus,
  landslideStatus,

  terrain,

  runoffChangePercent,

  imperviousPercent,
  greenPercent,
}: Input): Recommendation[] {
  const out: Recommendation[] = [];

  const floodPresent =
    isHazardPresent(floodStatus);

    const tsunamiPresent =
    isHazardPresent(tsunamiStatus);

    const landslidePresent =
    isHazardPresent(landslideStatus);

  const terrainContext =
    buildTerrainContext(terrain);

  if (tsunamiPresent) {
    out.push({
      id: "tsunami-evacuation",
      group: "before-build",
      priority: "high",
      text:
        "Confirm an evacuation route and access to higher ground or vertical refuge.",
    });
  }

  if (floodPresent) {
    out.push({
      id: "flood-drainage",
      group: "before-build",
      priority: "high",
      text:
        "Review drainage capacity, drainage outfalls, and finished-floor elevation.",
    });
  }

  if (
    landslidePresent ||
    terrainContext.steep
  ) {
    out.push({
      id: "geotechnical",
      group: "expert-review",
      priority: "high",
      text:
        "Obtain site-specific geotechnical review before detailed grading or foundation design.",
    });
  }

  if (runoffChangePercent > 5) {
    out.push({
      id: "reduce-sealed",
      group: "design",
      priority: "medium",
      text:
        "Reduce unnecessary paved or sealed surface and preserve infiltration capacity.",
    });
  }

  if (greenPercent > 0) {
    out.push({
      id: "retain-green",
      group: "design",
      priority: "normal",
      text:
        `Protect the proposed ${greenPercent}% green and open space through detailed design.`,
    });
  }

  if (imperviousPercent > 50) {
    out.push({
      id: "permeable-surfaces",
      group: "design",
      priority: "normal",
      text:
        "Consider permeable paving, vegetated drainage, rain gardens, or on-site retention.",
    });
  }

  return out;
}