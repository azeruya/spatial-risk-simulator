"use client";

import { useMemo, useEffect, useRef, useState } from "react";

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

type BasemapMode = | "streets" | "satellite";

export type SelectedSite = {
  longitude: number;
  latitude: number;
};

type SimulationMapProps = {
  selectedSite: SelectedSite | null;
  onSelectSite: (site: SelectedSite) => void;

  projectAreaHa: number;

  footprintMode: FootprintMode;

  // Only for displaying footprint information
  widthM: number;
  lengthM: number;
  bearing: number;

  // Final geometry calculated by page.tsx
  projectFootprint:
    GeoJSON.Feature<GeoJSON.Polygon> | null;

  // Needed because Terra Draw lives in SimulationMap
  setDrawnFootprint: (
    footprint: GeoJSON.Feature<GeoJSON.Polygon> | null
  ) => void;

  isDrawing: boolean;
  setIsDrawing: (value: boolean) => void;

  imperviousPercent: number;
  greenPercent: number;

  permeableSurfacePercent: number;
  greenInfrastructurePercent: number;

retentionLevel:
  | "none"
  | "low"
  | "moderate"
  | "high";

  simulationView: SimulationView;
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

  projectFootprint,
  setDrawnFootprint,

  isDrawing,
  setIsDrawing,

  imperviousPercent,
  greenPercent,

  permeableSurfacePercent,
  greenInfrastructurePercent,
  retentionLevel,

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

  const [ basemapMode, setBasemapMode ] = useState<BasemapMode>("satellite");

  const STREET_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

  const ARCGIS_API_KEY =
  process.env.NEXT_PUBLIC_ARCGIS_API_KEY;

  const SATELLITE_STYLE = {
    version: 8 as const,

    sources: {
      satellite: {
        type: "raster" as const,

        tiles: [
          "https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=YOUR_ARCGIS_TOKEN",
        ],

        tileSize: 256,

        attribution:
          "Esri, Maxar, Earthstar Geographics, and the GIS User Community",
      },
    },

    layers: [
      {
        id: "satellite",
        type: "raster" as const,
        source: "satellite",
      },
    ],
  };

  const mapRef = useRef<MapRef | null>(null);

  const hasMitigation =
    permeableSurfacePercent > 0 ||
    greenInfrastructurePercent > 0 ||
    retentionLevel !== "none";

  const drawRef =
    useRef<TerraDraw | null>(null);

  const footprintVisual = useMemo(() => {
    switch (simulationView) {
      case "current":
        return {
          fillColor: "#64748b",
          fillOpacity: 0.04,
          lineColor: "#ffffff",
          lineWidth: 2,
          lineDasharray: [2, 2] as number[],
        };

      case "mitigated":
        return {
          fillColor: "#10b981",
          fillOpacity: 0.22,
          lineColor: "#059669",
          lineWidth: 3,
          lineDasharray: undefined,
        };

      case "proposed":
      default:
        return {
          fillColor: "#2563eb",
          fillOpacity: 0.22,
          lineColor: "#2563eb",
          lineWidth: 3,
          lineDasharray: undefined,
        };
    }
  }, [simulationView]);

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
        mapStyle={
          basemapMode === "satellite"
            ? SATELLITE_STYLE
            : STREET_STYLE
        }
        cursor="crosshair"
        onClick={handleMapClick}
      >
        <div className="absolute right-4 top-4 z-20 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
          <div className="flex gap-1">
            {(
              [
                ["streets", "Map"],
                ["satellite", "Satellite"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() =>
                  setBasemapMode(mode)
                }
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  basemapMode === mode
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
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
                "fill-color":
                  footprintVisual.fillColor,

                "fill-opacity":
                  footprintVisual.fillOpacity,
              }}
            />

            <Layer
              id="project-footprint-outline"
              type="line"
              paint={{
                "line-color":
                  footprintVisual.lineColor,

                "line-width":
                  footprintVisual.lineWidth,

                ...(footprintVisual.lineDasharray
                  ? {
                      "line-dasharray":
                        footprintVisual.lineDasharray,
                    }
                  : {}),
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
        </div>
      )}

      {selectedSite && (
        <div className="absolute bottom-5 left-5 z-10 w-48 rounded-xl border border-white/40 bg-white/95 p-3 shadow-sm backdrop-blur">
          {simulationView === "current" && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Current site
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-800">
                Existing condition
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                Satellite imagery shows the existing physical site before the proposed development.
              </p>
            </>
          )}

          {simulationView === "proposed" && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                Proposed development
              </p>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <MapMetric
                  label="Impervious"
                  value={`${imperviousPercent}%`}
                />

                <MapMetric
                  label="Green"
                  value={`${greenPercent}%`}
                />
              </div>
            </>
          )}

          {simulationView === "mitigated" && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                Mitigated design
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-800">
                Improved site response
              </p>

              {!hasMitigation ? (
                <p className="mt-2 text-[10px] leading-4 text-slate-500">
                  No mitigation measures have been applied yet.
                </p>
              ) : (
                <div className="mt-2 space-y-1 text-[10px] text-slate-500">
                  {permeableSurfacePercent > 0 && (
                    <p>
                      Permeable surface:{" "}
                      <span className="font-semibold text-slate-700">
                        {permeableSurfacePercent}%
                      </span>
                    </p>
                  )}

                  {greenInfrastructurePercent > 0 && (
                    <p>
                      Green infrastructure:{" "}
                      <span className="font-semibold text-slate-700">
                        {greenInfrastructurePercent}%
                      </span>
                    </p>
                  )}

                  {retentionLevel !== "none" && (
                    <p>
                      Retention:{" "}
                      <span className="font-semibold capitalize text-slate-700">
                        {retentionLevel}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
      
    </div>
  );
}

function MapMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[9px] text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 text-xs font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}