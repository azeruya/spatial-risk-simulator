export default function Loading() {
  return (
    <main className="h-[calc(100vh-73px)]">
      <div className="flex h-full">
        {/* Sidebar skeleton */}
        <aside className="w-80 shrink-0 border-r border-slate-200 bg-white p-5">
          <div className="animate-pulse">
            <div className="h-7 w-40 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-56 rounded bg-slate-100" />

            <div className="mt-8 h-3 w-32 rounded bg-slate-200" />

            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <div className="h-8 w-20 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-24 rounded bg-slate-100" />
              <div className="mt-5 h-4 w-full rounded bg-slate-100" />
              <div className="mt-2 h-4 w-3/4 rounded bg-slate-100" />
            </div>

            <div className="mt-8 h-3 w-20 rounded bg-slate-200" />

            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <div className="h-4 w-36 rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Map skeleton */}
        <section className="flex flex-1 items-center justify-center bg-slate-100">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />

            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading live disaster data...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Fetching the latest BMKG information
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}