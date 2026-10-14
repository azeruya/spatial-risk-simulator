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
    <header
    className="
        relative z-50
        border-b border-slate-200/80
        bg-white/95
        shadow-[0_2px_10px_rgba(15,23,42,0.06)]
        backdrop-blur-xl
    "
    >
      <div className="flex h-[72px] items-center justify-between px-6">

        {/* Brand */}
        <Link
          href="/"
          className="
            group flex items-center gap-3
            rounded-xl
            transition
          "
        >
          <div
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl
              bg-blue-600
              text-sm font-bold text-white
              shadow-[0_4px_12px_rgba(37,99,235,0.28)]
              transition-transform duration-200
              group-hover:scale-[1.03]
            "
          >
            S
          </div>

          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight text-slate-950">
            SIVORA
            </p>

            <p className="mt-0.5 text-[10px] font-medium text-slate-400">
            Spatial intelligence platform
            </p>
          </div>
        </Link>

        {/* Workflow */}
        <div
        className="
            relative rounded-2xl
            bg-slate-100/90
            p-1.5
        "
        >
          {/* Sliding active background */}
          <div
            className="
                absolute bottom-1.5 top-1.5
                rounded-xl
                border border-slate-200/70
                bg-white
                shadow-[0_2px_8px_rgba(15,23,42,0.08)]
                transition-all duration-300
                ease-[cubic-bezier(0.22,1,0.36,1)]
                "
            style={{
              width: `calc((100% - 12px) / 3)`,
              left: `calc(6px + ${activeIndex} * ((100% - 12px) / 3))`,
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
                  className="
                    min-w-[104px]
                    rounded-xl
                    px-4 py-2
                    text-center
                    transition-colors
                  "
                >
                  <p
                    className={`
                      text-xs font-semibold
                      transition-colors duration-200
                      ${
                        active
                          ? "text-slate-950"
                          : "text-slate-400 hover:text-slate-600"
                      }
                    `}
                  >
                    {step.label}
                  </p>

                  <p
                    className={`
                      mt-0.5
                      text-[9px]
                      font-medium
                      transition-colors duration-200
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
            })}
          </div>
        </div>
      </div>
    </header>
  );
}