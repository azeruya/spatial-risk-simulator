type CacheEntry<T> = {
  value: T;
  createdAt: number;
};

const cache =
  new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS =
  10 * 60 * 1000; // 10 min

export function getCached<T>(
  key: string,
  ttlMs = DEFAULT_TTL_MS
): T | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  const age =
    Date.now() - entry.createdAt;

  if (age > ttlMs) {
    return null;
  }

  return entry.value as T;
}

export function getStaleCached<T>(
  key: string,
  maxAgeMs =
    24 * 60 * 60 * 1000
): T | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  const age =
    Date.now() - entry.createdAt;

  if (age > maxAgeMs) {
    return null;
  }

  return entry.value as T;
}

export function setCached<T>(
  key: string,
  value: T
) {
  cache.set(key, {
    value,
    createdAt: Date.now(),
  });
}