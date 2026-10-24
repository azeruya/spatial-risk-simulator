import { useEffect, useState } from "react";

/**
 * Current time in ms, refreshed every minute. Returns null on the server and
 * on the first client render, so relative-time text never mismatches hydration.
 */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
