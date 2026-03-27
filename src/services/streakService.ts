import { getDb } from '../db/connection.js';
import { getLatestSeasonFor } from './seasonCache.js';
import type { StreakResponse } from '../types/analytics.js';

interface BatterGameRow {
  player_id: number;
  season: number;
  game_date: string;
  game_pk: number | null;
  pa: number;
  ab: number;
  h: number;
  total_bases: number;
  bb: number;
  k: number;
  woba_value_sum: number;
  woba_denom_sum: number;
  avg_exit_velo: number | null;
}

interface PitcherGameRow {
  player_id: number;
  season: number;
  game_date: string;
  game_pk: number | null;
  pa_against: number;
  ab_against: number;
  h_against: number;
  hr_against: number;
  bb_against: number;
  k: number;
  outs_recorded: number;
  game_score: number | null;
}

function safeDivide(num: number, den: number): number | null {
  return den > 0 ? num / den : null;
}

function getLatestBatterSeason(): number {
  return getLatestSeasonFor('batter_game_stats');
}

function getLatestPitcherSeason(): number {
  return getLatestSeasonFor('pitcher_game_stats');
}

function computeWindow(rows: BatterGameRow[]) {
  if (rows.length === 0) return { ba: null, slg: null, woba: null, kPct: null, pa: 0, gamesPlayed: 0 };

  let pa = 0, ab = 0, h = 0, tb = 0, k = 0, wobaVal = 0, wobaDen = 0;
  for (const r of rows) {
    pa += r.pa;
    ab += r.ab;
    h += r.h;
    tb += r.total_bases;
    k += r.k;
    wobaVal += r.woba_value_sum;
    wobaDen += r.woba_denom_sum;
  }

  return {
    ba: safeDivide(h, ab),
    slg: safeDivide(tb, ab),
    woba: safeDivide(wobaVal, wobaDen),
    kPct: safeDivide(k, pa),
    pa,
    gamesPlayed: rows.length,
  };
}

function getBatterStreak(playerId: number, season?: number) {
  const db = getDb();
  const s = season || getLatestBatterSeason();

  const rows = db.prepare(
    'SELECT * FROM batter_game_stats WHERE player_id = ? AND season = ? ORDER BY game_date DESC'
  ).all(playerId, s) as BatterGameRow[];

  if (rows.length === 0) {
    return {
      windows: [
        { window: '7d' as const, ba: null, slg: null, woba: null, kPct: null, pa: 0, gamesPlayed: 0 },
        { window: '14d' as const, ba: null, slg: null, woba: null, kPct: null, pa: 0, gamesPlayed: 0 },
        { window: 'season' as const, ba: null, slg: null, woba: null, kPct: null, pa: 0, gamesPlayed: 0 },
      ],
      dailyStats: [],
    };
  }

  const latestDate = new Date(rows[0].game_date);
  const d7 = new Date(latestDate);
  d7.setDate(d7.getDate() - 7);
  const d14 = new Date(latestDate);
  d14.setDate(d14.getDate() - 14);
  const d21 = new Date(latestDate);
  d21.setDate(d21.getDate() - 21);

  const last7 = rows.filter(r => new Date(r.game_date) > d7);
  const last14 = rows.filter(r => new Date(r.game_date) > d14);

  const w7 = { window: '7d' as const, ...computeWindow(last7) };
  const w14 = { window: '14d' as const, ...computeWindow(last14) };
  const wSeason = { window: 'season' as const, ...computeWindow(rows) };

  // Daily stats for sparkline (last ~21 days, oldest first)
  const dailyRows = rows.filter(r => new Date(r.game_date) > d21).reverse();
  const dailyStats = dailyRows.map(r => ({
    gameDate: r.game_date,
    ba: safeDivide(r.h, r.ab),
    slg: safeDivide(r.total_bases, r.ab),
    woba: safeDivide(r.woba_value_sum, r.woba_denom_sum),
    kPct: safeDivide(r.k, r.pa),
    pa: r.pa,
  }));

  return { windows: [w7, w14, wSeason], dailyStats };
}

function getPitcherStreak(playerId: number, season?: number) {
  const db = getDb();
  const s = season || getLatestPitcherSeason();

  // Single query: CTE computes row numbers + season average in one pass
  const rows = db.prepare(
    `WITH stats AS (
       SELECT *, ROW_NUMBER() OVER (ORDER BY game_date DESC) AS rn
       FROM pitcher_game_stats WHERE player_id = ? AND season = ?
     ),
     season_avg AS (
       SELECT AVG(game_score) AS avg_gs FROM stats WHERE game_score IS NOT NULL
     )
     SELECT s.*, sa.avg_gs AS season_avg_game_score
     FROM stats s, season_avg sa
     WHERE s.rn <= 5
     ORDER BY s.game_date DESC`
  ).all(playerId, s) as Array<PitcherGameRow & { season_avg_game_score: number | null }>;

  const seasonAvgGameScore = rows.length > 0 ? rows[0].season_avg_game_score : null;

  return {
    recentStarts: rows.map(r => ({
      gameDate: r.game_date,
      gameScore: r.game_score,
      outsRecorded: r.outs_recorded,
      k: r.k,
      hAgainst: r.h_against,
      bbAgainst: r.bb_against,
    })),
    seasonAvgGameScore,
  };
}

export function getStreak(batterId: number, pitcherId?: number, season?: number): StreakResponse {
  const batter = getBatterStreak(batterId, season);
  const pitcher = pitcherId
    ? getPitcherStreak(pitcherId, season)
    : { recentStarts: [], seasonAvgGameScore: null };

  return { batter, pitcher };
}
