import { create } from 'zustand';

export interface PitchPrediction {
  pitchType: string;
  probability: number;
  zoneDistribution: Record<string, number> | null;
}

export interface PredictionStoreState {
  predictions: PitchPrediction[];
  accuracy: { correct: number; total: number; pct: number };
  loading: boolean;
  showLocationOverlay: boolean;
  setPredictions: (predictions: PitchPrediction[], accuracy: { correct: number; total: number; pct: number }) => void;
  toggleLocationOverlay: () => void;
  clear: () => void;
}

export const usePredictionStore = create<PredictionStoreState>((set, get) => ({
  predictions: [],
  accuracy: { correct: 0, total: 0, pct: 0 },
  loading: false,
  showLocationOverlay: false,

  setPredictions: (predictions, accuracy) =>
    set({ predictions, accuracy, loading: false }),

  toggleLocationOverlay: () => set({ showLocationOverlay: !get().showLocationOverlay }),

  clear: () =>
    set({
      predictions: [],
      accuracy: { correct: 0, total: 0, pct: 0 },
      loading: false,
      showLocationOverlay: false,
    }),
}));
