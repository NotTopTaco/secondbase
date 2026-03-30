import { create } from 'zustand';
import { parsePitches, type PitchEvent, type PlayEvents } from './gameStore';
import type { PitcherPitch } from './gameAnalyticsStore';
import { useMatchupStore } from './matchupStore';
import { useAnalyticsDataStore } from './analyticsDataStore';
import { fetchBatterBundle, fetchPitcherBundle } from '../api/playerApi';

// ── Types ──────────────────────────────────────────────────

export interface AtBatEntry {
  playIndex: number;
  inning: number;
  halfInning: string;
  batter: { id: number; name: string };
  pitcher: { id: number; name: string };
  result: string;
  event: string;
  pitchCount: number;
}

export interface GamePitcherEntry {
  id: number;
  name: string;
  pitchCount: number;
  inningsStart: number;
  inningsEnd: number;
  battersFaced: number;
  strikeouts: number;
  walks: number;
  hitsAllowed: number;
  isCurrentPitcher: boolean;
}

export interface DrawerAtBat {
  batter: { id: number; name: string };
  result: string;
  pitchCount: number;
  inning: number;
  halfInning: string;
}

// ── Feed shape (mirrors gameAnalyticsStore) ────────────────

interface FeedPlay {
  result?: { type?: string; event?: string; description?: string };
  about?: {
    atBatIndex?: number;
    halfInning?: string;
    inning?: number;
    isComplete?: boolean;
  };
  matchup?: {
    batter?: { id?: number; fullName?: string };
    pitcher?: { id?: number; fullName?: string };
  };
  playEvents?: PlayEvents;
}

interface LiveFeed {
  liveData?: {
    plays?: {
      allPlays?: FeedPlay[];
    };
    linescore?: {
      defense?: {
        pitcher?: { id?: number; fullName?: string };
      };
    };
  };
}

// ── Store ──────────────────────────────────────────────────

export interface ReviewState {
  // Review mode
  isReviewMode: boolean;
  reviewPlayIndex: number | null;
  reviewBatter: { id: number; name: string } | null;
  reviewPitcher: { id: number; name: string } | null;
  reviewPitches: PitchEvent[];
  reviewPitcherGamePitches: PitcherPitch[];

  // Game roster
  atBats: AtBatEntry[];
  gamePitchers: GamePitcherEntry[];

  // Pitcher drawer
  isDrawerOpen: boolean;
  drawerPitcherId: number | null;
  drawerPitcherPitches: PitcherPitch[];
  drawerPitcherAtBats: DrawerAtBat[];

  // Raw feed cache (for extracting pitches on demand)
  _rawPlays: FeedPlay[];

  // Actions
  updateRosterFromFeed: (feed: unknown) => void;
  enterReview: (playIndex: number) => void;
  exitReview: () => void;
  openDrawer: (pitcherId: number) => void;
  closeDrawer: () => void;
}

function extractPitcherGamePitches(plays: FeedPlay[], pitcherId: number): PitcherPitch[] {
  const pitches: PitcherPitch[] = [];
  let pitchNum = 0;
  for (const play of plays) {
    if (play.matchup?.pitcher?.id !== pitcherId) continue;
    for (const event of play.playEvents ?? []) {
      if (!event.isPitch || !event.pitchData?.startSpeed) continue;
      pitchNum++;
      pitches.push({
        pitchNumber: pitchNum,
        pitchType: event.details?.type?.code ?? '',
        velocity: event.pitchData.startSpeed,
        inning: play.about?.inning ?? 0,
        pX: event.pitchData.coordinates?.pX ?? 0,
        pZ: event.pitchData.coordinates?.pZ ?? 0,
      });
    }
  }
  return pitches;
}

