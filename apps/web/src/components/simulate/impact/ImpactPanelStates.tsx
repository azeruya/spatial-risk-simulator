const SHELL =
  "flex h-full w-full flex-col border-l border-slate-200 bg-white";

function Header({ title }: { title: string }) {
  return (
    <>
      <div className="px-5 pb-4 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Scenario impact
        </p>

        <h2 className="mt-1.5 text-[17px] font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
      </div>

      <div className="mx-5 border-t border-slate-100" />
    </>
  );
}

export function ImpactEmptyState() {
  return (
    <aside className={SHELL}>
      <Header title="Site assessment" />

      <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6">
        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-600">
            1
          </div>

          <p className="mt-3 text-base font-semibold leading-6 text-slate-950">
            Define a site to begin
          </p>

          <p className="mt-2 max-w-[290px] text-sm leading-5 text-slate-600">
            Draw a project footprint or enter its size. SIVORA will then check
            mapped hazards, terrain and how your design changes the site.
          </p>
        </section>

        <section className="mt-7">
          <p className="text-xs font-medium text-slate-600">
            Assessment workflow
          </p>

          <ol className="mt-4">
            <WorkflowStep
              number="1"
              title="Define site"
              description="Draw or size the proposed project footprint."
              active
            />
            <WorkflowStep
              number="2"
              title="Check the site"
              description="Mapped hazards, terrain and nearby people."
            />
            <WorkflowStep
              number="3"
              title="Compare the proposal"
              description="See how your design changes surface conditions."
            />
            <WorkflowStep
              number="4"
              title="Test mitigation"
              description="Try measures that reduce development impacts."
              last
            />
          </ol>
        </section>

        <p className="mt-auto rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-5 text-slate-600">
          Results are screening-level planning indicators, not detailed
          engineering analysis.
        </p>
      </div>
    </aside>
  );
}

/** Skeleton of the finished panel, so the layout doesn't jump when results arrive. */
export function ImpactLoadingState() {
  return (
    <aside className={SHELL} aria-busy="true">
      <Header title="Building site assessment…" />

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <p className="text-xs leading-5 text-slate-600">
          Checking mapped hazards, terrain and nearby people for your footprint.
        </p>

        <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />

        <div className="grid grid-cols-2 gap-2">
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        </div>

        <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </aside>
  );
}

function WorkflowStep({
  number,
  title,
  description,
  active = false,
  last = false,
}: {
  number: string;
  title: string;
  description: string;
  active?: boolean;
  last?: boolean;
}) {
  return (
    <li className="relative flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          {number}
        </div>

        {!last && <div className="my-1 h-10 w-px bg-slate-200" />}
      </div>

      <div className={last ? "pb-0" : "pb-4"}>
        <p
          className={`text-sm font-semibold ${
            active ? "text-slate-900" : "text-slate-600"
          }`}
        >
          {title}
        </p>

        <p className="mt-0.5 max-w-[260px] text-xs leading-4 text-slate-500">
          {description}
        </p>
      </div>
    </li>
  );
}