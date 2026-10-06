"use client";

import Map, {
  Marker,
  Popup,
} from "react-map-gl/maplibre";

import { useState } from "react";

import { setWorkerUrl } from "maplibre-gl";

import type { Earthquake } from "@/types/earthquake";

import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl(
  "/maplibre/maplibre-gl-worker.mjs"
);

type BaseMapProps = {
  earthquakes?: Earthquake[];
};

export default function BaseMap({
  earthquakes = [],
}: BaseMapProps) {
  const [selectedEarthquake, setSelectedEarthquake] =
    useState<Earthquake | null>(null);

  const validEarthquakes = earthquakes.filter(
    (earthquake) =>
        Number.isFinite(earthquake.latitude) &&
        Number.isFinite(earthquake.longitude) &&
        earthquake.latitude >= -90 &&
        earthquake.latitude <= 90 &&
        earthquake.longitude >= -180 &&
        earthquake.longitude <= 180
    );
    
  return (
    <Map
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
      {validEarthquakes.map((earthquake) => (
        <Marker
          key={earthquake.id}
          longitude={earthquake.longitude}
          latitude={earthquake.latitude}
          anchor="center"
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedEarthquake(earthquake);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-red-500 text-xs font-semibold text-white shadow-md transition hover:scale-110"
            title={`M ${earthquake.magnitude}`}
          >
            {earthquake.magnitude}
          </button>
        </Marker>
      ))}

      {selectedEarthquake && (
        <Popup
          longitude={
            selectedEarthquake.longitude
          }
          latitude={
            selectedEarthquake.latitude
          }
          anchor="bottom"
          offset={20}
          closeOnClick={false}
          onClose={() =>
            setSelectedEarthquake(null)
          }
        >
          <div className="min-w-52 p-1 text-slate-900">
            <div className="flex items-center justify-between gap-4">
              <p className="text-lg font-semibold">
                M {selectedEarthquake.magnitude}
              </p>

              <span className="text-xs text-slate-500">
                {selectedEarthquake.depthKm} km
              </span>
            </div>

            <p className="mt-2 text-sm font-medium">
              {selectedEarthquake.region}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {selectedEarthquake.date}
              {" · "}
              {selectedEarthquake.time}
            </p>

            {selectedEarthquake.potential && (
              <p className="mt-3 text-xs text-slate-600">
                {selectedEarthquake.potential}
              </p>
            )}

            {selectedEarthquake.felt && (
              <p className="mt-2 text-xs text-slate-600">
                Felt: {selectedEarthquake.felt}
              </p>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
}