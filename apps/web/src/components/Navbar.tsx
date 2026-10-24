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

  // -1 on the landing page, so no step is shown as active there.
  const activeIndex = steps.findIndex((step) =>
    pathname.startsWith(step.href)
  );

  return (
    <header
      className="
        relative z-50
        border-b border-slate-200/70
        bg-white/95
        shadow-[0_1px_6px_rgba(15,23,42,0.04)]
        backdrop-blur-xl
      "
    >
      <div className="flex h-16 items-center justify-between px-6">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-2.5"
        >
          <div
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-xl
              bg-blue-600
              text-xs font-bold text-white
              shadow-[0_3px_10px_rgba(37,99,235,0.24)]
              transition-transform duration-200
              group-hover:scale-[1.03]
            "
          >
            S
          </div>

          <div className="leading-none">
            <p className="text-sm font-semibold tracking-tight text-slate-950">
              SIVORA
            </p>

            <p className="mt-1 text-[9px] font-medium text-slate-400">
              Spatial intelligence platform
            </p>
          </div>
        </Link>

        {/* Workflow */}
        <div
          className="
            relative
            rounded-xl
            bg-slate-100/90
            p-1
          "
        >
          {/* Active background */}
          <div
            className={`
              absolute bottom-1 top-1
              rounded-lg
              border border-slate-200/70
              bg-white
              shadow-[0_1px_5px_rgba(15,23,42,0.08)]
              transition-all duration-300
              ease-[cubic-bezier(0.22,1,0.36,1)]
              ${activeIndex >= 0 ? "opacity-100" : "opacity-0"}
            `}
            style={{
              width:
                "calc((100% - 8px) / 3)",
              left: `calc(
                4px +
                ${Math.max(activeIndex, 0)} *
                ((100% - 8px) / 3)
              )`,
            }}
          />

          <div className="relative z-10 grid grid-cols-3">
            {steps.map(
              (step, index) => {
                const active =
                  index === activeIndex;

                return (
                  <Link
                    key={step.href}
                    href={step.href}
                    className="
                      min-w-[88px]
                      rounded-lg
                      px-3 py-1.5
                      text-center
                      transition-colors
                    "
                  >
                    <p
                      className={`
                        text-[11px]
                        font-semibold
                        transition-colors
                        duration-200
                        ${
                          active
                            ? "text-slate-950"
                            : "text-slate-500 hover:text-slate-700"
                        }
                      `}
                    >
                      {step.label}
                    </p>

                    <p
                      className={`
                        mt-0.5
                        text-[8px]
                        font-medium
                        transition-colors
                        duration-200
                        ${
                          active
                            ? "text-blue-600"
                            : "text-slate-300"
                        }
                      `}
                    >
                      {step.subtitle}
                    </p>
                  </Link>
                );
              }
            )}
          </div>
        </div>
      </div>
    </header>
  );
}