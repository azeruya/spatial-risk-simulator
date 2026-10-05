"use client";

import Map from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export default function BaseMap() {
  return (
    <Map
      initialViewState={{
        longitude: 100.3543,
        latitude: -0.9471,
        zoom: 11,
      }}
      style={{
        width: "100%",
        height: "100%",
      }}
      mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    />
  );
}