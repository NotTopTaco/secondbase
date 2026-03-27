import { getDb } from '../db/connection.js';
import type { CountStatsResponse, BatterCountStat } from '../types/analytics.js';

function getLatestSeason(): number {
  const db = getDb();
  const row = db.prepare('SELECT MAX(season) as s FROM batter_count_stats').get() as { s: number | null } | undefined;
  return row?.s || new Date().getFullYear();
}

export function getCountStats(playerId: number, season?: number): CountStatsResponse {
  const db = getDb();
  const s = season || getLatestSeason();

  const rows = db.prepare(
    'SELECT * FROM batter_count_stats WHERE player_id = ? AND season = ? ORDER BY balls, strikes'
  ).all(playerId, s) as BatterCountStat[];

  return {
    counts: rows.map(r => ({
      balls: r.balls,
      strikes: r.strikes,
      pa: r.pa,
      ba: r.ba,
      slg: r.slg,
      woba: r.woba,
      kPct: r.k_pct,
      bbPct: r.bb_pct,
    })),
  };
}
