import type {
  TerrainAnalysis,
} from "@/types/terrain";

export type TerrainContext = {
  available: boolean;

  lowLying: boolean;
  veryLowLying: boolean;

  flat: boolean;
  sloping: boolean;
  steep: boolean;

  highRelief: boolean;
};

export function buildTerrainContext(
  terrain: TerrainAnalysis | null
): TerrainContext {
  if (!terrain) {
    return {
      available: false,

      lowLying: false,
      veryLowLying: false,

      flat: false,
      sloping: false,
      steep: false,

      highRelief: false,
    };
  }

  return {
    available: true,

    lowLying:
      terrain.elevation.mean < 15,

    veryLowLying:
      terrain.elevation.mean < 5,

    flat:
      terrain.slope.mean < 3,

    sloping:
      terrain.slope.mean >= 8,

    steep:
      terrain.slope.mean >= 20,

    highRelief:
      terrain.relief >= 100,
  };
}