"use client";

import SegmentedControl, {
  type SegmentedOption,
} from "../ui/SegmentedControl";
import type { HazardOverlay, MapView } from "@/types/map";

const VIEW_OPTIONS: SegmentedOption<MapView>[] = [
  { value: "map", label: "Map" },
  { value: "satellite", label: "Satellite" },
  { value: "terrain", label: "3D" },
];

const HAZARD_OPTIONS: SegmentedOption<HazardOverlay>[] = [
  { value: null, label: "None" },
  { value: "flood", label: "Flood" },
  { value: "tsunami", label: "Tsunami" },
  { value: "landslide", label: "Landslide" },
];

type MapTopBarProps = {
  mapView: MapView;
  onMapViewChange: (value: MapView) => void;
  hazardOverlay: HazardOverlay;
  onHazardOverlayChange: (value: HazardOverlay) => void;
};

/**
 * Not absolutely positioned. The parent decides where it sits,
 * so it can't collide with other map HUD elements.
 */
export default function MapTopBar({
  mapView,
  onMapViewChange,
  hazardOverlay,
  onHazardOverlayChange,
}: MapTopBarProps) {
  return (
    <div className="pointer-events-none flex w-full flex-wrap items-start justify-between gap-3">
      <SegmentedControl
        label="Map view"
        options={VIEW_OPTIONS}
        value={mapView}
        onChange={onMapViewChange}
        className="pointer-events-auto"
      />

      <SegmentedControl
        label="Hazard layer"
        options={HAZARD_OPTIONS}
        value={hazardOverlay}
        onChange={onHazardOverlayChange}
        className="pointer-events-auto"
      />
    </div>
  );
}