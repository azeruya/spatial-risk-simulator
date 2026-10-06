import type {
  Earthquake,
  EarthquakeCategory,
} from "@/types/earthquake";

import type {
  WeatherForecast,
  WeatherForecastResponse,
} from "@/types/weather";

const BMKG_EARTHQUAKE_BASE_URL =
  "https://data.bmkg.go.id/DataMKG/TEWS";
  
const BMKG_WEATHER_BASE_URL =
  "https://api.bmkg.go.id/publik";

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

type BMKGWeatherItemRaw = {
  datetime: string;
  utc_datetime: string;
  local_datetime: string;

  t: number;
  hu: number;

  weather: number;
  weather_desc: string;
  weather_desc_en?: string;

  tp?: number;

  ws: number;
  wd: string;

  tcc?: number;

  vs?: number;
  vs_text?: string;

  image?: string;
};

type BMKGWeatherLocationRaw = {
  adm4: string;

  desa?: string;
  kecamatan?: string;
  kotkab?: string;
  provinsi?: string;

  lat?: number;
  lon?: number;

  timezone?: string;
};

type BMKGWeatherResponseRaw = {
  lokasi: BMKGWeatherLocationRaw;

  data: Array<{
    lokasi?: BMKGWeatherLocationRaw;
    cuaca: BMKGWeatherItemRaw[][];
  }>;
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

function normalizeWeatherItem(
  raw: BMKGWeatherItemRaw
): WeatherForecast {
  return {
    dateTime: raw.local_datetime,
    utcDateTime: raw.utc_datetime,

    temperatureC: raw.t,
    humidityPercent: raw.hu,

    weatherCode: raw.weather,
    weatherDescription:
      raw.weather_desc_en ?? raw.weather_desc,

    precipitationMm: raw.tp,

    windSpeedKmh: raw.ws,
    windDirection: raw.wd,

    cloudCoverPercent: raw.tcc,
    visibilityText: raw.vs_text,

    imageUrl: raw.image,
  };
}

async function fetchBMKG<T>(
  endpoint: string
): Promise<T> {
  const response = await fetch(
    `${BMKG_EARTHQUAKE_BASE_URL}/${endpoint}`,
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

async function fetchBMKGWeather<T>(
  adm4: string
): Promise<T> {
  const response = await fetch(
    `${BMKG_WEATHER_BASE_URL}/prakiraan-cuaca?adm4=${encodeURIComponent(
      adm4
    )}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `BMKG weather request failed: ${response.status}`
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

export async function getWeatherForecast(
  adm4: string
): Promise<WeatherForecastResponse> {
  const data =
    await fetchBMKGWeather<BMKGWeatherResponseRaw>(
      adm4
    );

  const forecasts =
    data.data?.[0]?.cuaca
      ?.flat()
      .map(normalizeWeatherItem) ?? [];

  return {
    location: {
      adm4: data.lokasi.adm4,

      village: data.lokasi.desa,
      district: data.lokasi.kecamatan,
      city: data.lokasi.kotkab,
      province: data.lokasi.provinsi,

      latitude: data.lokasi.lat,
      longitude: data.lokasi.lon,

      timezone: data.lokasi.timezone,
    },

    forecasts,
  };
}