import { bbox } from "@turf/bbox";
import { point } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

export type BnpbFootprintResult = {
  average: number | null;
  maximum: number | null;
  validSamples: number;
  totalSamples: number;
};

export async function analyseBnpbRasterFootprint({
  polygon,
  serviceUrl,
  sampleCount = 25,
}: {
  polygon: GeoJSON.Feature<GeoJSON.Polygon>;
  serviceUrl: string;
  sampleCount?: number;
}): Promise<BnpbFootprintResult> {
  const safeSampleCount = Math.min(
    Math.max(Number(sampleCount) || 25, 9),
    100
  );

  const [minLon, minLat, maxLon, maxLat] =
    bbox(polygon);

  const side = Math.ceil(
    Math.sqrt(safeSampleCount)
  );

  const candidates: [number, number][] = [];

  for (let row = 0; row < side; row++) {
    for (let col = 0; col < side; col++) {
      const lon =
        minLon +
        ((col + 0.5) / side) *
          (maxLon - minLon);

      const lat =
        minLat +
        ((row + 0.5) / side) *
          (maxLat - minLat);

      const candidate = point([
        lon,
        lat,
      ]);

      if (
        booleanPointInPolygon(
          candidate,
          polygon
        )
      ) {
        candidates.push([lon, lat]);
      }
    }
  }

  if (candidates.length === 0) {
    return {
      average: null,
      maximum: null,
      validSamples: 0,
      totalSamples: 0,
    };
  }

  const results = await Promise.all(
    candidates.map(async ([lon, lat]) => {
      const geometry = JSON.stringify({
        x: lon,
        y: lat,
        spatialReference: {
          wkid: 4326,
        },
      });

      const params = new URLSearchParams({
        geometry,
        geometryType:
          "esriGeometryPoint",
        returnFirstValueOnly: "true",
        interpolation:
          "RSP_NearestNeighbor",
        outFields: "*",
        f: "json",
      });

      try {
        const response = await fetch(
          `${serviceUrl}?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return null;
        }

        const data = await response.json();

        const rawValue =
          data.samples?.[0]?.value;

        if (
          rawValue === "" ||
          rawValue === null ||
          rawValue === undefined
        ) {
          return null;
        }

        const value = Number(rawValue);

        return Number.isFinite(value)
          ? value
          : null;
      } catch {
        return null;
      }
    })
  );

  const validValues = results.filter(
    (value): value is number =>
      value !== null
  );

  const average =
    validValues.length > 0
      ? validValues.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / validValues.length
      : null;

  const maximum =
    validValues.length > 0
      ? Math.max(...validValues)
      : null;

  return {
    average,
    maximum,
    validSamples:
      validValues.length,
    totalSamples:
      candidates.length,
  };
}