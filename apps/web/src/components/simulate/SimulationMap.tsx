"use client";

import { useMemo } from "react";

import Map, {
  Layer,
  Marker,
  Source,
} from "react-map-gl/maplibre";

import { setWorkerUrl } from "maplibre-gl";
import { circle } from "@turf/circle";

import "maplibre-gl/dist/maplibre-gl.css";
import { SimulationView } from "@/app/simulate/page";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export type SelectedSite = {
  longitude: number;
  latitude: number;
};

type SimulationMapProps = {
  selectedSite: SelectedSite | null;
  onSelectSite: (site: SelectedSite) => void;

  projectAreaHa: number;

  imperviousPercent: number;
  greenPercent: number;

  simulationView: SimulationView;
};

export default function SimulationMap({
  selectedSite,
  onSelectSite,
  projectAreaHa,
  imperviousPercent,
  greenPercent,
  simulationView,
}: SimulationMapProps) {
  /*
   * Convert hectares into the radius of an equivalent circle.
   *
   * 1 hectare = 10,000 m²
   *
   * area = πr²
   * r = √(area / π)
   */
  const footprintRadiusMeters = useMemo(() => {
    const areaM2 = projectAreaHa * 10_000;

    return Math.sqrt(areaM2 / Math.PI);
  }, [projectAreaHa]);

  const projectFootprint = useMemo(() => {
    if (!selectedSite) return null;

    return circle(
      [
        selectedSite.longitude,
        selectedSite.latitude,
      ],
      footprintRadiusMeters / 1000,
      {
        steps: 64,
        units: "kilometers",
      }
    );
  }, [
    selectedSite,
    footprintRadiusMeters,
  ]);

  const analysisRadiusMeters = 500;

  const analysisArea = useMemo(() => {
  if (!selectedSite) return null;

  const displayedImpervious =
    simulationView === "current"
      ? 40
      : imperviousPercent;

  const displayedGreen =
    simulationView === "current"
      ? 40
      : greenPercent;

  return circle(
    [
    selectedSite.longitude,
    selectedSite.latitude,
    ],
    analysisRadiusMeters / 1000,
    {
    steps: 64,
    units: "kilometers",
    }
  );
  }, [selectedSite]);

  function handleMapClick(event: {
    lngLat: {
      lng: number;
      lat: number;
    };
  }) {
    onSelectSite({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
    });
  }

  return (
    <div className="relative h-full w-full">
      <Map
        initialViewState={{
          longitude: 100.3543,
          latitude: -0.9471,
          zoom: 12,
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        cursor="crosshair"
        onClick={handleMapClick}
      >
        {analysisArea && (
          <Source
            id="analysis-context"
            type="geojson"
            data={analysisArea}
          >
            <Layer
              id="analysis-context-fill"
              type="fill"
              paint={{
                "fill-color": "#64748b",
                "fill-opacity": 0.04,
              }}
            />

            <Layer
              id="analysis-context-outline"
              type="line"
              paint={{
                "line-color": "#64748b",
                "line-width": 1.5,
                "line-dasharray": [3, 2],
              }}
            />
          </Source>
        )}
        {/* Proposed development footprint */}
        {projectFootprint && (
          <Source
            id="project-footprint"
            type="geojson"
            data={projectFootprint}
          >
            <Layer
              id="project-footprint-fill"
              type="fill"
              paint={{
                "fill-color": "#2563eb",
                "fill-opacity": 0.18,
              }}
            />

            <Layer
              id="project-footprint-outline"
              type="line"
              paint={{
                "line-color": "#2563eb",
                "line-width": 2.5,
              }}
            />
          </Source>
        )}

        {/* Center point */}
        {selectedSite && (
          <Marker
            longitude={selectedSite.longitude}
            latitude={selectedSite.latitude}
            anchor="center"
          >
            <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-md ring-4 ring-blue-100" />
          </Marker>
        )}
      </Map>

      {/* Initial instruction */}
      {!selectedSite && (
        <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 px-4 py-2 text-sm text-slate-600 shadow-sm">
          Click the map to place the proposed development
        </div>
      )}

      {/* Site information */}
      {selectedSite && (
        <div className="absolute left-5 top-5 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Proposed footprint
          </p>

          <div className="mt-1 flex items-baseline gap-1">
            <p className="text-xl font-semibold text-slate-900">
              {projectAreaHa.toFixed(1)}
            </p>

            <p className="text-xs text-slate-500">
              ha
            </p>
          </div>

          <p className="mt-1 text-[11px] text-slate-400">
            ≈ {Math.round(footprintRadiusMeters)} m radius
          </p>
        </div>
      )}

      {/* Land allocation mini panel */}
      {selectedSite && (
        <div className="absolute bottom-5 left-5 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Development mix
          </p>

          <div className="mt-2 flex gap-4 text-xs">
            <div>
              <p className="text-slate-400">
                Impervious
              </p>

              <p className="mt-0.5 font-semibold text-slate-800">
                {imperviousPercent}%
              </p>
            </div>

            <div>
              <p className="text-slate-400">
                Green
              </p>

              <p className="mt-0.5 font-semibold text-slate-800">
                {greenPercent}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}