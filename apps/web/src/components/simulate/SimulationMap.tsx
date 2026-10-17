"use client";

import { useMemo, useEffect, useRef, useState } from "react";

import Map, { Layer, Marker, Source, MapRef} from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { SimulationView, FootprintMode, DrawShape } from "@/types/simulation";
import { createRectangleFootprint } from "@/lib/geometry";

import { TerraDraw, TerraDrawPolygonMode, TerraDrawRectangleMode } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import bbox from "@turf/bbox";
import difference from "@turf/difference";
import bboxPolygon from "@turf/bbox-polygon";
import { featureCollection } from "@turf/helpers";
import intersect from "@turf/intersect";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

type MapView =
  | "map"
  | "satellite"
  | "terrain";

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
  hasDefinedSite: boolean;

  drawShape: DrawShape;

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
  setSimulationView: (value: SimulationView) => void;

  scenarioRunoffPressure: number;
  mitigatedRunoffPressure: number;
  mitigationReductionPercent: number;
  baselineRunoffPressure: number;
  hazardMapped: Record<HazardKey, boolean>;

  hazardOverlay: HazardOverlay;
  setHazardOverlay: (
    value: HazardOverlay
  ) => void;
  layoutVersion: string;
};

type HazardKey =
  | "flood"
  | "tsunami"
  | "landslide";

type HazardOverlay = HazardKey | null;

