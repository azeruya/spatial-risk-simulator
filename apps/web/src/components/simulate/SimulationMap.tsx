"use client";

import { useMemo, useEffect, useRef } from "react";

import Map, { Layer, Marker, Source, MapRef} from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import { circle } from "@turf/circle";
import "maplibre-gl/dist/maplibre-gl.css";

import { SimulationView } from "@/app/simulate/page";
import { FootprintMode } from "@/types/simulation";
import { createRectangleFootprint } from "@/lib/geometry";

import { TerraDraw, TerraDrawPolygonMode } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export type SelectedSite = {
  longitude: number;
  latitude: number;
};

type SimulationMapProps = {
  selectedSite: SelectedSite | null;
  onSelectSite: (site: SelectedSite) => void;

  projectAreaHa: number;

  footprintMode: FootprintMode;
  widthM: number;
  lengthM: number;
  bearing: number;

  imperviousPercent: number;
  greenPercent: number;

  simulationView: SimulationView;
  drawnFootprint:
    GeoJSON.Feature<GeoJSON.Polygon> | null;

  setDrawnFootprint: (
    footprint:
      GeoJSON.Feature<GeoJSON.Polygon> | null
  ) => void;

  isDrawing: boolean;
  setIsDrawing: (value: boolean) => void;
};

function formatArea(projectAreaHa: number) {
  const areaM2 = projectAreaHa * 10_000;

  if (areaM2 < 10_000) {
    return `${Math.round(areaM2).toLocaleString()} m²`;
  }

  return `${projectAreaHa.toFixed(2)} ha`;
}

export default function SimulationMap({
  selectedSite,
  onSelectSite,
  projectAreaHa,

  footprintMode,
  widthM,
  lengthM,
  bearing,

  drawnFootprint,
  setDrawnFootprint,

  isDrawing,
  setIsDrawing,

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

  const analysisRadiusMeters = 500;

  const analysisArea = useMemo(() => {
  if (!selectedSite) return null;

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

  const projectFootprint = useMemo(() => {
    if (footprintMode === "draw") {
      return drawnFootprint;
    }

    if (!selectedSite) {
      return null;
    }

    if (footprintMode === "dimensions") {
      return createRectangleFootprint(
        selectedSite.longitude,
        selectedSite.latitude,
        widthM,
        lengthM,
        bearing
      );
    }

    const radiusMeters = Math.sqrt(
      (projectAreaHa * 10_000) / Math.PI
    );

    return circle(
      [
        selectedSite.longitude,
        selectedSite.latitude,
      ],
      radiusMeters / 1000,
      {
        steps: 64,
        units: "kilometers",
      }
    );
  }, [
    footprintMode,
    drawnFootprint,
    selectedSite,
    widthM,
    lengthM,
    bearing,
    projectAreaHa,
  ]);
    console.log("DRAW STATE:", isDrawing);;

  const mapRef = useRef<MapRef | null>(null);

  const drawRef =
    useRef<TerraDraw | null>(null);

  function handleMapClick(event: {
    lngLat: {
      lng: number;
      lat: number;
    };
  }) {
    if (footprintMode === "draw") {
      return;
    }

    onSelectSite({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
    });
  }

  useEffect(() => {
    if (!isDrawing) return;

    const map = mapRef.current?.getMap();

    if (!map) return;

    // Prevent duplicate draw instances
    if (drawRef.current) {
      drawRef.current.stop();
      drawRef.current = null;
    }

    const draw = new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({
        map,
      }),

      modes: [
        new TerraDrawPolygonMode(),
      ],
    });

    draw.start();
    draw.setMode("polygon");

    drawRef.current = draw;

    const handleFinish = () => {
      const features = draw.getSnapshot();

      const polygon =
        features.find(
          (feature) =>
            feature.geometry.type === "Polygon"
        );

      if (!polygon) return;

      setDrawnFootprint(
        polygon as GeoJSON.Feature<GeoJSON.Polygon>
      );

      setIsDrawing(false);

      draw.setMode("static");
    };

    draw.on("finish", handleFinish);

    return () => {
      draw.stop();

      if (drawRef.current === draw) {
        drawRef.current = null;
      }
    };
  }, [
    isDrawing,
    setDrawnFootprint,
    setIsDrawing,
  ]);

  return (
    <div className="relative h-full w-full">
      <Map
        ref = { mapRef}
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
        {selectedSite && footprintMode !== "draw" && (
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
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {formatArea(projectAreaHa)}
            </p>
          </div>

          <p className="mt-1 text-[11px] text-slate-400">
              {footprintMode === "draw"
                ? `${projectAreaHa.toFixed(2)} ha · drawn boundary`
                : footprintMode === "dimensions"
                  ? `${widthM} m × ${lengthM} m`
                  : `≈ ${Math.round(footprintRadiusMeters)} m equivalent radius`}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {footprintMode === "dimensions"
              ? `${widthM} m × ${lengthM} m`
              : `≈ ${Math.round(footprintRadiusMeters)} m equivalent radius`}
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