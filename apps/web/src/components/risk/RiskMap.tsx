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

type HazardResult = {
  value: number | null;
  category: HazardCategory;
  hasData: boolean;
  resolutionMeters: number | null;
  source: string;
  error?: string;
};

type SiteHazards = {
  flood: HazardResult | null;
  tsunami: HazardResult | null;
  landslide: HazardResult | null;
};

type HazardType = keyof SiteHazards;

const EMPTY_HAZARDS: SiteHazards = {
  flood: null,
  tsunami: null,
  landslide: null,
};

const HAZARD_ENDPOINTS: Record<HazardType, string> = {
  flood: "/api/bnpb/flood-hazard",
  tsunami: "/api/bnpb/tsunami-hazard",
  landslide: "/api/bnpb/landslide-hazard",
};

export default function RiskMap() {
  const [selectedPoint, setSelectedPoint] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);

  const [hazards, setHazards] =
    useState<SiteHazards>(EMPTY_HAZARDS);

  const [loadingHazards, setLoadingHazards] =
    useState(false);

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

    setLoadingHazards(true);
    setHazards(EMPTY_HAZARDS);

    try {
      const hazardTypes: HazardType[] = [
        "flood",
        "tsunami",
        "landslide",
      ];

      const results = await Promise.allSettled(
        hazardTypes.map((type) =>
          fetchHazard(
            type,
            longitude,
            latitude
          )
        )
      );

      const nextHazards: SiteHazards = {
        flood: null,
        tsunami: null,
        landslide: null,
      };

      results.forEach((result, index) => {
        const type = hazardTypes[index];

        if (result.status === "fulfilled") {
          nextHazards[type] = result.value;
        } else {
          nextHazards[type] = {
            value: null,
            category: "no-data",
            hasData: false,
            resolutionMeters: null,
            source: "BNPB InaRISK",
            error: "Unable to retrieve data",
          };

          console.error(
            `${type} hazard request failed`,
            result.reason
          );
        }
      });

      setHazards(nextHazards);
    } finally {
      setLoadingHazards(false);
    }
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

          {/* Loading */}
          {loadingHazards && (
            <div className="mt-5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-slate-400" />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Querying BNPB InaRISK...
              </p>
            </div>
          )}

          {/* Hazard results */}
          {!loadingHazards && (
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
            </div>
          )}

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
    value,
    hasData: data.hasData === true,
    resolutionMeters:
      data.resolutionMeters ?? null,
    source: data.source ?? "BNPB InaRISK",

    // Temporary MVP interpretation.
    // Replace with official per-hazard class breaks later.
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
  hazard: HazardResult | null;
}) {
  if (!hazard) {
    return (
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-800">
            {label}
          </p>

          <span className="text-xs text-slate-400">
            —
          </span>
        </div>
      </div>
    );
  }

  if (hazard.error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-3">
        <p className="text-sm font-medium text-slate-800">
          {label}
        </p>

        <p className="mt-1 text-xs text-red-600">
          {hazard.error}
        </p>
      </div>
    );
  }

  if (!hazard.hasData) {
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