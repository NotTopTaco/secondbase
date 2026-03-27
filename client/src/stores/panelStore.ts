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
  { id: 'nextPitch', title: 'Next Pitch Prediction', collapsed: false },
  { id: 'winProbability', title: 'Win Probability', collapsed: false },
  { id: 'pitcherFatigue', title: 'Pitcher Fatigue', collapsed: false },
  { id: 'timeThroughOrder', title: 'Time Through Order', collapsed: false },
  { id: 'umpireScouting', title: 'Umpire Scouting', collapsed: false },
  { id: 'pitchMovement', title: 'Pitch Movement', collapsed: false },
  { id: 'bullpenStatus', title: 'Bullpen Status', collapsed: false },
  { id: 'batterByCount', title: 'Batter by Count', collapsed: false },
  { id: 'streakIndicator', title: 'Hot/Cold Streak', collapsed: false },
  { id: 'defensivePositioning', title: 'Defensive Positioning', collapsed: false },
  { id: 'pitchTunneling', title: 'Pitch Tunneling', collapsed: false },
];

const CURRENT_VERSION = 3;
const P1_PANEL_IDS = new Set([
  'nextPitch', 'winProbability', 'pitcherFatigue', 'timeThroughOrder',
  'umpireScouting', 'pitchMovement', 'bullpenStatus', 'batterByCount',
]);
const P2_PANEL_IDS = new Set([
  'streakIndicator', 'defensivePositioning', 'pitchTunneling',
]);

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
      version: CURRENT_VERSION,
      migrate: (persisted: any, version: number) => {
        let state = persisted as PanelState;
        if (version < 2) {
          // Add P1 panels to existing layouts
          const existingIds = new Set(state.panels.map((p: PanelInfo) => p.id));
          const newPanels = DEFAULT_PANELS.filter(p => P1_PANEL_IDS.has(p.id) && !existingIds.has(p.id));
          state = { ...state, panels: [...state.panels, ...newPanels] };
        }
        if (version < 3) {
          // Add P2 panels to existing layouts
          const existingIds = new Set(state.panels.map((p: PanelInfo) => p.id));
          const newPanels = DEFAULT_PANELS.filter(p => P2_PANEL_IDS.has(p.id) && !existingIds.has(p.id));
          state = { ...state, panels: [...state.panels, ...newPanels] };
        }
        return state;
      },
    },
  ),
);
