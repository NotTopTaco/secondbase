import { create } from 'zustand';

export interface PollingState {
  intervalMs: number;
  delayOffsetS: number;
  isConnected: boolean;
  lastUpdated: number | null;
  setInterval: (ms: number) => void;
  setDelayOffset: (s: number) => void;
  setConnected: (connected: boolean) => void;
  setLastUpdated: (ts: number) => void;
}

export const usePollingStore = create<PollingState>((set) => ({
  intervalMs: 7000,
  delayOffsetS: 45,
  isConnected: false,
  lastUpdated: null,
  setInterval: (ms) => set({ intervalMs: ms }),
  setDelayOffset: (s) => set({ delayOffsetS: s }),
  setConnected: (connected) => set({ isConnected: connected }),
  setLastUpdated: (ts) => set({ lastUpdated: ts }),
}));
