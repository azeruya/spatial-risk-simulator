export const STREET_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export function createSatelliteStyle(
  arcgisApiKey: string
) {
  return {
    version: 8 as const,

    sources: {
      satellite: {
        type: "raster" as const,

        tiles: [
          `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=${arcgisApiKey}`,
        ],

        tileSize: 256,

        attribution:
          "Esri, Maxar, Earthstar Geographics, and the GIS User Community",
      },
    },

    layers: [
      {
        id: "satellite",
        type: "raster" as const,
        source: "satellite",
      },
    ],
  };
}