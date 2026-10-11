"use client";

import { useMemo, useEffect, useRef, useState } from "react";

import Map, { Layer, Marker, Source, MapRef} from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { SimulationView } from "@/app/simulate/page";
import { FootprintMode } from "@/types/simulation";
import { createRectangleFootprint } from "@/lib/geometry";

import { TerraDraw, TerraDrawPolygonMode } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import bbox from "@turf/bbox";
import difference from "@turf/difference";
import bboxPolygon from "@turf/bbox-polygon";
import { featureCollection } from "@turf/helpers";

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

  analysisCircle:
    | GeoJSON.Feature<GeoJSON.Polygon>
    | null;

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
  scenarioRunoffPressure: number;
  mitigatedRunoffPressure: number;
  mitigationReductionPercent: number;
};

type HazardOverlay =
  | "flood"
  | "tsunami"
  | "landslide"
  | null;

const HAZARD_STYLE = {
  flood: {
    opacity: 0.22,
    tintOpacity: 0.08,
    tint: "#f59e0b",
    label: "Flood",
  },

  tsunami: {
    opacity: 0.18,
    tintOpacity: 0.10,
    tint: "#06b6d4",
    label: "Tsunami",
  },

  landslide: {
    opacity: 0.22,
    tintOpacity: 0.08,
    tint: "#f97316",
    label: "Landslide",
  },
} as const;

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
  analysisCircle,
  scenarioRunoffPressure,
  mitigatedRunoffPressure,
  mitigationReductionPercent,
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

  const [
    hazardOverlay,
    setHazardOverlay,
  ] =
    useState<HazardOverlay>(null);

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

  const hazardOverlayBounds =
    useMemo(() => {
      if (!analysisCircle) {
        return null;
      }

      const [
        west,
        south,
        east,
        north,
      ] = bbox(analysisCircle);

      return {
        west,
        south,
        east,
        north,
      };
    }, [analysisCircle]);

  const hazardOverlayUrl =
    useMemo(() => {
      if (
        !hazardOverlay ||
        !hazardOverlayBounds
      ) {
        return null;
      }

      const {
        west,
        south,
        east,
        north,
      } = hazardOverlayBounds;

      const bboxValue =
        [
          west,
          south,
          east,
          north,
        ].join(",");

      return (
        `/api/bnpb/hazard-overlay` +
        `?hazard=${hazardOverlay}` +
        `&bbox=${encodeURIComponent(
          bboxValue
        )}`
      );
    }, [
      hazardOverlay,
      hazardOverlayBounds,
    ]);

  const analysisMask = useMemo(() => {
    if (!analysisCircle) return null;

    const [
      minLon,
      minLat,
      maxLon,
      maxLat,
    ] = bbox(analysisCircle);

    const lonPadding =
      (maxLon - minLon) * 3;

    const latPadding =
      (maxLat - minLat) * 3;

    const outer = bboxPolygon([
      minLon - lonPadding,
      minLat - latPadding,
      maxLon + lonPadding,
      maxLat + latPadding,
    ]);

    try {
      return difference(
        featureCollection([
          outer,
          analysisCircle,
        ])
      );
    } catch {
      return null;
    }
  }, [analysisCircle]);

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

        <div className="absolute right-4 top-16 z-20 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
          <div className="flex gap-1">
            {(
              [
                ["none", "None"],
                ["flood", "Flood"],
                ["tsunami", "Tsunami"],
                [
                  "landslide",
                  "Landslide",
                ],
              ] as const
            ).map(([key, label]) => {
              const value =
                key === "none"
                  ? null
                  : key;

              const active =
                hazardOverlay === value;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setHazardOverlay(value)
                  }
                  className={`rounded-lg px-2.5 py-2 text-[10px] font-medium transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        {hazardOverlay && (
          <div className="absolute bottom-5 right-4 z-20 rounded-xl border border-white/40 bg-white/95 p-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    HAZARD_STYLE[
                      hazardOverlay
                    ].tint,
                }}
              />

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Hazard overlay
                </p>

                <p className="text-xs font-semibold text-slate-800">
                  {
                    HAZARD_STYLE[
                      hazardOverlay
                    ].label
                  }
                </p>
              </div>
            </div>

            <p className="mt-2 text-[9px] leading-4 text-slate-500">
              Mapped BNPB InaRISK hazard
              within the selected context area.
            </p>
          </div>
        )}

        {/* Hazard raster */}
        {hazardOverlayUrl &&
        hazardOverlayBounds && (
          <Source
            id="hazard-overlay"
            type="image"
            url={hazardOverlayUrl}
            coordinates={[
              [
                hazardOverlayBounds.west,
                hazardOverlayBounds.north,
              ],
              [
                hazardOverlayBounds.east,
                hazardOverlayBounds.north,
              ],
              [
                hazardOverlayBounds.east,
                hazardOverlayBounds.south,
              ],
              [
                hazardOverlayBounds.west,
                hazardOverlayBounds.south,
              ],
            ]}
          >
            <Layer
              id="hazard-overlay-layer"
              type="raster"
              paint={{
                "raster-opacity":
                  hazardOverlay
                    ? HAZARD_STYLE[
                        hazardOverlay
                      ].opacity
                    : 0,
                "raster-fade-duration": 200,
              }}
            />
          </Source>
        )}

        {/* Hazard color tint */}
        {analysisCircle &&
        hazardOverlay && (
          <Source
            id="hazard-tint"
            type="geojson"
            data={analysisCircle}
          >
            <Layer
              id="hazard-tint-fill"
              type="fill"
              paint={{
                "fill-color":
                  HAZARD_STYLE[
                    hazardOverlay
                  ].tint,
                "fill-opacity": 0.08,
              }}
            />
          </Source>
        )}

        {/* Outside mask */}
        {analysisMask && (
          <Source
            id="analysis-mask"
            type="geojson"
            data={analysisMask}
          >
            <Layer
              id="analysis-mask-fill"
              type="fill"
              paint={{
                "fill-color":
                  basemapMode === "satellite"
                    ? "#0f172a"
                    : "#f8fafc",

                "fill-opacity":
                  basemapMode === "satellite"
                    ? 0.15
                    : 0.5,
              }}
            />
          </Source>
        )}

        {/* Context circle */}
        {analysisCircle && (
          <Source
            id="analysis-context"
            type="geojson"
            data={analysisCircle}
          >
            <Layer
              id="analysis-context-fill"
              type="fill"
              paint={{
                "fill-color": "#2563eb",
                "fill-opacity": 0.02,
              }}
            />

            <Layer
              id="analysis-context-outline"
              type="line"
              paint={{
                "line-color": "#2563eb",
                "line-width": 2.5,
                "line-opacity": 0.9,
                "line-dasharray": [
                  2.5,
                  1.5,
                ],
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

              <div className="mt-3 rounded-lg bg-emerald-50 p-2.5">
                <p className="text-[9px] font-medium uppercase tracking-wide text-emerald-700">
                  Comparative runoff tendency
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    {scenarioRunoffPressure.toFixed(3)}
                  </span>

                  <span className="text-xs text-slate-300">
                    →
                  </span>

                  <span className="text-sm font-semibold text-emerald-700">
                    {mitigatedRunoffPressure.toFixed(3)}
                  </span>
                </div>

                <p className="mt-1 text-[10px] font-semibold text-emerald-700">
                  ↓ {mitigationReductionPercent.toFixed(1)}%
                </p>
              </div>

              <div className="mt-3">
                <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                  {[
                    permeableSurfacePercent > 0,
                    greenInfrastructurePercent > 0,
                    retentionLevel !== "none",
                  ].filter(Boolean).length}{" "}
                  intervention
                  {[
                    permeableSurfacePercent > 0,
                    greenInfrastructurePercent > 0,
                    retentionLevel !== "none",
                  ].filter(Boolean).length === 1
                    ? ""
                    : "s"}{" "}
                  applied
                </p>

                <div className="mt-1 space-y-0.5 text-[10px] leading-4 text-slate-500">
                  {permeableSurfacePercent > 0 && (
                    <p>
                      Permeable replacement ·{" "}
                      {permeableSurfacePercent}%
                    </p>
                  )}

                  {greenInfrastructurePercent > 0 && (
                    <p>
                      Green infrastructure ·{" "}
                      {greenInfrastructurePercent}%
                    </p>
                  )}

                  {retentionLevel !== "none" && (
                    <p className="capitalize">
                      Retention · {retentionLevel}
                    </p>
                  )}
                </div>
              </div>
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