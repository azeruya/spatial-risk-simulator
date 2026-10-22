import {
  NextRequest,
} from "next/server";

export const runtime = "nodejs";

const HAZARD_SERVICES = {
  flood:
    "https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_banjir/ImageServer",

  tsunami:
    "https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_TSUNAMI/ImageServer",

  landslide:
    "https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_tanah_longsor/ImageServer",
} as const;

type HazardKey =
  keyof typeof HAZARD_SERVICES;


// 1 × 1 transparent PNG.
// Used only when BNPB's visualization endpoint
// is temporarily unavailable.
const TRANSPARENT_PNG =
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64"
  );


async function fetchWithRetry(
  url: string,
  retries = 1
): Promise<Response> {
  const response =
    await fetch(url, {
      cache: "no-store",
    });

  if (
    retries > 0 &&
    [500, 502, 503, 504].includes(
      response.status
    )
  ) {
    await new Promise(
      (resolve) =>
        setTimeout(resolve, 500)
    );

    return fetchWithRetry(
      url,
      retries - 1
    );
  }

  return response;
}


export async function GET(
  request: NextRequest
) {
  const { searchParams } =
    new URL(request.url);

  const hazard =
    searchParams.get(
      "hazard"
    ) as HazardKey | null;

  const bbox =
    searchParams.get("bbox");

  if (
    !hazard ||
    !(hazard in HAZARD_SERVICES) ||
    !bbox
  ) {
    return new Response(
      "Invalid hazard or bbox",
      {
        status: 400,
      }
    );
  }

  const serviceUrl =
    HAZARD_SERVICES[hazard];

  const params = new URLSearchParams({
    bbox,
    bboxSR: "4326",
    imageSR: "4326",

    size: "512,512",

    format: "png32",
    transparent: "true",

    // Treat zero-valued raster cells as NoData.
    // This prevents them from becoming a gray sheet
    // over the basemap.
    noData: "0",
    noDataInterpretation: "esriNoDataMatchAny",

    f: "image",
  });

  const url =
    `${serviceUrl}/exportImage?${params.toString()}`;

  try {
    const response =
      await fetchWithRetry(
        url,
        1
      );

    if (!response.ok) {
      console.warn(
        "[hazard-overlay] BNPB exportImage unavailable:",
        hazard,
        response.status
      );

      return new Response(
        TRANSPARENT_PNG,
        {
          status: 200,

          headers: {
            "Content-Type":
              "image/png",

            "Cache-Control":
              "no-store",

            "X-Hazard-Overlay":
              "fallback",
          },
        }
      );
    }

    const image =
      await response.arrayBuffer();

    return new Response(image, {
      status: 200,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ?? "image/png",

        "Cache-Control":
          "public, max-age=300, stale-while-revalidate=3600",

        "X-Hazard-Overlay": "live",
      },
    });
  } catch (error) {
    console.warn(
      "[hazard-overlay] request failed:",
      hazard,
      error
    );

    return new Response(
      TRANSPARENT_PNG,
      {
        status: 200,

        headers: {
          "Content-Type":
            "image/png",

          "Cache-Control":
            "no-store",

          "X-Hazard-Overlay":
            "fallback",
        },
      }
    );
  }
}