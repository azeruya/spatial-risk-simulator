import type {
  HazardStatus,
  PlanningAssessment,
} from "@/types/simulation";

import type {
  TerrainAnalysis,
} from "@/types/terrain";

type RadiusMeters = 250 | 500 | 1000;

type Props = {
  assessment: PlanningAssessment;

  terrain: TerrainAnalysis | null;

  nearbyPopulation: number | null;
  additionalPopulation: number;

  radiusMeters: RadiusMeters;

  onRadiusChange: (
    value: RadiusMeters
  ) => void;
};

export default function SiteContextGrid({
  assessment,
  terrain,
  nearbyPopulation,
  additionalPopulation,
  radiusMeters,
  onRadiusChange,
}: Props) {
  const hazards = [
    {
      label: "Tsunami",
      status: assessment.site.tsunami,
    },
    {
      label: "Flood",
      status: assessment.site.flood,
    },
  ];

  const elevationM =
    terrain?.elevation.mean ?? null;

  const peopleNearby =
    nearbyPopulation;

  return (
    <section>
      {/* HEADER */}
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-500">
          About the site
        </p>

        <p className="text-[10px] text-slate-400">
          Same in every scenario
        </p>
      </div>

      {/* SITE METRICS */}
      <div className="grid grid-cols-2 gap-2">
        {hazards.map((hazard) => (
          <HazardCard
            key={hazard.label}
            label={hazard.label}
            status={hazard.status}
          />
        ))}

        <MetricCard
          label="Ground height"
          value={
            elevationM !== null
              ? `${Math.round(
                  elevationM
                )} m`
              : "Unavailable"
          }
          helper={
            elevationM !== null
              ? "Approximate elevation"
              : undefined
          }
        />

        <MetricCard
          label={`People within ${formatRadius(radiusMeters)}`}
          value={
            peopleNearby !== null
              ? Math.round(
                  peopleNearby
                ).toLocaleString()
              : "Unavailable"
          }
          helper={
            additionalPopulation > 0
              ? `+${additionalPopulation.toLocaleString()} from your proposal`
              : "Existing population context"
          }
        />
      </div>

      {/* RADIUS CONTROL */}
      <div className="mt-2 flex justify-end">
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
          {(
            [
              250,
              500,
              1000,
            ] as const
          ).map((radius) => {
            const active =
              radius === radiusMeters;

            return (
              <button
                key={radius}
                type="button"
                onClick={() =>
                  onRadiusChange(radius)
                }
                className={`
                  rounded-md px-2.5 py-1
                  text-[10px] font-medium
                  transition
                  ${
                    active
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-400 hover:text-slate-700"
                  }
                `}
              >
                {formatRadius(radius)}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HazardCard({
  label,
  status,
}: {
  label: string;
  status: HazardStatus;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-slate-500">
          {label}
        </p>

        <p
          className={`text-xs font-semibold ${
            status === "high"
              ? "text-red-700"
              : status === "moderate"
                ? "text-amber-700"
                : status === "low"
                  ? "text-emerald-700"
                  : status === "none"
                    ? "text-slate-600"
                    : "text-slate-400"
          }`}
        >
          {formatHazardStatus(status)}
        </p>
      </div>

      <HazardMeter status={status} />

      <p className="mt-2 text-[10px] leading-4 text-slate-400">
        {hazardHelper(status)}
      </p>
    </div>
  );
}

function HazardMeter({
  status,
}: {
  status: HazardStatus;
}) {
  const level =
    status === "low"
      ? 1
      : status === "moderate"
        ? 2
        : status === "high"
          ? 3
          : 0;

  return (
    <div className="mt-3 grid grid-cols-3 gap-1">
      {[1, 2, 3].map((step) => (
        <div
          key={step}
          className={`h-1.5 rounded-full ${
            step <= level
              ? status === "high"
                ? "bg-red-700"
                : status ===
                    "moderate"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>

      {helper && (
        <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
          {helper}
        </p>
      )}
    </div>
  );
}

function formatRadius(
  radius: RadiusMeters
) {
  return radius === 1000
    ? "1 km"
    : `${radius} m`;
}

function formatHazardStatus(
  status: HazardStatus
) {
  switch (status) {
    case "low":
      return "Low";

    case "moderate":
      return "Moderate";

    case "high":
      return "High";

    case "none":
      return "No hazard value";

    case "no-data":
      return "No mapped data";

    case "unavailable":
      return "Unavailable";
  }
}

function hazardHelper(
  status: HazardStatus
) {
  switch (status) {
    case "low":
    case "moderate":
    case "high":
      return "Mapped hazard index";

    case "none":
      return "Mapped coverage, value is zero";

    case "no-data":
      return "No mapped coverage returned";

    case "unavailable":
      return "Analysis unavailable";
  }
}