import { create } from 'zustand';

export interface CompletedPlay {
  playIndex: number;
  inning: number;
  halfInning: string;
  event: string;
  description: string;
  awayScore: number;
  homeScore: number;
  outs: number;
  runners: { first: boolean; second: boolean; third: boolean };
}

export interface PitcherPitch {
  pitchNumber: number;
  pitchType: string;
  velocity: number;
  inning: number;
  pX: number;
  pZ: number;
}

export interface GameAnalyticsState {
  allPlays: CompletedPlay[];
  currentPitcherAllPitches: PitcherPitch[];
  currentPitcherId: number | null;
  currentBatterTTOPass: number;
  umpire: { id: number; name: string } | null;
  updateFromFeed: (feed: unknown) => void;
}

interface LiveFeed {
  liveData?: {
    plays?: {
      allPlays?: Array<{
        result?: { type?: string; event?: string; description?: string };
        about?: {
          atBatIndex?: number;
          halfInning?: string;
          inning?: number;
          isComplete?: boolean;
        };
        count?: { outs?: number };
        matchup?: {
          batter?: { id?: number; fullName?: string };
          pitcher?: { id?: number; fullName?: string };
        };
        runners?: Array<{
          movement?: { end?: string };
        }>;
        playEvents?: Array<{
          isPitch?: boolean;
          pitchNumber?: number;
          pitchData?: {
            coordinates?: { pX?: number; pZ?: number };
            startSpeed?: number;
          };
          details?: {
            type?: { code?: string };
          };
        }>;
      }>;
    };
    linescore?: {
      defense?: {
        pitcher?: { id?: number; fullName?: string };
      };
      teams?: {
        away?: { runs?: number };
        home?: { runs?: number };
      };
    };
    boxscore?: {
      officials?: Array<{
        official?: { id?: number; fullName?: string };
        officialType?: string;
      }>;
    };
  };
}

export const useGameAnalyticsStore = create<GameAnalyticsState>((set, get) => ({
  allPlays: [],
  currentPitcherAllPitches: [],
  currentPitcherId: null,
  currentBatterTTOPass: 1,
  umpire: null,

  updateFromFeed: (feed: unknown) => {
    const f = feed as LiveFeed;
    const plays = f?.liveData?.plays?.allPlays ?? [];
    const defense = f?.liveData?.linescore?.defense;

    // Parse completed plays
    const completedPlays: CompletedPlay[] = [];
    let awayRuns = 0;
    let homeRuns = 0;
    for (const play of plays) {
      if (!play.about?.isComplete) continue;
      const scoringRunners = play.runners?.filter(r => r.movement?.end === 'score') ?? [];
      if (play.about.halfInning === 'top') {
        awayRuns += scoringRunners.length;
      } else {
        homeRuns += scoringRunners.length;
      }
      completedPlays.push({
        playIndex: play.about.atBatIndex ?? 0,
        inning: play.about.inning ?? 0,
        halfInning: play.about.halfInning ?? '',
        event: play.result?.event ?? '',
        description: play.result?.description ?? '',
        awayScore: awayRuns,
        homeScore: homeRuns,
        outs: play.count?.outs ?? 0,
        runners: { first: false, second: false, third: false },
      });
    }

    // Parse current pitcher's pitches for velocity tracking
    const currentPitcherId = defense?.pitcher?.id ?? null;

    let pitcherPitches: PitcherPitch[] = [];
    if (currentPitcherId) {
      let pitchNum = 0;
      for (const play of plays) {
        if (play.matchup?.pitcher?.id !== currentPitcherId) continue;
        for (const event of play.playEvents ?? []) {
          if (!event.isPitch || !event.pitchData?.startSpeed) continue;
          pitchNum++;
          pitcherPitches.push({
            pitchNumber: pitchNum,
            pitchType: event.details?.type?.code ?? '',
            velocity: event.pitchData.startSpeed,
            inning: play.about?.inning ?? 0,
            pX: event.pitchData.coordinates?.pX ?? 0,
            pZ: event.pitchData.coordinates?.pZ ?? 0,
          });
        }
      }
    }

    // Calculate TTO pass for current batter
    let ttoPass = 1;
    if (currentPitcherId) {
      const currentBatterId = plays[plays.length - 1]?.matchup?.batter?.id;
      if (currentBatterId) {
        let timesThrough = 0;
        for (const play of plays) {
          if (play.matchup?.pitcher?.id !== currentPitcherId) continue;
          const bid = play.matchup?.batter?.id;
          if (bid === currentBatterId) {
            timesThrough++;
          }
        }
        ttoPass = Math.min(Math.max(timesThrough, 1), 3);
      }
    }

    // Parse umpire from boxscore officials
    let umpire = get().umpire;
    const officials = f?.liveData?.boxscore?.officials;
    if (officials) {
      const hp = officials.find(o => o.officialType === 'Home Plate');
      if (hp?.official?.id) {
        umpire = { id: hp.official.id, name: hp.official.fullName ?? '' };
      }
    }

    set({
      allPlays: completedPlays,
      currentPitcherAllPitches: pitcherPitches,
      currentPitcherId,
      currentBatterTTOPass: ttoPass,
      umpire,
    });
  },
}));
