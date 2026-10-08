import { destination } from "@turf/destination";
import { point, polygon } from "@turf/helpers";
import { transformRotate } from "@turf/transform-rotate";

export function createRectangleFootprint(
  longitude: number,
  latitude: number,
  widthM: number,
  lengthM: number,
  bearing = 0
): GeoJSON.Feature<GeoJSON.Polygon> {
  const center = point([
    longitude,
    latitude,
  ]);

  const halfWidthKm =
    widthM / 2000;

  const halfLengthKm =
    lengthM / 2000;

  const north = destination(
    center,
    halfLengthKm,
    0,
    { units: "kilometers" }
  );

  const south = destination(
    center,
    halfLengthKm,
    180,
    { units: "kilometers" }
  );

  const northWest = destination(
    north,
    halfWidthKm,
    -90,
    { units: "kilometers" }
  );

  const northEast = destination(
    north,
    halfWidthKm,
    90,
    { units: "kilometers" }
  );

  const southEast = destination(
    south,
    halfWidthKm,
    90,
    { units: "kilometers" }
  );

  const southWest = destination(
    south,
    halfWidthKm,
    -90,
    { units: "kilometers" }
  );

  const rectangle = polygon([
    [
      northWest.geometry.coordinates,
      northEast.geometry.coordinates,
      southEast.geometry.coordinates,
      southWest.geometry.coordinates,
      northWest.geometry.coordinates,
    ],
  ]);

  return transformRotate(
    rectangle,
    bearing,
    {
      pivot: [
        longitude,
        latitude,
      ],
    }
  );
}