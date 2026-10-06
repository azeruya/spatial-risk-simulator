"use client";

import { useState } from "react";

import Map, {
  Marker,
} from "react-map-gl/maplibre";

import { setWorkerUrl } from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

type FloodHazardCategory =
  | "low"
  | "moderate"
  | "high"
  | "no-data";

type FloodHazardResult = {
  value: number | null;
  category: FloodHazardCategory;
  hasData: boolean;
  resolutionMeters?: number | null;
};

export default function RiskMap() {
  const [selectedPoint, setSelectedPoint] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);

  const [floodHazard, setFloodHazard] =
    useState<FloodHazardResult | null>(null);

  const [loadingHazard, setLoadingHazard] =
    useState(false);

  const [hazardError, setHazardError] =
    useState<string | null>(null);

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

    setLoadingHazard(true);
    setFloodHazard(null);
    setHazardError(null);

    try {
      const response = await fetch(
        `/api/bnpb/flood-hazard?lon=${longitude}&lat=${latitude}`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to retrieve flood hazard data"
        );
      }

      const data = await response.json();

      const value =
        typeof data.value === "number"
          ? data.value
          : null;

      setFloodHazard({
        value,
        hasData: data.hasData,
        resolutionMeters:
          data.resolutionMeters ?? null,
        category: classifyFloodHazard(value),
      });
    } catch (error) {
      console.error(error);

      setHazardError(
        "Unable to retrieve flood hazard data."
      );
    } finally {
      setLoadingHazard(false);
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
          Click anywhere on the map to analyse flood hazard
        </div>
      )}

      {/* Result */}
      {selectedPoint && (
        <div className="absolute bottom-6 right-6 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Site analysis
              </p>

              <p className="mt-1 text-sm font-medium text-slate-900">
                Flood hazard
              </p>
            </div>

            {floodHazard?.hasData && (
              <HazardBadge
                category={floodHazard.category}
              />
            )}
          </div>

          {loadingHazard && (
            <div className="mt-5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-slate-400" />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Querying BNPB InaRISK...
              </p>
            </div>
          )}

          {!loadingHazard &&
            floodHazard?.hasData && (
              <>
                <div className="mt-5">
                  <p className="text-3xl font-semibold text-slate-900">
                    {floodHazard.value?.toFixed(3)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Hazard index
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <ResultStat
                    label="Longitude"
                    value={selectedPoint.longitude.toFixed(
                      5
                    )}
                  />

                  <ResultStat
                    label="Latitude"
                    value={selectedPoint.latitude.toFixed(
                      5
                    )}
                  />

                  <ResultStat
                    label="Resolution"
                    value={
                      floodHazard.resolutionMeters
                        ? `${floodHazard.resolutionMeters} m`
                        : "—"
                    }
                  />

                  <ResultStat
                    label="Source"
                    value="BNPB InaRISK"
                  />
                </div>
              </>
            )}

          {!loadingHazard &&
            floodHazard &&
            !floodHazard.hasData && (
              <div className="mt-5 rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-700">
                  No mapped hazard value
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  BNPB returned NoData for this
                  100 m raster cell. Try another
                  nearby location.
                </p>
              </div>
            )}

          {hazardError && (
            <div className="mt-5 rounded-xl bg-red-50 p-3">
              <p className="text-xs text-red-700">
                {hazardError}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function classifyFloodHazard(
  value: number | null
): FloodHazardCategory {
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

function HazardBadge({
  category,
}: {
  category: FloodHazardCategory;
}) {
  const styles = {
    low: "bg-emerald-50 text-emerald-700",
    moderate: "bg-amber-50 text-amber-700",
    high: "bg-red-50 text-red-700",
    "no-data": "bg-slate-100 text-slate-600",
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
  category: FloodHazardCategory
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