import type {
  StyleSpecification,
} from "maplibre-gl";

import type {
  SimulationView,
} from "@/types/simulation";

export const STREET_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const ARCGIS_API_KEY =
  process.env.NEXT_PUBLIC_ARCGIS_API_KEY;

if (
  !ARCGIS_API_KEY &&
  typeof window !== "undefined"
) {
  console.warn(
    "NEXT_PUBLIC_ARCGIS_API_KEY is not set. Satellite tiles will fail."
  );
}

export const SATELLITE_STYLE:
  StyleSpecification = {
  version: 8,

  sources: {
    satellite: {
      type: "raster",

      tiles: [
        `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=${ARCGIS_API_KEY ?? ""}`,
      ],

      tileSize: 256,

      attribution:
        "Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    },
  },

  layers: [
    {
      id: "satellite",
      type: "raster",
      source: "satellite",
    },
  ],
};

export const TERRAIN_DEM_URL =
  "https://tiles.mapterhorn.com/tilejson.json";

export const HAZARD_STYLE = {
  flood: {
    label: "Flood",
    tint: "#f59e0b",
    opacity: 0.34,
  },

  tsunami: {
    label: "Tsunami",
    tint: "#06b6d4",
    opacity: 0.45,
  },

  landslide: {
    label: "Landslide",
    tint: "#f97316",
    opacity: 0.48,
  },
} as const;

export const SURFACE_COLORS = {
  impervious: "#334155",
  green: "#22c55e",
  other: "#cbd5e1",
  permeable: "#06b6d4",
  greenInfrastructure: "#10b981",
} as const;

export const FOOTPRINT_VISUAL: Record<
  SimulationView,
  {
    fillColor: string;
    fillOpacity: number;
    lineColor: string;
    lineWidth: number;
    lineDasharray?: number[];
  }
> = {
  current: {
    fillColor: "#64748b",
    fillOpacity: 0.06,
    lineColor: "#64748b",
    lineWidth: 2,
    lineDasharray: [3, 2],
  },
  proposed: {
    fillColor: "#2563eb",
    fillOpacity: 0.12,
    lineColor: "#2563eb",
    lineWidth: 3,
  },
  mitigated: {
    fillColor: "#10b981",
    fillOpacity: 0.12,
    lineColor: "#059669",
    lineWidth: 3,
  },
};