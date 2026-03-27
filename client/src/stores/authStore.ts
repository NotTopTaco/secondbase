import { create } from 'zustand';
import * as authApi from '../api/authApi';

interface AuthState {
  user: { id: number; username: string } | null;
  favoriteTeamIds: Set<number>;
  favoritePlayerIds: Set<number>;
  isInitialized: boolean;
  isLoading: boolean;

  checkSession: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleFavoriteTeam: (teamId: number) => Promise<void>;
  toggleFavoritePlayer: (playerId: number) => Promise<void>;
  isTeamFavorite: (teamId: number) => boolean;
  isPlayerFavorite: (playerId: number) => boolean;
}

function applyAuthUser(set: (partial: Partial<AuthState>) => void, data: authApi.AuthenticatedUser) {
  set({
    user: { id: data.id, username: data.username },
    favoriteTeamIds: new Set(data.favoriteTeamIds),
    favoritePlayerIds: new Set(data.favoritePlayerIds),
  });
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  favoriteTeamIds: new Set<number>(),
  favoritePlayerIds: new Set<number>(),
  isInitialized: false,
  isLoading: false,

  checkSession: async () => {
    try {
      const data = await authApi.fetchMe();
      applyAuthUser(set, data);
    } catch {
      set({ user: null });
    } finally {
      set({ isInitialized: true });
    }
  },

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const data = await authApi.login(username, password);
      applyAuthUser(set, data);
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (username, password) => {
    set({ isLoading: true });
    try {
      const data = await authApi.register(username, password);
      applyAuthUser(set, data);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await authApi.logout();
    set({
      user: null,
      favoriteTeamIds: new Set(),
      favoritePlayerIds: new Set(),
    });
  },

  toggleFavoriteTeam: async (teamId) => {
    const current = get().favoriteTeamIds;
    if (current.has(teamId)) {
      await authApi.removeFavoriteTeam(teamId);
      const next = new Set(current);
      next.delete(teamId);
      set({ favoriteTeamIds: next });
    } else {
      await authApi.addFavoriteTeam(teamId);
      set({ favoriteTeamIds: new Set([...current, teamId]) });
    }
  },

  toggleFavoritePlayer: async (playerId) => {
    const current = get().favoritePlayerIds;
    if (current.has(playerId)) {
      await authApi.removeFavoritePlayer(playerId);
      const next = new Set(current);
      next.delete(playerId);
      set({ favoritePlayerIds: next });
    } else {
      await authApi.addFavoritePlayer(playerId);
      set({ favoritePlayerIds: new Set([...current, playerId]) });
    }
  },

  isTeamFavorite: (teamId) => get().favoriteTeamIds.has(teamId),
  isPlayerFavorite: (playerId) => get().favoritePlayerIds.has(playerId),
}));
