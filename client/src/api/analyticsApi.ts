import { apiFetch } from './client';

export interface NextPitchResponse {
  predictions: Array<{
    pitchType: string;
    probability: number;
    zoneDistribution: Record<string, number> | null;
  }>;
  accuracy: { correct: number; total: number; pct: number };
  batterHand: string;
  count: { balls: number; strikes: number };
}

export interface WinProbabilityResponse {
  currentHomeWp: number;
  events: Array<{
    playIndex: number;
    inning: number;
    halfInning: string;
    event: string;
    description: string;
    homeWp: number;
    delta: number;
  }>;
  biggestSwing: {
    playIndex: number;
    event: string;
    description: string;
    homeWp: number;
    delta: number;
  } | null;
}

export interface VelocityResponse {
  pitches: Array<{
    pitchNumber: number;
    pitchType: string;
    velocity: number;
    inning: number;
  }>;
  seasonAverages: Record<string, number>;
}

export interface UmpireResponse {
  umpire: { id: number; name: string } | null;
  zones: Array<{ zoneId: number; calledStrikePct: number; sampleSize: number }>;
  stats: { accuracyPct: number; expandedZoneRate: number; consistencyRating: number } | null;
}

export interface BullpenResponse {
  away: Array<{
    id: number;
    name: string;
    hand: string;
    era: number | null;
    pitchesToday: number;
    pitchesYesterday: number;
    availability: 'Available' | 'Limited' | 'Unavailable';
    role: string;
  }>;
  home: Array<{
    id: number;
    name: string;
    hand: string;
    era: number | null;
    pitchesToday: number;
    pitchesYesterday: number;
    availability: 'Available' | 'Limited' | 'Unavailable';
    role: string;
  }>;
}

export function fetchNextPitch(
  gamePk: number,
  pitcherId: number,
  batterHand: string,
  balls: number,
  strikes: number,
  lastPitchType?: string,
): Promise<NextPitchResponse> {
  const params = new URLSearchParams({
    pitcherId: String(pitcherId),
    batterHand,
    balls: String(balls),
    strikes: String(strikes),
  });
  if (lastPitchType) params.set('lastPitchType', lastPitchType);
  return apiFetch<NextPitchResponse>(`/game-analytics/${gamePk}/next-pitch?${params}`);
}

export function fetchWinProbability(gamePk: number): Promise<WinProbabilityResponse> {
  return apiFetch<WinProbabilityResponse>(`/game-analytics/${gamePk}/win-probability`);
}

export function fetchVelocityData(gamePk: number): Promise<VelocityResponse> {
  return apiFetch<VelocityResponse>(`/game-analytics/${gamePk}/velocity`);
}

export function fetchUmpireData(gamePk: number): Promise<UmpireResponse> {
  return apiFetch<UmpireResponse>(`/game-analytics/${gamePk}/umpire`);
}

export function fetchBullpenStatus(gamePk: number): Promise<BullpenResponse> {
  return apiFetch<BullpenResponse>(`/game-analytics/${gamePk}/bullpen`);
}

export interface DefensivePositioningResponse {
  fielders: Array<{
    position: string;
    playerId: number;
    playerName: string;
    svgX: number;
    svgY: number;
  }>;
  alignment: {
    ifStandardPct: number | null;
    ifShadePct: number | null;
    ifStrategicPct: number | null;
    ofStandardPct: number | null;
    ofStrategicPct: number | null;
    totalPA: number;
    pullPct: number | null;
    centerPct: number | null;
    oppoPct: number | null;
  } | null;
  shiftDetected: boolean;
  shiftDescription: string | null;
}

export function fetchDefensivePositioning(
  gamePk: number,
  batterId: number,
): Promise<DefensivePositioningResponse> {
  return apiFetch<DefensivePositioningResponse>(
    `/game-analytics/${gamePk}/defensive-positioning?batterId=${batterId}`
  );
}
