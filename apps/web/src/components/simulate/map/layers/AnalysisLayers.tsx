"use client";

import { useMemo } from "react";
import {
  Layer,
  Source,
} from "react-map-gl/maplibre";

import {
  getBounds,
} from "@/lib/simulation/geometry";

import type {
  Footprint,
  HazardMapped,
  HazardOverlay,
  MapView,
} from "@/types/map";

import {
  HAZARD_STYLE,
} from "../mapStyles";

type Props = {
  analysisCircle: Footprint | null;
  hazardOverlay: HazardOverlay;

  // True when actual non-zero hazard exists
  hazardPresent: HazardMapped;

  mapView: MapView;
};

export default function AnalysisLayers({
  analysisCircle,
  hazardOverlay,
  hazardPresent,
  mapView,
}: Props) {
  const isImagery =
    mapView !== "map";

  const hazardIsPresent =
    hazardOverlay
      ? hazardPresent[hazardOverlay]
      : false;

  const bounds = useMemo(
    () =>
      analysisCircle
        ? getBounds(analysisCircle)
        : null,
    [analysisCircle]
  );

  const overlayUrl = useMemo(() => {
    if (
      !hazardOverlay ||
      !bounds ||
      !hazardIsPresent
    ) {
      return null;
    }

    const bboxValue = [
      bounds.west,
      bounds.south,
      bounds.east,
      bounds.north,
    ].join(",");

    return (
      `/api/bnpb/hazard-overlay?hazard=${hazardOverlay}` +
      `&bbox=${encodeURIComponent(
        bboxValue
      )}`
    );
  }, [
    hazardOverlay,
    bounds,
    hazardIsPresent,
  ]);

  if (!analysisCircle) {
    return null;
  }

  const showHazard =
    hazardOverlay !== null &&
    hazardIsPresent;

  const hazardStyle =
    hazardOverlay
      ? HAZARD_STYLE[hazardOverlay]
      : null;

  return (
    <>
      {/* =========================================
          ACTUAL BNPB HAZARD RASTER
      ========================================= */}

      {showHazard &&
        overlayUrl &&
        bounds &&
        hazardStyle && (
          <Source
            key={`hazard-${hazardOverlay}-${overlayUrl}`}
            id={`hazard-overlay-${hazardOverlay}`}
            type="image"
            url={overlayUrl}
            coordinates={[
              [
                bounds.west,
                bounds.north,
              ],
              [
                bounds.east,
                bounds.north,
              ],
              [
                bounds.east,
                bounds.south,
              ],
              [
                bounds.west,
                bounds.south,
              ],
            ]}
          >
            <Layer
              id={`hazard-overlay-layer-${hazardOverlay}`}
              type="raster"
              paint={{
                "raster-opacity":
                  hazardStyle.opacity,

                "raster-fade-duration": 150,
              }}
            />
          </Source>
        )}

      {/* =========================================
          ANALYSIS CONTEXT

          Keep this mostly as an outline.
          We do NOT place a gray mask over the map.
      ========================================= */}

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

            // Extremely subtle.
            // Hazard raster should remain dominant.
            "fill-opacity":
              showHazard
                ? 0
                : isImagery
                  ? 0.025
                  : 0.015,
          }}
        />

        <Layer
          id="analysis-context-outline"
          type="line"
          paint={{
            "line-color": "#2563eb",
            "line-width": 1.5,
            "line-opacity": 0.65,
            "line-dasharray": [3, 2],
          }}
        />
      </Source>
    </>
  );
}