import { create } from 'zustand';

export interface PitchEvent {
  pitchNumber: number;
  type: string;
  typeDescription: string;
  speed: number;
  pX: number;
  pZ: number;
  spinRate: number;
  breakH: number;
  breakV: number;
  call: string;
  callDescription: string;
  isInPlay: boolean;
  isStrike: boolean;
  isBall: boolean;
  hitData?: {
    launchSpeed: number;
    launchAngle: number;
    totalDistance: number;
    coordinates: { coordX: number; coordY: number };
  };
}

export interface TeamInfo {
  id: number;
  name: string;
  abbreviation?: string;
  runs: number;
  hits: number;
  errors: number;
}

export interface GameState {
  gamePk: number | null;
  status: string;
  detailedState: string;
  inning: number | null;
  inningHalf: string | null;
  awayTeam: TeamInfo | null;
  homeTeam: TeamInfo | null;
  batter: { id: number; name: string } | null;
  pitcher: { id: number; name: string } | null;
  count: { balls: number; strikes: number; outs: number };
  runners: { first: boolean; second: boolean; third: boolean };
  pitches: PitchEvent[];
  setGamePk: (pk: number) => void;
  updateFromFeed: (feed: unknown) => void;
  clearPitches: () => void;
}

interface LiveFeed {
  gameData?: {
    status?: { abstractGameState?: string; detailedState?: string };
    teams?: {
      away?: { id?: number; name?: string; abbreviation?: string };
      home?: { id?: number; name?: string; abbreviation?: string };
    };
  };
  liveData?: {
    linescore?: {
      currentInning?: number;
      inningHalf?: string;
      offense?: { first?: unknown; second?: unknown; third?: unknown };
      teams?: {
        away?: { runs?: number; hits?: number; errors?: number };
        home?: { runs?: number; hits?: number; errors?: number };
      };
    };
    plays?: {
      currentPlay?: {
        matchup?: {
          batter?: { id?: number; fullName?: string };
          pitcher?: { id?: number; fullName?: string };
        };
        count?: { balls?: number; strikes?: number; outs?: number };
        playEvents?: Array<{
          isPitch?: boolean;
          pitchNumber?: number;
          pitchData?: {
            coordinates?: { pX?: number; pZ?: number };
            startSpeed?: number;
            breaks?: { spinRate?: number; breakHorizontal?: number; breakVertical?: number };
          };
          details?: {
            type?: { code?: string; description?: string };
            call?: { code?: string; description?: string };
            isInPlay?: boolean;
            isStrike?: boolean;
            isBall?: boolean;
          };
          hitData?: {
            launchSpeed?: number;
            launchAngle?: number;
            totalDistance?: number;
            coordinates?: { coordX?: number; coordY?: number };
          };
        }>;
      };
    };
  };
}

type PlayEvents = NonNullable<NonNullable<NonNullable<NonNullable<LiveFeed['liveData']>['plays']>['currentPlay']>['playEvents']>;

function parsePitches(playEvents: PlayEvents | undefined): PitchEvent[] {
  if (!playEvents) return [];
  return playEvents
    .filter((e) => e?.isPitch)
    .map((e) => ({
      pitchNumber: e.pitchNumber ?? 0,
      type: e.details?.type?.code ?? '',
      typeDescription: e.details?.type?.description ?? '',
      speed: e.pitchData?.startSpeed ?? 0,
      pX: e.pitchData?.coordinates?.pX ?? 0,
      pZ: e.pitchData?.coordinates?.pZ ?? 0,
      spinRate: e.pitchData?.breaks?.spinRate ?? 0,
      breakH: e.pitchData?.breaks?.breakHorizontal ?? 0,
      breakV: e.pitchData?.breaks?.breakVertical ?? 0,
      call: e.details?.call?.code ?? '',
      callDescription: e.details?.call?.description ?? '',
      isInPlay: e.details?.isInPlay ?? false,
      isStrike: e.details?.isStrike ?? false,
      isBall: e.details?.isBall ?? false,
      hitData: e.hitData
        ? {
            launchSpeed: e.hitData.launchSpeed ?? 0,
            launchAngle: e.hitData.launchAngle ?? 0,
            totalDistance: e.hitData.totalDistance ?? 0,
            coordinates: {
              coordX: e.hitData.coordinates?.coordX ?? 0,
              coordY: e.hitData.coordinates?.coordY ?? 0,
            },
          }
        : undefined,
    }));
}

export const useGameStore = create<GameState>((set) => ({
  gamePk: null,
  status: '',
  detailedState: '',
  inning: null,
  inningHalf: null,
  awayTeam: null,
  homeTeam: null,
  batter: null,
  pitcher: null,
  count: { balls: 0, strikes: 0, outs: 0 },
  runners: { first: false, second: false, third: false },
  pitches: [],

  setGamePk: (pk) => set({ gamePk: pk }),

  updateFromFeed: (feed: unknown) => {
    const f = feed as LiveFeed;
    const gameData = f?.gameData;
    const liveData = f?.liveData;
    const linescore = liveData?.linescore;
    const currentPlay = liveData?.plays?.currentPlay;
    const matchup = currentPlay?.matchup;
    const cnt = currentPlay?.count;
    const offense = linescore?.offense;
    const lineTeams = linescore?.teams;
    const teams = gameData?.teams;

    set({
      status: gameData?.status?.abstractGameState ?? '',
      detailedState: gameData?.status?.detailedState ?? '',
      inning: linescore?.currentInning ?? null,
      inningHalf: linescore?.inningHalf ?? null,
      awayTeam: teams?.away
        ? {
            id: teams.away.id ?? 0,
            name: teams.away.name ?? '',
            abbreviation: teams.away.abbreviation,
            runs: lineTeams?.away?.runs ?? 0,
            hits: lineTeams?.away?.hits ?? 0,
            errors: lineTeams?.away?.errors ?? 0,
          }
        : null,
      homeTeam: teams?.home
        ? {
            id: teams.home.id ?? 0,
            name: teams.home.name ?? '',
            abbreviation: teams.home.abbreviation,
            runs: lineTeams?.home?.runs ?? 0,
            hits: lineTeams?.home?.hits ?? 0,
            errors: lineTeams?.home?.errors ?? 0,
          }
        : null,
      batter: matchup?.batter
        ? { id: matchup.batter.id ?? 0, name: matchup.batter.fullName ?? '' }
        : null,
      pitcher: matchup?.pitcher
        ? { id: matchup.pitcher.id ?? 0, name: matchup.pitcher.fullName ?? '' }
        : null,
      count: {
        balls: cnt?.balls ?? 0,
        strikes: cnt?.strikes ?? 0,
        outs: cnt?.outs ?? 0,
      },
      runners: {
        first: !!offense?.first,
        second: !!offense?.second,
        third: !!offense?.third,
      },
      pitches: parsePitches(currentPlay?.playEvents),
    });
  },

  clearPitches: () => set({ pitches: [] }),
}));
