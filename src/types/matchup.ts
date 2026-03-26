export interface MatchupSummary {
  batter_id: number;
  pitcher_id: number;
  total_pa: number;
  ba: number | null;
  slg: number | null;
  k_pct: number | null;
  bb_pct: number | null;
}

export interface MatchupAtBat {
  game_date: string | null;
  at_bat_number: number;
  pitch_sequence: string | null;
  result: string | null;
  exit_velo: number | null;
  launch_angle: number | null;
}

export interface MatchupResponse {
  summary: MatchupSummary;
  at_bats: MatchupAtBat[];
}
