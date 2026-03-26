import { getDb } from '../db/connection.js';
import type { MatchupResponse, MatchupAtBat, MatchupSummary } from '../types/matchup.js';

export function getMatchupHistory(batterId: number, pitcherId: number): MatchupResponse {
  const db = getDb();

  const atBats = db.prepare(
    `SELECT game_date, at_bat_number, pitch_sequence, result, exit_velo, launch_angle
     FROM matchup_history
     WHERE batter_id = ? AND pitcher_id = ?
     ORDER BY game_date DESC, at_bat_number DESC`
  ).all(batterId, pitcherId) as MatchupAtBat[];

  const totalPa = atBats.length;

  if (totalPa === 0) {
    return {
      summary: {
        batter_id: batterId,
        pitcher_id: pitcherId,
        total_pa: 0,
        ba: null,
        slg: null,
        k_pct: null,
        bb_pct: null,
      },
      at_bats: [],
    };
  }

  // Compute summary stats from at-bat results
  let hits = 0, totalBases = 0, strikeouts = 0, walks = 0, atBatCount = 0;

  for (const ab of atBats) {
    const r = ab.result?.toLowerCase() || '';
    const isWalk = r.includes('walk') || r.includes('hit by pitch');
    const isSac = r.includes('sac fly') || r.includes('sac bunt');

    if (isWalk) { walks++; continue; }
    if (isSac) continue;

    atBatCount++;
    if (r.includes('strikeout')) { strikeouts++; continue; }

    if (r.includes('single')) { hits++; totalBases += 1; }
    else if (r.includes('double')) { hits++; totalBases += 2; }
    else if (r.includes('triple')) { hits++; totalBases += 3; }
    else if (r.includes('home run')) { hits++; totalBases += 4; }
  }

  const summary: MatchupSummary = {
    batter_id: batterId,
    pitcher_id: pitcherId,
    total_pa: totalPa,
    ba: atBatCount > 0 ? hits / atBatCount : null,
    slg: atBatCount > 0 ? totalBases / atBatCount : null,
    k_pct: totalPa > 0 ? strikeouts / totalPa : null,
    bb_pct: totalPa > 0 ? walks / totalPa : null,
  };

  return { summary, at_bats: atBats };
}
