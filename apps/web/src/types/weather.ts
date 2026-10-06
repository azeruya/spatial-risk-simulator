export type WeatherForecast = {
  dateTime: string;
  utcDateTime: string;

  temperatureC: number;
  humidityPercent: number;

  weatherCode: number;
  weatherDescription: string;

  precipitationMm?: number;

  windSpeedKmh: number;
  windDirection: string;

  cloudCoverPercent?: number;
  visibilityText?: string;

  imageUrl?: string;
};

export type WeatherLocation = {
  adm4: string;

  village?: string;
  district?: string;
  city?: string;
  province?: string;

  latitude?: number;
  longitude?: number;

  timezone?: string;
};

export type WeatherForecastResponse = {
  location: WeatherLocation;
  forecasts: WeatherForecast[];
};