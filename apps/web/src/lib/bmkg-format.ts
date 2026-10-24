/**
 * Turns BMKG's raw Indonesian strings into readable English.
 * Anything it doesn't recognise is returned unchanged, so it can never hide data.
 */
import { STUDY_AREA } from "@/lib/study-area";

const DIRECTIONS: Record<string, string> = {
  utara: "N",
  timurlaut: "NE",
  timur: "E",
  tenggara: "SE",
  selatan: "S",
  baratdaya: "SW",
  barat: "W",
  baratlaut: "NW",
};

const ACRONYMS = new Set(["NTT", "NTB", "DIY", "DKI", "RI"]);

/** BMKG glues words together ("ACEHBARAT"), so split known suffixes back out. */
const COMPOUND_SUFFIX =
  /(?<=[A-Z]{3})(BRTDAYA|BARATDAYA|BARATLAUT|TIMURLAUT|TENGGARA|SELATAN|TENGAH|UTARA|BARAT|TIMUR)$/;

function titleCase(word: string) {
  if (ACRONYMS.has(word)) return word;
  return word.charAt(0) + word.slice(1).toLowerCase();
}

function formatPlace(raw: string) {
  return raw
    .split("-")
    .map((part) =>
      part
        .trim()
        .toUpperCase()
        .replace(COMPOUND_SUFFIX, (match) =>
          match === "BRTDAYA" ? " BARAT DAYA" : ` ${match}`
        )
        .split(/\s+/)
        .filter(Boolean)
        .map(titleCase)
        .join(" ")
    )
    .filter(Boolean)
    .join(", ");
}

/**
 * "6 km BaratLaut LEBONG-BENGKULU" -> "6 km NW of Lebong, Bengkulu"
 */
export function formatRegion(region: string) {
  const match = region
    .trim()
    .match(/^(\d+(?:[.,]\d+)?)\s*km\s+([A-Za-z]+)\s+(.+)$/i);

  if (!match) return region;

  const [, distance, direction, place] = match;
  const compass = DIRECTIONS[direction.toLowerCase()];

  if (!compass) return region;

  return `${distance} km ${compass} of ${formatPlace(place)}`;
}

/** "Tidak berpotensi tsunami" -> "No tsunami potential" */
export function formatPotential(potential?: string) {
  if (!potential) return undefined;

  const text = potential.toLowerCase();

  if (text.includes("tidak berpotensi tsunami")) return "No tsunami potential";
  if (text.includes("berpotensi tsunami")) return "Tsunami potential. Follow BMKG guidance.";

  return potential;
}

/** "19 h ago". Returns null when the date can't be parsed. */
export function relativeTime(dateTime: string, now: number) {
  const time = new Date(dateTime).getTime();
  if (Number.isNaN(time)) return null;

  const minutes = Math.max(0, Math.round((now - time) / 60_000));

  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;

  return `${Math.round(hours / 24)} d ago`;
}

export function distanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(dLon / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** "~210 km from Padang" */
export function distanceFromStudyArea(point: {
  latitude: number;
  longitude: number;
}) {
  const km = distanceKm(STUDY_AREA, point);
  const rounded = km < 100 ? Math.round(km / 5) * 5 : Math.round(km / 10) * 10;
  return `~${Math.max(rounded, 5).toLocaleString("en-US")} km from ${STUDY_AREA.name}`;
}
