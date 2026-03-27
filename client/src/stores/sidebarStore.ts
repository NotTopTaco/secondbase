import { create } from 'zustand';
import type { ScheduleGame } from '../api/gameApi';

interface SidebarState {
  games: ScheduleGame[];
  previousGames: ScheduleGame[];
  isCollapsed: boolean;
  pinnedGamePks: Set<number>;

  updateGames: (games: ScheduleGame[]) => void;
  toggleCollapsed: () => void;
  togglePin: (gamePk: number) => void;
}

export const useSidebarStore = create<SidebarState>()((set, get) => ({
  games: [],
  previousGames: [],
  isCollapsed: false,
  pinnedGamePks: new Set(),

  updateGames: (games) => {
    set({
      previousGames: get().games,
      games,
    });
  },

  toggleCollapsed: () => set({ isCollapsed: !get().isCollapsed }),

  togglePin: (gamePk) => {
    const current = get().pinnedGamePks;
    const next = new Set(current);
    if (next.has(gamePk)) {
      next.delete(gamePk);
    } else {
      next.add(gamePk);
    }
    set({ pinnedGamePks: next });
  },
}));
