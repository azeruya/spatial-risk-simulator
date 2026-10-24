import { bbox } from "@turf/bbox";
import { point } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

import { upstreamFetch } from "@/lib/upstream";

const BNPB_BATCH_SIZE = 6;
const SAMPLE_TIMEOUT_MS = 6_000;

/**
 * Finest raster cell we assume. Sampling more densely than this just reads the
 * same pixel again, so small sites need far fewer requests.
 */
const MIN_CELL_M = 30;

export type BnpbFootprintResult = {
  average: number | null;
  maximum: number | null;
  validSamples: number;
  totalSamples: number;
  /** Requests that errored (as opposed to returning "no data"). */
  failedSamples: number;
};

type SampleOutcome = { ok: true; value: number | null } | { ok: false };

async function fetchWithRetry(
  url: string,
  signal: AbortSignal | undefined,
  retries = 1
): Promise<Response> {
  const response = await upstreamFetch(url, {
    timeoutMs: SAMPLE_TIMEOUT_MS,
    signal,
  });

  // Only retry quick gateway errors. A timeout is not retried: it would just
  // double the wait.
  if (retries > 0 && [502, 503, 504].includes(response.status)) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return fetchWithRetry(url, signal, retries - 1);
  }

  return response;
}

function extractRasterValue(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;

  const payload = data as {
    samples?: Array<{ value?: string | number | null }>;
  };

  const rawValue = payload.samples?.[0]?.value;

  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
  }

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

function approxExtentMeters([minLon, minLat, maxLon, maxLat]: number[]) {
  const midLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const width = (maxLon - minLon) * 111_320 * Math.cos(midLat);
  const height = (maxLat - minLat) * 110_574;
  return Math.max(width, height);
}

export async function analyseBnpbRasterFootprint({
  polygon,
  serviceUrl,
  sampleCount = 25,
  signal,
}: {
  polygon: GeoJSON.Feature<GeoJSON.Polygon>;
  serviceUrl: string;
  sampleCount?: number;
  signal?: AbortSignal;
}): Promise<BnpbFootprintResult> {
  const safeSampleCount = Math.min(
    Math.max(Number(sampleCount) || 25, 1),
    100
  );

  const box = bbox(polygon);
  const [minLon, minLat, maxLon, maxLat] = box;

  // Never sample finer than the raster: a ~11 m parcel needs 1 sample, not 16.
  const maxSide = Math.ceil(Math.sqrt(safeSampleCount));
  const side = Math.max(
    1,
    Math.min(maxSide, Math.ceil(approxExtentMeters(box) / MIN_CELL_M))
  );

  const candidates: [number, number][] = [];

  for (let row = 0; row < side; row++) {
    for (let col = 0; col < side; col++) {
      const lon = minLon + ((col + 0.5) / side) * (maxLon - minLon);
      const lat = minLat + ((row + 0.5) / side) * (maxLat - minLat);

      if (booleanPointInPolygon(point([lon, lat]), polygon)) {
        candidates.push([lon, lat]);
      }
    }
  }

  // Thin or concave shapes can miss every grid point; fall back to the centre.
  if (candidates.length === 0) {
    candidates.push([(minLon + maxLon) / 2, (minLat + maxLat) / 2]);
  }

  const results: SampleOutcome[] = [];

  for (let i = 0; i < candidates.length; i += BNPB_BATCH_SIZE) {
    if (signal?.aborted) throw new Error("Footprint analysis aborted");

    const batch = candidates.slice(i, i + BNPB_BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async ([lon, lat]): Promise<SampleOutcome> => {
        const params = new URLSearchParams({
          geometry: JSON.stringify({
            x: lon,
            y: lat,
            spatialReference: { wkid: 4326 },
          }),
          geometryType: "esriGeometryPoint",
          returnFirstValueOnly: "true",
          interpolation: "RSP_NearestNeighbor",
          outFields: "*",
          f: "json",
        });

        try {
          const response = await fetchWithRetry(
            `${serviceUrl}?${params.toString()}`,
            signal
          );

          if (!response.ok) return { ok: false };

          return { ok: true, value: extractRasterValue(await response.json()) };
        } catch {
          return { ok: false };
        }
      })
    );

    results.push(...batchResults);
  }

  const failedSamples = results.filter((r) => !r.ok).length;

  // Every request failed: this is an outage, not "no data here".
  // Throwing lets the route answer 502 so the UI can offer a retry.
  if (failedSamples === results.length) {
    throw new Error("BNPB service did not respond");
  }

  const validValues = results
    .map((r) => (r.ok ? r.value : null))
    .filter((value): value is number => value !== null);

  const average =
    validValues.length > 0
      ? validValues.reduce((sum, value) => sum + value, 0) / validValues.length
      : null;

  const maximum = validValues.length > 0 ? Math.max(...validValues) : null;

  return {
    average,
    maximum,
    validSamples: validValues.length,
    totalSamples: candidates.length,
    failedSamples,
  };
}
