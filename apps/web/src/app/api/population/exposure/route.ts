import { NextRequest, NextResponse } from "next/server";

const WORLDPOP_API =
  "https://api.worldpop.org/v2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const polygon = body.polygon;
    const year = body.year ?? 2025;

    if (!polygon?.geometry) {
      return NextResponse.json(
        {
          error: "GeoJSON polygon is required",
        },
        {
          status: 400,
        }
      );
    }

    const submitResponse = await fetch(
      `${WORLDPOP_API}/population`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          geojson: polygon.geometry,
          year,
          resolution: "100m",
        }),
        cache: "no-store",
      }
    );

    if (!submitResponse.ok) {
      return NextResponse.json(
        {
          error:
            "WorldPop population request failed",
          status: submitResponse.status,
        },
        {
          status: 502,
        }
      );
    }

    const submitData = 
      await submitResponse.json();

    const taskId = submitData.task_id;

    if (!taskId) {
      return NextResponse.json(
        {
          error:
            "WorldPop did not return a task ID",
        },
        {
          status: 502,
        }
      );
    }

    // poll briefly for result
    for (let attempt = 0; attempt < 6; attempt++) {
      await new Promise((resolve) => 
        setTimeout(resolve, 700)
      );

      const resultResponse = await fetch(
        `${WORLDPOP_API}/tasks/${taskId}`,
        {
          cache: "no-store",
        }
      );

      if (!resultResponse.ok) {
        continue;
      }

      const result =
        await resultResponse.json();

      if (result.status === "success") {
        const population =
          result.result?.total_population;

        return NextResponse.json({
          population:
            typeof population === "number"
              ? population
              : null,
          year,
          resolution: "100m",
          source: "WorldPop",
        });
      }

      if (result.status === "failure") {
        return NextResponse.json(
          {
            error:
              result.error ??
              "WorldPop task failed",
          },
          {
            status: 502,
          }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "WorldPop population calculation timed out",
      },
      {
        status: 504,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "Unable to calculate population exposure",
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

