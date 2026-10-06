import LiveMapPanel from "@/components/live/LiveMapPanel";

import {
  getLatestEarthquake,
  getSignificantEarthquakes,
  getFeltEarthquakes,
  getWeatherForecast,
} from "@/lib/bmkg";

const PADANG_ADM4 = "13.71.11.1011";

export default async function LivePage() {
  const [
    latest,
    significantEarthquakes,
    feltEarthquakes,
    weather,
  ] = await Promise.all([
    getLatestEarthquake(),
    getSignificantEarthquakes(),
    getFeltEarthquakes(),
    getWeatherForecast(PADANG_ADM4),
  ]);

  return (
    <main className="h-[calc(100vh-73px)]">
      <LiveMapPanel
        latest={latest}
        significantEarthquakes={significantEarthquakes}
        feltEarthquakes={feltEarthquakes}
        weather={weather}
      />
    </main>
  );
}