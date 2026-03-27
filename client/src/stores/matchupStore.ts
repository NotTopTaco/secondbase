import { create } from 'zustand';
import { fetchHotZones, fetchTendencies, fetchVsPitchType, fetchSprayChart } from '../api/playerApi';
import { fetchMatchup } from '../api/matchupApi';
import type { BatterBundleData, PitcherBundleData } from '../api/playerApi';

export interface HotZoneCell {
  zone: number;
  woba: number;
  ba: number;
  slg: number;
  sampleSize: number;
}

export interface TendencyEntry {
  pitchType: string;
  zone: number;
  frequency: number;
  usagePct: number;
  avgVelocity: number | null;
  batterHand: string;
}

export interface BatterVsPitchRow {
  pitchType: string;
  pa: number;
  ba: number;
  slg: number;
  wOBA: number;
  whiffPct: number;
  exitVelo: number;
  launchAngle: number;
}

export interface SprayChartHit {
  coordX: number;
  coordY: number;
  result: string;
  exitVelo: number;
  launchAngle: number;
  pitchType: string;
  pitcherHand: string;
  date: string;
}

export interface H2HAtBat {
  date: string;
  pitchCount: number;
  pitchSequence: string[];
  result: string;
}

export interface H2HData {
  totalPA: number;
  ba: number;
  slg: number;
  kPct: number;
  bbPct: number;
  atBats: H2HAtBat[];
}

export interface MatchupState {
  matchupKey: string | null;
  batterId: number | null;
  hotZones: HotZoneCell[];
  tendencies: TendencyEntry[];
  batterVsPitch: BatterVsPitchRow[];
  sprayChart: SprayChartHit[];
  h2h: H2HData | null;
  loadingHotZones: boolean;
  loadingTendencies: boolean;
  loadingBatterVsPitch: boolean;
  loadingSprayChart: boolean;
  loadingH2H: boolean;
  error: string | null;
  fetchAllForMatchup: (batterId: number, pitcherId: number) => Promise<void>;
  fetchHotZonesForPeriod: (period: string) => Promise<void>;
  fetchBatterVsPitch: (batterId: number, params?: { pitcherHand?: string; season?: number }) => Promise<void>;
  setBundleData: (batterBundle: BatterBundleData, pitcherBundle: PitcherBundleData) => void;
  clear: () => void;
}

export const useMatchupStore = create<MatchupState>((set, get) => ({
  matchupKey: null,
  batterId: null,
  hotZones: [],
  tendencies: [],
  batterVsPitch: [],
  sprayChart: [],
  h2h: null,
  loadingHotZones: false,
  loadingTendencies: false,
  loadingBatterVsPitch: false,
  loadingSprayChart: false,
  loadingH2H: false,
  error: null,

  fetchAllForMatchup: async (batterId, pitcherId) => {
    const key = `${batterId}-${pitcherId}`;
    if (get().matchupKey === key) return;

    set({
      matchupKey: key,
      batterId,
      hotZones: [],
      tendencies: [],
      batterVsPitch: [],
      sprayChart: [],
      h2h: null,
      loadingHotZones: true,
      loadingTendencies: true,
      loadingBatterVsPitch: true,
      loadingSprayChart: true,
      loadingH2H: true,
      error: null,
    });

    const settle = <T>(promise: Promise<T>) =>
      promise.then(
        (v) => ({ ok: true as const, value: v }),
        (e: Error) => ({ ok: false as const, error: e.message }),
      );

    const [hzResult, tdResult, bvpResult, scResult, h2hResult] =
      await Promise.all([
        settle(fetchHotZones(batterId)),
        settle(fetchTendencies(pitcherId)),
        settle(fetchVsPitchType(batterId)),
        settle(fetchSprayChart(batterId)),
        settle(fetchMatchup(batterId, pitcherId)),
      ]);

    const errors: string[] = [];

    if (hzResult.ok) {
      set({ hotZones: hzResult.value as HotZoneCell[], loadingHotZones: false });
    } else {
      errors.push(hzResult.error);
      set({ loadingHotZones: false });
    }

    if (tdResult.ok) {
      set({ tendencies: tdResult.value as TendencyEntry[], loadingTendencies: false });
    } else {
      errors.push(tdResult.error);
      set({ loadingTendencies: false });
    }

    if (bvpResult.ok) {
      set({ batterVsPitch: bvpResult.value as BatterVsPitchRow[], loadingBatterVsPitch: false });
    } else {
      errors.push(bvpResult.error);
      set({ loadingBatterVsPitch: false });
    }

    if (scResult.ok) {
      set({ sprayChart: scResult.value as SprayChartHit[], loadingSprayChart: false });
    } else {
      errors.push(scResult.error);
      set({ loadingSprayChart: false });
    }

    if (h2hResult.ok) {
      set({ h2h: h2hResult.value as H2HData, loadingH2H: false });
    } else {
      errors.push(h2hResult.error);
      set({ loadingH2H: false });
    }

    if (errors.length > 0) {
      set({ error: errors.join('; ') });
    }
  },

  fetchHotZonesForPeriod: async (period) => {
    const batterId = get().batterId;
    if (!batterId) return;
    set({ loadingHotZones: true });
    try {
      const data = await fetchHotZones(batterId, { period });
      set({ hotZones: data, loadingHotZones: false });
    } catch (e) {
      set({ loadingHotZones: false, error: e instanceof Error ? e.message : 'Failed to fetch hot zones' });
    }
  },

  fetchBatterVsPitch: async (batterId, params) => {
    set({ loadingBatterVsPitch: true });
    try {
      const data = await fetchVsPitchType(batterId, params);
      set({ batterVsPitch: data, loadingBatterVsPitch: false });
    } catch (e) {
      set({ loadingBatterVsPitch: false, error: e instanceof Error ? e.message : 'Failed to fetch batter vs pitch type' });
    }
  },

  setBundleData: (batterBundle, pitcherBundle) => {
    set({
      hotZones: batterBundle.hotZones,
      tendencies: pitcherBundle.tendencies,
      batterVsPitch: batterBundle.batterVsPitch,
      sprayChart: batterBundle.sprayChart,
      h2h: batterBundle.h2h,
      loadingHotZones: false,
      loadingTendencies: false,
      loadingBatterVsPitch: false,
      loadingSprayChart: false,
      loadingH2H: false,
      error: null,
    });
  },

  clear: () =>
    set({
      matchupKey: null,
      batterId: null,
      hotZones: [],
      tendencies: [],
      batterVsPitch: [],
      sprayChart: [],
      h2h: null,
      loadingHotZones: false,
      loadingTendencies: false,
      loadingBatterVsPitch: false,
      loadingSprayChart: false,
      loadingH2H: false,
      error: null,
    }),
}));
