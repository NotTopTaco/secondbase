import { getDb } from '../db/connection.js';
import type { PitchTunnelingResponse, TunnelPair } from '../types/analytics.js';

interface TunnelRow {
  pitch_type_a: string;
  pitch_type_b: string;
  tunnel_score: number | null;
  decision_point_distance_ft: number | null;
  separation_at_decision_in: number | null;
  separation_at_plate_in: number | null;
  release_x_a: number | null;
  release_z_a: number | null;
  release_x_b: number | null;
  release_z_b: number | null;
  velocity_a: number | null;
  velocity_b: number | null;
  pfx_x_a: number | null;
  pfx_z_a: number | null;
  pfx_x_b: number | null;
  pfx_z_b: number | null;
  plate_x_a: number | null;
  plate_z_a: number | null;
  plate_x_b: number | null;
  plate_z_b: number | null;
  extension_a: number | null;
  extension_b: number | null;
  sample_a: number;
  sample_b: number;
}

function getLatestSeason(): number {
  const db = getDb();
  const row = db.prepare('SELECT MAX(season) as s FROM pitch_tunneling').get() as { s: number | null } | undefined;
  return row?.s || new Date().getFullYear();
}

export function getPitchTunneling(playerId: number, season?: number): PitchTunnelingResponse {
  const db = getDb();
  const s = season || getLatestSeason();

  const rows = db.prepare(
    `SELECT * FROM pitch_tunneling
     WHERE player_id = ? AND season = ?
     ORDER BY tunnel_score DESC`
  ).all(playerId, s) as TunnelRow[];

  const pairs: TunnelPair[] = rows
    .filter(r => r.tunnel_score != null)
    .map(r => ({
      pitchTypeA: r.pitch_type_a,
      pitchTypeB: r.pitch_type_b,
      tunnelScore: r.tunnel_score!,
      decisionPointDistanceFt: r.decision_point_distance_ft ?? 0,
      separationAtDecisionIn: r.separation_at_decision_in ?? 0,
      separationAtPlateIn: r.separation_at_plate_in ?? 0,
      releaseXA: r.release_x_a ?? 0,
      releaseZA: r.release_z_a ?? 0,
      releaseXB: r.release_x_b ?? 0,
      releaseZB: r.release_z_b ?? 0,
      velocityA: r.velocity_a ?? 0,
      velocityB: r.velocity_b ?? 0,
      pfxXA: r.pfx_x_a ?? 0,
      pfxZA: r.pfx_z_a ?? 0,
      pfxXB: r.pfx_x_b ?? 0,
      pfxZB: r.pfx_z_b ?? 0,
      plateXA: r.plate_x_a ?? 0,
      plateZA: r.plate_z_a ?? 0,
      plateXB: r.plate_x_b ?? 0,
      plateZB: r.plate_z_b ?? 0,
      extensionA: r.extension_a ?? 0,
      extensionB: r.extension_b ?? 0,
      sampleA: r.sample_a,
      sampleB: r.sample_b,
    }));

  return {
    pairs,
    bestPair: pairs.length > 0 ? pairs[0] : null,
  };
}
