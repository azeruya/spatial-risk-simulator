"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MapGL, { Marker, ScaleControl, type MapRef } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { getBounds } from "@/lib/simulation/geometry";
import type {
  Footprint,
  HazardKey,
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
import MapControls from "./MapControls";
import {
  AnalysisAreaLabel,
  FootprintChip,
  HazardNote,
  MapHint,
  MapLegend,
  formatArea,
  type HazardNoteLevel,
} from "./MapHud";
import AnalysisLayers from "./layers/AnalysisLayers";
import FootprintLayers from "./layers/FootprintLayers";
import { useTerraDraw } from "./hooks/useTerraDraw";
import { useTerrain } from "./hooks/useTerrain";
import { useFitToSite } from "./hooks/useFitToSite";
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

  /** Optional. Lets the hazard chip show High / Moderate / Low with a scale. */
  hazardLevels?: Partial<Record<HazardKey, HazardNoteLevel>>;

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

/** Radius of the analysis circle in metres, rounded to the nearest 50. */
function getRadiusM(circle: Footprint) {
  const { south, north } = getBounds(circle);
  return Math.round(((north - south) / 2) * 110_574 / 50) * 50;
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
  hazardLevels,
}: SimulationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapRef | null>(null);

  const [mapView, setMapView] = useState<MapView>("satellite");
  const [mapReady, setMapReady] = useState(false);
  const [rotated, setRotated] = useState(false);
  const [parcelInView, setParcelInView] = useState(true);

  const isImagery = mapView !== "map";

  const hazardHasData = hazardOverlay ? hazardMapped[hazardOverlay] : false;
  const hazardIsPresent = hazardOverlay ? hazardPresent[hazardOverlay] : false;

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

  const { fitSite, fitContext } = useFitToSite({
    mapRef,
    containerRef,
    ready: mapReady,
    footprint: projectFootprint,
    analysisCircle,
  });

  // Keep the canvas sized to its container (panels collapsing, window resizing).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let frame = 0;
    const resize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => mapRef.current?.resize());
    };

    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  // Track whether the map is rotated and whether the parcel is on screen.
  const syncView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    setRotated(Math.abs(map.getBearing()) > 1);

    if (!projectFootprint) {
      setParcelInView(true);
      return;
    }

    const { west, south, east, north } = getBounds(projectFootprint);
    setParcelInView(map.getBounds().contains([(west + east) / 2, (south + north) / 2]));
  }, [projectFootprint]);

  useEffect(() => {
    if (mapReady) syncView();
  }, [mapReady, syncView]);

  function handleMapClick(event: { lngLat: { lng: number; lat: number } }) {
    if (footprintMode === "draw") return;

    onSelectSite({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
    });
  }

  const showLegend =
    (simulationView === "current" ? selectedSite !== null : hasDefinedSite) &&
    parcelInView;

  const circleBounds = analysisCircle ? getBounds(analysisCircle) : null;

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
    >
      <MapGL
        ref={mapRef}
        initialViewState={{ longitude: 100.3543, latitude: -0.9471, zoom: 12 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={isImagery ? SATELLITE_STYLE : STREET_STYLE}
        cursor={footprintMode === "draw" ? undefined : "crosshair"}
        onClick={handleMapClick}
        onLoad={() => setMapReady(true)}
        onMoveEnd={syncView}
      >
        <ScaleControl position="bottom-left" unit="metric" maxWidth={90} />

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

        {analysisCircle && circleBounds && (
          <Marker
            longitude={(circleBounds.west + circleBounds.east) / 2}
            latitude={circleBounds.north}
            anchor="bottom"
            style={{ pointerEvents: "none" }}
          >
            <AnalysisAreaLabel radiusM={getRadiusM(analysisCircle)} />
          </Marker>
        )}

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

      <div className="pointer-events-none absolute right-4 top-20 z-30">
        <MapControls
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onFitSite={fitSite}
          onFitContext={fitContext}
          onResetNorth={() => mapRef.current?.resetNorth({ duration: 400 })}
          canFitSite={projectFootprint !== null}
          canFitContext={analysisCircle !== null}
          rotated={rotated}
        />
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
          <HazardNote
            hazard={hazardOverlay}
            hasData={hazardHasData}
            hasHazard={hazardIsPresent}
            level={hazardLevels?.[hazardOverlay]}
          />
        )}
      </div>
    </div>
  );
}