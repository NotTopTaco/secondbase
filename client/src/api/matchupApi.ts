import { apiFetch } from './client';
import type { H2HData } from '../stores/matchupStore';

interface MatchupApiResponse {
  summary: {
    batter_id: number;
    pitcher_id: number;
    total_pa: number;
    ba: number | null;
    slg: number | null;
    k_pct: number | null;
    bb_pct: number | null;
  };
  at_bats: Array<{
    game_date: string | null;
    at_bat_number: number;
    pitch_sequence: string | null;
    result: string | null;
    exit_velo: number | null;
    launch_angle: number | null;
  }>;
}

export async function fetchMatchup(batterId: number, pitcherId: number): Promise<H2HData> {
  const raw = await apiFetch<MatchupApiResponse>(`/matchup/${batterId}/${pitcherId}`);
  return {
    totalPA: raw.summary.total_pa,
    ba: raw.summary.ba ?? 0,
    slg: raw.summary.slg ?? 0,
    kPct: (raw.summary.k_pct ?? 0) * 100,
    bbPct: (raw.summary.bb_pct ?? 0) * 100,
    atBats: raw.at_bats.map((ab) => ({
      date: ab.game_date ?? '',
      pitchCount: ab.pitch_sequence ? JSON.parse(ab.pitch_sequence).length : 0,
      pitchSequence: ab.pitch_sequence ? JSON.parse(ab.pitch_sequence).map((p: { pitch_type?: string }) => p.pitch_type ?? '?') : [],
      result: ab.result ?? '',
    })),
  };
}
