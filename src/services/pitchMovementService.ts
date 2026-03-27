import { getDb } from '../db/connection.js';
import type { PitchMovementResponse, PitchMovementPoint } from '../types/analytics.js';
import type { PitcherTendency } from '../types/player.js';
import type { LeaguePitchAverage } from '../types/analytics.js';

function getLatestSeason(): number {
  const db = getDb();
  const row = db.prepare('SELECT MAX(season) as s FROM pitcher_tendencies').get() as { s: number | null } | undefined;
  return row?.s || new Date().getFullYear();
}

export function getPitchMovement(playerId: number, season?: number): PitchMovementResponse {
  const db = getDb();
  const s = season || getLatestSeason();

  // Get pitcher's tendencies (aggregated across batter hands)
  const tendencies = db.prepare(
    `SELECT pitch_type,
            AVG(avg_velocity) as avg_velocity,
            AVG(avg_h_break) as avg_h_break,
            AVG(avg_v_break) as avg_v_break,
            SUM(usage_pct) / COUNT(*) as usage_pct
     FROM pitcher_tendencies
     WHERE player_id = ? AND season = ?
     GROUP BY pitch_type`
  ).all(playerId, s) as Array<{
    pitch_type: string;
    avg_velocity: number | null;
    avg_h_break: number | null;
    avg_v_break: number | null;
    usage_pct: number | null;
  }>;

  // Get pitcher's hand to query appropriate league averages
  const playerRow = db.prepare(
    'SELECT throws FROM players WHERE player_id = ?'
  ).get(playerId) as { throws: string } | undefined;
  const hand = playerRow?.throws ?? 'R';

  // Get league averages for this hand
  const leagueAvgs = db.prepare(
    `SELECT pitch_type, avg_velocity, avg_h_break, avg_v_break
     FROM league_pitch_averages
     WHERE season = ? AND pitcher_hand = ?`
  ).all(s, hand) as LeaguePitchAverage[];

  // Convert feet → inches (Statcast pfx_x/pfx_z are in feet)
  const pitcher: PitchMovementPoint[] = tendencies
    .filter(t => t.avg_h_break != null && t.avg_v_break != null)
    .map(t => ({
      pitchType: t.pitch_type,
      hBreak: t.avg_h_break! * 12,
      vBreak: t.avg_v_break! * 12,
      velocity: t.avg_velocity ?? 0,
      usagePct: t.usage_pct ?? 0,
    }));

  // Only include league averages for pitch types the pitcher actually throws
  const pitcherPitchTypes = new Set(tendencies.map(t => t.pitch_type));
  const leagueAvg: PitchMovementPoint[] = leagueAvgs
    .filter(l => pitcherPitchTypes.has(l.pitch_type) && l.avg_h_break != null && l.avg_v_break != null)
    .map(l => ({
      pitchType: l.pitch_type,
      hBreak: l.avg_h_break! * 12,
      vBreak: l.avg_v_break! * 12,
      velocity: l.avg_velocity ?? 0,
      usagePct: 0,
    }));

  return { pitcher, leagueAvg };
}
