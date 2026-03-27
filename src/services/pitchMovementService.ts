import { getDb } from '../db/connection.js';
import { getLatestSeasonFor } from './seasonCache.js';
import type { PitchMovementResponse, PitchMovementPoint } from '../types/analytics.js';

function getLatestSeason(): number {
  return getLatestSeasonFor('pitcher_tendencies');
}

export function getPitchMovement(playerId: number, season?: number): PitchMovementResponse {
  const db = getDb();
  const s = season || getLatestSeason();

  // Single query: pitcher tendencies + hand + league averages via CTE + JOIN
  const rows = db.prepare(
    `WITH player_data AS (
       SELECT pitch_type,
              AVG(avg_velocity) as avg_velocity,
              AVG(avg_h_break) as avg_h_break,
              AVG(avg_v_break) as avg_v_break,
              SUM(usage_pct) / COUNT(*) as usage_pct
       FROM pitcher_tendencies
       WHERE player_id = ? AND season = ?
       GROUP BY pitch_type
     )
     SELECT pd.pitch_type, pd.avg_velocity, pd.avg_h_break, pd.avg_v_break, pd.usage_pct,
            p.throws AS pitcher_hand,
            lpa.avg_velocity AS league_avg_velocity,
            lpa.avg_h_break AS league_avg_h_break,
            lpa.avg_v_break AS league_avg_v_break
     FROM player_data pd
     CROSS JOIN players p
     LEFT JOIN league_pitch_averages lpa
       ON lpa.season = ? AND lpa.pitcher_hand = p.throws AND lpa.pitch_type = pd.pitch_type
     WHERE p.player_id = ?`
  ).all(playerId, s, s, playerId) as Array<{
    pitch_type: string;
    avg_velocity: number | null;
    avg_h_break: number | null;
    avg_v_break: number | null;
    usage_pct: number | null;
    pitcher_hand: string | null;
    league_avg_velocity: number | null;
    league_avg_h_break: number | null;
    league_avg_v_break: number | null;
  }>;

  // Convert feet → inches (Statcast pfx_x/pfx_z are in feet)
  const pitcher: PitchMovementPoint[] = rows
    .filter(r => r.avg_h_break != null && r.avg_v_break != null)
    .map(r => ({
      pitchType: r.pitch_type,
      hBreak: r.avg_h_break! * 12,
      vBreak: r.avg_v_break! * 12,
      velocity: r.avg_velocity ?? 0,
      usagePct: r.usage_pct ?? 0,
    }));

  const leagueAvg: PitchMovementPoint[] = rows
    .filter(r => r.league_avg_h_break != null && r.league_avg_v_break != null)
    .map(r => ({
      pitchType: r.pitch_type,
      hBreak: r.league_avg_h_break! * 12,
      vBreak: r.league_avg_v_break! * 12,
      velocity: r.league_avg_velocity ?? 0,
      usagePct: 0,
    }));

  return { pitcher, leagueAvg };
}
