"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Map, { Marker, Source, Layer, MapRef } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { circle } from "@turf/circle";
import bbox from "@turf/bbox";

import Link from "next/link";
import { buildLocationUrl } from "@/lib/navigation";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

type HazardCategory =
  | "low"
  | "moderate"
  | "high"
  | "no-data";

type HazardStatus =
  | "idle"
  | "loading"
  | "success"
  | "no-data"
  | "error";

type HazardResult = {
  status: HazardStatus;
  value: number | null;
  category: HazardCategory;
  hasData: boolean;
  resolutionMeters: number | null;
  source: string;
  error?: string;
};

type SiteHazards = {
  flood: HazardResult;
  tsunami: HazardResult;
  landslide: HazardResult;
  earthquake: HazardResult;
};

type AreaHazardStatus =
  | "idle"
  | "loading"
  | "success"
  | "no-data"
  | "error";

type HazardAreaResult = {
  status: AreaHazardStatus;
  average: number | null;
  maximum: number | null;
  minimum: number | null;
  validSamples: number;
  totalSamples: number;
  hasData: boolean;
};

type AreaHazardType =
  | "flood"
  | "tsunami"
  | "landslide";

type AreaHazards = Record<
  AreaHazardType,
  HazardAreaResult
>;

type HazardType = keyof SiteHazards;

type AnalysisRadius = 250 | 500 | 1000;

type RiskOverlay =
  | "none"
  | "flood"
  | "tsunami"
  | "landslide";

const OVERLAY_STYLE = {
  flood: {
    label: "Flood",
    tint: "#f59e0b",
  },
  tsunami: {
    label: "Tsunami",
    tint: "#06b6d4",
  },
  landslide: {
    label: "Landslide",
    tint: "#ef4444",
  },
} as const;

type PopulationExposure = {
  status:
    | "idle"
    | "loading"
    | "success"
    | "error";

  population: number | null;
  areaKm2: number | null;
  densityPerKm2: number | null;
  year: number | null;
};

const createIdleHazard = (): HazardResult => ({
  status: "idle",
  value: null,
  category: "no-data",
  hasData: false,
  resolutionMeters: null,
  source: "BNPB InaRISK",
});

const createIdleAreaHazard =
  (): HazardAreaResult => ({
    status: "idle",
    average: null,
    maximum: null,
    minimum: null,
    validSamples: 0,
    totalSamples: 0,
    hasData: false,
  });

const createEmptyAreaHazards =
  (): AreaHazards => ({
    flood: createIdleAreaHazard(),
    tsunami: createIdleAreaHazard(),
    landslide: createIdleAreaHazard(),
  });

const EMPTY_HAZARDS: SiteHazards = {
  flood: createIdleHazard(),
  tsunami: createIdleHazard(),
  landslide: createIdleHazard(),
  earthquake: createIdleHazard(),
};

const HAZARD_ENDPOINTS: Record<HazardType, string> = {
  flood: "/api/bnpb/flood-hazard",
  tsunami: "/api/bnpb/tsunami-hazard",
  landslide: "/api/bnpb/landslide-hazard",
  earthquake: "/api/bnpb/earthquake-hazard",
};

const AREA_HAZARD_ENDPOINTS: Record<
  AreaHazardType,
  string
> = {
  flood: "/api/bnpb/flood-hazard/area",
  tsunami: "/api/bnpb/tsunami-hazard/area",
  landslide: "/api/bnpb/landslide-hazard/area",
};

