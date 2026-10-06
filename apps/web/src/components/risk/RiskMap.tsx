"use client";

import { useState } from "react";
import Map, { Marker } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

type HazardCategory =
  | "low"
  | "moderate"
  | "high"
  | "no-data";

type HazardStatus =
  | "idle"
  | "loading"
  | "success"
  | "no-data"
  | "error";

type HazardResult = {
  status: HazardStatus;
  value: number | null;
  category: HazardCategory;
  hasData: boolean;
  resolutionMeters: number | null;
  source: string;
  error?: string;
};

type SiteHazards = {
  flood: HazardResult;
  tsunami: HazardResult;
  landslide: HazardResult;
  earthquake: HazardResult;
};

type HazardType = keyof SiteHazards;

const createIdleHazard = (): HazardResult => ({
  status: "idle",
  value: null,
  category: "no-data",
  hasData: false,
  resolutionMeters: null,
  source: "BNPB InaRISK",
});

const EMPTY_HAZARDS: SiteHazards = {
  flood: createIdleHazard(),
  tsunami: createIdleHazard(),
  landslide: createIdleHazard(),
  earthquake: createIdleHazard(),
};

const HAZARD_ENDPOINTS: Record<HazardType, string> = {
  flood: "/api/bnpb/flood-hazard",
  tsunami: "/api/bnpb/tsunami-hazard",
  landslide: "/api/bnpb/landslide-hazard",
  earthquake: "/api/bnpb/earthquake-hazard",
};

export default function RiskMap() {
  const [selectedPoint, setSelectedPoint] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);

  const [hazards, setHazards] =
    useState<SiteHazards>(EMPTY_HAZARDS);

  async function handleMapClick(event: {
    lngLat: {
      lng: number;
      lat: number;
    };
  }) {
    const longitude = event.lngLat.lng;
    const latitude = event.lngLat.lat;

    setSelectedPoint({
      longitude,
      latitude,
    });

    // Set ALL rows to loading BEFORE starting requests
    setHazards({
      flood: {
        ...createIdleHazard(),
        status: "loading",
      },
      tsunami: {
        ...createIdleHazard(),
        status: "loading",
      },
      landslide: {
        ...createIdleHazard(),
        status: "loading",
      },
      earthquake: {
        ...createIdleHazard(),
        status: "loading",
      },
    });

    const hazardTypes: HazardType[] = [
      "flood",
      "tsunami",
      "landslide",
      "earthquake",
    ];

    hazardTypes.forEach((type) => {
      fetchHazard(
        type,
        longitude,
        latitude
      )
        .then((result) => {
          setHazards((current) => ({
            ...current,
            [type]: {
              ...result,
              status: result.hasData
                ? "success"
                : "no-data",
            },
          }));
        })
        .catch(() => {
          setHazards((current) => ({
            ...current,
            [type]: {
              ...createIdleHazard(),
              status: "error",
              error: "Service unavailable",
            },
          }));
        });
    });
  }

  return (
    <div className="relative h-full w-full">
      <Map
        initialViewState={{
          longitude: 100.3543,
          latitude: -0.9471,
          zoom: 10,
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        onClick={handleMapClick}
        cursor="crosshair"
      >
        {selectedPoint && (
          <Marker
            longitude={selectedPoint.longitude}
            latitude={selectedPoint.latitude}
            anchor="center"
          >
            <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-md ring-4 ring-blue-100" />
          </Marker>
        )}
      </Map>

      {/* Instruction */}
      {!selectedPoint && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 px-4 py-2 text-sm text-slate-600 shadow-sm">
          Click anywhere on the map to analyse site hazards
        </div>
      )}

      {/* Site analysis */}
      {selectedPoint && (
        <div className="absolute bottom-6 right-6 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Site analysis
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              Hazard profile
            </p>
          </div>

          {/* Coordinates */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <ResultStat
              label="Longitude"
              value={selectedPoint.longitude.toFixed(5)}
            />

            <ResultStat
              label="Latitude"
              value={selectedPoint.latitude.toFixed(5)}
            />
          </div>

          <div className="mt-5 space-y-3">
            <HazardRow
              label="Flood"
              hazard={hazards.flood}
            />

            <HazardRow
              label="Tsunami"
              hazard={hazards.tsunami}
            />

            <HazardRow
              label="Landslide"
              hazard={hazards.landslide}
            />

            <HazardRow
              label="Earthquake"
              hazard={hazards.earthquake}
            />
          </div>

          <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] leading-4 text-slate-400">
            Source: BNPB InaRISK. Hazard values are
            sampled from raster cells at the selected
            location.
          </p>
        </div>
      )}
    </div>
  );
}

async function fetchHazard(
  type: HazardType,
  longitude: number,
  latitude: number
): Promise<HazardResult> {
  const endpoint = HAZARD_ENDPOINTS[type];

  const response = await fetch(
    `${endpoint}?lon=${longitude}&lat=${latitude}`
  );

  if (!response.ok) {
    throw new Error(
      `${type} hazard request failed: ${response.status}`
    );
  }

  const data = await response.json();

  const value =
    typeof data.value === "number"
      ? data.value
      : null;

    return {
      status: value !== null
        ? "success"
        : "no-data",
      value,
      hasData: data.hasData === true,
      resolutionMeters:
        data.resolutionMeters ?? null,
      source: data.source ?? "BNPB InaRISK",
      category: classifyHazard(value),
    };
}

function classifyHazard(
  value: number | null
): HazardCategory {
  if (value === null) {
    return "no-data";
  }

  if (value < 0.33) {
    return "low";
  }

  if (value < 0.66) {
    return "moderate";
  }

  return "high";
}

function HazardRow({
  label,
  hazard,
}: {
  label: string;
  hazard: HazardResult;
  }) {
    if (hazard.status === "loading") {
      return (
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-800">
              {label}
            </p>

            <span className="text-xs text-slate-400">
              Checking...
            </span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-slate-300" />
          </div>
        </div>
      );
    }

    if (hazard.status === "error") {
      return (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-800">
              {label}
            </p>

            <span className="text-xs text-amber-700">
              Unavailable
            </span>
          </div>
        </div>
      );
    }

    if (hazard.status === "no-data") {
      return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              {label}
            </p>

            <HazardBadge category="no-data" />
          </div>

          <p className="mt-1 text-xs text-slate-500">
            No mapped value at this location.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-slate-800">
            {label}
          </p>

          <HazardBadge
            category={hazard.category}
          />
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-2xl font-semibold text-slate-900">
              {hazard.value?.toFixed(3)}
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              Hazard index
            </p>
          </div>

          {hazard.resolutionMeters && (
            <p className="text-[11px] text-slate-400">
              {hazard.resolutionMeters} m
            </p>
          )}
        </div>
      </div>
    );
  }


function HazardBadge({
  category,
}: {
  category: HazardCategory;
}) {
  const styles: Record<
    HazardCategory,
    string
  > = {
    low: "bg-emerald-50 text-emerald-700",
    moderate: "bg-amber-50 text-amber-700",
    high: "bg-red-50 text-red-700",
    "no-data":
      "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[category]}`}
    >
      {formatCategory(category)}
    </span>
  );
}

function ResultStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5">
      <p className="text-[11px] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

function formatCategory(
  category: HazardCategory
) {
  switch (category) {
    case "low":
      return "Low";

    case "moderate":
      return "Moderate";

    case "high":
      return "High";

    default:
      return "No data";
  }
}