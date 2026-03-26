import { config } from '../config.js';
import type { MlbScheduleResponse, MlbLiveFeed } from './mlbTypes.js';

const TIMEOUT_MS = 10000;

async function fetchMlb<T>(path: string): Promise<T> {
  const url = `${config.MLB_API_BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`MLB API error: ${res.status} ${res.statusText} for ${url}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSchedule(date?: string): Promise<MlbScheduleResponse> {
  const d = date || new Date().toISOString().slice(0, 10);
  return fetchMlb<MlbScheduleResponse>(
    `/schedule?sportId=1&date=${d}&hydrate=team,linescore,probablePitcher`
  );
}

export async function fetchLiveFeed(gamePk: number): Promise<MlbLiveFeed> {
  // Live feed uses v1.1 endpoint
  const url = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`MLB API error: ${res.status} for live feed ${gamePk}`);
    }
    return (await res.json()) as MlbLiveFeed;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPlayer(playerId: number) {
  return fetchMlb(`/people/${playerId}?hydrate=currentTeam,stats(type=season)`);
}
