import sharp from "sharp";

export type Bbox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

const MAX_SPAN_DEGREES = 0.5;
const MAX_SIDE_PX = 512;

/** Parses "west,south,east,north". Returns null for anything unsafe or nonsensical. */
export function parseBbox(value: string | null): Bbox | null {
  if (!value) return null;

  const parts = value.split(",").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  const [west, south, east, north] = parts;

  const valid =
    west >= -180 &&
    east <= 180 &&
    south >= -90 &&
    north <= 90 &&
    west < east &&
    south < north &&
    east - west <= MAX_SPAN_DEGREES &&
    north - south <= MAX_SPAN_DEGREES;

  return valid ? { west, south, east, north } : null;
}

/**
 * Image size that matches the bbox's own proportions, so the server never
 * stretches the picture. MapLibre then places it on the map exactly.
 */
export function overlaySize({ west, south, east, north }: Bbox) {
  const aspect = (north - south) / (east - west);

  return aspect <= 1
    ? { width: MAX_SIDE_PX, height: Math.max(64, Math.round(MAX_SIDE_PX * aspect)) }
    : { width: Math.max(64, Math.round(MAX_SIDE_PX / aspect)), height: MAX_SIDE_PX };
}

/**
 * Makes everything outside the inscribed ellipse transparent.
 * MapLibre stretches the image over the circle's bounding box, so an ellipse
 * inscribed in the image becomes the analysis circle on the map.
 */
export async function clipToEllipse(png: Buffer): Promise<Buffer> {
  const { width, height } = await sharp(png).metadata();
  if (!width || !height) return png;

  const mask = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
      `<ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 2 - 1}" ry="${height / 2 - 1}" fill="#fff"/>` +
      `</svg>`
  );

  return sharp(png)
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}