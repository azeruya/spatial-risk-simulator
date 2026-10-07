import { NextRequest, NextResponse } from "next/server";

const BNPB_LANDSLIDE_HAZARD_SAMPLES_URL =
  "https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_tanah_longsor/ImageServer/getSamples";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const polygon = body.polygon;
    const sampleCount = body.sampleCount ?? 25;

    if (!polygon?.geometry?.coordinates?.[0]) {
      return NextResponse.json(
        {
        error: "A GeoJSON polygon is required",
        },
        {
        status: 400,
        }
      );
    }

    const ring = polygon.geometry.coordinates[0];

    const geometry = JSON.stringify({
      rings: [ring],
      spatialReference: {
        wkid: 4326,
      },
    });

    const params = new URLSearchParams({
      geometry,
      geometryType: "esriGeometryPolygon",
      sampleCount: String(sampleCount),

      pixelSize: JSON.stringify({
        x: 100,
        y: 100,
        spatialReference: {
          wkid: 3395,
        },
      }),

      interpolation: "RSP_BilinearInterpolation",
      f: "json",
    });

    const response = await fetch(
      `${BNPB_LANDSLIDE_HAZARD_SAMPLES_URL}?${params.toString()}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "BNPB landslide area request failed",
          status: response.status,
        },
        {
          status: 502,
        }
      );
    }

    const data = await response.json();

    const values: number[] =
      data.samples
        ?.map((sample: { value?: string | number }) => {
          if (
            sample.value === "" ||
            sample.value === null ||
            sample.value === undefined
          ) {
            return null;
          }

          const value = Number(sample.value);

          return Number.isFinite(value)
            ? value
            : null;
        })
        .filter(
          (value: number | null): value is number =>
            value !== null
        ) ?? [];

    if (values.length === 0) {
      return NextResponse.json({
        hasData: false,
        average: null,
        maximum: null,
        minimum: null,
        validSamples: 0,
        totalSamples: data.samples?.length ?? 0,
        source: "BNPB InaRISK",
        layer: "Landslide hazard",
      });
    }

    const average =
      values.reduce(
        (sum, value) => sum + value,
        0
      ) / values.length;

    const maximum = Math.max(...values);
    const minimum = Math.min(...values);

    return NextResponse.json({
      hasData: true,
      average,
      maximum,
      minimum,
      validSamples: values.length,
      totalSamples: data.samples?.length ?? values.length,
      source: "BNPB InaRISK",
      layer: "Landslide hazard",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to analyse landslide hazard area",
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
