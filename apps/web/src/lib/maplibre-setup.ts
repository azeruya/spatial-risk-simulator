/**
 * One-time MapLibre setup, shared by every map in the app.
 * Import this for its side effects. It used to be copy-pasted into
 * BaseMap, RiskMap and SimulationMap.
 */
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
