"use client";

import { useEffect, useRef } from "react";
import Map, { Marker, Popup, type MapRef } from "react-map-gl/maplibre";

import "@/lib/maplibre-setup";
import type { Earthquake } from "@/types/earthquake";
import { useMapResize } from "@/hooks/useMapResize";
import {
  distanceFromStudyArea,
  formatPotential,
  formatRegion,
} from "@/lib/bmkg-format";
import { STUDY_AREA } from "@/lib/study-area";

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
  const containerRef = useMapResize(mapRef);

  const validEarthquakes = earthquakes.filter(
    (earthquake) =>
        Number.isFinite(earthquake.latitude) &&
        Number.isFinite(earthquake.longitude) &&
        earthquake.latitude >= -90 &&
        earthquake.latitude <= 90 &&
        earthquake.longitude >= -180 &&
        earthquake.longitude <= 180
    );

  // Frame the event together with the study area, so "how far is it from
  // Padang?" is answered by the map itself.
  useEffect(() => {
    if (!selectedEarthquake) return;

    mapRef.current?.fitBounds(
      [
        [
          Math.min(selectedEarthquake.longitude, STUDY_AREA.longitude),
          Math.min(selectedEarthquake.latitude, STUDY_AREA.latitude),
        ],
        [
          Math.max(selectedEarthquake.longitude, STUDY_AREA.longitude),
          Math.max(selectedEarthquake.latitude, STUDY_AREA.latitude),
        ],
      ],
      {
        padding: { top: 220, bottom: 80, left: 80, right: 80 },
        maxZoom: 8,
        duration: 1200,
      }
    );
  }, [selectedEarthquake]);

  return (
    <div ref={containerRef} className="h-full w-full">
    <Map
      ref={mapRef}
      initialViewState={{
        // Sumatra, with the study area in the middle of the frame.
        longitude: STUDY_AREA.longitude,
        latitude: STUDY_AREA.latitude - 1.2,
        zoom: 5.2,
      }}
      style={{
        width: "100%",
        height: "100%",
      }}
      mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    >
      {/* Study area anchor: the point the next two steps are about */}
      <Marker
        longitude={STUDY_AREA.longitude}
        latitude={STUDY_AREA.latitude}
        anchor="center"
        style={{ zIndex: 10, pointerEvents: "none" }}
      >
        <div className="flex flex-col items-center">
          <span className="h-3 w-3 rounded-full border-2 border-white bg-slate-900 shadow" />
          <span className="mt-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-slate-800 shadow-sm">
            {STUDY_AREA.name}
          </span>
        </div>
      </Marker>

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

                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
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

                <p className="mt-0.5 text-[10px] text-slate-500">
                  Depth
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p
                className="text-sm font-semibold leading-5 text-slate-800"
                title={selectedEarthquake.region}
              >
                {formatRegion(selectedEarthquake.region)}
              </p>

              <p className="mt-1 text-[11px] text-slate-600">
                {distanceFromStudyArea(selectedEarthquake)}
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                {selectedEarthquake.date} · {selectedEarthquake.time}
              </p>
            </div>

            {/* Tsunami status */}
            {selectedEarthquake.potential && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />

                <p
                  className="text-[11px] leading-4 text-slate-600"
                  title={selectedEarthquake.potential}
                >
                  {formatPotential(selectedEarthquake.potential)}
                </p>
              </div>
            )}
          </div>
        </Popup>
      )}
    </Map>
    </div>
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