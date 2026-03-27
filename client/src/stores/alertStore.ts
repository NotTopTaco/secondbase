import { create } from 'zustand';
import type { ScheduleGame } from '../api/gameApi';
import { useAuthStore } from './authStore';

export interface Alert {
  id: string;
  type: 'favorite-batting' | 'close-game' | 'game-ended';
  gamePk: number;
  message: string;
  timestamp: number;
  isRead: boolean;
}

interface AlertState {
  alerts: Alert[];
  isDropdownOpen: boolean;

  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissAlert: (id: string) => void;
  clearAll: () => void;
  toggleDropdown: () => void;
  closeDropdown: () => void;
  processScheduleUpdate: (current: ScheduleGame[], previous: ScheduleGame[]) => void;
}

export const useAlertStore = create<AlertState>()((set, get) => ({
  alerts: [],
  isDropdownOpen: false,

  addAlert: (partial) => {
    const alert: Alert = {
      ...partial,
      id: `${partial.type}-${partial.gamePk}-${Date.now()}`,
      timestamp: Date.now(),
      isRead: false,
    };
    set({ alerts: [alert, ...get().alerts].slice(0, 50) });
  },

  markAsRead: (id) => {
    set({ alerts: get().alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a)) });
  },

  markAllAsRead: () => {
    set({ alerts: get().alerts.map((a) => ({ ...a, isRead: true })) });
  },

  dismissAlert: (id) => {
    set({ alerts: get().alerts.filter((a) => a.id !== id) });
  },

  clearAll: () => set({ alerts: [] }),

  toggleDropdown: () => set({ isDropdownOpen: !get().isDropdownOpen }),

  closeDropdown: () => set({ isDropdownOpen: false }),

  processScheduleUpdate: (current, previous) => {
    const { favoritePlayerIds, favoriteTeamIds } = useAuthStore.getState();
    const { addAlert, alerts } = get();

    // Build lookup from previous poll
    const prevBatters = new Map<number, number | undefined>();
    const prevStates = new Map<number, string>();
    for (const game of previous) {
      prevBatters.set(game.gamePk, game.linescore?.offense?.batter?.id);
      prevStates.set(game.gamePk, game.status.abstractGameState);
    }

    for (const game of current) {
      const gPk = game.gamePk;

      // Rule 1: Favorite player at bat
      if (game.status.abstractGameState === 'Live') {
        const batterId = game.linescore?.offense?.batter?.id;
        if (batterId && favoritePlayerIds.has(batterId)) {
          const prevBatter = prevBatters.get(gPk);
          if (prevBatter !== batterId) {
            const name = game.linescore?.offense?.batter?.fullName ?? 'Player';
            const exists = alerts.some(
              (a) => a.type === 'favorite-batting' && a.gamePk === gPk && a.message.includes(name) && Date.now() - a.timestamp < 120000
            );
            if (!exists) {
              addAlert({
                type: 'favorite-batting',
                gamePk: gPk,
                message: `${name} is at bat`,
              });
            }
          }
        }

        // Rule 2: Close game in late innings
        const inning = game.linescore?.currentInning;
        const awayScore = game.teams.away.score ?? 0;
        const homeScore = game.teams.home.score ?? 0;
        if (inning && inning >= 9 && Math.abs(awayScore - homeScore) <= 2) {
          const exists = alerts.some((a) => a.type === 'close-game' && a.gamePk === gPk);
          if (!exists) {
            const away = game.teams.away.team.abbreviation || game.teams.away.team.name;
            const home = game.teams.home.team.abbreviation || game.teams.home.team.name;
            addAlert({
              type: 'close-game',
              gamePk: gPk,
              message: `Close game: ${away} ${awayScore} - ${homeScore} ${home} (${inning}th)`,
            });
          }
        }
      }

      // Rule 3: Favorite team game ended
      if (game.status.abstractGameState === 'Final' && prevStates.get(gPk) !== 'Final') {
        const awayId = game.teams.away.team.id;
        const homeId = game.teams.home.team.id;
        if (favoriteTeamIds.has(awayId) || favoriteTeamIds.has(homeId)) {
          const away = game.teams.away.team.abbreviation || game.teams.away.team.name;
          const home = game.teams.home.team.abbreviation || game.teams.home.team.name;
          const awayScore = game.teams.away.score ?? 0;
          const homeScore = game.teams.home.score ?? 0;
          addAlert({
            type: 'game-ended',
            gamePk: gPk,
            message: `Final: ${away} ${awayScore} - ${homeScore} ${home}`,
          });
        }
      }
    }
  },
}));
