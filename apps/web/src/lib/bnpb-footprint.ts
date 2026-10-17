import { bbox } from "@turf/bbox";
import { point } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

const BNPB_BATCH_SIZE = 4;

export type BnpbFootprintResult = {
  average: number | null;
  maximum: number | null;
  validSamples: number;
  totalSamples: number;
};

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 1
): Promise<Response> {
  const response = await fetch(url, options);

  if (
    retries > 0 &&
    [502, 503, 504].includes(response.status)
  ) {
    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    );

    return fetchWithRetry(
      url,
      options,
      retries - 1
    );
  }

  return response;
}

function extractRasterValue(
  data: unknown
): number | null {
  if (
    !data ||
    typeof data !== "object"
  ) {
    return null;
  }

  const payload = data as {
    samples?: Array<{
      value?: string | number | null;
    }>;
  };

  const rawValue =
    payload.samples?.[0]?.value;

  if (
    rawValue === null ||
    rawValue === undefined
  ) {
    return null;
  }

  const value = Number(rawValue);

  return Number.isFinite(value)
    ? value
    : null;
}

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

  const results: Array<number | null> = [];

  for (
    let i = 0;
    i < candidates.length;
    i += BNPB_BATCH_SIZE
  ) {
    const batch =
      candidates.slice(
        i,
        i + BNPB_BATCH_SIZE
      );

    const batchResults =
      await Promise.all(
        batch.map(async ([lon, lat]) => {
          const geometry =
            JSON.stringify({
              x: lon,
              y: lat,
              spatialReference: {
                wkid: 4326,
              },
            });

          const params =
            new URLSearchParams({
              geometry,
              geometryType:
                "esriGeometryPoint",
              returnFirstValueOnly:
                "true",
              interpolation:
                "RSP_NearestNeighbor",
              outFields: "*",
              f: "json",
            });

          try {
            const response =
              await fetchWithRetry(
                `${serviceUrl}?${params.toString()}`,
                {
                  cache: "no-store",
                },
                1
              );

            if (!response.ok) {
              return null;
            }

            const data =
              await response.json();

            return extractRasterValue(data);
          } catch {
            return null;
          }
        })
      );

    results.push(...batchResults);
  }

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