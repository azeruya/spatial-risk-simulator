import { useEffect, useRef, type RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { TerraDraw, TerraDrawPolygonMode, TerraDrawRectangleMode } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";

import type { DrawShape } from "@/types/simulation";
import type { Footprint } from "@/types/map";

type Options = {
  mapRef: RefObject<MapRef | null>;
  ready: boolean;
  active: boolean;
  shape: DrawShape;
  onFinish: (footprint: Footprint) => void;
};

export function useTerraDraw({ mapRef, ready, active, shape, onFinish }: Options) {
  // Keep the latest callback without restarting the drawing session.
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    if (!active || !ready) return;

    const map = mapRef.current?.getMap();
    if (!map) return;

    const draw = new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({ map }),
      modes: [
        new TerraDrawPolygonMode({ pointerDistance: 20 }),
        new TerraDrawRectangleMode(),
      ],
    });

    draw.start();
    draw.setMode(shape === "rectangle" ? "rectangle" : "polygon");

    draw.on("finish", (id) => {
      const feature = draw
        .getSnapshot()
        .find((f) => f.id === id && f.geometry.type === "Polygon");

      if (!feature) return;

      onFinishRef.current(feature as Footprint);
      draw.setMode("static");
    });

    return () => {
      draw.stop();
    };
  }, [active, ready, shape, mapRef]);
}