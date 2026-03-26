export interface GameState {
  gamePk: number;
  status: string;
  detailedState: string;
  inning: number | null;
  inningHalf: string | null;
  inningOrdinal: string | null;
  awayTeam: { id: number; name: string; runs: number; hits: number; errors: number };
  homeTeam: { id: number; name: string; runs: number; hits: number; errors: number };
  batter: { id: number; name: string } | null;
  pitcher: { id: number; name: string } | null;
  count: { balls: number; strikes: number; outs: number };
  runners: { first: boolean; second: boolean; third: boolean };
  pitches: PitchEvent[];
}

export interface PitchEvent {
  pitchNumber: number;
  type: string;
  typeDescription: string;
  speed: number | null;
  pX: number | null;
  pZ: number | null;
  spinRate: number | null;
  breakH: number | null;
  breakV: number | null;
  call: string;
  callDescription: string;
  isInPlay: boolean;
  isStrike: boolean;
  isBall: boolean;
  hitData?: {
    coordX: number | null;
    coordY: number | null;
    launchSpeed: number | null;
    launchAngle: number | null;
  };
}
