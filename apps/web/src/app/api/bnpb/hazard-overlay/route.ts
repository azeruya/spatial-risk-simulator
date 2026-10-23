import { NextRequest } from "next/server";

import {
  clipToEllipse,
  overlaySize,
  parseBbox,
} from "@/lib/simulation/clipOverlay";

export const runtime = "nodejs";

const HAZARD_SERVICES = {
  flood:
    "https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_banjir/ImageServer",

  tsunami:
    "https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_TSUNAMI/ImageServer",

  landslide:
    "https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_tanah_longsor/ImageServer",
} as const;

type HazardKey = keyof typeof HAZARD_SERVICES;

// 1 × 1 transparent PNG.
// Used only when BNPB's visualization endpoint is temporarily unavailable.
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

const FETCH_TIMEOUT_MS = 8000;

function fallback() {
  return new Response(TRANSPARENT_PNG, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      "X-Hazard-Overlay": "fallback",
    },
  });
}

async function fetchWithRetry(url: string, retries = 1): Promise<Response> {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (retries > 0 && [500, 502, 503, 504].includes(response.status)) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return fetchWithRetry(url, retries - 1);
  }

  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const hazard = searchParams.get("hazard") as HazardKey | null;
  const bbox = parseBbox(searchParams.get("bbox"));

  if (!hazard || !(hazard in HAZARD_SERVICES) || !bbox) {
    return new Response("Invalid hazard or bbox", { status: 400 });
  }

  const { width, height } = overlaySize(bbox);

  const params = new URLSearchParams({
    bbox: [bbox.west, bbox.south, bbox.east, bbox.north].join(","),
    bboxSR: "4326",
    imageSR: "4326",

    // Matches the bbox proportions so the server never distorts the image.
    size: `${width},${height}`,

    format: "png32",
    transparent: "true",

    // Treat zero-valued raster cells as NoData.
    // This prevents them from becoming a gray sheet over the basemap.
    noData: "0",
    noDataInterpretation: "esriNoDataMatchAny",

    f: "image",
  });

  const url = `${HAZARD_SERVICES[hazard]}/exportImage?${params.toString()}`;

  try {
    const response = await fetchWithRetry(url, 1);

    const contentType = response.headers.get("content-type") ?? "";

    // ArcGIS sometimes answers 200 with a JSON error body instead of an image.
    if (!response.ok || !contentType.startsWith("image/")) {
      console.warn(
        "[hazard-overlay] BNPB exportImage unavailable:",
        hazard,
        response.status,
        contentType
      );
      return fallback();
    }

    const source = Buffer.from(await response.arrayBuffer());

    let body: Buffer = source;
    let clip = "ellipse";

    try {
      body = await clipToEllipse(source);
    } catch (error) {
      // Better an unclipped overlay than none.
      console.warn("[hazard-overlay] clipping failed:", hazard, error);
      clip = "none";
    }

    return new Response(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": clip === "ellipse" ? "image/png" : contentType,
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        "X-Hazard-Overlay": "live",
        "X-Hazard-Clip": clip,
      },
    });
  } catch (error) {
    console.warn("[hazard-overlay] request failed:", hazard, error);
    return fallback();
  }
}