import { NextRequest, NextResponse } from "next/server";

import {
  getCached,
  getStaleCached,
  polygonCacheKey,
  setCached,
} from "@/lib/server-cache";
import { errorMessage, isAbortOrTimeout, upstreamFetch } from "@/lib/upstream";

const WORLDPOP_API = "https://api.worldpop.org/v2";

// WorldPop runs the calculation as an async task and often needs 5-20 s.
// The old budget was 6 x 700 ms (about 4 s), which is why this route 504'd.
const POLL_BUDGET_MS = 25_000;
const REQUEST_TIMEOUT_MS = 8_000;

type PopulationResult = {
  population: number | null;
  year: number;
  resolution: string;
  source: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const polygon = body.polygon;
    const year = Number(body.year ?? 2025);

    if (!polygon?.geometry) {
      return NextResponse.json(
        { error: "GeoJSON polygon is required" },
        { status: 400 }
      );
    }

    // Population for a given area doesn't change between requests.
    const cacheKey = polygonCacheKey("population", polygon, year);

    const cached = getCached<PopulationResult>(cacheKey, 6 * 60 * 60 * 1000);
    if (cached) return NextResponse.json({ ...cached, cacheStatus: "fresh" });

    const staleOr = (fallback: () => NextResponse) => {
      const stale = getStaleCached<PopulationResult>(cacheKey);
      return stale
        ? NextResponse.json({ ...stale, cacheStatus: "stale" })
        : fallback();
    };

    const submitResponse = await upstreamFetch(`${WORLDPOP_API}/population`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        geojson: polygon.geometry,
        year,
        resolution: "100m",
      }),
      timeoutMs: REQUEST_TIMEOUT_MS,
      signal: request.signal,
    });

    if (!submitResponse.ok) {
      return staleOr(() =>
        NextResponse.json(
          {
            error: "WorldPop population request failed",
            status: submitResponse.status,
            retryable: true,
          },
          { status: 502 }
        )
      );
    }

    const { task_id: taskId } = await submitResponse.json();

    if (!taskId) {
      return NextResponse.json(
        { error: "WorldPop did not return a task ID" },
        { status: 502 }
      );
    }

    const startedAt = Date.now();
    let delay = 1_000;

    while (Date.now() - startedAt < POLL_BUDGET_MS) {
      await sleep(delay);
      delay = Math.min(delay + 500, 3_000); // 1s, 1.5s, 2s ... capped at 3s

      if (request.signal.aborted) {
        return NextResponse.json({ error: "Request cancelled" }, { status: 499 });
      }

      let resultResponse: Response;

      try {
        resultResponse = await upstreamFetch(`${WORLDPOP_API}/tasks/${taskId}`, {
          timeoutMs: REQUEST_TIMEOUT_MS,
          signal: request.signal,
        });
      } catch (error) {
        // One slow poll shouldn't fail the whole request. Try again.
        if (request.signal.aborted) throw error;
        continue;
      }

      if (!resultResponse.ok) continue;

      const result = await resultResponse.json();

      if (result.status === "success") {
        const population = result.result?.total_population;

        const payload: PopulationResult = {
          population: typeof population === "number" ? population : null,
          year,
          resolution: "100m",
          source: "WorldPop",
        };

        if (payload.population !== null) setCached(cacheKey, payload);

        return NextResponse.json(payload);
      }

      if (result.status === "failure") {
        return staleOr(() =>
          NextResponse.json(
            { error: result.error ?? "WorldPop task failed" },
            { status: 502 }
          )
        );
      }
    }

    return staleOr(() =>
      NextResponse.json(
        {
          error: "WorldPop population calculation timed out",
          retryable: true,
        },
        { status: 504 }
      )
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to calculate population exposure",
        details: errorMessage(error),
        retryable: true,
      },
      { status: isAbortOrTimeout(error) ? 504 : 500 }
    );
  }
}
