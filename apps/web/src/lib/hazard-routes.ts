/**
 * One implementation for the three BNPB InaRISK hazard layers.
 *
 * Previously flood / tsunami / landslide each had their own copy of the point,
 * area and footprint routes (about 600 duplicated lines). They now differ only
 * by the HAZARDS config below.
 */
import { NextRequest, NextResponse } from "next/server";

import { analyseBnpbRasterFootprint } from "@/lib/bnpb-footprint";
import {
  getCached,
  getStaleCached,
  polygonCacheKey,
  setCached,
} from "@/lib/server-cache";
import { errorMessage, isAbortOrTimeout, upstreamFetch } from "@/lib/upstream";

export type HazardConfig = {
  id: "flood" | "tsunami" | "landslide";
  /** Label returned to the client, e.g. "Flood hazard". */
  layer: string;
  samplesUrl: string;
  classify?: (value: number | null) => string;
};

const INARISK = "https://gis.bnpb.go.id/server/rest/services/inarisk";

const classifyFlood = (value: number | null) => {
  if (value === null) return "no-data";
  if (value < 0.33) return "low";
  if (value < 0.66) return "moderate";
  return "high";
};

export const HAZARDS: Record<HazardConfig["id"], HazardConfig> = {
  flood: {
    id: "flood",
    layer: "Flood hazard",
    samplesUrl: `${INARISK}/layer_bahaya_banjir/ImageServer/getSamples`,
    classify: classifyFlood,
  },
  tsunami: {
    id: "tsunami",
    layer: "Tsunami hazard",
    samplesUrl: `${INARISK}/INDEKS_BAHAYA_TSUNAMI/ImageServer/getSamples`,
  },
  landslide: {
    id: "landslide",
    layer: "Landslide hazard",
    samplesUrl: `${INARISK}/layer_bahaya_tanah_longsor/ImageServer/getSamples`,
  },
};

const SOURCE = "BNPB InaRISK";

const PIXEL_SIZE = JSON.stringify({
  x: 100,
  y: 100,
  spatialReference: { wkid: 3395 },
});

const POINT_TIMEOUT_MS = 12_000;
const AREA_TIMEOUT_MS = 15_000;
const FOOTPRINT_DEADLINE_MS = 25_000;

function toValue(raw: unknown): number | null {
  if (raw === "" || raw === null || raw === undefined) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function failure(config: HazardConfig, what: string, error: unknown) {
  const timedOut = isAbortOrTimeout(error);

  return NextResponse.json(
    {
      error: timedOut
        ? `BNPB ${config.id} ${what} timed out`
        : `Unable to reach BNPB ${config.id} ${what} service`,
      details: errorMessage(error),
      retryable: true,
    },
    { status: timedOut ? 504 : 502 }
  );
}

/* ------------------------------------------------------------------ */
/* GET ?lon=&lat=  -> value at one point                               */
/* ------------------------------------------------------------------ */

export function createPointHandler(config: HazardConfig) {
  return async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const lon = searchParams.get("lon");
    const lat = searchParams.get("lat");

    if (!lon || !lat) {
      return NextResponse.json(
        { error: "lon and lat are required" },
        { status: 400 }
      );
    }

    const longitude = Number(lon);
    const latitude = Number(lat);

    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    type PointResult = Record<string, unknown>;

    // ~1 m precision: repeated clicks on the same spot are free.
    const cacheKey = `${config.id}-point:${longitude.toFixed(5)}:${latitude.toFixed(5)}`;

    const cached = getCached<PointResult>(cacheKey);
    if (cached) return NextResponse.json({ ...cached, cacheStatus: "fresh" });

    const params = new URLSearchParams({
      geometry: JSON.stringify({
        x: longitude,
        y: latitude,
        spatialReference: { wkid: 4326 },
      }),
      geometryType: "esriGeometryPoint",
      pixelSize: PIXEL_SIZE,
      returnFirstValueOnly: "true",
      interpolation: "RSP_BilinearInterpolation",
      f: "json",
    });

    try {
      const response = await upstreamFetch(`${config.samplesUrl}?${params}`, {
        timeoutMs: POINT_TIMEOUT_MS,
        signal: request.signal,
      });

      if (!response.ok) {
        const stale = getStaleCached<PointResult>(cacheKey);
        if (stale) return NextResponse.json({ ...stale, cacheStatus: "stale" });

        return NextResponse.json(
          {
            error: `BNPB ${config.id} hazard request failed`,
            status: response.status,
            retryable: true,
          },
          { status: 502 }
        );
      }

      const data = await response.json();
      const value = toValue(data.samples?.[0]?.value);

      const result: PointResult = {
        longitude,
        latitude,
        value,
        ...(config.classify ? { category: config.classify(value) } : {}),
        hasData: value !== null,
        resolutionMeters: data.samples?.[0]?.resolution ?? null,
        source: SOURCE,
        layer: config.layer,
      };

      setCached(cacheKey, result);
      return NextResponse.json(result);
    } catch (error) {
      const stale = getStaleCached<PointResult>(cacheKey);
      if (stale) return NextResponse.json({ ...stale, cacheStatus: "stale" });

      return failure(config, "hazard", error);
    }
  };
}

