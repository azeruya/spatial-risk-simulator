import fs from "node:fs/promises";
import path from "node:path";

import { fromArrayBuffer } from "geotiff";

import type {TerrainAnalysis} from "@/types/terrain";

type TerrainRasterData = ArrayLike<number>;

type LoadedTerrainRaster = {
  data: TerrainRasterData;

  width: number;
  height: number;

  west: number;
  south: number;
  east: number;
  north: number;

  pixelWidthDegrees: number;
  pixelHeightDegrees: number;
};

type Coordinate = {
  longitude: number;
  latitude: number;
};

let cachedRaster: Promise<LoadedTerrainRaster> | null = null;

async function loadTerrainRaster() {
  if (cachedRaster) {
    return cachedRaster;
  }

  cachedRaster = (async () => {
    const filePath = path.join(
      process.cwd(),
      "data",
      "terrain",
      "padang-cop30.tif"
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

    const raster = rasters[0] as ArrayLike<number>;

    const pixelWidthDegrees =
      (east - west) / width;

    const pixelHeightDegrees =
      (north - south) / height;

    return {
      data: raster,
      width,
      height,

      west,
      south,
      east,
      north,

      pixelWidthDegrees,
      pixelHeightDegrees,
    };
  })();

  return cachedRaster;
}

function coordinateToPixel(
  longitude: number,
  latitude: number,
  raster: {
    width: number;
    height: number;
    west: number;
    south: number;
    east: number;
    north: number;
  }
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

function getElevation(
  raster: LoadedTerrainRaster,
  x: number,
  y: number
) {
  if (
    x < 0 ||
    y < 0 ||
    x >= raster.width ||
    y >= raster.height
  ) {
    return null;
  }

  const value = Number(
    raster.data[
      y * raster.width + x
    ]
  );

  if (!Number.isFinite(value)) {
    return null;
  }

  if (
    value < -500 ||
    value > 9000
  ) {
    return null;
  }

  return value;
}

function degreesLongitudeToMeters(
  degrees: number,
  latitude: number
) {
  return (
    degrees *
    111_320 *
    Math.cos(
      (latitude * Math.PI) / 180
    )
  );
}

function degreesLatitudeToMeters(
  degrees: number
) {
  return degrees * 110_574;
}

function calculateSlopeAtPixel(
  raster: LoadedTerrainRaster,
  x: number,
  y: number,
  latitude: number
) {
  const left = getElevation(
    raster,
    x - 1,
    y
  );

  const right = getElevation(
    raster,
    x + 1,
    y
  );

  const up = getElevation(
    raster,
    x,
    y - 1
  );

  const down = getElevation(
    raster,
    x,
    y + 1
  );

  if (
    left === null ||
    right === null ||
    up === null ||
    down === null
  ) {
    return null;
  }

  const pixelWidthMeters =
    Math.abs(
      degreesLongitudeToMeters(
        raster.pixelWidthDegrees,
        latitude
      )
    );

  const pixelHeightMeters =
    Math.abs(
      degreesLatitudeToMeters(
        raster.pixelHeightDegrees
      )
    );

  if (
    pixelWidthMeters <= 0 ||
    pixelHeightMeters <= 0
  ) {
    return null;
  }

  /*
   * Central difference approximation:
   *
   * dz/dx and dz/dy = change in elevation
   * divided by horizontal distance.
   */

  const dzdx =
    (right - left) /
    (2 * pixelWidthMeters);

  const dzdy =
    (down - up) /
    (2 * pixelHeightMeters);

  const gradient =
    Math.sqrt(
      dzdx * dzdx +
        dzdy * dzdy
    );

  const slopeRadians =
    Math.atan(gradient);

  return (
    slopeRadians *
    (180 / Math.PI)
  );
}

function classifyTerrain(
  meanSlope: number
): TerrainAnalysis["terrainClass"] {
  if (meanSlope < 3) {
    return "flat";
  }

  if (meanSlope < 8) {
    return "gently sloping";
  }

  if (meanSlope < 20) {
    return "moderately sloping";
  }

  if (meanSlope < 35) {
    return "steep";
  }

  return "very steep";
}

export async function analyseTerrain({
  longitude,
  latitude,
  radiusMeters = 500,
}: Coordinate & {
  radiusMeters?: number;
}): Promise<TerrainAnalysis> {
  const raster =
    await loadTerrainRaster();

  const center =
    coordinateToPixel(
      longitude,
      latitude,
      raster
    );

  const centerPixelWidthMeters =
    Math.abs(
      degreesLongitudeToMeters(
        raster.pixelWidthDegrees,
        latitude
      )
    );

  const centerPixelHeightMeters =
    Math.abs(
      degreesLatitudeToMeters(
        raster.pixelHeightDegrees
      )
    );

  const pixelRadiusX =
    Math.ceil(
      radiusMeters /
        centerPixelWidthMeters
    );

  const pixelRadiusY =
    Math.ceil(
      radiusMeters /
        centerPixelHeightMeters
    );

  const elevations: number[] = [];
  const slopes: number[] = [];

  /*
   * Sample every few pixels instead of every single
   * DEM cell. Faster and sufficient for contextual
   * terrain statistics.
   */
  const samplingStep = Math.max(
    1,
    Math.floor(
      Math.min(
        pixelRadiusX,
        pixelRadiusY
      ) / 10
    )
  );

  for (
    let y =
      center.y - pixelRadiusY;
    y <= center.y + pixelRadiusY;
    y += samplingStep
  ) {
    for (
      let x =
        center.x - pixelRadiusX;
      x <= center.x + pixelRadiusX;
      x += samplingStep
    ) {
      /*
       * Keep only pixels inside circular
       * analysis radius.
       */
      const dx =
        (x - center.x) *
        centerPixelWidthMeters;

      const dy =
        (y - center.y) *
        centerPixelHeightMeters;

      const distance =
        Math.sqrt(
          dx * dx +
            dy * dy
        );

      if (
        distance >
        radiusMeters
      ) {
        continue;
      }

      const elevation =
        getElevation(
          raster,
          x,
          y
        );

      if (elevation === null) {
        continue;
      }

      elevations.push(elevation);

      const slope =
        calculateSlopeAtPixel(
          raster,
          x,
          y,
          latitude
        );

      if (
        slope !== null &&
        Number.isFinite(slope)
      ) {
        slopes.push(slope);
      }
    }
  }

  if (
    elevations.length === 0
  ) {
    throw new Error(
      "No terrain data available for this location"
    );
  }

  const elevationMean =
    elevations.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / elevations.length;

  const slopeMean =
    slopes.length > 0
      ? slopes.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / slopes.length
      : 0;

  const slopeMax =
    slopes.length > 0
      ? Math.max(...slopes)
      : 0;

  const elevationMin = Math.min(...elevations);
  const elevationMax = Math.max(...elevations);

  return {
    elevation: {
      min: Math.min(
        ...elevations
      ),

      max: Math.max(
        ...elevations
      ),

      mean: elevationMean,
    },

    slope: {
      mean: slopeMean,
      max: slopeMax,
    },

    relief: elevationMax - elevationMin,

    terrainClass:
      classifyTerrain(
        slopeMean
      ),

    sampleCount:
      elevations.length,

    source: {
      dataset:
        "Copernicus DEM GLO-30",
      resolutionMeters: 30,
    },
  };
}