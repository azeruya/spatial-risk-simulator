"use client";

import SegmentedControl, {
  type SegmentedOption,
} from "@/components/simulate/ui/SegmentedControl";
import { MapHint } from "@/components/simulate/map/MapHud";
import type { RiskOverlay } from "@/types/risk";

type View = "2d" | "3d";

const VIEW_OPTIONS: SegmentedOption<View>[] = [
  { value: "2d", label: "2D" },
  { value: "3d", label: "3D" },
];

const OVERLAY_OPTIONS: SegmentedOption<RiskOverlay>[] = [
  { value: "none", label: "None" },
  { value: "flood", label: "Flood" },
  { value: "tsunami", label: "Tsunami" },
  { value: "landslide", label: "Landslide" },
];

type RiskMapControlsProps = {
  terrainEnabled: boolean;
  setTerrainEnabled: (value: boolean) => void;

  riskOverlay: RiskOverlay;
  setRiskOverlay: (value: RiskOverlay) => void;

  /** Show the "click the map" hint under the controls. */
  showHint: boolean;
};

/**
 * Same layout as the Simulate map's top bar (view switch on the left, hazard
 * layer on the right, hint underneath) so the two maps feel like one product.
 */
export default function RiskMapControls({
  terrainEnabled,
  setTerrainEnabled,
  riskOverlay,
  setRiskOverlay,
  showHint,
}: RiskMapControlsProps) {
  return (
    <div className="pointer-events-none absolute inset-x-4 top-4 z-30 flex flex-col items-start gap-3">
      <div className="pointer-events-none flex w-full flex-wrap items-start justify-between gap-3">
        <SegmentedControl
          label="Map view"
          options={VIEW_OPTIONS}
          value={terrainEnabled ? "3d" : "2d"}
          onChange={(value) => setTerrainEnabled(value === "3d")}
          className="pointer-events-auto"
        />

        <SegmentedControl
          label="Hazard layer"
          options={OVERLAY_OPTIONS}
          value={riskOverlay}
          onChange={setRiskOverlay}
          className="pointer-events-auto"
        />
      </div>

      {showHint && <MapHint text="Click anywhere on the map to analyse a site" />}
    </div>
  );
}
