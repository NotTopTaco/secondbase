import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PanelInfo {
  id: string;
  title: string;
  collapsed: boolean;
}

const DEFAULT_PANELS: PanelInfo[] = [
  { id: 'strikeZone', title: 'Strike Zone', collapsed: false },
  { id: 'hotZone', title: 'Hot Zones', collapsed: false },
  { id: 'pitcherTendency', title: 'Pitcher Tendency', collapsed: false },
  { id: 'batterVsPitchType', title: 'Batter vs Pitch Type', collapsed: false },
  { id: 'sprayChart', title: 'Spray Chart', collapsed: false },
  { id: 'headToHead', title: 'Head to Head', collapsed: false },
];

export interface PanelState {
  panels: PanelInfo[];
  toggleCollapse: (id: string) => void;
  reorderPanels: (ids: string[]) => void;
  resetLayout: () => void;
}

export const usePanelStore = create<PanelState>()(
  persist(
    (set, get) => ({
      panels: DEFAULT_PANELS,

      toggleCollapse: (id) =>
        set({
          panels: get().panels.map((p) =>
            p.id === id ? { ...p, collapsed: !p.collapsed } : p,
          ),
        }),

      reorderPanels: (ids) =>
        set({
          panels: ids
            .map((id) => get().panels.find((p) => p.id === id))
            .filter((p): p is PanelInfo => p !== undefined),
        }),

      resetLayout: () => set({ panels: DEFAULT_PANELS }),
    }),
    {
      name: 'secondbase-panels',
    },
  ),
);
