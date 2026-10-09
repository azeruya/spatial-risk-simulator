import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  analyseBnpbRasterFootprint,
} from "@/lib/bnpb-footprint";

const SERVICE_URL =
  "https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_banjir/ImageServer/getSamples";

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const polygon =
      body.polygon as GeoJSON.Feature<GeoJSON.Polygon>;

    if (
      !polygon ||
      polygon.geometry?.type !== "Polygon"
    ) {
      return NextResponse.json(
        {
          error:
            "A valid polygon is required.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await analyseBnpbRasterFootprint({
        polygon,
        serviceUrl: SERVICE_URL,
        sampleCount:
          body.sampleCount ?? 25,
      });

    return NextResponse.json({
      ...result,
      source: "BNPB InaRISK",
      layer: "Flood hazard",
    });
  } catch (error) {
    console.error(
      "Flood footprint analysis error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to analyse flood hazard for the footprint.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 502,
      }
    );
  }
}