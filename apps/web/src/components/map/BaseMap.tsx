"use client";

import { useEffect, useRef } from "react";
import Map, { Marker, Popup, type MapRef } from "react-map-gl/maplibre";

import { setWorkerUrl } from "maplibre-gl";
import type { Earthquake } from "@/types/earthquake";
import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl(
  "/maplibre/maplibre-gl-worker.mjs"
);

type BaseMapProps = {
  earthquakes?: Earthquake[];
  selectedEarthquake?: Earthquake | null;
  onSelectEarthquake?: (
    earthquake: Earthquake | null
  ) => void;
};

export default function BaseMap({
  earthquakes = [],
  selectedEarthquake,
  onSelectEarthquake,
}: BaseMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  const validEarthquakes = earthquakes.filter(
    (earthquake) =>
        Number.isFinite(earthquake.latitude) &&
        Number.isFinite(earthquake.longitude) &&
        earthquake.latitude >= -90 &&
        earthquake.latitude <= 90 &&
        earthquake.longitude >= -180 &&
        earthquake.longitude <= 180
    );

  const isSelected =
  
  useEffect(() => {
    if (!selectedEarthquake) return;

    mapRef.current?.flyTo({
        center: [
            selectedEarthquake.longitude,
            selectedEarthquake.latitude,
        ],
        zoom: 7,
        duration: 1200,
    });
    }, [selectedEarthquake]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: 118,
        latitude: -2,
        zoom: 4.5,
      }}
      style={{
        width: "100%",
        height: "100%",
      }}
      mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    >
      {validEarthquakes.map((earthquake) => {
        const markerSize =
          earthquake.category === "latest"
            ? "h-10 w-10"
            : "h-8 w-8";

        const isSelected =
          selectedEarthquake?.id === earthquake.id;

        return (
          <Marker
            key={earthquake.id}
            longitude={earthquake.longitude}
            latitude={earthquake.latitude}
            anchor="center"
            style={{
              zIndex: isSelected
                ? 40
                : earthquake.category === "latest"
                  ? 30
                  : 20,
            }}
          >
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                onSelectEarthquake?.(earthquake);
              }}
              className={`
                relative z-20 flex ${markerSize}
                cursor-pointer items-center justify-center
                rounded-full border-2 border-white
                text-xs font-semibold text-white shadow-md
                transition duration-200
                hover:scale-110
                ${getMarkerClass(earthquake)}
                ${
                  isSelected
                    ? "scale-110 ring-4 ring-blue-200/70"
                    : ""
                }
              `}
              title={`M ${earthquake.magnitude}`}
            >
              {earthquake.magnitude}
            </button>
          </Marker>
        );
      })}

      {selectedEarthquake && (
        <Popup
            longitude={selectedEarthquake.longitude}
            latitude={selectedEarthquake.latitude}
            anchor="bottom"
            offset={24}
            maxWidth="320px"
            closeOnClick={false}
            closeButton
            onClose={() =>
            onSelectEarthquake?.(null)
            }
        >
          <div className="w-[270px]">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-semibold tracking-tight text-slate-950">
                    M {selectedEarthquake.magnitude}
                  </p>

                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      selectedEarthquake.category === "latest"
                        ? "bg-blue-600"
                        : selectedEarthquake.category === "felt"
                          ? "bg-orange-500"
                          : "bg-red-500"
                    }`}
                  />
                </div>

                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  {selectedEarthquake.category === "latest"
                    ? "Latest earthquake"
                    : selectedEarthquake.category === "felt"
                      ? "Felt earthquake"
                      : "Significant earthquake"}
                </p>
              </div>

              <div className="shrink-0 pr-5 text-right">
                <p className="text-xs font-semibold text-slate-700">
                  {selectedEarthquake.depthKm} km
                </p>

                <p className="mt-0.5 text-[9px] text-slate-400">
                  Depth
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-sm font-semibold leading-5 text-slate-800">
                {selectedEarthquake.region}
              </p>

              <p className="mt-2 text-[11px] text-slate-500">
                {selectedEarthquake.date} · {selectedEarthquake.time}
              </p>
            </div>

            {/* Tsunami status */}
            {selectedEarthquake.potential && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />

                <p className="text-[11px] leading-4 text-slate-600">
                  {selectedEarthquake.potential}
                </p>
              </div>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
}

function getMarkerClass(
  earthquake: Earthquake
) {
  switch (earthquake.category) {
    case "latest":
      return "bg-blue-600";

    case "felt":
      return "bg-amber-500";

    case "significant":
    default:
      return "bg-red-500";
  }
}