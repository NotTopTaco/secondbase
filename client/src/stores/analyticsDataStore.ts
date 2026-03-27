import { create } from 'zustand';
import { fetchBatterCountStats, fetchTTOSplits, fetchPitchMovement, fetchStreak, fetchPitchTunneling, type StreakData, type PitchTunnelingData, type BatterBundleData, type PitcherBundleData } from '../api/playerApi';

export interface CountStatRow {
  balls: number;
  strikes: number;
  pa: number;
  ba: number | null;
  slg: number | null;
  woba: number | null;
  kPct: number | null;
  bbPct: number | null;
}

export interface TTOSplitRow {
  timesThrough: number;
  pa: number;
  ba: number | null;
  slg: number | null;
  woba: number | null;
  kPct: number | null;
  bbPct: number | null;
  avgExitVelo: number | null;
}

export interface PitchMovementPoint {
  pitchType: string;
  hBreak: number;
  vBreak: number;
  velocity: number;
  usagePct: number;
}

export interface AnalyticsDataState {
  batterCountStats: CountStatRow[];
  pitcherTTOSplits: TTOSplitRow[];
  pitchMovement: { pitcher: PitchMovementPoint[]; leagueAvg: PitchMovementPoint[] } | null;
  streakData: StreakData | null;
  pitchTunneling: PitchTunnelingData | null;
  loadingCountStats: boolean;
  loadingTTOSplits: boolean;
  loadingPitchMovement: boolean;
  loadingStreak: boolean;
  loadingTunneling: boolean;
  error: string | null;
  fetchAllP1Data: (batterId: number, pitcherId: number) => Promise<void>;
  setBundleData: (batterBundle: BatterBundleData, pitcherBundle: PitcherBundleData) => void;
  clear: () => void;
}

export const useAnalyticsDataStore = create<AnalyticsDataState>((set) => ({
  batterCountStats: [],
  pitcherTTOSplits: [],
  pitchMovement: null,
  streakData: null,
  pitchTunneling: null,
  loadingCountStats: false,
  loadingTTOSplits: false,
  loadingPitchMovement: false,
  loadingStreak: false,
  loadingTunneling: false,
  error: null,

  fetchAllP1Data: async (batterId, pitcherId) => {
    set({
      loadingCountStats: true,
      loadingTTOSplits: true,
      loadingPitchMovement: true,
      loadingStreak: true,
      loadingTunneling: true,
      error: null,
    });

    const settle = <T>(promise: Promise<T>) =>
      promise.then(
        (v) => ({ ok: true as const, value: v }),
        (e: Error) => ({ ok: false as const, error: e.message }),
      );

    const [csResult, ttoResult, pmResult, streakResult, tunnelingResult] = await Promise.all([
      settle(fetchBatterCountStats(batterId)),
      settle(fetchTTOSplits(pitcherId)),
      settle(fetchPitchMovement(pitcherId)),
      settle(fetchStreak(batterId, pitcherId)),
      settle(fetchPitchTunneling(pitcherId)),
    ]);

    const errors: string[] = [];

    if (csResult.ok) {
      set({ batterCountStats: csResult.value, loadingCountStats: false });
    } else {
      errors.push(csResult.error);
      set({ loadingCountStats: false });
    }

    if (ttoResult.ok) {
      set({ pitcherTTOSplits: ttoResult.value, loadingTTOSplits: false });
    } else {
      errors.push(ttoResult.error);
      set({ loadingTTOSplits: false });
    }

    if (pmResult.ok) {
      set({ pitchMovement: pmResult.value, loadingPitchMovement: false });
    } else {
      errors.push(pmResult.error);
      set({ loadingPitchMovement: false });
    }

    if (streakResult.ok) {
      set({ streakData: streakResult.value, loadingStreak: false });
    } else {
      errors.push(streakResult.error);
      set({ loadingStreak: false });
    }

    if (tunnelingResult.ok) {
      set({ pitchTunneling: tunnelingResult.value, loadingTunneling: false });
    } else {
      errors.push(tunnelingResult.error);
      set({ loadingTunneling: false });
    }

    if (errors.length > 0) {
      set({ error: errors.join('; ') });
    }
  },

  setBundleData: (batterBundle, pitcherBundle) => {
    set({
      batterCountStats: batterBundle.countStats,
      pitcherTTOSplits: pitcherBundle.ttoSplits,
      pitchMovement: pitcherBundle.pitchMovement,
      streakData: batterBundle.streak,
      pitchTunneling: pitcherBundle.pitchTunneling,
      loadingCountStats: false,
      loadingTTOSplits: false,
      loadingPitchMovement: false,
      loadingStreak: false,
      loadingTunneling: false,
      error: null,
    });
  },

  clear: () =>
    set({
      batterCountStats: [],
      pitcherTTOSplits: [],
      pitchMovement: null,
      streakData: null,
      pitchTunneling: null,
      loadingCountStats: false,
      loadingTTOSplits: false,
      loadingPitchMovement: false,
      loadingStreak: false,
      loadingTunneling: false,
      error: null,
    }),
}));
