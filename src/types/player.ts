export interface Player {
  player_id: number;
  full_name: string;
  team: string | null;
  position: string | null;
  bats: string | null;
  throws: string | null;
  headshot_url: string | null;
}

export interface HotZone {
  player_id: number;
  season: number;
  period: string;
  zone_id: number;
  woba: number | null;
  ba: number | null;
  slg: number | null;
  sample_size: number;
}

export interface PitcherTendency {
  player_id: number;
  season: number;
  pitch_type: string;
  batter_hand: string;
  usage_pct: number | null;
  avg_velocity: number | null;
  avg_h_break: number | null;
  avg_v_break: number | null;
  zone_distribution: string | null;
}

export interface BatterVsPitchType {
  player_id: number;
  season: number;
  pitch_type: string;
  pitcher_hand: string;
  pa: number;
  ba: number | null;
  slg: number | null;
  woba: number | null;
  whiff_pct: number | null;
  avg_exit_velo: number | null;
  avg_launch_angle: number | null;
}

export interface SprayChartEntry {
  player_id: number;
  season: number;
  hc_x: number;
  hc_y: number;
  exit_velo: number | null;
  launch_angle: number | null;
  result: string | null;
  pitch_type: string | null;
  pitcher_hand: string | null;
  game_date: string | null;
}
