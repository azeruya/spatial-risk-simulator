import { NextRequest, NextResponse } from "next/server";

import { analyseTerrain } from "@/lib/terrain";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const longitude =
      Number(body.longitude);

    const latitude =
      Number(body.latitude);

    const radiusMeters =
      Number(
        body.radiusMeters ?? 500
      );

    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid longitude or latitude",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        radiusMeters
      ) ||
      radiusMeters <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid analysis radius",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await analyseTerrain({
        longitude,
        latitude,
        radiusMeters,
      });

    return NextResponse.json(
      result
    );
  } catch (error) {
    console.error(
      "Terrain analysis error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to analyse terrain",
      },
      {
        status: 500,
      }
    );
  }
}