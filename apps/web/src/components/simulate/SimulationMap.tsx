"use client";

import { useMemo, useEffect, useRef, useState } from "react";

import Map, { Layer, Marker, Source, MapRef} from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { SimulationView, FootprintMode, DrawShape, HazardKey, HazardOverlay, MapView } from "@/types/simulation";
import MapTopBar from "./MapTopBar";
import MapLegend from "./map/MapLegend";
import { STREET_STYLE, createSatelliteStyle } from "./map/mapStyles";
import { TerraDraw, TerraDrawPolygonMode, TerraDrawRectangleMode } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import bbox from "@turf/bbox";
import difference from "@turf/difference";
import bboxPolygon from "@turf/bbox-polygon";
import { featureCollection } from "@turf/helpers";
import intersect from "@turf/intersect";

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
  hazardPresent: Record<HazardKey, boolean>;

  hazardOverlay: HazardOverlay;
  setHazardOverlay: (
    value: HazardOverlay
  ) => void;
  layoutVersion: string;
};

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
  hazardPresent,

  hazardOverlay,
  setHazardOverlay,
  layoutVersion
}: SimulationMapProps) {
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
          fillOpacity: 0.06,
          lineColor: "#64748b",
          lineWidth: 2,
          lineDasharray: [3, 2] as number[],
        };

      case "mitigated":
        return {
          fillColor: "#10b981",
          fillOpacity: 0.12,
          lineColor: "#059669",
          lineWidth: 3,
          lineDasharray: undefined,
        };

      case "proposed":
        return {
          fillColor: "#2563eb",
          fillOpacity: 0.12,
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

  const selectedHazardPresent =
    hazardOverlay
      ? hazardPresent[hazardOverlay]
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

  const mapSourceLabel =
  hazardOverlay === "flood"
    ? "BNPB InaRISK · Flood hazard"
    : hazardOverlay === "tsunami"
      ? "BNPB InaRISK · Tsunami hazard"
      : hazardOverlay === "landslide"
        ? "BNPB InaRISK · Landslide hazard"
        : mapView === "terrain"
          ? "Copernicus DEM GLO-30"
          : mapView === "satellite"
            ? "Esri World Imagery"
            : "CARTO · OpenStreetMap";

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
    const map =
      mapRef.current?.getMap();

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
        exaggeration: 1.25,
      });

      map.easeTo({
        pitch: 55,
        duration: 500,
      });
    };

    const disableTerrain = () => {
      map.setTerrain(null);

      map.easeTo({
        pitch: 0,
        duration: 400,
      });
    };

    const applyTerrainState = () => {
      if (mapView === "terrain") {
        enableTerrain();
      } else {
        disableTerrain();
      }
    };

    if (map.isStyleLoaded()) {
      applyTerrainState();
    } else {
      map.once(
        "style.load",
        applyTerrainState
      );
    }

    return () => {
      map.off(
        "style.load",
        applyTerrainState
      );
    };
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

  const ARCGIS_API_KEY = process.env.NEXT_PUBLIC_ARCGIS_API_KEY;

  const SATELLITE_STYLE =
    useMemo(
      () =>
        createSatelliteStyle(
          ARCGIS_API_KEY ?? ""
        ),
      []
    );

  useEffect(() => {
    if (!ARCGIS_API_KEY) {
      console.warn(
        "NEXT_PUBLIC_ARCGIS_API_KEY is not configured."
      );
    }
  }, []);

  return (
    <div className="relative h-full min-h-[560px] overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
      <MapTopBar
        mapView={mapView}
        onMapViewChange={setMapView}
        hazardOverlay={hazardOverlay}
        onHazardOverlayChange={setHazardOverlay}
      />

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
          selectedHazardPresent && (
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
          selectedHazardPresent && (
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
                "fill-color": footprintVisual.fillColor,
                "fill-opacity": footprintVisual.fillOpacity,
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

      {hazardOverlay && (
        <div className="pointer-events-none absolute right-4 top-16 z-20">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  selectedHazardPresent
                    ? HAZARD_STYLE[hazardOverlay].tint
                    : "#94a3b8",
              }}
            />

            <span className="text-[10px] font-medium text-slate-600">
              {!selectedHazardHasData
                ? `${HAZARD_STYLE[hazardOverlay].label}: no mapped data`
                : selectedHazardPresent
                ? `${HAZARD_STYLE[hazardOverlay].label} hazard mapped`
                : `${HAZARD_STYLE[hazardOverlay].label}: no hazard value`}
            </span>
          </div>
        </div>
      )}
      {projectFootprint && (
        <MapLegend
          simulationView={
            simulationView
          }
          imperviousPercent={
            imperviousPercent
          }
          greenPercent={
            greenPercent
          }
          permeableSurfacePercent={
            permeableSurfacePercent
          }
          greenInfrastructurePercent={
            greenInfrastructurePercent
          }
          hasMitigation={
            hasMitigation
          }
        />
      )}

      <div className="pointer-events-none absolute bottom-4 right-4 z-20">
        <div className="rounded-lg bg-white/90 px-2.5 py-1.5 text-[9px] text-slate-500 shadow-sm backdrop-blur">
          {mapSourceLabel}
        </div>
      </div>
    </div>
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