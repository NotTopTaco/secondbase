import { getDb } from '../db/connection.js';
import { getLatestSeasonFor } from './seasonCache.js';
import type { TTOSplitResponse, PitcherTTOSplit } from '../types/analytics.js';

function getLatestSeason(): number {
  return getLatestSeasonFor('pitcher_tto_splits');
}

export function getTTOSplits(playerId: number, season?: number): TTOSplitResponse {
  const db = getDb();
  const s = season || getLatestSeason();

  const rows = db.prepare(
    'SELECT * FROM pitcher_tto_splits WHERE player_id = ? AND season = ? ORDER BY times_through'
  ).all(playerId, s) as PitcherTTOSplit[];

  return {
    splits: rows.map(r => ({
      timesThrough: r.times_through,
      pa: r.pa,
      ba: r.ba,
      slg: r.slg,
      woba: r.woba,
      kPct: r.k_pct,
      bbPct: r.bb_pct,
      avgExitVelo: r.avg_exit_velo,
    })),
  };
}
