import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TabId = 'pitcher' | 'batter' | 'matchup' | 'game';

export const TAB_ASSIGNMENTS: Record<string, TabId> = {
  pitcherTendency: 'pitcher',
  pitcherFatigue: 'pitcher',
  timeThroughOrder: 'pitcher',
  pitchMovement: 'pitcher',
  pitchTunneling: 'pitcher',
  hotZone: 'batter',
  batterVsPitchType: 'batter',
  sprayChart: 'batter',
  batterByCount: 'batter',
  defensivePositioning: 'batter',
  headToHead: 'matchup',
  nextPitch: 'matchup',
  umpireScouting: 'matchup',
  streakIndicator: 'matchup',
  winProbability: 'game',
  bullpenStatus: 'game',
};

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

const DEFAULT_TAB_ORDERS: Record<TabId, string[]> = {
  pitcher: ['pitcherTendency', 'pitcherFatigue', 'timeThroughOrder', 'pitchMovement', 'pitchTunneling'],
  batter: ['hotZone', 'batterVsPitchType', 'sprayChart', 'batterByCount', 'defensivePositioning'],
  matchup: ['headToHead', 'nextPitch', 'umpireScouting', 'streakIndicator'],
  game: ['winProbability', 'bullpenStatus'],
};

const CURRENT_VERSION = 4;
const P1_PANEL_IDS = new Set([
  'nextPitch', 'winProbability', 'pitcherFatigue', 'timeThroughOrder',
  'umpireScouting', 'pitchMovement', 'bullpenStatus', 'batterByCount',
]);
const P2_PANEL_IDS = new Set([
  'streakIndicator', 'defensivePositioning', 'pitchTunneling',
]);

const MAX_PINNED = 2;

export interface PanelState {
  panels: PanelInfo[];
  activeTab: TabId;
  pinnedPanelIds: string[];
  tabOrders: Record<TabId, string[]>;
  toggleCollapse: (id: string) => void;
  reorderPanels: (ids: string[]) => void;
  setActiveTab: (tab: TabId) => void;
  togglePin: (id: string) => void;
  reorderTabPanels: (tab: TabId, ids: string[]) => void;
  resetLayout: () => void;
}

export const usePanelStore = create<PanelState>()(
  persist(
    (set, get) => ({
      panels: DEFAULT_PANELS,
      activeTab: 'matchup' as TabId,
      pinnedPanelIds: [] as string[],
      tabOrders: DEFAULT_TAB_ORDERS,

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

      setActiveTab: (tab) => set({ activeTab: tab }),

      togglePin: (id) => {
        const { pinnedPanelIds } = get();
        if (pinnedPanelIds.includes(id)) {
          set({ pinnedPanelIds: pinnedPanelIds.filter((p) => p !== id) });
        } else if (pinnedPanelIds.length < MAX_PINNED && TAB_ASSIGNMENTS[id]) {
          set({ pinnedPanelIds: [...pinnedPanelIds, id] });
        }
      },

      reorderTabPanels: (tab, ids) =>
        set({
          tabOrders: { ...get().tabOrders, [tab]: ids },
        }),

      resetLayout: () =>
        set({
          panels: DEFAULT_PANELS,
          activeTab: 'matchup' as TabId,
          pinnedPanelIds: [],
          tabOrders: DEFAULT_TAB_ORDERS,
        }),
    }),
    {
      name: 'secondbase-panels',
      version: CURRENT_VERSION,
      migrate: (persisted: any, version: number) => {
        let state = persisted as any;
        if (version < 2) {
          const existingIds = new Set(state.panels.map((p: PanelInfo) => p.id));
          const newPanels = DEFAULT_PANELS.filter(p => P1_PANEL_IDS.has(p.id) && !existingIds.has(p.id));
          state = { ...state, panels: [...state.panels, ...newPanels] };
        }
        if (version < 3) {
          const existingIds = new Set(state.panels.map((p: PanelInfo) => p.id));
          const newPanels = DEFAULT_PANELS.filter(p => P2_PANEL_IDS.has(p.id) && !existingIds.has(p.id));
          state = { ...state, panels: [...state.panels, ...newPanels] };
        }
        if (version < 4) {
          // Build tabOrders from existing panel order, preserving user reordering
          const tabOrders: Record<TabId, string[]> = {
            pitcher: [], batter: [], matchup: [], game: [],
          };
          for (const panel of state.panels) {
            const tab = TAB_ASSIGNMENTS[panel.id];
            if (tab) {
              tabOrders[tab].push(panel.id);
            }
          }
          // Fill in any missing panels from defaults
          for (const [tab, defaults] of Object.entries(DEFAULT_TAB_ORDERS)) {
            for (const id of defaults) {
              if (!tabOrders[tab as TabId].includes(id)) {
                tabOrders[tab as TabId].push(id);
              }
            }
          }
          state = {
            ...state,
            tabOrders,
            activeTab: 'matchup',
            pinnedPanelIds: [],
          };
        }
        return state;
      },
    },
  ),
);
