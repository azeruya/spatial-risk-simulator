import LiveMapPanel from "@/components/live/LiveMapPanel";

import {
  getLatestEarthquake,
  getSignificantEarthquakes,
  getFeltEarthquakes,
} from "@/lib/bmkg";

export default async function LivePage() {
  const [
    latest,
    significantEarthquakes,
    feltEarthquakes,
  ] = await Promise.all([
    getLatestEarthquake(),
    getSignificantEarthquakes(),
    getFeltEarthquakes(),
  ]);

  return (
    <main className="h-[calc(100vh-73px)]">
      <LiveMapPanel
        latest={latest}
        significantEarthquakes={significantEarthquakes}
        feltEarthquakes={feltEarthquakes}
      />
    </main>
  );
}