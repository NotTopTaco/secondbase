import { getDb } from '../db/connection.js';
import type { MatchupResponse, MatchupAtBat, MatchupSummary } from '../types/matchup.js';

export function getMatchupHistory(batterId: number, pitcherId: number): MatchupResponse {
  const db = getDb();

  // Aggregate summary in SQL instead of iterating rows in JS
  const agg = db.prepare(
    `SELECT
       COUNT(*) AS total_pa,
       SUM(CASE WHEN LOWER(result) NOT LIKE '%walk%'
                 AND LOWER(result) NOT LIKE '%hit by pitch%'
                 AND LOWER(result) NOT LIKE '%sac fly%'
                 AND LOWER(result) NOT LIKE '%sac bunt%' THEN 1 ELSE 0 END) AS ab_count,
       SUM(CASE WHEN LOWER(result) LIKE '%single%' OR LOWER(result) LIKE '%double%'
                 OR LOWER(result) LIKE '%triple%' OR LOWER(result) LIKE '%home run%' THEN 1 ELSE 0 END) AS hits,
       SUM(CASE WHEN LOWER(result) LIKE '%single%' THEN 1
                 WHEN LOWER(result) LIKE '%double%' THEN 2
                 WHEN LOWER(result) LIKE '%triple%' THEN 3
                 WHEN LOWER(result) LIKE '%home run%' THEN 4 ELSE 0 END) AS total_bases,
       SUM(CASE WHEN LOWER(result) LIKE '%strikeout%' THEN 1 ELSE 0 END) AS strikeouts,
       SUM(CASE WHEN LOWER(result) LIKE '%walk%' OR LOWER(result) LIKE '%hit by pitch%' THEN 1 ELSE 0 END) AS walks
     FROM matchup_history
     WHERE batter_id = ? AND pitcher_id = ?`
  ).get(batterId, pitcherId) as {
    total_pa: number; ab_count: number; hits: number;
    total_bases: number; strikeouts: number; walks: number;
  };

  if (agg.total_pa === 0) {
    return {
      summary: {
        batter_id: batterId, pitcher_id: pitcherId,
        total_pa: 0, ba: null, slg: null, k_pct: null, bb_pct: null,
      },
      at_bats: [],
    };
  }

  // Detail query for the at-bat list
  const atBats = db.prepare(
    `SELECT game_date, at_bat_number, pitch_sequence, result, exit_velo, launch_angle
     FROM matchup_history
     WHERE batter_id = ? AND pitcher_id = ?
     ORDER BY game_date DESC, at_bat_number DESC`
  ).all(batterId, pitcherId) as MatchupAtBat[];

  const summary: MatchupSummary = {
    batter_id: batterId,
    pitcher_id: pitcherId,
    total_pa: agg.total_pa,
    ba: agg.ab_count > 0 ? agg.hits / agg.ab_count : null,
    slg: agg.ab_count > 0 ? agg.total_bases / agg.ab_count : null,
    k_pct: agg.total_pa > 0 ? agg.strikeouts / agg.total_pa : null,
    bb_pct: agg.total_pa > 0 ? agg.walks / agg.total_pa : null,
  };

  return { summary, at_bats: atBats };
}
