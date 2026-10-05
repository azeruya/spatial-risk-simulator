import Link from "next/link";
import {
  ArrowRight,
  Activity,
  ShieldAlert,
  Layers3,
  MapPinned,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Hero */}
      <section className="border-b border-slate-200">
        <div className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              <MapPinned className="h-4 w-4" />
              Disaster-aware spatial intelligence
            </div>

            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Understand risk.
              <br />
              Simulate before you build.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Explore current disaster conditions, understand long-term spatial
              risk, and simulate how proposed developments may impact the
              environment and surrounding communities.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/simulate"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Start a simulation
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/live"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Explore live data
              </Link>
            </div>
          </div>

          {/* Visual / Product Preview */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <p className="text-sm font-medium">Spatial Risk Overview</p>
                  <p className="text-xs text-slate-500">Padang, West Sumatra</p>
                </div>

                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  Live
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <MetricCard label="Flood Risk" value="78" status="High" />
                <MetricCard label="Earthquake Hazard" value="86" status="High" />
                <MetricCard label="Green Cover" value="46%" status="Current" />
                <MetricCard
                  label="Population Exposure"
                  value="11.9k"
                  status="1 km radius"
                />
              </div>

              <div className="mx-5 mb-5 flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
                <div className="text-center">
                  <Layers3 className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    Interactive geospatial map
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Live data, risk layers, and scenario results
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Flow */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            How it works
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            From what is happening now to what could happen next.
          </h2>

          <p className="mt-4 text-slate-600">
            The platform combines live disaster information, spatial risk
            intelligence, and development scenario simulation in one workflow.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <FeatureCard
            href="/live"
            number="01"
            icon={<Activity className="h-6 w-6" />}
            title="Live"
            description="See current disaster events, weather conditions, warnings, and recent reports from integrated data sources."
          />

          <FeatureCard
            href="/risk"
            number="02"
            icon={<ShieldAlert className="h-6 w-6" />}
            title="Risk"
            description="Understand long-term hazards, vulnerability, population exposure, and environmental conditions at a location."
          />

          <FeatureCard
            href="/simulate"
            number="03"
            icon={<Layers3 className="h-6 w-6" />}
            title="Simulate"
            description="Test proposed development scenarios and compare how changes may affect environmental and community risk."
            highlighted
          />
        </div>
      </section>

      {/* Value Proposition */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Beyond disaster monitoring
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Existing platforms show where risk is.
                <br />
                We help explore what your decisions may do to that risk.
              </h2>
            </div>

            <div className="space-y-4 text-slate-600">
              <p>
                A proposed development can alter vegetation, impermeable surface,
                runoff, heat exposure, and the number of people exposed to
                existing hazards.
              </p>

              <p>
                Our scenario engine is designed to compare baseline conditions
                against proposed development plans so planners can identify
                potential impacts before construction begins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="rounded-3xl bg-slate-900 px-8 py-14 text-white sm:px-12">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              What happens if we build here?
            </h2>

            <p className="mt-4 max-w-2xl text-slate-300">
              Select a location, understand its baseline risk, and test a
              development scenario before anything is built.
            </p>

            <Link
              href="/simulate"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Create a scenario
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>Spatial Risk Simulator</p>
          <p>Live intelligence · Risk analysis · Scenario simulation</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  href,
  number,
  icon,
  title,
  description,
  highlighted = false,
}: {
  href: string;
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  highlighted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-3xl border p-6 transition ${
        highlighted
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white hover:border-slate-400"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            highlighted
              ? "bg-white/10 text-white"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {icon}
        </div>

        <span
          className={`text-sm ${
            highlighted ? "text-slate-400" : "text-slate-400"
          }`}
        >
          {number}
        </span>
      </div>

      <h3 className="mt-8 text-2xl font-semibold">{title}</h3>

      <p
        className={`mt-3 leading-7 ${
          highlighted ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {description}
      </p>

      <div className="mt-8 flex items-center gap-2 text-sm font-medium">
        Explore
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function MetricCard({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-slate-500">{status}</p>
      </div>
    </div>
  );
}