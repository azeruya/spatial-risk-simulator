import { Signal } from "lucide-react";
import { NextRequest, NextResponse } from "next/server";

const BNPB_EARTHQUAKE_HAZARD_SAMPLES_URL =
  "https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_GEMPABUMI/ImageServer/getSamples";

const controller = new AbortController();

const timeout = setTimeout(() => {
  controller.abort();
}, 3000);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const lon = searchParams.get("lon");
  const lat = searchParams.get("lat");

  if (!lon || !lat) {
    return NextResponse.json(
      {
        error: "lon and lat are required",
      },
      {
        status: 400,
      }
    );
  }

  const longitude = Number(lon);
  const latitude = Number(lat);

  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return NextResponse.json(
      {
        error: "Invalid coordinates",
      },
      {
        status: 400,
      }
    );
  }

  const geometry = JSON.stringify({
    x: longitude,
    y: latitude,
    spatialReference: {
      wkid: 4326,
    },
  });

  const params = new URLSearchParams({
    geometry,
    geometryType: "esriGeometryPoint",

    pixelSize: JSON.stringify({
      x: 100,
      y: 100,
      spatialReference: {
        wkid: 3395,
      },
    }),

    returnFirstValueOnly: "true",
    interpolation: "RSP_BilinearInterpolation",
    f: "json",
  });

  try {
    const response = await fetch(
      `${BNPB_EARTHQUAKE_HAZARD_SAMPLES_URL}?${params.toString()}`,
      {
        cache: "no-store",
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "BNPB earthquake hazard request failed",
          status: response.status,
        },
        {
          status: 502,
        }
      );
    }

    const data = await response.json();

    const rawValue = data.samples?.[0]?.value;

    const parsedValue =
      rawValue === "" ||
      rawValue === null ||
      rawValue === undefined
        ? null
        : Number(rawValue);

    const value =
      parsedValue !== null &&
      Number.isFinite(parsedValue)
        ? parsedValue
        : null;

    return NextResponse.json({
      longitude,
      latitude,
      value,
      hasData: value !== null,
      resolutionMeters:
        data.samples?.[0]?.resolution ?? null,
      source: "BNPB InaRISK",
      layer: "Earthquake hazard",
    });
  } catch (error) {
      const isTimeout =
         error instanceof Error &&
         error.name === "AbortError";

      return NextResponse.json(
         {
            error: isTimeout
            ? "BNPB earthquake hazard service timed out"
            : "Unable to reach BNPB earthquake hazard service",
         },
         {
            status: isTimeout ? 504 : 502,
         }
      );
   }
}

