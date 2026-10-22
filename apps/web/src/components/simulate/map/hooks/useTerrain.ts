import {
  useEffect,
  type RefObject,
} from "react";

import type {
  MapRef,
} from "react-map-gl/maplibre";

import {
  TERRAIN_DEM_URL,
} from "../mapStyles";

const TERRAIN_SOURCE_ID =
  "terrain-dem";

export function useTerrain(
  mapRef: RefObject<MapRef | null>,
  ready: boolean,
  enabled: boolean
) {
  useEffect(() => {
    if (!ready) return;

    const map =
      mapRef.current?.getMap();

    if (!map) return;

    let cancelled = false;

    const applyTerrain = () => {
      if (cancelled) return;

      if (!enabled) {
        map.setTerrain(null);

        map.easeTo({
          pitch: 0,
          bearing: 0,
          duration: 500,
        });

        return;
      }

      if (
        !map.getSource(
          TERRAIN_SOURCE_ID
        )
      ) {
        map.addSource(
          TERRAIN_SOURCE_ID,
          {
            type: "raster-dem",
            url: TERRAIN_DEM_URL,

            encoding:
              "terrarium",

            tileSize: 512,
          }
        );
      }

      map.setTerrain({
        source:
          TERRAIN_SOURCE_ID,

        exaggeration: 1.15,
      });

      map.easeTo({
        pitch: 60,
        bearing: -18,
        duration: 650,
      });
    };

    if (map.isStyleLoaded()) {
      applyTerrain();
    } else {
      map.once(
        "style.load",
        applyTerrain
      );
    }

    return () => {
      cancelled = true;

      map.off(
        "style.load",
        applyTerrain
      );
    };
  }, [
    mapRef,
    ready,
    enabled,
  ]);
}