import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";

import { getBounds } from "@/lib/simulation/geometry";
import type { Footprint } from "@/types/map";

type Options = {
  mapRef: RefObject<MapRef | null>;
  containerRef: RefObject<HTMLElement | null>;
  ready: boolean;
  footprint: Footprint | null;
  analysisCircle: Footprint | null;
};

/**
 * Camera helpers.
 * - fitSite: the parcel with generous space around it, so a small site is still visible.
 * - fitContext: the whole analysis circle.
 * It also frames the parcel automatically the first time it exists, and again
 * whenever it is no longer fully on screen. Editing the size does not re-zoom the map.
 */
export function useFitToSite({
  mapRef,
  containerRef,
  ready,
  footprint,
  analysisCircle,
}: Options) {
  const hadSite = useRef(false);

  const fit = useCallback(
    (feature: Footprint | null, padRatio: number, maxZoom: number) => {
      const map = mapRef.current;
      const el = containerRef.current;
      if (!map || !el || !feature) return;

      const { west, south, east, north } = getBounds(feature);

      // Keep room for the toolbar and legend, and never ask for more padding than fits.
      const padY = Math.min(Math.max(90, el.clientHeight * padRatio), el.clientHeight * 0.4);
      const padX = Math.min(Math.max(40, el.clientWidth * padRatio), el.clientWidth * 0.4);

      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        {
          padding: { top: padY, bottom: padY, left: padX, right: padX },
          maxZoom,
          duration: 600,
        }
      );
    },
    [mapRef, containerRef]
  );

  const fitSite = useCallback(
    () => fit(footprint, 0.3, 19),
    [fit, footprint]
  );

  const fitContext = useCallback(
    () => fit(analysisCircle, 0.08, 17),
    [fit, analysisCircle]
  );

  const siteKey = footprint
    ? Object.values(getBounds(footprint))
        .map((value) => value.toFixed(6))
        .join(",")
    : "";

  useEffect(() => {
    if (!ready) return;

    if (!footprint) {
      hadSite.current = false;
      return;
    }

    const map = mapRef.current;
    if (!map) return;

    const { west, south, east, north } = getBounds(footprint);
    const view = map.getBounds();
    const fullyVisible =
      view.contains([west, south]) && view.contains([east, north]);

    if (!hadSite.current || !fullyVisible) {
      fitSite();
    }

    hadSite.current = true;
    // Only the footprint's position and size should trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, siteKey]);

  return { fitSite, fitContext };
}