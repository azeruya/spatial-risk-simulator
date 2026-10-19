import fs from "node:fs/promises";
import path from "node:path";

import { fromArrayBuffer } from "geotiff";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import bbox from "@turf/bbox";

import type { LandCoverAnalysis } from "@/types/land-cover";

type LoadedLandCoverRaster = {
  data: ArrayLike<number>;

  width: number;
  height: number;

  west: number;
  south: number;
  east: number;
  north: number;

  pixelWidthDegrees: number;
  pixelHeightDegrees: number;
};

let cachedRaster:
  | Promise<LoadedLandCoverRaster>
  | null = null;

async function loadLandCoverRaster() {
  if (cachedRaster) {
    return cachedRaster;
  }

  cachedRaster = (async () => {
    const filePath = path.join(
      process.cwd(),
      "data",
      "land-cover",
      "padang-worldcover-2021.tif"
    );

    const file = await fs.readFile(filePath);

    const arrayBuffer = file.buffer.slice(
      file.byteOffset,
      file.byteOffset + file.byteLength
    );

    const tiff = await fromArrayBuffer(
      arrayBuffer as ArrayBuffer
    );

    const image = await tiff.getImage();

    const [west, south, east, north] =
      image.getBoundingBox();

    const width = image.getWidth();
    const height = image.getHeight();

    const rasters = await image.readRasters({
      samples: [0],
    });

    const raster =
      rasters[0] as ArrayLike<number>;

    return {
      data: raster,

      width,
      height,

      west,
      south,
      east,
      north,

      pixelWidthDegrees:
        (east - west) / width,

      pixelHeightDegrees:
        (north - south) / height,
    };
  })();

  return cachedRaster;
}

const WORLD_COVER = {
  TREE_COVER: 10,
  SHRUBLAND: 20,
  GRASSLAND: 30,
  CROPLAND: 40,
  BUILT_UP: 50,
  BARE_SPARSE: 60,
  SNOW_ICE: 70,
  WATER: 80,
  WETLAND: 90,
  MANGROVES: 95,
  MOSS_LICHEN: 100,
} as const;

function coordinateToPixel(
  longitude: number,
  latitude: number,
  raster: LoadedLandCoverRaster
) {
  const x =
    ((longitude - raster.west) /
      (raster.east - raster.west)) *
    raster.width;

  const y =
    ((raster.north - latitude) /
      (raster.north - raster.south)) *
    raster.height;

  return {
    x: Math.floor(x),
    y: Math.floor(y),
  };
}

function pixelToCoordinate(
  x: number,
  y: number,
  raster: LoadedLandCoverRaster
) {
  const longitude =
    raster.west +
    (x + 0.5) *
      raster.pixelWidthDegrees;

  const latitude =
    raster.north -
    (y + 0.5) *
      raster.pixelHeightDegrees;

  return {
    longitude,
    latitude,
  };
}

export async function analyseLandCover(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>
): Promise<LandCoverAnalysis> {
  const raster =
    await loadLandCoverRaster();

  const [
    minLon,
    minLat,
    maxLon,
    maxLat,
  ] = bbox(polygon);

  const minPixel =
    coordinateToPixel(
      minLon,
      maxLat,
      raster
    );

  const maxPixel =
    coordinateToPixel(
      maxLon,
      minLat,
      raster
    );

  const counts = {
    treeCover: 0,
    shrubland: 0,
    grassland: 0,
    cropland: 0,
    builtUp: 0,
    bareSparse: 0,
    snowIce: 0,
    water: 0,
    wetland: 0,
    mangroves: 0,
    mossLichen: 0,
  };

  let totalPixels = 0;

  const startX = Math.max(
    0,
    minPixel.x
  );

  const endX = Math.min(
    raster.width - 1,
    maxPixel.x
  );

  const startY = Math.max(
    0,
    minPixel.y
  );

  const endY = Math.min(
    raster.height - 1,
    maxPixel.y
  );

  for (
    let y = startY;
    y <= endY;
    y++
  ) {
    for (
      let x = startX;
      x <= endX;
      x++
    ) {
      const {
        longitude,
        latitude,
      } = pixelToCoordinate(
        x,
        y,
        raster
      );

      const inside =
        booleanPointInPolygon(
          point([
            longitude,
            latitude,
          ]),
          polygon
        );

      if (!inside) {
        continue;
      }

      const value = Number(
        raster.data[
          y * raster.width + x
        ]
      );

      if (!Number.isFinite(value)) {
        continue;
      }

      switch (value) {
        case WORLD_COVER.TREE_COVER:
          counts.treeCover++;
          break;

        case WORLD_COVER.SHRUBLAND:
          counts.shrubland++;
          break;

        case WORLD_COVER.GRASSLAND:
          counts.grassland++;
          break;

        case WORLD_COVER.CROPLAND:
          counts.cropland++;
          break;

        case WORLD_COVER.BUILT_UP:
          counts.builtUp++;
          break;

        case WORLD_COVER.BARE_SPARSE:
          counts.bareSparse++;
          break;

        case WORLD_COVER.SNOW_ICE:
          counts.snowIce++;
          break;

        case WORLD_COVER.WATER:
          counts.water++;
          break;

        case WORLD_COVER.WETLAND:
          counts.wetland++;
          break;

        case WORLD_COVER.MANGROVES:
          counts.mangroves++;
          break;

        case WORLD_COVER.MOSS_LICHEN:
          counts.mossLichen++;
          break;

        default:
          continue;
      }

      totalPixels++;
    }
  }

  if (totalPixels === 0) {
    throw new Error(
      "No WorldCover pixels found inside footprint"
    );
  }

  const percent = (
    count: number
  ) =>
    (count / totalPixels) * 100;

  const builtUpPercent =
    percent(counts.builtUp);

  const vegetatedPixels =
    counts.treeCover +
    counts.shrubland +
    counts.grassland +
    counts.cropland +
    counts.mangroves;

  const vegetatedPercent =
    percent(vegetatedPixels);

  const waterPercent =
    percent(
      counts.water +
        counts.wetland
    );

  const otherPercent = Math.max(
    0,
    100 -
      builtUpPercent -
      vegetatedPercent -
      waterPercent
  );

  return {
    totalPixels,

    classes: counts,

    planning: {
      builtUpPercent,
      vegetatedPercent,
      waterPercent,
      otherPercent,
    },

    source: {
      dataset:
        "ESA WorldCover 2021 v200",
      year: 2021,
      resolutionMeters: 10,
    },
  };
}