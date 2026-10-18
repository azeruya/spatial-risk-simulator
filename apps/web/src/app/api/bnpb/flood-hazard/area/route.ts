import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getCached,
  getStaleCached,
  setCached,
} from "@/lib/server-cache";

const BNPB_FLOOD_HAZARD_SAMPLES_URL =
  "https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_banjir/ImageServer/getSamples";

type FloodAreaResult = {
  hasData: boolean;
  average: number | null;
  maximum: number | null;
  minimum: number | null;
  validSamples: number;
  totalSamples: number;
  source: string;
  layer: string;
};

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const polygon = body.polygon;
    const sampleCount =
      body.sampleCount ?? 25;

    if (
      !polygon?.geometry?.coordinates?.[0]
    ) {
      return NextResponse.json(
        {
          error:
            "A GeoJSON polygon is required",
        },
        {
          status: 400,
        }
      );
    }

    const cacheKey =
      `flood-area:${sampleCount}:${JSON.stringify(
        polygon
      )}`;

    const cached =
      getCached<FloodAreaResult>(
        cacheKey
      );

    if (cached) {
      return NextResponse.json({
        ...cached,
        cacheStatus: "fresh",
      });
    }

    const ring =
      polygon.geometry.coordinates[0];

    const geometry = JSON.stringify({
      rings: [ring],
      spatialReference: {
        wkid: 4326,
      },
    });

    const params =
      new URLSearchParams({
        geometry,
        geometryType:
          "esriGeometryPolygon",
        sampleCount:
          String(sampleCount),

        pixelSize: JSON.stringify({
          x: 100,
          y: 100,
          spatialReference: {
            wkid: 3395,
          },
        }),

        interpolation:
          "RSP_BilinearInterpolation",
        f: "json",
      });

    const response = await fetch(
      `${BNPB_FLOOD_HAZARD_SAMPLES_URL}?${params.toString()}`,
      {
        cache: "no-store",
      }
    );

    console.log(
      "[flood-area] upstream status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      const upstreamText =
        await response.text();

      console.error(
        `[BNPB flood-area] ${response.status} ${response.statusText}`,
        upstreamText.includes(
          "ArcGIS Web Adaptor"
        )
          ? "ArcGIS Web Adaptor application error"
          : upstreamText.slice(0, 200)
      );

      const stale =
        getStaleCached<FloodAreaResult>(
          cacheKey
        );

      if (stale) {
        return NextResponse.json({
          ...stale,
          cacheStatus: "stale",
        });
      }

      return NextResponse.json(
        {
          error:
            "BNPB flood area request failed",
          upstreamStatus:
            response.status,
        },
        {
          status: 503,
        }
      );
    }

    const data =
      await response.json();

    const values: number[] =
      data.samples
        ?.map(
          (sample: {
            value?:
              | string
              | number;
          }) => {
            if (
              sample.value === "" ||
              sample.value === null ||
              sample.value === undefined
            ) {
              return null;
            }

            const value =
              Number(sample.value);

            return Number.isFinite(
              value
            )
              ? value
              : null;
          }
        )
        .filter(
          (
            value: number | null
          ): value is number =>
            value !== null
        ) ?? [];

    if (values.length === 0) {
      const result: FloodAreaResult =
        {
          hasData: false,
          average: null,
          maximum: null,
          minimum: null,
          validSamples: 0,
          totalSamples:
            data.samples?.length ?? 0,
          source:
            "BNPB InaRISK",
          layer:
            "Flood hazard",
        };

      setCached(
        cacheKey,
        result
      );

      return NextResponse.json({
        ...result,
        cacheStatus: "live",
      });
    }

    const average =
      values.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / values.length;

    const maximum =
      Math.max(...values);

    const minimum =
      Math.min(...values);

    const result: FloodAreaResult =
      {
        hasData: true,
        average,
        maximum,
        minimum,
        validSamples:
          values.length,
        totalSamples:
          data.samples?.length ??
          values.length,
        source:
          "BNPB InaRISK",
        layer:
          "Flood hazard",
      };

    setCached(
      cacheKey,
      result
    );

    return NextResponse.json({
      ...result,
      cacheStatus: "live",
    });
  } catch (error) {
    console.error(
      "[flood-area] route error:",
      error
    );
    return NextResponse.json(
      {
        error:
          "Unable to analyse flood hazard area",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}