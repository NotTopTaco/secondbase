import { getDb } from '../db/connection.js';

const seasonCache = new Map<string, number>();

const SEASON_TABLES = [
  'batter_hot_zones',
  'pitcher_tto_splits',
  'pitcher_tendencies',
  'batter_game_stats',
  'pitcher_game_stats',
  'batter_count_stats',
  'batter_defensive_alignment',
  'pitcher_count_tendencies',
  'pitch_tunneling',
  'umpire_stats',
] as const;

type SeasonTable = typeof SEASON_TABLES[number];

export function getLatestSeasonFor(table: SeasonTable): number {
  const cached = seasonCache.get(table);
  if (cached !== undefined) return cached;

  const db = getDb();
  const row = db.prepare(`SELECT MAX(season) as s FROM ${table}`).get() as { s: number | null } | undefined;
  const season = row?.s || new Date().getFullYear();
  seasonCache.set(table, season);
  return season;
}

export function invalidateSeasonCache(): void {
  seasonCache.clear();
}
