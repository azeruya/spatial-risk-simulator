"use client";

import { useMemo, useState } from "react";

import BaseMap from "@/components/map/BaseMap";
import NextStepCard from "@/components/shell/NextStepCard";
import RailHeader, { RailStatus } from "@/components/shell/RailHeader";
import Workspace from "@/components/shell/Workspace";
import { useNow } from "@/hooks/useNow";
import {
  distanceFromStudyArea,
  formatPotential,
  formatRegion,
  relativeTime,
} from "@/lib/bmkg-format";
import { STUDY_AREA } from "@/lib/study-area";
import type { Earthquake } from "@/types/earthquake";
import type { WeatherForecastResponse } from "@/types/weather";

import StatusBadge from "../ui/StatusBadge";

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
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [selectedEarthquake, setSelectedEarthquake] =
    useState<Earthquake | null>(null);

  const now = useNow();

  const recentEvents = showAllEvents
    ? significantEarthquakes
    : significantEarthquakes.slice(0, 4);

  const visibleEarthquakes = useMemo(() => {
    const items: Earthquake[] = [];

    if (showSignificant) items.push(...significantEarthquakes);
    if (showFelt) items.push(...feltEarthquakes);
    if (showLatest) items.push(latest);

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

  const sidebar = (
    <div className="flex h-full flex-col">
      <RailHeader
        step="live"
        title="See what is happening now."
        description="Current earthquake and weather conditions."
      >
        <RailStatus step="live">BMKG data connected</RailStatus>
      </RailHeader>

      <div className="ui-rail min-h-0 flex-1 overflow-y-auto border-t border-slate-100 px-5 pb-6">
        <section className="mt-5">
          <p className="ui-eyebrow">Latest earthquake</p>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-semibold">M {latest.magnitude}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Depth {latest.depthKm} km
                </p>
              </div>

              <StatusBadge tone="danger">Latest</StatusBadge>
            </div>

            <p
              className="mt-4 text-sm font-medium leading-5 text-slate-800"
              title={latest.region}
            >
              {formatRegion(latest.region)}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              {distanceFromStudyArea(latest)}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {latest.date} · {latest.time}
              {now !== null && relativeTime(latest.dateTime, now)
                ? ` · ${relativeTime(latest.dateTime, now)}`
                : ""}
            </p>

            {latest.potential && (
              <p
                className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700"
                title={latest.potential}
              >
                {formatPotential(latest.potential)}
              </p>
            )}
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-center justify-between">
            <p className="ui-eyebrow">Recent significant events</p>

            {significantEarthquakes.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllEvents((current) => !current)}
                className="text-[11px] font-medium text-blue-700 hover:text-blue-800"
              >
                {showAllEvents ? "Show less" : "View more"}
              </button>
            )}
          </div>

          <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {recentEvents.map((earthquake) => {
              const isSelected = selectedEarthquake?.id === earthquake.id;
              const ago =
                now !== null ? relativeTime(earthquake.dateTime, now) : null;

              return (
                <button
                  key={earthquake.id}
                  type="button"
                  onClick={() => setSelectedEarthquake(earthquake)}
                  aria-pressed={isSelected}
                  className={`w-full px-4 py-2.5 text-left transition ${
                    isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      M {earthquake.magnitude}
                    </p>

                    <span className="text-[11px] text-slate-500">
                      {ago ?? earthquake.date}
                    </span>
                  </div>

                  <p
                    className="mt-1 line-clamp-1 text-xs leading-4 text-slate-700"
                    title={earthquake.region}
                  >
                    {formatRegion(earthquake.region)}
                  </p>

                  <p className="mt-1 text-[11px] leading-4 text-slate-500">
                    Depth {earthquake.depthKm} km ·{" "}
                    {distanceFromStudyArea(earthquake)}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-7">
          <p className="ui-eyebrow">Layers</p>

          <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            <LayerToggle
              label="Significant earthquakes"
              description={`${significantEarthquakes.length} events · M5.0+`}
              colorClass="bg-red-500"
              checked={showSignificant}
              onChange={setShowSignificant}
            />

            <LayerToggle
              label="Felt earthquakes"
              description={`${feltEarthquakes.length} recent events`}
              colorClass="bg-orange-500"
              checked={showFelt}
              onChange={setShowFelt}
            />

            <LayerToggle
              label="Latest earthquake"
              description={`M ${latest.magnitude}`}
              colorClass="bg-blue-500"
              checked={showLatest}
              onChange={setShowLatest}
            />
          </div>
        </section>

        <section className="mt-7">
          <p className="ui-eyebrow">Weather · {STUDY_AREA.name}</p>

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

              <p className="mt-3 text-xs text-slate-600">
                {weather.location.village}
                {weather.location.city ? `, ${weather.location.city}` : ""}
                {" · "}
                {formatForecastTime(currentWeather.dateTime)}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
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

              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="ui-eyebrow">Next periods</p>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  {nextForecasts.map((forecast) => (
                    <div
                      key={forecast.dateTime}
                      className="rounded-lg bg-slate-50 p-2 text-center"
                    >
                      <p className="text-[11px] font-medium text-slate-600">
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
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Weather forecast unavailable.
            </p>
          )}
        </section>

        <p className="mt-6 border-t border-slate-100 pt-4 text-[11px] leading-4 text-slate-500">
          Earthquake and weather data: BMKG
        </p>
      </div>

      {/* Always visible: the next step never needs a long scroll. */}
      <div className="border-t border-slate-100 bg-white p-4">
        <NextStepCard
          to="risk"
          title={`Understand spatial risk in ${STUDY_AREA.name}`}
          cta="Open Risk"
          href="/risk"
          compact
        />
      </div>
    </div>
  );

  return (
    <Workspace left={sidebar} leftLabel="Live conditions">
      <BaseMap
        earthquakes={visibleEarthquakes}
        selectedEarthquake={selectedEarthquake}
        onSelectEarthquake={setSelectedEarthquake}
      />
    </Workspace>
  );
}

function LayerToggle({
  label,
  description,
  checked,
  onChange,
  colorClass,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  colorClass: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-2.5 transition hover:bg-slate-50">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${colorClass}`}
        />

        <div>
          <p className="text-sm font-medium text-slate-800">{label}</p>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
            {description}
          </p>
        </div>
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

function deduplicateEarthquakes(earthquakes: Earthquake[]): Earthquake[] {
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

    if (!existing || priority[earthquake.category] > priority[existing.category]) {
      map.set(key, earthquake);
    }
  }

  return Array.from(map.values());
}

function WeatherStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-slate-500">{label}</p>
      <p className="mt-0.5 font-medium text-slate-800">{value}</p>
    </div>
  );
}

function formatForecastTime(dateTime: string) {
  const date = new Date(dateTime.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return dateTime;

  return (
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date) + " WIB"
  );
}

function formatForecastHour(dateTime: string) {
  const date = new Date(dateTime.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return dateTime;

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
