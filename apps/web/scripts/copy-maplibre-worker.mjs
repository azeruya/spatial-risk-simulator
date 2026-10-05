import { copyFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const files = [
  {
    from: "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs",
    to: "public/maplibre/maplibre-gl-worker.mjs",
  },
  {
    from: "node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs",
    to: "public/maplibre/maplibre-gl-shared.mjs",
  },
];

for (const file of files) {
    mkdirSync(dirname(file.to), { recursive: true });
    copyFileSync(file.from, file.to);
}

console.log("MapLibre worker files copied successfully.");