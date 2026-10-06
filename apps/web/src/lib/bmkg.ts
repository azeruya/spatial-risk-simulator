import type {
  Earthquake,
  EarthquakeCategory,
} from "@/types/earthquake";

const BMKG_BASE_URL =
  "https://data.bmkg.go.id/DataMKG/TEWS";

type BMKGEarthquakeRaw = {
  Tanggal: string;
  Jam: string;
  DateTime: string;
  Coordinates?: string;
  Lintang?: string;
  Bujur?: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi?: string;
  Dirasakan?: string;
  Shakemap?: string;

  point?: {
    coordinates?: string;
  };
};

type BMKGSingleResponse = {
  Infogempa: {
    gempa: BMKGEarthquakeRaw;
  };
};

type BMKGListResponse = {
  Infogempa: {
    gempa: BMKGEarthquakeRaw[];
  };
};

function parseCoordinates(raw: BMKGEarthquakeRaw) {
  const coordinateString =
    raw.Coordinates ?? raw.point?.coordinates;

  if (!coordinateString) {
    return {
      latitude: 0,
      longitude: 0,
    };
  }

  // IMPORTANT:
  // BMKG format = latitude,longitude
  const [latitude, longitude] = coordinateString
    .split(",")
    .map(Number);

  return {
    latitude,
    longitude,
  };
}

function parseDepth(depth: string) {
  return Number.parseFloat(
    depth.replace(" km", "").trim()
  );
}

function normalizeEarthquake(
  raw: BMKGEarthquakeRaw,
  category: EarthquakeCategory,
  index: number
): Earthquake {
  const { latitude, longitude } =
    parseCoordinates(raw);

  return {
    id: `${category}-${raw.DateTime}-${index}`,

    category,

    date: raw.Tanggal,
    time: raw.Jam,
    dateTime: raw.DateTime,

    latitude,
    longitude,

    magnitude: Number.parseFloat(raw.Magnitude),
    depthKm: parseDepth(raw.Kedalaman),

    region: raw.Wilayah,

    potential: raw.Potensi,
    felt: raw.Dirasakan,

    shakemapUrl: raw.Shakemap
      ? `https://static.bmkg.go.id/${raw.Shakemap}`
      : undefined,
  };
}

async function fetchBMKG<T>(
  endpoint: string
): Promise<T> {
  const response = await fetch(
    `${BMKG_BASE_URL}/${endpoint}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `BMKG request failed: ${response.status}`
    );
  }

  return response.json();
}

export async function getLatestEarthquake(): Promise<Earthquake> {
  const data =
    await fetchBMKG<BMKGSingleResponse>(
      "autogempa.json"
    );

  return normalizeEarthquake(
    data.Infogempa.gempa,
    "latest",
    0
  );
}

export async function getSignificantEarthquakes(): Promise<
  Earthquake[]
> {
  const data =
    await fetchBMKG<BMKGListResponse>(
      "gempaterkini.json"
    );

  return data.Infogempa.gempa.map(
    (earthquake, index) =>
      normalizeEarthquake(
        earthquake,
        "significant",
        index
      )
  );
}

export async function getFeltEarthquakes(): Promise<
  Earthquake[]
> {
  const data =
    await fetchBMKG<BMKGListResponse>(
      "gempadirasakan.json"
    );

  return data.Infogempa.gempa.map(
    (earthquake, index) =>
      normalizeEarthquake(
        earthquake,
        "felt",
        index
      )
  );
}