/* ------------------------------------------------------------------ */
/* POST { polygon, sampleCount } -> stats over a polygon (Risk page)   */
/* ------------------------------------------------------------------ */

type AreaResult = {
  hasData: boolean;
  average: number | null;
  maximum: number | null;
  minimum: number | null;
  validSamples: number;
  totalSamples: number;
  coveragePercent: number;
  source: string;
  layer: string;
};

export function createAreaHandler(config: HazardConfig) {
  return async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      const polygon = body.polygon;
      const sampleCount = Math.min(
        Math.max(Number(body.sampleCount) || 25, 1),
        100
      );

      const ring = polygon?.geometry?.coordinates?.[0];

      if (!ring) {
        return NextResponse.json(
          { error: "A GeoJSON polygon is required" },
          { status: 400 }
        );
      }

      const cacheKey = polygonCacheKey(`${config.id}-area`, polygon, sampleCount);

      const cached = getCached<AreaResult>(cacheKey);
      if (cached) return NextResponse.json({ ...cached, cacheStatus: "fresh" });

      const params = new URLSearchParams({
        geometry: JSON.stringify({
          rings: [ring],
          spatialReference: { wkid: 4326 },
        }),
        geometryType: "esriGeometryPolygon",
        sampleCount: String(sampleCount),
        pixelSize: PIXEL_SIZE,
        interpolation: "RSP_BilinearInterpolation",
        f: "json",
      });

      const staleOr = (fallback: () => NextResponse) => {
        const stale = getStaleCached<AreaResult>(cacheKey);
        return stale
          ? NextResponse.json({ ...stale, cacheStatus: "stale" })
          : fallback();
      };

      let response: Response;

      try {
        response = await upstreamFetch(`${config.samplesUrl}?${params}`, {
          timeoutMs: AREA_TIMEOUT_MS,
          signal: request.signal,
        });
      } catch (error) {
        return staleOr(() => failure(config, "area", error));
      }

      if (!response.ok) {
        return staleOr(() =>
          NextResponse.json(
            {
              error: `BNPB ${config.id} area request failed`,
              upstreamStatus: response.status,
              retryable: true,
            },
            { status: 503 }
          )
        );
      }

      const data = await response.json();

      const values: number[] = (data.samples ?? [])
        .map((s: { value?: unknown }) => toValue(s.value))
        .filter((v: number | null): v is number => v !== null);

      const totalSamples: number = data.samples?.length ?? values.length;

      const result: AreaResult =
        values.length === 0
          ? {
              hasData: false,
              average: null,
              maximum: null,
              minimum: null,
              validSamples: 0,
              totalSamples,
              coveragePercent: 0,
              source: SOURCE,
              layer: config.layer,
            }
          : {
              hasData: true,
              average: values.reduce((s, v) => s + v, 0) / values.length,
              maximum: Math.max(...values),
              minimum: Math.min(...values),
              validSamples: values.length,
              totalSamples,
              coveragePercent:
                totalSamples > 0 ? (values.length / totalSamples) * 100 : 0,
              source: SOURCE,
              layer: config.layer,
            };

      setCached(cacheKey, result);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        {
          error: `Unable to analyse ${config.id} hazard area`,
          details: errorMessage(error),
        },
        { status: 500 }
      );
    }
  };
}

/* ------------------------------------------------------------------ */
/* POST { polygon, sampleCount } -> stats over a project footprint     */
/* ------------------------------------------------------------------ */

export function createFootprintHandler(config: HazardConfig) {
  return async function POST(request: NextRequest) {
    try {
      const body = await request.json();

      const polygon = body.polygon as GeoJSON.Feature<GeoJSON.Polygon>;

      if (!polygon || polygon.geometry?.type !== "Polygon") {
        return NextResponse.json(
          { error: "A valid polygon is required." },
          { status: 400 }
        );
      }

      const sampleCount = body.sampleCount ?? 25;
      const cacheKey = polygonCacheKey(`${config.id}-footprint`, polygon, sampleCount);

      const cached = getCached<object>(cacheKey);
      if (cached) return NextResponse.json({ ...cached, cacheStatus: "fresh" });

      // One overall deadline so a slow service can't hold the request open.
      const signal = AbortSignal.any([
        request.signal,
        AbortSignal.timeout(FOOTPRINT_DEADLINE_MS),
      ]);

      try {
        const result = await analyseBnpbRasterFootprint({
          polygon,
          serviceUrl: config.samplesUrl,
          sampleCount,
          signal,
        });

        const payload = { ...result, source: SOURCE, layer: config.layer };
        setCached(cacheKey, payload);
        return NextResponse.json(payload);
      } catch (error) {
        const stale = getStaleCached<object>(cacheKey);
        if (stale) return NextResponse.json({ ...stale, cacheStatus: "stale" });
        throw error;
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: `Unable to analyse ${config.id} hazard for the footprint.`,
          details: errorMessage(error),
          retryable: true,
        },
        { status: isAbortOrTimeout(error) ? 504 : 502 }
      );
    }
  };
}
