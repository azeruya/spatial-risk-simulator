import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  analyseLandCover,
} from "@/lib/land-cover";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const polygon =
      body.polygon as
        | GeoJSON.Feature<GeoJSON.Polygon>
        | undefined;

    if (
      !polygon ||
      polygon.geometry?.type !==
        "Polygon"
    ) {
      return NextResponse.json(
        {
          error:
            "A GeoJSON Polygon is required",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await analyseLandCover(
        polygon
      );

    return NextResponse.json(
      result
    );
  } catch (error) {
    console.error(
      "Land-cover analysis error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to analyse land cover",
      },
      {
        status: 500,
      }
    );
  }
}