import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

export function cacheGet<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function cacheSet<T>(key: string, value: T, ttl?: number): void {
  if (ttl !== undefined) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
}

export function cacheDel(key: string): void {
  cache.del(key);
}

const inflight = new Map<string, Promise<unknown>>();

export async function cacheGetOrCompute<T>(
  key: string,
  ttl: number,
  compute: () => T | Promise<T>,
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) return cached;

  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = Promise.resolve()
    .then(() => compute())
    .then((result) => {
      cache.set(key, result, ttl);
      return result;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}
