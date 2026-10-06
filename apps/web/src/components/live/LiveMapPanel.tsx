"use client";

import { useMemo, useState } from "react";
import type { Earthquake } from "@/types/earthquake";
import type { WeatherForecastResponse } from "@/types/weather";
import BaseMap from "@/components/map/BaseMap";

type LiveMapPanelProps = {
  latest: Earthquake;
  significantEarthquakes: Earthquake[];
  feltEarthquakes: Earthquake[];
  weather: WeatherForecastResponse;
};

export default function LiveMapPanel({
  latest,
  significantEarthquakes,
  feltEarthquakes,
  weather,
}: LiveMapPanelProps) {
  const [showSignificant, setShowSignificant] = useState(true);
  const [showFelt, setShowFelt] = useState(false);
  const [showLatest, setShowLatest] = useState(true);
  const [selectedEarthquake, setSelectedEarthquake] =
    useState<Earthquake | null>(null);

  const visibleEarthquakes = useMemo(() => {
    const items: Earthquake[] = [];

    if (showSignificant) {
        items.push(...significantEarthquakes);
    }

    if (showFelt) {
        items.push(...feltEarthquakes);
    }

    if (showLatest) {
        items.push(latest);
    }

    return deduplicateEarthquakes(items);
        }, [
        showSignificant,
        showFelt,
        showLatest,
        significantEarthquakes,
        feltEarthquakes,
        latest,
    ]);

  const currentWeather = weather.forecasts[0];
  const nextForecasts = weather.forecasts.slice(1, 5);

  return (
    <div className="flex h-full">
      <aside className="w-80 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Live Conditions
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Current disaster and environmental information.
          </p>
        </div>

        <section className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Latest earthquake
          </p>

          <div className="mt-3 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-semibold">
                  M {latest.magnitude}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Depth {latest.depthKm} km
                </p>
              </div>

              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                Latest
              </span>
            </div>

            <p className="mt-4 text-sm font-medium leading-5 text-slate-800">
              {latest.region}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {latest.date} · {latest.time}
            </p>

            {latest.potential && (
              <p className="mt-3 text-xs text-slate-600">
                {latest.potential}
              </p>
            )}
          </div>
        </section>

        <section className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Weather forecast
            </p>

            {currentWeather ? (
                <div className="mt-3 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                    <p className="text-3xl font-semibold">
                        {currentWeather.temperatureC}°C
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-700">
                        {currentWeather.weatherDescription}
                    </p>
                    </div>

                    {currentWeather.imageUrl && (
                    <img
                        src={currentWeather.imageUrl}
                        alt={currentWeather.weatherDescription}
                        className="h-12 w-12"
                    />
                    )}
                </div>

                <p className="mt-4 text-xs text-slate-500">
                    {weather.location.village}
                    {weather.location.city
                    ? `, ${weather.location.city}`
                    : ""}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <WeatherStat
                    label="Humidity"
                    value={`${currentWeather.humidityPercent}%`}
                    />

                    <WeatherStat
                    label="Wind"
                    value={`${currentWeather.windSpeedKmh} km/h ${currentWeather.windDirection}`}
                    />

                    <WeatherStat
                    label="Cloud cover"
                    value={
                        currentWeather.cloudCoverPercent !== undefined
                        ? `${currentWeather.cloudCoverPercent}%`
                        : "—"
                    }
                    />

                    <WeatherStat
                    label="Rain"
                    value={
                        currentWeather.precipitationMm !== undefined
                        ? `${currentWeather.precipitationMm} mm`
                        : "—"
                    }
                    />
                </div>

                <p className="mt-4 text-[11px] text-slate-400">
                    Forecast for {formatForecastTime(currentWeather.dateTime)}
                </p>

                <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Next periods
                    </p>

                    <div className="mt-3 grid grid-cols-4 gap-2">
                    {nextForecasts.map((forecast) => (
                        <div
                        key={forecast.dateTime}
                        className="rounded-lg bg-slate-50 p-2 text-center"
                        >
                        <p className="text-[11px] font-medium text-slate-500">
                            {formatForecastHour(forecast.dateTime)}
                        </p>

                        {forecast.imageUrl && (
                            <img
                            src={forecast.imageUrl}
                            alt={forecast.weatherDescription}
                            className="mx-auto mt-1 h-7 w-7"
                            />
                        )}

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                            {forecast.temperatureC}°
                        </p>
                        </div>
                    ))}
                    </div>
                </div>

                <p className="mt-4 text-[10px] text-slate-400">
                    Weather data source: BMKG
                </p>
                </div>
            ) : (
                <p className="mt-3 text-sm text-slate-500">
                Weather forecast unavailable.
                </p>
            )}
        </section>

        <section className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Layers
          </p>

          <div className="mt-3 space-y-3">
            <LayerToggle
              label="Significant earthquakes"
              description={`${significantEarthquakes.length} events · M5.0+`}
              checked={showSignificant}
              onChange={setShowSignificant}
            />

            <LayerToggle
              label="Felt earthquakes"
              description={`${feltEarthquakes.length} recent events`}
              checked={showFelt}
              onChange={setShowFelt}
            />

            <LayerToggle
              label="Latest earthquake"
              description={`M ${latest.magnitude}`}
              checked={showLatest}
              onChange={setShowLatest}
            />
          </div>
        </section>

        <section className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Legend
          </p>

          <div className="mt-3 space-y-2 text-xs text-slate-600">
            <LegendItem
              className="bg-red-500"
              label="M5.0+ earthquake"
            />

            <LegendItem
              className="bg-amber-500"
              label="Felt earthquake"
            />

            <LegendItem
              className="bg-blue-600 ring-4 ring-blue-100"
              label="Latest earthquake"
            />
          </div>
        </section>

        <section className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recent significant events
          </p>

          <div className="mt-3 space-y-3">
            {significantEarthquakes.slice(0, 5).map((earthquake) => {
                const isSelected =
                    selectedEarthquake?.id === earthquake.id;

                return (
                    <button
                    key={earthquake.id}
                    type="button"
                    onClick={() => {
                        console.log("Sidebar selected:", earthquake);
                        setSelectedEarthquake(earthquake);
                    }}
                    className={`w-full cursor-pointer rounded-xl border p-3 text-left transition ${
                        isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                    >
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">
                        M {earthquake.magnitude}
                        </p>

                        <p className="text-xs text-slate-400">
                        {earthquake.depthKm} km
                        </p>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                        {earthquake.region}
                    </p>

                    <p className="mt-2 text-[11px] text-slate-400">
                        {earthquake.date} · {earthquake.time}
                    </p>
                    </button>
                );
            })}
          </div>
        </section>

        <p className="mt-8 border-t border-slate-200 pt-4 text-[11px] leading-4 text-slate-400">
          Earthquake data source: BMKG — Badan Meteorologi, Klimatologi,
          dan Geofisika.
        </p>
      </aside>

      <section className="min-w-0 flex-1">
        <BaseMap 
            earthquakes={visibleEarthquakes}
            selectedEarthquake={selectedEarthquake}
            onSelectEarthquake={setSelectedEarthquake} 
        />
      </section>
    </div>
  );
}

function LayerToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 p-3">
      <div>
        <p className="text-sm font-medium text-slate-800">
          {label}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4"
      />
    </label>
  );
}

function LegendItem({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-3 w-3 rounded-full ${className}`} />
      <span>{label}</span>
    </div>
  );
}

function deduplicateEarthquakes(
  earthquakes: Earthquake[]
): Earthquake[] {
  const priority: Record<Earthquake["category"], number> = {
    felt: 1,
    significant: 2,
    latest: 3,
  };

  const map = new Map<string, Earthquake>();

  for (const earthquake of earthquakes) {
    const key = [
      earthquake.dateTime,
      earthquake.latitude.toFixed(3),
      earthquake.longitude.toFixed(3),
    ].join("-");

    const existing = map.get(key);

    if (
      !existing ||
      priority[earthquake.category] >
        priority[existing.category]
    ) {
      map.set(key, earthquake);
    }
  }

  return Array.from(map.values());
}

function WeatherStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5">
      <p className="text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

function formatForecastTime(dateTime: string) {
  const date = new Date(dateTime.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return dateTime;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date) + " WIB";
}

function formatForecastHour(dateTime: string) {
  const date = new Date(dateTime.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return dateTime;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}