function extractDrawerAtBats(plays: FeedPlay[], pitcherId: number): DrawerAtBat[] {
  const results: DrawerAtBat[] = [];
  for (const play of plays) {
    if (!play.about?.isComplete) continue;
    if (play.matchup?.pitcher?.id !== pitcherId) continue;
    const pitchCount = (play.playEvents ?? []).filter(e => e.isPitch).length;
    results.push({
      batter: {
        id: play.matchup?.batter?.id ?? 0,
        name: play.matchup?.batter?.fullName ?? '',
      },
      result: play.result?.event ?? '',
      pitchCount,
      inning: play.about.inning ?? 0,
      halfInning: play.about.halfInning ?? '',
    });
  }
  return results;
}

const K_EVENTS = new Set(['Strikeout', 'Strikeout Double Play']);
const BB_EVENTS = new Set(['Walk', 'Intent Walk', 'Hit By Pitch']);
const HIT_EVENTS = new Set(['Single', 'Double', 'Triple', 'Home Run']);

export const useReviewStore = create<ReviewState>((set, get) => ({
  isReviewMode: false,
  reviewPlayIndex: null,
  reviewBatter: null,
  reviewPitcher: null,
  reviewPitches: [],
  reviewPitcherGamePitches: [],

  atBats: [],
  gamePitchers: [],

  isDrawerOpen: false,
  drawerPitcherId: null,
  drawerPitcherPitches: [],
  drawerPitcherAtBats: [],

  _rawPlays: [],

  updateRosterFromFeed: (feed: unknown) => {
    const f = feed as LiveFeed;
    const plays = f?.liveData?.plays?.allPlays ?? [];
    const currentDefensePitcherId = f?.liveData?.linescore?.defense?.pitcher?.id ?? null;

    // Build at-bat list
    const atBats: AtBatEntry[] = [];
    for (const play of plays) {
      if (!play.about?.isComplete) continue;
      const pitchCount = (play.playEvents ?? []).filter(e => e.isPitch).length;
      atBats.push({
        playIndex: play.about.atBatIndex ?? 0,
        inning: play.about.inning ?? 0,
        halfInning: play.about.halfInning ?? '',
        batter: {
          id: play.matchup?.batter?.id ?? 0,
          name: play.matchup?.batter?.fullName ?? '',
        },
        pitcher: {
          id: play.matchup?.pitcher?.id ?? 0,
          name: play.matchup?.pitcher?.fullName ?? '',
        },
        result: play.result?.event ?? '',
        event: play.result?.type ?? '',
        pitchCount,
      });
    }

    // Build pitcher roster
    const pitcherMap = new Map<number, GamePitcherEntry>();
    for (const play of plays) {
      const pid = play.matchup?.pitcher?.id;
      if (!pid) continue;
      let entry = pitcherMap.get(pid);
      if (!entry) {
        entry = {
          id: pid,
          name: play.matchup?.pitcher?.fullName ?? '',
          pitchCount: 0,
          inningsStart: play.about?.inning ?? 0,
          inningsEnd: play.about?.inning ?? 0,
          battersFaced: 0,
          strikeouts: 0,
          walks: 0,
          hitsAllowed: 0,
          isCurrentPitcher: false,
        };
        pitcherMap.set(pid, entry);
      }
      // Count pitches
      const pitchesInAB = (play.playEvents ?? []).filter(e => e.isPitch).length;
      entry.pitchCount += pitchesInAB;
      entry.inningsEnd = play.about?.inning ?? entry.inningsEnd;
      if (play.about?.isComplete) {
        entry.battersFaced++;
        const evt = play.result?.event ?? '';
        if (K_EVENTS.has(evt)) entry.strikeouts++;
        if (BB_EVENTS.has(evt)) entry.walks++;
        if (HIT_EVENTS.has(evt)) entry.hitsAllowed++;
      }
    }
    if (currentDefensePitcherId) {
      const entry = pitcherMap.get(currentDefensePitcherId);
      if (entry) entry.isCurrentPitcher = true;
    }
    const gamePitchers = Array.from(pitcherMap.values());

    // Update drawer data if drawer is open
    const { isDrawerOpen, drawerPitcherId } = get();
    let drawerUpdate: Partial<ReviewState> = {};
    if (isDrawerOpen && drawerPitcherId) {
      drawerUpdate = {
        drawerPitcherPitches: extractPitcherGamePitches(plays, drawerPitcherId),
        drawerPitcherAtBats: extractDrawerAtBats(plays, drawerPitcherId),
      };
    }

    // Update review pitcher game pitches if in review mode
    const { isReviewMode, reviewPitcher } = get();
    let reviewUpdate: Partial<ReviewState> = {};
    if (isReviewMode && reviewPitcher) {
      reviewUpdate = {
        reviewPitcherGamePitches: extractPitcherGamePitches(plays, reviewPitcher.id),
      };
    }

    set({
      atBats,
      gamePitchers,
      _rawPlays: plays,
      ...drawerUpdate,
      ...reviewUpdate,
    });
  },

  enterReview: (playIndex: number) => {
    const { _rawPlays } = get();
    const play = _rawPlays.find(p => p.about?.atBatIndex === playIndex);
    if (!play) return;

    const batter = play.matchup?.batter
      ? { id: play.matchup.batter.id ?? 0, name: play.matchup.batter.fullName ?? '' }
      : null;
    const pitcher = play.matchup?.pitcher
      ? { id: play.matchup.pitcher.id ?? 0, name: play.matchup.pitcher.fullName ?? '' }
      : null;

    const reviewPitches = parsePitches(play.playEvents);
    const reviewPitcherGamePitches = pitcher
      ? extractPitcherGamePitches(_rawPlays, pitcher.id)
      : [];

    set({
      isReviewMode: true,
      reviewPlayIndex: playIndex,
      reviewBatter: batter,
      reviewPitcher: pitcher,
      reviewPitches,
      reviewPitcherGamePitches,
    });

    // Fetch bundles for the reviewed matchup
    if (batter && pitcher) {
      const matchupKey = `${batter.id}-${pitcher.id}`;
      useMatchupStore.setState({
        matchupKey, batterId: batter.id,
        loadingHotZones: true, loadingTendencies: true, loadingBatterVsPitch: true,
        loadingSprayChart: true, loadingH2H: true,
      });
      useAnalyticsDataStore.setState({
        loadingCountStats: true, loadingTTOSplits: true, loadingPitchMovement: true,
        loadingStreak: true, loadingTunneling: true,
      });

      Promise.all([
        fetchBatterBundle(batter.id, pitcher.id),
        fetchPitcherBundle(pitcher.id),
      ]).then(([batterBundle, pitcherBundle]) => {
        useMatchupStore.getState().setBundleData(batterBundle, pitcherBundle);
        useAnalyticsDataStore.getState().setBundleData(batterBundle, pitcherBundle);
      }).catch(() => {
        useMatchupStore.setState({
          loadingHotZones: false, loadingTendencies: false, loadingBatterVsPitch: false,
          loadingSprayChart: false, loadingH2H: false,
        });
        useAnalyticsDataStore.setState({
          loadingCountStats: false, loadingTTOSplits: false, loadingPitchMovement: false,
          loadingStreak: false, loadingTunneling: false,
        });
      });
    }
  },

  exitReview: () => {
    set({
      isReviewMode: false,
      reviewPlayIndex: null,
      reviewBatter: null,
      reviewPitcher: null,
      reviewPitches: [],
      reviewPitcherGamePitches: [],
    });
  },

  openDrawer: (pitcherId: number) => {
    const { _rawPlays } = get();
    set({
      isDrawerOpen: true,
      drawerPitcherId: pitcherId,
      drawerPitcherPitches: extractPitcherGamePitches(_rawPlays, pitcherId),
      drawerPitcherAtBats: extractDrawerAtBats(_rawPlays, pitcherId),
    });
  },

  closeDrawer: () => {
    set({
      isDrawerOpen: false,
      drawerPitcherId: null,
      drawerPitcherPitches: [],
      drawerPitcherAtBats: [],
    });
  },
}));
