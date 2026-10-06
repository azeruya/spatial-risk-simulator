"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>

        <h1 className="mt-5 text-2xl font-semibold text-slate-900">
          Unable to load live data
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          We couldn&apos;t retrieve the latest disaster information right now.
          The data source may be temporarily unavailable.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs font-medium text-slate-500">
              Error details
            </summary>

            <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-200">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}