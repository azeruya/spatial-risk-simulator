/**
 * fetch() for third-party services (BNPB, WorldPop).
 *
 * Plain fetch() has no timeout, so a slow upstream used to hold requests open
 * for 60s+. This always applies a deadline, and also cancels when the caller's
 * signal aborts (e.g. the browser went away), so we stop hammering the service.
 * Requires Node 20.3+ (AbortSignal.any), which Next 15/16 already needs.
 */
export type UpstreamInit = RequestInit & { timeoutMs?: number };

export function upstreamFetch(url: string, init: UpstreamInit = {}) {
  const { timeoutMs = 10_000, signal, ...rest } = init;
  const deadline = AbortSignal.timeout(timeoutMs);

  return fetch(url, {
    cache: "no-store",
    ...rest,
    signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
  });
}

export function isAbortOrTimeout(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}
