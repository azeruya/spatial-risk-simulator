import { useEffect, useRef, type RefObject } from "react";
import type { MapRef } from "react-map-gl/maplibre";

/**
 * Keeps a MapLibre canvas the same size as its container.
 *
 * MapLibre measures its container once when it is created. If the container
 * changes size afterwards (rails animating, fonts/CSS arriving late, the
 * window resizing) the canvas keeps the old width until something nudges it:
 * that is the "extra width, then it snaps" glitch. Attach the returned ref to
 * the map's wrapper element.
 */
export function useMapResize(mapRef: RefObject<MapRef | null>) {
  const containerRef = useRef<HTMLDivElement | null>(null);

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

    // Catch late layout changes (stylesheets, fonts) that don't resize the box.
    resize();
    const late = window.setTimeout(resize, 400);
    window.addEventListener("load", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(late);
      window.removeEventListener("load", resize);
      observer.disconnect();
    };
  }, [mapRef]);

  return containerRef;
}