export default function RiskMap() {
  const [selectedPoint, setSelectedPoint] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);

  const hasSelectedPoint = selectedPoint !== null;

  const [hazards, setHazards] =
    useState<SiteHazards>(EMPTY_HAZARDS);

  const [radius, setRadius] =
    useState<AnalysisRadius>(500);

  const [areaHazards, setAreaHazards] =
    useState<AreaHazards>(
      createEmptyAreaHazards()
    );

  const [populationExposure, setPopulationExposure] =
    useState<PopulationExposure>({
      status: "idle",
      population: null,
      areaKm2: null,
      densityPerKm2: null,
      year: null,
    });

  const mapRef = useRef<MapRef | null>(null);

  const [riskOverlay, setRiskOverlay] =
    useState<RiskOverlay>("none");

  const [terrainEnabled, setTerrainEnabled] =
    useState(false);

  const analysisCircle = useMemo(() => {
    if (!selectedPoint) return null;

    return circle(
      [
        selectedPoint.longitude,
        selectedPoint.latitude,
      ],
      radius / 1000,
      {
        steps: 64,
        units: "kilometers",
      }
    );
  }, [selectedPoint, radius]);

  const analysisAreaKm2 = useMemo(() => {
    const radiusKm = radius / 1000;

    return Math.PI * radiusKm * radiusKm;
  }, [radius]);

  const hazardOverlayBounds = useMemo(() => {
    if (!analysisCircle) return null;

    const [
      west,
      south,
      east,
      north,
    ] = bbox(analysisCircle);

    return {
      west,
      south,
      east,
      north,
    };
  }, [analysisCircle]);

  const hazardOverlayUrl = useMemo(() => {
    if (
      riskOverlay === "none" ||
      !hazardOverlayBounds
    ) {
      return null;
    }

    const {
      west,
      south,
      east,
      north,
    } = hazardOverlayBounds;

    const bboxValue = [
      west,
      south,
      east,
      north,
    ].join(",");

    return (
      `/api/bnpb/hazard-overlay` +
      `?hazard=${riskOverlay}` +
      `&bbox=${encodeURIComponent(bboxValue)}`
    );
  }, [
    riskOverlay,
    hazardOverlayBounds,
  ]);

  useEffect(() => {
    if (!analysisCircle) {
      setAreaHazards(
        createEmptyAreaHazards()
      );

      return;
    }

    const controller = new AbortController();

    const areaTypes: AreaHazardType[] = [
      "flood",
      "tsunami",
      "landslide",
    ];

    // Set each area result to loading
    setAreaHazards({
      flood: {
        ...createIdleAreaHazard(),
        status: "loading",
      },
      tsunami: {
        ...createIdleAreaHazard(),
        status: "loading",
      },
      landslide: {
        ...createIdleAreaHazard(),
        status: "loading",
      },
    });

    areaTypes.forEach((type) => {
      fetchAreaHazard(
        type,
        analysisCircle,
        controller.signal
      )
        .then((result) => {
          setAreaHazards((current) => ({
            ...current,
            [type]: result,
          }));
        })
        .catch((error) => {
          if (error instanceof Error &&
              error.name === "AbortError") {
            return;
          }

          setAreaHazards((current) => ({
            ...current,
            [type]: {
              ...createIdleAreaHazard(),
              status: "error",
            },
          }));
        });
    });

    return () => {
      controller.abort();
    };
  }, [analysisCircle]);

  useEffect(() => {
    if (!analysisCircle) {
      return;
    }

    const controller = new AbortController();

    setPopulationExposure({
      status: "loading",
      population: null,
      areaKm2: analysisAreaKm2,
      densityPerKm2: null,
      year: 2025,
    });

    async function loadPopulation() {
      try {
        const response = await fetch(
          "/api/population/exposure",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              polygon: analysisCircle,
              year: 2025,
            }),
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "Population request failed"
          );
        }

        const data = await response.json();

        const population =
          typeof data.population === "number"
            ? data.population
            : null;

        const density =
          population !== null &&
          analysisAreaKm2 > 0
            ? population /
              analysisAreaKm2
            : null;

        setPopulationExposure({
          status: "success",
          population,
          areaKm2: analysisAreaKm2,
          densityPerKm2: density,
          year: data.year ?? 2025,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        setPopulationExposure({
          status: "error",
          population: null,
          areaKm2: analysisAreaKm2,
          densityPerKm2: null,
          year: 2025,
        });
      }
    }

    loadPopulation();

    return () => {
      controller.abort();
    };
  }, [analysisCircle, analysisAreaKm2]);

  useEffect(() => {
    const map = mapRef.current?.getMap();

    if (!map) return;

    const applyTerrain = () => {
      // Add DEM source once
      if (!map.getSource("terrain-dem")) {
        map.addSource("terrain-dem", {
          type: "raster-dem",
          url: "https://tiles.mapterhorn.com/tilejson.json",
          tileSize: 256,
        });
      }

      if (terrainEnabled) {
        map.setTerrain({
          source: "terrain-dem",
          exaggeration: 1.5,
        });

        map.easeTo({
          pitch: 60,
          bearing: -15,
          duration: 700,
        });
      } else {
        map.setTerrain(null);

        map.easeTo({
          pitch: 0,
          bearing: 0,
          duration: 700,
        });
      }
    };

    if (map.loaded()) {
      applyTerrain();
    } else {
      map.once("load", applyTerrain);
    }

    return () => {
      map.off("load", applyTerrain);
    };
  }, [terrainEnabled]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      mapRef.current?.resize();
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [hasSelectedPoint]);

  async function handleMapClick(event: {
    lngLat: {
      lng: number;
      lat: number;
    };
  }) {
    const longitude = event.lngLat.lng;
    const latitude = event.lngLat.lat;

    setSelectedPoint({
      longitude,
      latitude,
    });

    // Set ALL rows to loading BEFORE starting requests
    setHazards({
      flood: {
        ...createIdleHazard(),
        status: "loading",
      },
      tsunami: {
        ...createIdleHazard(),
        status: "loading",
      },
      landslide: {
        ...createIdleHazard(),
        status: "loading",
      },
      earthquake: {
        ...createIdleHazard(),
        status: "loading",
      },
    });

    const hazardTypes: HazardType[] = [
      "flood",
      "tsunami",
      "landslide",
      "earthquake",
    ];

    hazardTypes.forEach((type) => {
      fetchHazard(
        type,
        longitude,
        latitude
      )
        .then((result) => {
          setHazards((current) => ({
            ...current,
            [type]: {
              ...result,
              status: result.hasData
                ? "success"
                : "no-data",
            },
          }));
        })
        .catch(() => {
          setHazards((current) => ({
            ...current,
            [type]: {
              ...createIdleHazard(),
              status: "error",
              error: "Service unavailable",
            },
          }));
        });
    });
  }

  const mappedAreaHazards = (
    ["flood", "tsunami", "landslide"] as const
  ).filter(
    (type) =>
      areaHazards[type].status === "success" &&
      areaHazards[type].hasData
  );

  const mappedHazardNames =
    mappedAreaHazards.map(formatHazardName);

  const population =
    populationExposure.status === "success"
      ? populationExposure.population
      : null;

  const radiusLabel =
    radius === 1000
      ? "1 km"
      : `${radius} m`;

  const mappedHazardText =
  formatHazardList(mappedHazardNames);

  const hazardSummary =
    mappedHazardNames.length > 0
      ? `${mappedHazardText} ${
          mappedHazardNames.length === 1
            ? "hazard is"
            : "hazards are"
        } mapped within the selected ${radiusLabel} surrounding context.`
      : `No mapped flood, tsunami, or landslide values were returned within the selected ${radiusLabel} surrounding context.`;

  const keyConcern =
    population !== null &&
    population > 0 &&
    mappedAreaHazards.length > 0
      ? `The surrounding context includes an estimated ${Math.round(
          population
        ).toLocaleString()} people who may be relevant when considering development in this mapped hazard context.`
      : mappedAreaHazards.length > 0
        ? "Mapped hazard values are present around the selected site and should be considered before development."
        : "Current mapped data does not identify a clear surrounding hazard concern for this site.";

  return (
    <div className="relative flex h-full overflow-hidden bg-slate-50">

      {/* =========================================================
          MAP
      ========================================================= */}
      <div className="relative min-w-0 flex-1 transition-[width] duration-300 ease-out">
        <Map
          initialViewState={{
            longitude: 100.3543,
            latitude: -0.9471,
            zoom: 10,
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          onClick={handleMapClick}
          cursor="crosshair"
          ref={mapRef}
        >
          <Source
            id="hillshade-dem"
            type="raster-dem"
            url="https://tiles.mapterhorn.com/tilejson.json"
            tileSize={256}
          >
            <Layer
              id="terrain-hillshade"
              type="hillshade"
              layout={{
                visibility:
                  terrainEnabled ? "visible" : "none",
              }}
              paint={{
                "hillshade-exaggeration": 0.25,
              }}
            />
          </Source>

          {riskOverlay !== "none" &&
            hazardOverlayUrl &&
            hazardOverlayBounds && (
              <Source
                id="risk-hazard-overlay"
                type="image"
                url={hazardOverlayUrl}
                coordinates={[
                  [
                    hazardOverlayBounds.west,
                    hazardOverlayBounds.north,
                  ],
                  [
                    hazardOverlayBounds.east,
                    hazardOverlayBounds.north,
                  ],
                  [
                    hazardOverlayBounds.east,
                    hazardOverlayBounds.south,
                  ],
                  [
                    hazardOverlayBounds.west,
                    hazardOverlayBounds.south,
                  ],
                ]}
              >
                <Layer
                  id="risk-hazard-overlay-layer"
                  type="raster"
                  paint={{
                    "raster-opacity": 0.42,
                  }}
                />
              </Source>
            )}

          {analysisCircle && (
            <Source
              id="risk-analysis-context"
              type="geojson"
              data={analysisCircle}
            >
              <Layer
                id="risk-analysis-context-fill"
                type="fill"
                paint={{
                  "fill-color": "#2563eb",
                  "fill-opacity": 0.035,
                }}
              />

              <Layer
                id="risk-analysis-context-outline"
                type="line"
                paint={{
                  "line-color": "#2563eb",
                  "line-width": 2,
                  "line-opacity": 0.8,
                  "line-dasharray": [3, 2],
                }}
              />
            </Source>
          )}

          {selectedPoint && (
            <Marker
              longitude={selectedPoint.longitude}
              latitude={selectedPoint.latitude}
              anchor="center"
            >
              <div className="h-4 w-4 rounded-full border-[3px] border-white bg-blue-600 shadow-lg ring-4 ring-blue-500/20" />
            </Marker>
          )}

          {riskOverlay !== "none" && (
            <HazardLegend
              riskOverlay={riskOverlay}
            />
          )}
        </Map>

        <MapControls
          terrainEnabled={terrainEnabled}
          setTerrainEnabled={setTerrainEnabled}
          riskOverlay={riskOverlay}
          setRiskOverlay={setRiskOverlay}
          hasSelectedSite={selectedPoint !== null}
        />

        {!selectedPoint && (
          <div
            className="
              pointer-events-none
              absolute left-1/2 top-4 z-20
              -translate-x-1/2
              rounded-xl border border-slate-200
              bg-white/95 px-4 py-2
              text-xs font-medium text-slate-600
              shadow-sm backdrop-blur
            "
          >
            Click anywhere on the map to analyse a site
          </div>
        )}
      </div>

      {/* =========================================================
          ANALYSIS PANEL
      ========================================================= */}
      {selectedPoint && (
        <aside className="risk-analysis-panel w-[350px] shrink-0 overflow-y-auto border-l border-slate-200 bg-white">
          <div className="p-4">
            {/* Header */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Site analysis
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              Multi-hazard profile
            </p>
          </div>

          {/* Location */}
          <div className="mt-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Selected location
            </p>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <ResultStat
                label="Longitude"
                value={selectedPoint.longitude.toFixed(5)}
              />

              <ResultStat
                label="Latitude"
                value={selectedPoint.latitude.toFixed(5)}
              />
            </div>
          </div>

          {/* Radius */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-600">
                Surrounding context
              </p>

              
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2">
              {[250, 500, 1000].map((value) => (
                <button
                  key={value}
                  onClick={() =>
                    setRadius(value as AnalysisRadius)
                  }
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    radius === value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {value === 1000
                    ? "1 km"
                    : `${value} m`}
                </button>
              ))}
            </div>
          </div>

          {/* Hazards */}
          <div className="mt-5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Hazard assessment
            </p>

            <div className="mt-2 rounded-xl border border-slate-200 px-3">
              <HazardAssessment
                name="Flood"
                point={hazards.flood}
                area={areaHazards.flood}
                radius={radius}
              />

              <HazardAssessment
                name="Tsunami"
                point={hazards.tsunami}
                area={areaHazards.tsunami}
                radius={radius}
              />

              <HazardAssessment
                name="Landslide"
                point={hazards.landslide}
                area={areaHazards.landslide}
                radius={radius}
              />

              <HazardAssessment
                name="Earthquake"
                point={hazards.earthquake}
                radius={radius}
              />
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Exposure
              </p>

              <span className="text-[10px] text-slate-400">
                WorldPop 2025
              </span>
            </div>

            {populationExposure.status ===
              "loading" && (
              <div className="mt-2 rounded-xl border border-slate-200 p-3">
                <p className="text-xs text-slate-500">
                  Estimating population within the selected area...
                </p>
              </div>
            )}

            {populationExposure.status ===
              "success" && (
              <div className="mt-2 rounded-xl border border-slate-200 p-3">
                <div className="grid grid-cols-3 gap-3">
                  <AreaMetric
                    label="Population"
                    value={
                      populationExposure.population !==
                      null
                        ? Math.round(
                            populationExposure.population
                          ).toLocaleString()
                        : "—"
                    }
                  />

                  <AreaMetric
                    label="Density"
                    value={
                      populationExposure.densityPerKm2 !==
                      null
                        ? `${Math.round(
                            populationExposure.densityPerKm2
                          ).toLocaleString()}/km²`
                        : "—"
                    }
                  />

                  <AreaMetric
                    label="Area"
                    value={
                      populationExposure.areaKm2 !==
                      null
                        ? `${populationExposure.areaKm2.toFixed(
                            2
                          )} km²`
                        : "—"
                    }
                  />
                </div>

                
              </div>
            )}

            {populationExposure.status ===
              "error" && (
              <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
                <p className="text-xs text-amber-700">
                  Population data temporarily unavailable.
                </p>
              </div>
            )}
          </div>

          {/* Site summary */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Site summary
            </p>

            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Mapped hazard context
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-700">
                  {hazardSummary}
                </p>
              </div>

              <div className="mt-3 border-t border-slate-200 pt-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Key concern
                </p>

                <p className="mt-1 text-xs font-medium leading-5 text-slate-800">
                  {keyConcern}
                </p>
              </div>
            </div>
          </div>

          {/* Continue to simulation */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Next step
            </p>

            <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
              <p className="text-xs font-semibold text-slate-800">
                Test a development scenario
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Continue with this exact location and explore
                how a proposed development could change runoff,
                green space, and population exposure.
              </p>

              <Link
                href={buildLocationUrl(
                  "/simulate",
                  selectedPoint.latitude,
                  selectedPoint.longitude
                )}
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Simulate development here →
              </Link>
            </div>
          </div>

          {/* Source note */}
          <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] leading-4 text-slate-400">
            Source: BNPB InaRISK. Center-point values represent
            the raster cell at the selected location. Area
            statistics summarize valid raster samples within the
            selected radius.
          </p>
          </div>
        </aside>

      )}
    </div>
  );
}

async function fetchHazard(
  type: HazardType,
  longitude: number,
  latitude: number
): Promise<HazardResult> {
  const endpoint = HAZARD_ENDPOINTS[type];

  const response = await fetch(
    `${endpoint}?lon=${longitude}&lat=${latitude}`
  );

  if (!response.ok) {
    throw new Error(
      `${type} hazard request failed: ${response.status}`
    );
  }

  const data = await response.json();

  const value =
    typeof data.value === "number"
      ? data.value
      : null;

    return {
      status: value !== null
        ? "success"
        : "no-data",
      value,
      hasData: data.hasData === true,
      resolutionMeters:
        data.resolutionMeters ?? null,
      source: data.source ?? "BNPB InaRISK",
      category: classifyHazard(value),
    };
}

async function fetchAreaHazard(
  type: AreaHazardType,
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  signal?: AbortSignal
): Promise<HazardAreaResult> {
  const endpoint =
    AREA_HAZARD_ENDPOINTS[type];

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      polygon,
      sampleCount: 25,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `${type} area hazard request failed: ${response.status}`
    );
  }

  const data = await response.json();

  const hasData =
    data.hasData === true &&
    typeof data.average === "number";

  return {
    status: hasData
      ? "success"
      : "no-data",

    average:
      typeof data.average === "number"
        ? data.average
        : null,

    maximum:
      typeof data.maximum === "number"
        ? data.maximum
        : null,

    minimum:
      typeof data.minimum === "number"
        ? data.minimum
        : null,

    validSamples:
      data.validSamples ?? 0,

    totalSamples:
      data.totalSamples ?? 0,

    hasData,
  };
}

function HazardAreaSummary({
  label,
  result,
  radius,
}: {
  label: string;
  result: HazardAreaResult;
  radius: AnalysisRadius;
}) {
  const radiusLabel =
    radius === 1000
      ? "1 km"
      : `${radius} m`;

  if (result.status === "idle") {
    return null;
  }

  if (result.status === "loading") {
    return (
      <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-700">
              {label} · area analysis
            </p>

            <p className="mt-0.5 text-[10px] text-slate-500">
              Analysing raster samples within{" "}
              {radiusLabel}
            </p>
          </div>

          <span className="text-[10px] text-blue-600">
            Checking...
          </span>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-300" />
        </div>
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
        <p className="text-xs font-medium text-slate-700">
          {label} · area analysis
        </p>

        <p className="mt-1 text-[10px] text-amber-700">
          Area data temporarily unavailable.
        </p>
      </div>
    );
  }

  if (
    result.status === "no-data" ||
    !result.hasData
  ) {
    return (
      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-medium text-slate-700">
          {label} · area analysis
        </p>

        <p className="mt-1 text-[10px] text-slate-500">
          No valid mapped samples within{" "}
          {radiusLabel}.
        </p>
      </div>
    );
  }

  const coveragePercent =
    result.totalSamples > 0
      ? Math.round(
          (result.validSamples /
            result.totalSamples) *
            100
        )
      : 0;

  return (
    <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-blue-700">
            {label} · area analysis
          </p>

          <p className="mt-0.5 text-[10px] text-slate-500">
            Valid raster samples within{" "}
            {radiusLabel}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-medium text-blue-700">
          {coveragePercent}% data coverage
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <AreaMetric
          label="Avg. valid"
          value={
            result.average !== null
              ? result.average.toFixed(3)
              : "—"
          }
        />

        <AreaMetric
          label="Maximum"
          value={
            result.maximum !== null
              ? result.maximum.toFixed(3)
              : "—"
          }
        />

        <AreaMetric
          label="Valid cells"
          value={`${result.validSamples}/${result.totalSamples}`}
        />
      </div>
    </div>
  );
}

function classifyHazard(
  value: number | null
): HazardCategory {
  if (value === null) {
    return "no-data";
  }

  if (value < 0.33) {
    return "low";
  }

  if (value < 0.66) {
    return "moderate";
  }

  return "high";
}

function HazardRow({
  label,
  hazard,
}: {
  label: string;
  hazard: HazardResult;
  }) {
    if (hazard.status === "loading") {
      return (
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-800">
              {label}
            </p>

            <span className="text-xs text-slate-400">
              Checking...
            </span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-slate-300" />
          </div>
        </div>
      );
    }

    if (hazard.status === "error") {
      return (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-800">
              {label}
            </p>

            <span className="text-xs text-amber-700">
              Unavailable
            </span>
          </div>
        </div>
      );
    }

    if (hazard.status === "no-data") {
      return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              {label}
            </p>

            <HazardBadge category="no-data" />
          </div>

          <p className="mt-1 text-xs text-slate-500">
            No mapped value at this location.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-slate-800">
            {label}
          </p>

          <HazardBadge
            category={hazard.category}
          />
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-2xl font-semibold text-slate-900">
              {hazard.value?.toFixed(3)}
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              Hazard index
            </p>
          </div>

          {hazard.resolutionMeters && (
            <p className="text-[11px] text-slate-400">
              {hazard.resolutionMeters} m
            </p>
          )}
        </div>
      </div>
    );
  }


function HazardBadge({
  category,
}: {
  category: HazardCategory;
}) {
  const styles: Record<
    HazardCategory,
    string
  > = {
    low: "bg-emerald-50 text-emerald-700",
    moderate: "bg-amber-50 text-amber-700",
    high: "bg-red-50 text-red-700",
    "no-data":
      "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[category]}`}
    >
      {formatCategory(category)}
    </span>
  );
}

function ResultStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5">
      <p className="text-[11px] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

function formatCategory(
  category: HazardCategory
) {
  switch (category) {
    case "low":
      return "Low";

    case "moderate":
      return "Moderate";

    case "high":
      return "High";

    default:
      return "No data";
  }
}

function formatHazardName(
  type: "flood" | "tsunami" | "landslide"
) {
  switch (type) {
    case "flood":
      return "Flood";
    case "tsunami":
      return "Tsunami";
    case "landslide":
      return "Landslide";
  }
}

function formatHazardList(
  hazards: string[]
) {
  if (hazards.length === 0) {
    return "";
  }

  if (hazards.length === 1) {
    return hazards[0];
  }

  if (hazards.length === 2) {
    return `${hazards[0]} and ${hazards[1]}`;
  }

  return `${hazards
    .slice(0, -1)
    .join(", ")}, and ${hazards.at(-1)}`;
}

function AreaMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function HazardAssessment({
  name,
  point,
  area,
  radius,
}: {
  name: string;
  point: HazardResult;
  area?: HazardAreaResult;
  radius: AnalysisRadius;
}) {
  const radiusLabel =
    radius === 1000 ? "1 km" : `${radius} m`;

  const areaMapped =
    area?.status === "success" &&
    area.hasData;

  const pointMapped =
    point.status === "success" &&
    point.hasData;

  const coverage =
    area &&
    area.totalSamples > 0
      ? Math.round(
          (area.validSamples / area.totalSamples) * 100
        )
      : null;

  return (
    <div className="border-b border-slate-100 py-4 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">
          {name}
        </p>

        <span
          className={`rounded-full px-2 py-1 text-[10px] font-medium ${
            pointMapped || areaMapped
              ? "bg-blue-50 text-blue-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {pointMapped || areaMapped
            ? "Mapped"
            : "No mapped data"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Point
          </p>

          <p className="mt-1 text-lg font-semibold text-slate-900">
            {pointMapped && point.value !== null
              ? point.value.toFixed(3)
              : "—"}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Within {radiusLabel}
          </p>

          {areaMapped ? (
            <>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Avg {area!.average?.toFixed(3)}
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Max {area!.maximum?.toFixed(3)}
                {" · "}
                {area!.validSamples}/{area!.totalSamples} mapped
                {coverage !== null
                  ? ` (${coverage}%)`
                  : ""}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-400">
              —
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MapControls({
  terrainEnabled,
  setTerrainEnabled,
  riskOverlay,
  setRiskOverlay,
  hasSelectedSite,
}: {
  terrainEnabled: boolean;
  setTerrainEnabled: (value: boolean) => void;
  riskOverlay: RiskOverlay;
  setRiskOverlay: (value: RiskOverlay) => void;
  hasSelectedSite: boolean;
}) {
  return (
    <div
      className="
        absolute right-4 top-4 z-30
        w-[280px]
        overflow-hidden rounded-2xl
        border border-slate-200/80
        bg-white/95 shadow-lg backdrop-blur-md
        transition-all duration-200
      "
    >
      {/* View */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          View
        </p>

        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setTerrainEnabled(false)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${
              !terrainEnabled
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            2D
          </button>

          <button
            type="button"
            onClick={() => setTerrainEnabled(true)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${
              terrainEnabled
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            3D
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Hazard overlay */}
      <div className="px-3 py-2.5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Hazard overlay
        </p>

        <div className="grid grid-cols-4 rounded-xl bg-slate-100 p-1">
          {(["none", "flood", "tsunami", "landslide"] as const).map(
            (overlay) => (
              <button
                key={overlay}
                type="button"
                onClick={() => setRiskOverlay(overlay)}
                className={`min-w-0 rounded-lg px-1.5 py-1.5 text-[10px] font-medium transition ${
                  riskOverlay === overlay
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {overlay === "none"
                  ? "None"
                  : overlay === "landslide"
                    ? "Landslide"
                    : overlay[0].toUpperCase() + overlay.slice(1)}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function HazardLegend({
  riskOverlay,
}: {
  riskOverlay: Exclude<RiskOverlay, "none">;
}) {
  return (
    <div
      className="
        absolute bottom-4 right-4 z-20
        rounded-xl
        border border-slate-200
        bg-white/95
        px-3 py-2
        shadow-sm
        backdrop-blur
      "
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor:
              OVERLAY_STYLE[riskOverlay].tint,
          }}
        />

        <div>
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
            Hazard overlay
          </p>

          <p className="text-xs font-semibold text-slate-800">
            {OVERLAY_STYLE[riskOverlay].label}
          </p>
        </div>
      </div>

      <p className="mt-1 text-[9px] text-slate-400">
        BNPB InaRISK
      </p>
    </div>
  );
}