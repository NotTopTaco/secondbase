import { getDb } from '../db/connection.js';
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
  const db = getDb();
  const row = db.prepare('SELECT MAX(season) as s FROM batter_game_stats').get() as { s: number | null } | undefined;
  return row?.s || new Date().getFullYear();
}

function getLatestPitcherSeason(): number {
  const db = getDb();
  const row = db.prepare('SELECT MAX(season) as s FROM pitcher_game_stats').get() as { s: number | null } | undefined;
  return row?.s || new Date().getFullYear();
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

  const recentRows = db.prepare(
    'SELECT * FROM pitcher_game_stats WHERE player_id = ? AND season = ? ORDER BY game_date DESC LIMIT 5'
  ).all(playerId, s) as PitcherGameRow[];

  const allRows = db.prepare(
    'SELECT game_score FROM pitcher_game_stats WHERE player_id = ? AND season = ?'
  ).all(playerId, s) as Array<{ game_score: number | null }>;

  const scores = allRows.map(r => r.game_score).filter((v): v is number => v != null);
  const seasonAvgGameScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  return {
    recentStarts: recentRows.map(r => ({
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
