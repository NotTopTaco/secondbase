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
