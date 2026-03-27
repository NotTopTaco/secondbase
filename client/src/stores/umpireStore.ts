import { create } from 'zustand';

export interface UmpireZoneData {
  zoneId: number;
  calledStrikePct: number;
  sampleSize: number;
}

export interface UmpireStoreState {
  umpireId: number | null;
  umpireName: string;
  zones: UmpireZoneData[];
  stats: { accuracyPct: number; expandedZoneRate: number; consistencyRating: number } | null;
  showOverlay: boolean;
  loading: boolean;
  setData: (data: {
    umpire: { id: number; name: string } | null;
    zones: UmpireZoneData[];
    stats: { accuracyPct: number; expandedZoneRate: number; consistencyRating: number } | null;
  }) => void;
  toggleOverlay: () => void;
  clear: () => void;
}

export const useUmpireStore = create<UmpireStoreState>((set, get) => ({
  umpireId: null,
  umpireName: '',
  zones: [],
  stats: null,
  showOverlay: false,
  loading: false,

  setData: (data) =>
    set({
      umpireId: data.umpire?.id ?? null,
      umpireName: data.umpire?.name ?? '',
      zones: data.zones,
      stats: data.stats,
      loading: false,
    }),

  toggleOverlay: () => set({ showOverlay: !get().showOverlay }),

  clear: () =>
    set({
      umpireId: null,
      umpireName: '',
      zones: [],
      stats: null,
      showOverlay: false,
      loading: false,
    }),
}));
