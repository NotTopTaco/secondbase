export interface MlbScheduleResponse {
  dates: MlbScheduleDate[];
}

export interface MlbScheduleDate {
  date: string;
  games: MlbScheduleGame[];
}

export interface MlbScheduleGame {
  gamePk: number;
  gameDate: string;
  status: {
    abstractGameState: string;
    detailedState: string;
    statusCode: string;
  };
  teams: {
    away: MlbTeamInfo;
    home: MlbTeamInfo;
  };
  venue: { name: string };
  linescore?: MlbLinescore;
}

export interface MlbTeamInfo {
  team: { id: number; name: string };
  score?: number;
  leagueRecord?: { wins: number; losses: number };
  probablePitcher?: { id: number; fullName: string };
}

export interface MlbLiveFeed {
  gamePk: number;
  gameData: {
    status: { abstractGameState: string; detailedState: string; statusCode: string };
    teams: { away: { name: string; id: number }; home: { name: string; id: number } };
    players: Record<string, MlbPlayer>;
  };
  liveData: {
    linescore: MlbLinescore;
    plays: {
      currentPlay?: MlbPlay;
      allPlays: MlbPlay[];
    };
  };
}

export interface MlbPlayer {
  id: number;
  fullName: string;
  primaryPosition: { abbreviation: string };
  batSide: { code: string };
  pitchHand: { code: string };
}

export interface MlbLinescore {
  currentInning?: number;
  currentInningOrdinal?: string;
  inningHalf?: string;
  teams: {
    away: { runs?: number; hits?: number; errors?: number };
    home: { runs?: number; hits?: number; errors?: number };
  };
  offense?: {
    batter?: { id: number; fullName: string };
    onDeck?: { id: number; fullName: string };
    first?: { id: number; fullName: string };
    second?: { id: number; fullName: string };
    third?: { id: number; fullName: string };
  };
  defense?: {
    pitcher?: { id: number; fullName: string };
  };
  balls?: number;
  strikes?: number;
  outs?: number;
}

export interface MlbPlay {
  result: { type: string; event: string; description: string };
  about: { atBatIndex: number; halfInning: string; inning: number; isComplete: boolean };
  count: { balls: number; strikes: number; outs: number };
  matchup: {
    batter: { id: number; fullName: string };
    pitcher: { id: number; fullName: string };
    batSide: { code: string };
    pitchHand: { code: string };
  };
  playEvents: MlbPlayEvent[];
}

export interface MlbPlayEvent {
  details: {
    call?: { code: string; description: string };
    description: string;
    type?: { code: string; description: string };
    isInPlay?: boolean;
    isStrike?: boolean;
    isBall?: boolean;
  };
  count: { balls: number; strikes: number; outs: number };
  pitchData?: {
    coordinates: { pX?: number; pZ?: number };
    startSpeed?: number;
    breaks?: { spinRate?: number; breakHorizontal?: number; breakVertical?: number };
  };
  pitchNumber?: number;
  index: number;
  isPitch: boolean;
  hitData?: {
    coordinates?: { coordX?: number; coordY?: number };
    launchSpeed?: number;
    launchAngle?: number;
  };
}

export interface MlbBoxscore {
  officials?: Array<{
    official: { id: number; fullName: string };
    officialType: string;
  }>;
  teams: {
    away: { bullpen: number[]; players: Record<string, MlbBoxscorePlayer> };
    home: { bullpen: number[]; players: Record<string, MlbBoxscorePlayer> };
  };
}

export interface MlbBoxscorePlayer {
  person: { id: number; fullName: string };
  position: { abbreviation: string };
  stats?: {
    pitching?: {
      numberOfPitches?: number;
      earnedRuns?: number;
      inningsPitched?: string;
    };
  };
  seasonStats?: {
    pitching?: {
      era?: string;
    };
  };
}

export interface MlbGameLog {
  stats: Array<{
    splits: Array<{
      date: string;
      stat: {
        numberOfPitches?: number;
        gamesPlayed?: number;
      };
    }>;
  }>;
}