type HazardMapped = Record<HazardKey, boolean>;

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
  drawShape,
  hasDefinedSite,

  imperviousPercent,
  greenPercent,

  permeableSurfacePercent,
  greenInfrastructurePercent,
  retentionLevel,

  simulationView,
  setSimulationView,

  analysisCircle,

  scenarioRunoffPressure,
  mitigatedRunoffPressure,
  mitigationReductionPercent,
  baselineRunoffPressure,

  hazardMapped,

  hazardOverlay,
  setHazardOverlay,
  layoutVersion
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

  const hasMitigation =
    permeableSurfacePercent > 0 ||
    greenInfrastructurePercent > 0 ||
    retentionLevel !== "none";


  const [mapView, setMapView] =
    useState<MapView>("satellite");

  const mapRef = useRef<MapRef | null>(null);

  const drawRef =
    useRef<TerraDraw | null>(null);

  const footprintVisual = useMemo(() => {
    switch (simulationView) {
      case "current":
        return {
          fillColor: "#64748b",
          fillOpacity: 0.025,
          lineColor: "#ffffff",
          lineWidth: 2,
          lineDasharray: [2, 2] as number[],
        };

      case "mitigated":
        return {
          fillColor: "#10b981",
          fillOpacity: 0.08,
          lineColor: "#059669",
          lineWidth: 3,
          lineDasharray: undefined,
        };

      case "proposed":
      default:
        return {
          fillColor: "#2563eb",
          fillOpacity: 0.08,
          lineColor: "#2563eb",
          lineWidth: 3,
          lineDasharray: undefined,
        };
    }
  }, [simulationView]);

  const selectedHazardHasData =
    hazardOverlay
      ? hazardMapped[hazardOverlay]
      : false;

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

  const hazardOverlayUrl = useMemo(() => {
    if (
      !hazardOverlay ||
      !hazardOverlayBounds ||
      !hazardMapped[hazardOverlay]
    ) {
      return null;
    }

    const {
      west,
      south,
      east,
      north,
    } = hazardOverlayBounds;

    const bboxValue = [
      west,
      south,
      east,
      north,
    ].join(",");

    return (
      `/api/bnpb/hazard-overlay` +
      `?hazard=${hazardOverlay}` +
      `&bbox=${encodeURIComponent(bboxValue)}`
    );
  }, [
    hazardOverlay,
    hazardOverlayBounds,
    hazardMapped,
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


  const surfaceAllocation =
    useMemo(() => {
      if (
        !projectFootprint ||
        simulationView === "current"
      ) {
        return null;
      }

      const footprint = projectFootprint;

      const [
        west,
        south,
        east,
        north,
      ] = bbox(projectFootprint);

      const width = east - west;

      const imperviousShare = Math.min(
        Math.max(imperviousPercent / 100, 0),
        1
      );

      const remainingAfterImpervious =
        1 - imperviousShare;

      const greenShare = Math.min(
        Math.max(greenPercent / 100, 0),
        remainingAfterImpervious
      );

      const imperviousEnd =
        west + width * imperviousShare;

      const greenEnd =
        imperviousEnd +
        width * greenShare;

      function clip(
        polygon: GeoJSON.Feature<GeoJSON.Polygon>
      ) {
        try {
          return intersect(
            featureCollection([
              footprint,
              polygon,
            ])
          );
        } catch {
          return null;
        }
      }

      const impervious =
        imperviousShare > 0
          ? clip(
              bboxPolygon([
                west,
                south,
                imperviousEnd,
                north,
              ])
            )
          : null;

      const green =
        greenShare > 0
          ? clip(
              bboxPolygon([
                imperviousEnd,
                south,
                greenEnd,
                north,
              ])
            )
          : null;

      const other =
        greenEnd < east
          ? clip(
              bboxPolygon([
                greenEnd,
                south,
                east,
                north,
              ])
            )
          : null;

      return {
        impervious,
        green,
        other,
      };
    }, [
      projectFootprint,
      simulationView,
      imperviousPercent,
      greenPercent,
    ]);

  const mitigationPatterns =
    useMemo(() => {
      if (
        !projectFootprint ||
        simulationView !== "mitigated"
      ) {
        return null;
      }

      return {
        permeable:
          permeableSurfacePercent > 0
            ? createTreatmentBands(
                projectFootprint,
                "vertical"
              )
            : null,

        greenInfrastructure:
          greenInfrastructurePercent > 0
            ? createTreatmentBands(
                projectFootprint,
                "horizontal"
              )
            : null,
      };
    }, [
      projectFootprint,
      simulationView,
      permeableSurfacePercent,
      greenInfrastructurePercent,
    ]);

  
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

    if (drawRef.current) {
      drawRef.current.stop();
      drawRef.current = null;
    }

    const draw = new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({
        map,
      }),

      modes: [
        new TerraDrawPolygonMode({
          pointerDistance: 20,
        }),

        new TerraDrawRectangleMode(),
      ],
    });

    draw.start();

    draw.setMode(
      drawShape === "rectangle"
        ? "rectangle"
        : "polygon"
    );

    drawRef.current = draw;

    const handleFinish = () => {
      const features =
        draw.getSnapshot();

      const polygon =
        features.find(
          (feature) =>
            feature.geometry.type ===
            "Polygon"
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

      if (
        drawRef.current === draw
      ) {
        drawRef.current = null;
      }
    };
  }, [
    isDrawing,
    drawShape,
    setDrawnFootprint,
    setIsDrawing,
  ]);

  useEffect(() => {
    const map = mapRef.current?.getMap();

    if (!map) return;

    const enableTerrain = () => {
      if (!map.getSource("terrain-dem")) {
        map.addSource("terrain-dem", {
          type: "raster-dem",
          url: "https://tiles.mapterhorn.com/tilejson.json",
          tileSize: 256,
        });
      }

      map.setTerrain({
        source: "terrain-dem",
        exaggeration: 1.5,
      });

      map.easeTo({
        pitch: 60,
        bearing: -18,
        duration: 700,
      });
    };

    const disableTerrain = () => {
      map.setTerrain(null);

      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 600,
      });
    };

    if (!map.isStyleLoaded()) {
      map.once("load", () => {
        if (mapView === "terrain") {
          enableTerrain();
        }
      });

      return;
    }

    if (mapView === "terrain") {
      enableTerrain();
    } else {
      disableTerrain();
    }
  }, [mapView]);

  useEffect(() => {
    const timeout =
      window.setTimeout(() => {
        mapRef.current?.resize();
      }, 320);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [layoutVersion]);

  const STREET_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
  const ARCGIS_API_KEY = process.env.NEXT_PUBLIC_ARCGIS_API_KEY;

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


  return (
    <div className="relative h-full min-h-0 min-w-0 w-full">
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
          mapView === "satellite"
            ? SATELLITE_STYLE
            : STREET_STYLE
        }
        cursor="crosshair"
        onClick={handleMapClick}
      >
        <div
          className="
            absolute right-4 top-4 z-30
            w-[292px]
            overflow-hidden rounded-2xl
            border border-slate-200/80
            bg-white/95 shadow-lg backdrop-blur-md
          "
        >
          <div className="border-b border-slate-100 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                View
              </p>

              <div className="flex rounded-xl bg-slate-100 p-1">
                {(["map", "satellite", "terrain"] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setMapView(view)}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-medium transition ${
                      mapView === view
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    {view === "terrain"
                      ? "3D"
                      : view[0].toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Scenario
            </p>

            {/* Current / Proposed / Mitigated */}
            <div className="mt-2 grid grid-cols-3 rounded-xl bg-slate-100 p-1">
              {(
                [
                  "current",
                  "proposed",
                  "mitigated",
                ] as const
              ).map((view) => {
                const disabled =
                  view === "mitigated" &&
                  !hasMitigation;

                return (
                  <button
                    key={view}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (!disabled) {
                        setSimulationView(view);
                      }
                    }}
                    className={`
                      rounded-lg px-2 py-1.5
                      text-[10px] font-medium capitalize
                      transition-all duration-200
                      ${
                        simulationView === view
                          ? "bg-white text-slate-900 shadow-sm"
                          : disabled
                            ? "cursor-not-allowed text-slate-300"
                            : "text-slate-500 hover:text-slate-800"
                      }
                    `}
                  >
                    {view}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Hazard overlay
            </p>

            <div className="mt-2 grid grid-cols-4 rounded-xl bg-slate-100 p-1">
              {(
                [
                  null,
                  "flood",
                  "tsunami",
                  "landslide",
                ] as const
              ).map((value) => {
                const active =
                  hazardOverlay === value;

                const hasMappedData =
                  value === null
                    ? true
                    : hazardMapped[value];

                return (
                  <button
                    key={value ?? "none"}
                    type="button"
                    onClick={() =>
                      setHazardOverlay(value)
                    }
                    className={`
                      flex-1 rounded-xl
                      px-2 py-2
                      text-[10px] font-medium
                      transition-all duration-200

                      ${
                        active
                          ? "bg-slate-900 text-white shadow-sm"
                          : hasMappedData
                            ? "text-slate-500 hover:bg-white hover:text-slate-800"
                            : "text-slate-300 hover:bg-white"
                      }
                    `}
                  >
                    {value === null
                      ? "None"
                      : HAZARD_STYLE[value].label}
                  </button>
                );
              })}
          </div>
          </div>
        </div>

        {hazardOverlay && (
          <div
            className="
              absolute bottom-5 right-5 z-20
              min-w-[190px]
              rounded-2xl
              border border-slate-200/80
              bg-white/95
              px-3.5 py-3
              shadow-lg
              backdrop-blur-md
            "
          >
            <div className="flex items-start gap-2.5">
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    selectedHazardHasData
                      ? HAZARD_STYLE[
                          hazardOverlay
                        ].tint
                      : "#94a3b8",
                }}
              />

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  Context layer
                </p>

                <p className="mt-0.5 text-xs font-semibold text-slate-800">
                  {
                    HAZARD_STYLE[hazardOverlay]
                      .label
                  }
                </p>

                {selectedHazardHasData ? (
                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    Mapped BNPB InaRISK hazard
                    within the selected context.
                  </p>
                ) : (
                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    No mapped values returned
                    within this analysis area.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <Source
          id="hillshade-dem"
          type="raster-dem"
          url="https://tiles.mapterhorn.com/tilejson.json"
          tileSize={256}
        >
          <Layer
            id="terrain-hillshade"
            type="hillshade"
            layout={{
              visibility:
                mapView === "terrain"
                  ? "visible"
                  : "none",
            }}
            paint={{
              "hillshade-exaggeration": 0.25,
            }}
          />
        </Source>

        {/* Hazard raster */}
        {hazardOverlayUrl &&
          hazardOverlayBounds &&
          selectedHazardHasData && (
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
          hazardOverlay &&
          selectedHazardHasData && (
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
        {analysisMask &&
          hazardOverlay &&
          selectedHazardHasData && (
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
                  mapView === "satellite"
                    ? "#0f172a"
                    : "#f8fafc",

                "fill-opacity":
                  mapView === "satellite"
                    ? 0.12
                    : mapView === "terrain"
                      ? 0.10
                      : 0.20,
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
                "fill-opacity": mapView === "satellite" ? 0.06 : 0.035,
              }}
            />

            <Layer
              id="analysis-context-outline"
              type="line"
              paint={{
                "line-color": "#2563eb",
                "line-width": mapView === "satellite" ? 2.5 : 2,
                "line-opacity": 0.9,
                "line-dasharray": [3, 2],
              }}
            />
          </Source>
        )}

        {/* Proposed development fill */}
        {projectFootprint && (
          <Source
            id="project-footprint-base"
            type="geojson"
            data={projectFootprint}
          >
            <Layer
            id="project-footprint-fill"
            type="fill"
            paint={{
              "fill-color":
                simulationView === "mitigated"
                  ? "#10b981"
                  : "#2563eb",
              "fill-opacity": 0.18,
            }}
          />

          <Layer
            id="project-footprint-outline"
            type="line"
            paint={{
              "line-color":
                simulationView === "mitigated"
                  ? "#059669"
                  : "#2563eb",
              "line-width": 3,
            }}
          />
          </Source>
        )}

        {surfaceAllocation?.impervious && (
  <Source
    id="surface-impervious"
    type="geojson"
    data={surfaceAllocation.impervious}
  >
    <Layer
      id="surface-impervious-fill"
      type="fill"
      paint={{
        "fill-color": "#334155",
        "fill-opacity":
          simulationView === "proposed"
            ? 0.42
            : 0.30,
      }}
    />
  </Source>
        )}

        {surfaceAllocation?.green && (
          <Source
            id="surface-green"
            type="geojson"
            data={surfaceAllocation.green}
          >
            <Layer
              id="surface-green-fill"
              type="fill"
              paint={{
                "fill-color": "#22c55e",
                "fill-opacity":
                  simulationView === "proposed"
                    ? 0.42
                    : 0.30,
              }}
            />
          </Source>
        )}

        {surfaceAllocation?.other && (
          <Source
            id="surface-other"
            type="geojson"
            data={surfaceAllocation.other}
          >
            <Layer
              id="surface-other-fill"
              type="fill"
              paint={{
                "fill-color": "#cbd5e1",
                "fill-opacity": 0.30,
              }}
            />
          </Source>
        )}

        {mitigationPatterns?.permeable && (
          <Source
            id="mitigation-permeable"
            type="geojson"
            data={mitigationPatterns.permeable}
          >
            <Layer
              id="mitigation-permeable-fill"
              type="fill"
              paint={{
                "fill-color": "#06b6d4",
                "fill-opacity": 0.45,
              }}
            />
          </Source>
        )}

        {mitigationPatterns?.greenInfrastructure && (
          <Source
            id="mitigation-green"
            type="geojson"
            data={
              mitigationPatterns.greenInfrastructure
            }
          >
            <Layer
              id="mitigation-green-fill"
              type="fill"
              paint={{
                "fill-color": "#10b981",
                "fill-opacity": 0.42,
              }}
            />
          </Source>
        )}

        {/* Proposed development outline */}
        {projectFootprint && (
          <Source
            id="project-footprint-outline-source"
            type="geojson"
            data={projectFootprint}
          >
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
      {!hasDefinedSite && (
        <div className="absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 px-4 py-2 text-sm text-slate-600 shadow-sm">
          {footprintMode === "draw"
            ? "Draw the project boundary on the map"
            : !selectedSite
              ? "Click the map to place the proposed development"
              : "Enter a project area to define the development footprint"}
        </div>
      )}

      {/* Site information */}
      <div
        className="
          absolute left-5 top-5 z-20
          rounded-2xl
          border border-slate-200/80
          bg-white/95
          px-3.5 py-3
          shadow-md
          backdrop-blur-md
        "
      >
        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
          Project footprint
        </p>

        <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
          {formatArea(projectAreaHa)}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-400">
          {footprintMode === "draw"
            ? "Drawn boundary"
            : footprintMode === "dimensions"
              ? `${widthM} × ${lengthM} m`
              : "Equivalent site area"}
        </p>
      </div>

      {(
        simulationView === "current"
          ? selectedSite !== null
          : hasDefinedSite
      ) && (
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

          {hasDefinedSite && simulationView == "proposed" && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                Proposed development
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-800">
                Surface composition changes
              </p>

              <div className="mt-2 grid grid-cols-3 gap-2">
                <MapMetric
                  label="Impervious"
                  value={`${imperviousPercent}%`}
                />

                <MapMetric
                  label="Green"
                  value={`${greenPercent}%`}
                />

                <MapMetric
                  label="Other"
                  value={`${Math.max(
                    0,
                    100 -
                      imperviousPercent -
                      greenPercent
                  )}%`}
                />
              </div>

              <div className="mt-3 rounded-lg bg-blue-50 p-2.5">
                <p className="text-[9px] font-medium uppercase tracking-wide text-blue-700">
                  Comparative runoff tendency
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-600">
                    {baselineRunoffPressure.toFixed(3)}
                  </span>

                  <span className="text-xs text-slate-300">
                    →
                  </span>

                  <span className="text-sm font-semibold text-blue-700">
                    {scenarioRunoffPressure.toFixed(3)}
                  </span>
                </div>

                {baselineRunoffPressure > 0 && (
                  <p className="mt-1 text-[10px] font-semibold text-blue-700">
                    {scenarioRunoffPressure >=
                    baselineRunoffPressure
                      ? "↑"
                      : "↓"}{" "}
                    {Math.abs(
                      ((scenarioRunoffPressure -
                        baselineRunoffPressure) /
                        baselineRunoffPressure) *
                        100
                    ).toFixed(1)}
                    %
                  </p>
                )}
              </div>
            </>
          )}

          {hasDefinedSite && simulationView === "mitigated" && (
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

function LegendDot({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-sm"
        style={{
          backgroundColor: color,
        }}
      />

      {label}
    </span>
  );
}

function createTreatmentBands(
  footprint:
    GeoJSON.Feature<GeoJSON.Polygon>,
  direction: "vertical" | "horizontal",
  count = 11
) {
  const [
    west,
    south,
    east,
    north,
  ] = bbox(footprint);

  const result: GeoJSON.Feature[] = [];

  if (direction === "vertical") {
    const width = east - west;
    const step = width / count;

    for (let i = 0; i < count; i += 2) {
      const stripWidth = step * 0.32;

      const strip = bboxPolygon([
        west + i * step,
        south,
        west + i * step + stripWidth,
        north,
      ]);

      try {
        const clipped = intersect(
          featureCollection([
            footprint,
            strip,
          ])
        );

        if (clipped) {
          result.push(clipped);
        }
      } catch {}
    }
  } else {
    const height = north - south;
    const step = height / count;

    for (let i = 0; i < count; i += 2) {
      const stripHeight = step * 0.32;

      const strip = bboxPolygon([
        west,
        south + i * step,
        east,
        south + i * step + stripHeight,
      ]);

      try {
        const clipped = intersect(
          featureCollection([
            footprint,
            strip,
          ])
        );

        if (clipped) {
          result.push(clipped);
        }
      } catch {}
    }
  }

  return featureCollection(result);
}