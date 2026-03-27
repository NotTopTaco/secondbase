import { apiFetch, apiPost, apiPut, apiDelete } from './client';

export interface AuthenticatedUser {
  id: number;
  username: string;
  favoriteTeamIds: number[];
  favoritePlayerIds: number[];
}

export interface PlayerSearchResult {
  player_id: number;
  full_name: string;
  team: string | null;
  position: string | null;
}

export function login(username: string, password: string): Promise<AuthenticatedUser> {
  return apiPost<AuthenticatedUser>('/auth/login', { username, password });
}

export function register(username: string, password: string): Promise<AuthenticatedUser> {
  return apiPost<AuthenticatedUser>('/auth/register', { username, password });
}

export function logout(): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>('/auth/logout', {});
}

export function fetchMe(): Promise<AuthenticatedUser> {
  return apiFetch<AuthenticatedUser>('/auth/me');
}

export function addFavoriteTeam(teamId: number): Promise<{ ok: boolean }> {
  return apiPut<{ ok: boolean }>(`/favorites/teams/${teamId}`);
}

export function removeFavoriteTeam(teamId: number): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/favorites/teams/${teamId}`);
}

export function addFavoritePlayer(playerId: number): Promise<{ ok: boolean }> {
  return apiPut<{ ok: boolean }>(`/favorites/players/${playerId}`);
}

export function removeFavoritePlayer(playerId: number): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/favorites/players/${playerId}`);
}

export function searchPlayers(query: string): Promise<{ results: PlayerSearchResult[] }> {
  return apiFetch<{ results: PlayerSearchResult[] }>(`/players/search?q=${encodeURIComponent(query)}`);
}
