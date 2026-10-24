import { RAIL } from "./dimensions";

/**
 * Same grid and rail widths as <Workspace/>, with placeholder content.
 * Used as the Suspense / loading fallback so the real page drops in
 * without any layout shift.
 */
export default function WorkspaceSkeleton({
  right = false,
  message = "Loading…",
}: {
  right?: boolean;
  message?: string;
}) {
  return (
    <main
      className="grid h-[calc(100vh-var(--nav-h))] overflow-hidden bg-slate-50 supports-[height:100dvh]:h-[calc(100dvh-var(--nav-h))]"
      style={{
        gridTemplateColumns: `${RAIL.left}px minmax(0, 1fr) ${right ? RAIL.right : 0}px`,
        gridTemplateRows: "minmax(0, 1fr)",
      }}
    >
      <aside className="min-w-0 overflow-hidden border-r border-slate-200 bg-white p-5">
        <div className="animate-pulse">
          <div className="h-3 w-20 rounded bg-slate-200" />
          <div className="mt-3 h-6 w-48 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-64 rounded bg-slate-100" />

          <div className="mt-8 space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 p-4">
                <div className="h-4 w-32 rounded bg-slate-100" />
                <div className="mt-3 h-3 w-48 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-slate-300 border-t-slate-700" />
          <p className="mt-3 text-sm text-slate-600">{message}</p>
        </div>
      </div>

      {right ? (
        <aside className="min-w-0 overflow-hidden border-l border-slate-200 bg-white p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="h-24 rounded-2xl bg-slate-100" />
            <div className="h-16 rounded-2xl bg-slate-100" />
          </div>
        </aside>
      ) : (
        <div aria-hidden />
      )}
    </main>
  );
}
