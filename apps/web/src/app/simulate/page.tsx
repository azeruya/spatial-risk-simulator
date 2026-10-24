import { Suspense } from "react";

import WorkspaceSkeleton from "@/components/shell/WorkspaceSkeleton";

import SimulateClient from "./SimulateClient";

// useSearchParams() in the client component needs a Suspense boundary, or
// `next build` fails. The fallback uses the same grid and rail widths as the
// real page, so nothing shifts when it swaps in.
export default function SimulatePage() {
  return (
    <Suspense
      fallback={<WorkspaceSkeleton right message="Loading simulator…" />}
    >
      <SimulateClient />
    </Suspense>
  );
}
