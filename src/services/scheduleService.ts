import { fetchSchedule } from '../mlb/mlbClient.js';
import { cacheGet, cacheSet } from '../cache/cache.js';
import type { MlbScheduleResponse } from '../mlb/mlbTypes.js';

const CACHE_TTL = 60;

export async function getSchedule(date?: string): Promise<MlbScheduleResponse> {
  const d = date || new Date().toISOString().slice(0, 10);
  const cacheKey = `schedule:${d}`;

  const cached = cacheGet<MlbScheduleResponse>(cacheKey);
  if (cached) return cached;

  const data = await fetchSchedule(d);
  cacheSet(cacheKey, data, CACHE_TTL);
  return data;
}
