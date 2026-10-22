"use client";

import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";

import {
  buildSurfaceAllocation,
  createTreatmentBands,
} from "@/lib/simulation/geometry";
import type { Footprint } from "@/types/map";
import type { SimulationView } from "@/types/simulation";
import { FOOTPRINT_VISUAL, SURFACE_COLORS } from "../mapStyles";

type Props = {
  projectFootprint: Footprint | null;
  simulationView: SimulationView;
  imperviousPercent: number;
  greenPercent: number;
  permeableSurfacePercent: number;
  greenInfrastructurePercent: number;
};

function FillLayer({
  id,
  data,
  color,
  opacity,
}: {
  id: string;
  data: GeoJSON.Feature | GeoJSON.FeatureCollection | null;
  color: string;
  opacity: number;
}) {
  if (!data) return null;

  return (
    <Source id={id} type="geojson" data={data}>
      <Layer
        id={`${id}-fill`}
        type="fill"
        paint={{ "fill-color": color, "fill-opacity": opacity }}
      />
    </Source>
  );
}

export default function FootprintLayers({
  projectFootprint,
  simulationView,
  imperviousPercent,
  greenPercent,
  permeableSurfacePercent,
  greenInfrastructurePercent,
}: Props) {
  const visual = FOOTPRINT_VISUAL[simulationView];

  const allocation = useMemo(() => {
    if (!projectFootprint || simulationView === "current") return null;
    return buildSurfaceAllocation(projectFootprint, imperviousPercent, greenPercent);
  }, [projectFootprint, simulationView, imperviousPercent, greenPercent]);

  const mitigation = useMemo(() => {
    if (!projectFootprint || simulationView !== "mitigated") return null;

    return {
      permeable:
        permeableSurfacePercent > 0
          ? createTreatmentBands(projectFootprint, "vertical")
          : null,
      greenInfrastructure:
        greenInfrastructurePercent > 0
          ? createTreatmentBands(projectFootprint, "horizontal")
          : null,
    };
  }, [
    projectFootprint,
    simulationView,
    permeableSurfacePercent,
    greenInfrastructurePercent,
  ]);

  if (!projectFootprint) return null;

  const surfaceOpacity = simulationView === "proposed" ? 0.42 : 0.3;

  return (
    <>
      <FillLayer
        id="project-footprint"
        data={projectFootprint}
        color={visual.fillColor}
        opacity={visual.fillOpacity}
      />

      <FillLayer
        id="surface-impervious"
        data={allocation?.impervious ?? null}
        color={SURFACE_COLORS.impervious}
        opacity={surfaceOpacity}
      />
      <FillLayer
        id="surface-green"
        data={allocation?.green ?? null}
        color={SURFACE_COLORS.green}
        opacity={surfaceOpacity}
      />
      <FillLayer
        id="surface-other"
        data={allocation?.other ?? null}
        color={SURFACE_COLORS.other}
        opacity={0.3}
      />

      <FillLayer
        id="mitigation-permeable"
        data={mitigation?.permeable ?? null}
        color={SURFACE_COLORS.permeable}
        opacity={0.45}
      />
      <FillLayer
        id="mitigation-green"
        data={mitigation?.greenInfrastructure ?? null}
        color={SURFACE_COLORS.greenInfrastructure}
        opacity={0.42}
      />

      <Source id="project-footprint-outline-source" type="geojson" data={projectFootprint}>
        <Layer
          id="project-footprint-outline"
          type="line"
          paint={{
            "line-color": visual.lineColor,
            "line-width": visual.lineWidth,
            ...(visual.lineDasharray
              ? { "line-dasharray": visual.lineDasharray }
              : {}),
          }}
        />
      </Source>
    </>
  );
}