"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const steps = [
  {
    href: "/live",
    label: "Live",
    subtitle: "Observe",
  },
  {
    href: "/risk",
    label: "Risk",
    subtitle: "Understand",
  },
  {
    href: "/simulate",
    label: "Simulate",
    subtitle: "Explore",
  },
];

export default function Navbar() {
  const pathname = usePathname();

  const activeIndex = Math.max(
    steps.findIndex((step) =>
      pathname.startsWith(step.href)
    ),
    0
  );

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex h-[72px] items-center justify-between px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
            S
          </div>

          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-900">
              SIVORA
            </p>

            <p className="text-[10px] text-slate-400">
              Spatial intelligence platform
            </p>
          </div>
        </Link>

        {/* Workflow navigation */}
        <div className="relative rounded-xl bg-slate-100 p-1">
          <div
            className="absolute bottom-1 top-1 rounded-lg bg-white shadow-sm transition-all duration-300 ease-out"
            style={{
              width: `calc((100% - 8px) / 3)`,
              left: `calc(4px + ${activeIndex} * ((100% - 8px) / 3))`,
            }}
          />

          <div className="relative z-10 grid grid-cols-3">
            {steps.map((step, index) => {
              const active =
                index === activeIndex;

              return (
                <Link
                  key={step.href}
                  href={step.href}
                  className="min-w-[96px] rounded-lg px-4 py-2 text-center transition-colors"
                >
                  <p
                    className={`text-xs font-semibold ${
                      active
                        ? "text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </p>

                  <p
                    className={`mt-0.5 text-[9px] ${
                      active
                        ? "text-blue-600"
                        : "text-slate-400"
                    }`}
                  >
                    {step.subtitle}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}