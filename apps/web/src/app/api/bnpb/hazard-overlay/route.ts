import { NextRequest } from "next/server";

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

export async function GET(
  request: NextRequest
) {
  const { searchParams } =
    new URL(request.url);

  const hazard =
    searchParams.get("hazard") as
      | HazardKey
      | null;

  const bbox =
    searchParams.get("bbox");

  if (
    !hazard ||
    !(hazard in HAZARD_SERVICES) ||
    !bbox
  ) {
    return new Response(
      "Invalid hazard or bbox",
      { status: 400 }
    );
  }

  const serviceUrl =
    HAZARD_SERVICES[hazard];

  const params =
    new URLSearchParams({
      bbox,
      bboxSR: "4326",
      imageSR: "4326",

      size: "900,900",

      format: "png32",
      transparent: "true",

      f: "image",
    });

  try {
    const response = await fetch(
      `${serviceUrl}/exportImage?${params.toString()}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `BNPB overlay request failed: ${response.status}`
      );
    }

    const image =
      await response.arrayBuffer();

    return new Response(image, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "Hazard overlay error:",
      error
    );

    return new Response(
      "Unable to load hazard overlay",
      {
        status: 502,
      }
    );
  }
}