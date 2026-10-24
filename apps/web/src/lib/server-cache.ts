type CacheEntry<T> = {
  value: T;
  createdAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 min
const MAX_ENTRIES = 300;

export function getCached<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > ttlMs) return null;
  return entry.value as T;
}

/** Last known good value, used as a fallback when the upstream is down. */
export function getStaleCached<T>(
  key: string,
  maxAgeMs = 24 * 60 * 60 * 1000
): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > maxAgeMs) return null;
  return entry.value as T;
}

export function setCached<T>(key: string, value: T) {
  // Re-insert so the Map's insertion order doubles as recency order.
  cache.delete(key);
  cache.set(key, { value, createdAt: Date.now() });

  // Bounded: drop the oldest entries instead of growing forever.
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/**
 * Stable cache key for a polygon. Coordinates are rounded (5 dp is about 1 m)
 * so tiny floating-point differences still hit the cache.
 */
export function polygonCacheKey(
  prefix: string,
  polygon: unknown,
  ...extra: Array<string | number>
) {
  const round = (value: unknown): unknown =>
    typeof value === "number"
      ? Math.round(value * 1e5) / 1e5
      : Array.isArray(value)
        ? value.map(round)
        : value;

  const coordinates = (
    polygon as { geometry?: { coordinates?: unknown } } | undefined
  )?.geometry?.coordinates;

  return [prefix, ...extra, JSON.stringify(round(coordinates))].join(":");
}
