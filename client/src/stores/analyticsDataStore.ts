import { create } from 'zustand';
import { fetchBatterCountStats, fetchTTOSplits, fetchPitchMovement } from '../api/playerApi';

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
  loadingCountStats: boolean;
  loadingTTOSplits: boolean;
  loadingPitchMovement: boolean;
  error: string | null;
  fetchAllP1Data: (batterId: number, pitcherId: number) => Promise<void>;
  clear: () => void;
}

export const useAnalyticsDataStore = create<AnalyticsDataState>((set) => ({
  batterCountStats: [],
  pitcherTTOSplits: [],
  pitchMovement: null,
  loadingCountStats: false,
  loadingTTOSplits: false,
  loadingPitchMovement: false,
  error: null,

  fetchAllP1Data: async (batterId, pitcherId) => {
    set({
      loadingCountStats: true,
      loadingTTOSplits: true,
      loadingPitchMovement: true,
      error: null,
    });

    const settle = <T>(promise: Promise<T>) =>
      promise.then(
        (v) => ({ ok: true as const, value: v }),
        (e: Error) => ({ ok: false as const, error: e.message }),
      );

    const [csResult, ttoResult, pmResult] = await Promise.all([
      settle(fetchBatterCountStats(batterId)),
      settle(fetchTTOSplits(pitcherId)),
      settle(fetchPitchMovement(pitcherId)),
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

    if (errors.length > 0) {
      set({ error: errors.join('; ') });
    }
  },

  clear: () =>
    set({
      batterCountStats: [],
      pitcherTTOSplits: [],
      pitchMovement: null,
      loadingCountStats: false,
      loadingTTOSplits: false,
      loadingPitchMovement: false,
      error: null,
    }),
}));
