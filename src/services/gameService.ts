import { fetchLiveFeed } from '../mlb/mlbClient.js';
import { cacheGet, cacheSet } from '../cache/cache.js';
import type { MlbLiveFeed } from '../mlb/mlbTypes.js';

const CACHE_TTL = 5;

export async function getLiveFeed(gamePk: number): Promise<MlbLiveFeed> {
  const cacheKey = `livefeed:${gamePk}`;

  const cached = cacheGet<MlbLiveFeed>(cacheKey);
  if (cached) return cached;

  const data = await fetchLiveFeed(gamePk);
  cacheSet(cacheKey, data, CACHE_TTL);
  return data;
}
