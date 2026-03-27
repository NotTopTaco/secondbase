export interface PitcherCountTendency {
  player_id: number;
  season: number;
  batter_hand: string;
  balls: number;
  strikes: number;
  pitch_type: string;
  usage_pct: number | null;
  sample_size: number;
  zone_distribution: string | null;
}

export interface WinExpectancyRow {
  inning: number;
  half: string;
  outs: number;
  runner_state: string;
  score_diff: number;
  home_wp: number;
}

export interface PitcherTTOSplit {
  player_id: number;
  season: number;
  times_through: number;
  pa: number;
  ba: number | null;
  slg: number | null;
  woba: number | null;
  k_pct: number | null;
  bb_pct: number | null;
  avg_exit_velo: number | null;
}

export interface Umpire {
  umpire_id: number;
  umpire_name: string;
}

export interface UmpireZone {
  umpire_id: number;
  season: number;
  zone_id: number;
  called_strike_pct: number | null;
  sample_size: number;
}

export interface UmpireStats {
  umpire_id: number;
  season: number;
  games: number;
  accuracy_pct: number | null;
  expanded_zone_rate: number | null;
  consistency_rating: number | null;
}

export interface LeaguePitchAverage {
  season: number;
  pitch_type: string;
  pitcher_hand: string;
  avg_velocity: number | null;
  avg_h_break: number | null;
  avg_v_break: number | null;
  sample_size: number;
}

export interface BatterCountStat {
  player_id: number;
  season: number;
  balls: number;
  strikes: number;
  pa: number;
  ba: number | null;
  slg: number | null;
  woba: number | null;
  k_pct: number | null;
  bb_pct: number | null;
}

export interface NextPitchPrediction {
  pitchType: string;
  probability: number;
  zoneDistribution: Record<string, number> | null;
}

export interface NextPitchResponse {
  predictions: NextPitchPrediction[];
  accuracy: { correct: number; total: number; pct: number };
  batterHand: string;
  count: { balls: number; strikes: number };
}

export interface WinProbabilityEvent {
  playIndex: number;
  inning: number;
  halfInning: string;
  event: string;
  description: string;
  homeWp: number;
  delta: number;
}

export interface WinProbabilityResponse {
  currentHomeWp: number;
  events: WinProbabilityEvent[];
  biggestSwing: WinProbabilityEvent | null;
}

export interface VelocityDataPoint {
  pitchNumber: number;
  pitchType: string;
  velocity: number;
  inning: number;
}

export interface VelocityResponse {
  pitches: VelocityDataPoint[];
  seasonAverages: Record<string, number>;
}

export interface UmpireResponse {
  umpire: { id: number; name: string } | null;
  zones: Array<{ zoneId: number; calledStrikePct: number; sampleSize: number }>;
  stats: { accuracyPct: number; expandedZoneRate: number; consistencyRating: number } | null;
}

export interface RelieverInfo {
  id: number;
  name: string;
  hand: string;
  era: number | null;
  pitchesToday: number;
  pitchesYesterday: number;
  availability: 'Available' | 'Limited' | 'Unavailable';
  role: string;
}

export interface BullpenResponse {
  away: RelieverInfo[];
  home: RelieverInfo[];
}

export interface PitchMovementPoint {
  pitchType: string;
  hBreak: number;
  vBreak: number;
  velocity: number;
  usagePct: number;
}

export interface PitchMovementResponse {
  pitcher: PitchMovementPoint[];
  leagueAvg: PitchMovementPoint[];
}

export interface TTOSplitResponse {
  splits: Array<{
    timesThrough: number;
    pa: number;
    ba: number | null;
    slg: number | null;
    woba: number | null;
    kPct: number | null;
    bbPct: number | null;
    avgExitVelo: number | null;
  }>;
}

export interface CountStatsResponse {
  counts: Array<{
    balls: number;
    strikes: number;
    pa: number;
    ba: number | null;
    slg: number | null;
    woba: number | null;
    kPct: number | null;
    bbPct: number | null;
  }>;
}
