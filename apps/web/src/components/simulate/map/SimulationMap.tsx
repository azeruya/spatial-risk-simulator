"use client";

import { useEffect, useRef, useState } from "react";
import MapGL, { Marker, type MapRef } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type {
  Footprint,
  HazardMapped,
  HazardOverlay,
  MapView,
  RetentionLevel,
  SelectedSite,
} from "@/types/map";
import type {
  DrawShape,
  FootprintMode,
  SimulationView,
} from "@/types/simulation";

import MapTopBar from "./MapTopBar";
import {
  FootprintChip,
  HazardNote,
  MapHint,
  MapLegend,
  formatArea,
} from "./MapHud"
import AnalysisLayers from "./layers/AnalysisLayers";
import FootprintLayers from "./layers/FootprintLayers";
import { useTerraDraw } from "./hooks/useTerraDraw";
import { useTerrain } from "./hooks/useTerrain";
import { SATELLITE_STYLE, STREET_STYLE } from "./mapStyles";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export type { SelectedSite } from "@/types/map";

type SimulationMapProps = {
  selectedSite: SelectedSite | null;
  onSelectSite: (site: SelectedSite) => void;

  projectAreaHa: number;
  footprintMode: FootprintMode;
  widthM: number;
  lengthM: number;

  projectFootprint: Footprint | null;
  setDrawnFootprint: (footprint: Footprint | null) => void;
  analysisCircle: Footprint | null;

  isDrawing: boolean;
  setIsDrawing: (value: boolean) => void;
  hasDefinedSite: boolean;
  drawShape: DrawShape;

  imperviousPercent: number;
  greenPercent: number;
  permeableSurfacePercent: number;
  greenInfrastructurePercent: number;
  retentionLevel: RetentionLevel;

  simulationView: SimulationView;

  hazardMapped: HazardMapped;
  hazardPresent: HazardMapped;
  hazardOverlay: HazardOverlay;
  setHazardOverlay: (value: HazardOverlay) => void;

  /** @deprecated No longer used here. Safe to stop passing from page.tsx. */
  bearing?: number;
  /** @deprecated The map now relies on a ResizeObserver. */
  layoutVersion?: string;
  /** @deprecated */
  setSimulationView?: (value: SimulationView) => void;
  /** @deprecated Runoff numbers live in the results panel. */
  scenarioRunoffPressure?: number;
  /** @deprecated */
  mitigatedRunoffPressure?: number;
  /** @deprecated */
  mitigationReductionPercent?: number;
  /** @deprecated */
  baselineRunoffPressure?: number;
};

function getHintText(
  footprintMode: FootprintMode,
  selectedSite: SelectedSite | null
) {
  if (footprintMode === "draw") return "Draw the project boundary on the map";
  if (!selectedSite) return "Click the map to place the proposed development";
  return "Enter a project area to define the development footprint";
}

function getFootprintCaption(
  footprintMode: FootprintMode,
  widthM: number,
  lengthM: number
) {
  if (footprintMode === "draw") return "Drawn boundary";
  if (footprintMode === "dimensions") return `${widthM} × ${lengthM} m`;
  return "Equivalent site area";
}

export default function SimulationMap({
  selectedSite,
  onSelectSite,
  projectAreaHa,
  footprintMode,
  widthM,
  lengthM,
  projectFootprint,
  setDrawnFootprint,
  analysisCircle,
  isDrawing,
  setIsDrawing,
  hasDefinedSite,
  drawShape,
  imperviousPercent,
  greenPercent,
  permeableSurfacePercent,
  greenInfrastructurePercent,
  simulationView,
  hazardMapped,
  hazardPresent,
  hazardOverlay,
  setHazardOverlay,
}: SimulationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapRef | null>(null);

  const [mapView, setMapView] = useState<MapView>("satellite");
  const [mapReady, setMapReady] = useState(false);

  const isImagery = mapView !== "map";
  const hazardHasData =
    hazardOverlay
      ? hazardMapped[hazardOverlay]
      : false;

  const hazardIsPresent =
    hazardOverlay
      ? hazardPresent[hazardOverlay]
      : false;

  useTerrain(mapRef, mapReady, mapView === "terrain");

  useTerraDraw({
    mapRef,
    ready: mapReady,
    active: isDrawing,
    shape: drawShape,
    onFinish: (footprint) => {
      setDrawnFootprint(footprint);
      setIsDrawing(false);
    },
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => mapRef.current?.resize());
    });

    observer.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    let animationFrame = 0;

    const resizeMap = () => {
      cancelAnimationFrame(animationFrame);

      animationFrame = requestAnimationFrame(() => {
        mapRef.current?.resize();
      });
    };

    const observer = new ResizeObserver(resizeMap);

    observer.observe(container);

    // Initial resize after mount/layout settles
    resizeMap();

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, []);

  function handleMapClick(event: { lngLat: { lng: number; lat: number } }) {
    if (footprintMode === "draw") return;

    onSelectSite({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
    });
  }

  const showLegend =
    simulationView === "current" ? selectedSite !== null : hasDefinedSite;

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[560px] overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50"
    >
      <MapGL
        ref={mapRef}
        initialViewState={{ longitude: 100.3543, latitude: -0.9471, zoom: 12 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={isImagery ? SATELLITE_STYLE : STREET_STYLE}
        cursor="crosshair"
        onClick={handleMapClick}
        onLoad={() => setMapReady(true)}
      >
        <AnalysisLayers
          analysisCircle={analysisCircle}
          hazardOverlay={hazardOverlay}
          hazardPresent={hazardPresent}
          mapView={mapView}
        />

        <FootprintLayers
          projectFootprint={projectFootprint}
          simulationView={simulationView}
          imperviousPercent={imperviousPercent}
          greenPercent={greenPercent}
          permeableSurfacePercent={permeableSurfacePercent}
          greenInfrastructurePercent={greenInfrastructurePercent}
        />

        {selectedSite && footprintMode !== "draw" && (
          <Marker
            longitude={selectedSite.longitude}
            latitude={selectedSite.latitude}
            anchor="center"
          >
            <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-md ring-4 ring-blue-100" />
          </Marker>
        )}
      </MapGL>

      <div className="pointer-events-none absolute inset-x-4 top-4 z-30 flex flex-col items-start gap-3">
        <MapTopBar
          mapView={mapView}
          onMapViewChange={setMapView}
          hazardOverlay={hazardOverlay}
          onHazardOverlayChange={setHazardOverlay}
        />

        {hasDefinedSite ? (
          <FootprintChip
            area={formatArea(projectAreaHa)}
            caption={getFootprintCaption(footprintMode, widthM, lengthM)}
          />
        ) : (
          <MapHint text={getHintText(footprintMode, selectedSite)} />
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-4 bottom-10 z-20 flex items-end justify-between gap-3">
        {showLegend ? (
          <MapLegend
            view={simulationView}
            hasPermeable={permeableSurfacePercent > 0}
            hasGreenInfrastructure={greenInfrastructurePercent > 0}
          />
        ) : (
          <span />
        )}

        {hazardOverlay && (
          <HazardNote hazard={hazardOverlay} hasData={hazardHasData} hasHazard={hazardIsPresent}/>
        )}
      </div>
    </div>
  );
}