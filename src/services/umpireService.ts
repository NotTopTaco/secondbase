import { getDb } from '../db/connection.js';
import { fetchBoxscore } from '../mlb/mlbClient.js';
import { getLatestSeasonFor } from './seasonCache.js';
import { cacheGet, cacheSet } from '../cache/cache.js';
import type { UmpireResponse } from '../types/analytics.js';

export async function getUmpireData(gamePk: number): Promise<UmpireResponse> {
  const cacheKey = `umpire:${gamePk}`;
  const cached = cacheGet<UmpireResponse>(cacheKey);
  if (cached) return cached;

  let umpireId: number | null = null;
  let umpireName: string | null = null;

  try {
    const boxscore = await fetchBoxscore(gamePk);
    const hpUmpire = boxscore.officials?.find(o => o.officialType === 'Home Plate');
    if (hpUmpire) {
      umpireId = hpUmpire.official.id;
      umpireName = hpUmpire.official.fullName;
    }
  } catch {
    // Boxscore may not be available yet
  }

  if (!umpireId) {
    const result: UmpireResponse = { umpire: null, zones: [], stats: null };
    return result;
  }

  const db = getDb();
  const season = getLatestSeasonFor('umpire_stats');

  // Try to find umpire by ID first, fall back to game_pk-based data
  const zones = db.prepare(
    `SELECT zone_id, called_strike_pct, sample_size FROM umpire_zones
     WHERE umpire_id = ? AND season = ?`
  ).all(umpireId, season) as Array<{ zone_id: number; called_strike_pct: number; sample_size: number }>;

  const statsRow = db.prepare(
    `SELECT accuracy_pct, expanded_zone_rate, consistency_rating FROM umpire_stats
     WHERE umpire_id = ? AND season = ?`
  ).get(umpireId, season) as { accuracy_pct: number; expanded_zone_rate: number; consistency_rating: number } | undefined;

  const result: UmpireResponse = {
    umpire: { id: umpireId, name: umpireName! },
    zones: zones.map(z => ({
      zoneId: z.zone_id,
      calledStrikePct: z.called_strike_pct,
      sampleSize: z.sample_size,
    })),
    stats: statsRow ? {
      accuracyPct: statsRow.accuracy_pct,
      expandedZoneRate: statsRow.expanded_zone_rate,
      consistencyRating: statsRow.consistency_rating,
    } : null,
  };

  cacheSet(cacheKey, result, 300); // Cache for 5 minutes
  return result;
}
