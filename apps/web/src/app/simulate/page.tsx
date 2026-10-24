import { Suspense } from "react";

import SimulateClient from "./SimulateClient";

// useSearchParams() in the client component needs a Suspense boundary, or
// `next build` fails / opts the whole route out of static rendering.
export default function SimulatePage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-[calc(100vh-64px)] items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">Loading simulator…</p>
        </main>
      }
    >
      <SimulateClient />
    </Suspense>
  );
}
