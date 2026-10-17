"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Map, { Marker, Source, Layer, MapRef } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { circle } from "@turf/circle";
import bbox from "@turf/bbox";

import RiskMapControls from "./RiskMapControls";
import RiskAnalysisPanel from "./RiskAnalysisPanel";

import type {
  SelectedPoint,
  SiteHazards,
  AreaHazards,
  HazardResult,
  HazardAreaResult,
  HazardType,
  HazardCategory,
  AreaHazardType,
  AnalysisRadius,
  RiskOverlay,
  PopulationExposure,
} from "@/types/risk";

import type {
  TerrainAnalysis,
} from "@/types/terrain";


setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

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
  const [selectedPoint, setSelectedPoint] =
    useState<SelectedPoint | null>(null);

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

  const [terrainAnalysis, setTerrainAnalysis] =
    useState<TerrainAnalysis | null>(null);

  const [terrainLoading, setTerrainLoading] =
    useState(false);

  const [terrainError, setTerrainError] =
    useState(false);

  const [terrainEnabled, setTerrainEnabled] =
    useState(false);

  const mapRef = useRef<MapRef | null>(null);

  const [riskOverlay, setRiskOverlay] =
    useState<RiskOverlay>("none");

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
              status: "unavailable",
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
    if (!selectedPoint) {
      setTerrainAnalysis(null);
      setTerrainError(false);
      return;
    }

    const point = selectedPoint;

    const controller =
      new AbortController();

    async function loadTerrain() {
      setTerrainLoading(true);
      setTerrainError(false);

      try {
        const response = await fetch(
          "/api/terrain/analyse",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              longitude:
                point.longitude,

              latitude:
                point.latitude,

              radiusMeters:
                radius,
            }),

            signal:
              controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "Terrain analysis failed"
          );
        }

        const data: TerrainAnalysis =
          await response.json();

        setTerrainAnalysis(data);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Terrain analysis error:",
          error
        );

        setTerrainAnalysis(null);
        setTerrainError(true);
      } finally {
        setTerrainLoading(false);
      }
    }

    loadTerrain();

    return () => {
      controller.abort();
    };
  }, [selectedPoint, radius]);

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

  function handleMapClick(event: {
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

        <RiskMapControls
          terrainEnabled={terrainEnabled}
          setTerrainEnabled={setTerrainEnabled}
          riskOverlay={riskOverlay}
          setRiskOverlay={setRiskOverlay}
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
        <RiskAnalysisPanel
          selectedPoint={selectedPoint}
          radius={radius}
          setRadius={setRadius}
          hazards={hazards}
          areaHazards={areaHazards}
          populationExposure={populationExposure}
          terrainAnalysis={terrainAnalysis}
          terrainLoading={terrainLoading}
          terrainError={terrainError}
          hazardSummary={hazardSummary}
          keyConcern={keyConcern}
        />
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
      sampleCount: 12,
    }),

    signal,
  });

  if (!response.ok) {
    throw new Error(
      `${type} hazard request failed: ${response.status}`
    );
  }

  const data = await response.json();

  const validSamples =
    typeof data.validSamples === "number"
      ? data.validSamples
      : 0;

  const totalSamples =
    typeof data.totalSamples === "number"
      ? data.totalSamples
      : 0;

  const average =
    typeof data.average === "number"
      ? data.average
      : null;

  const maximum =
    typeof data.maximum === "number"
      ? data.maximum
      : null;

  const minimum =
    typeof data.minimum === "number"
      ? data.minimum
      : null;

  const hasData =
    validSamples > 0 &&
    (
      average !== null ||
      maximum !== null ||
      minimum !== null
    );

  return {
    status: hasData
      ? "success"
      : "no-data",

    average,
    maximum,
    minimum,

    validSamples,
    totalSamples,

    hasData,
  };
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