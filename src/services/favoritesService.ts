import { getDb } from '../db/connection.js';
import type { AuthenticatedUser } from '../types/auth.js';

export function getFavoriteTeams(userId: number): number[] {
  const db = getDb();
  const rows = db.prepare('SELECT team_id FROM user_favorite_teams WHERE user_id = ?').all(userId) as { team_id: number }[];
  return rows.map((r) => r.team_id);
}

export function addFavoriteTeam(userId: number, teamId: number): void {
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO user_favorite_teams (user_id, team_id) VALUES (?, ?)').run(userId, teamId);
}

export function removeFavoriteTeam(userId: number, teamId: number): void {
  const db = getDb();
  db.prepare('DELETE FROM user_favorite_teams WHERE user_id = ? AND team_id = ?').run(userId, teamId);
}

export function getFavoritePlayers(userId: number): number[] {
  const db = getDb();
  const rows = db.prepare('SELECT player_id FROM user_favorite_players WHERE user_id = ?').all(userId) as { player_id: number }[];
  return rows.map((r) => r.player_id);
}

export function addFavoritePlayer(userId: number, playerId: number): void {
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO user_favorite_players (user_id, player_id) VALUES (?, ?)').run(userId, playerId);
}

export function removeFavoritePlayer(userId: number, playerId: number): void {
  const db = getDb();
  db.prepare('DELETE FROM user_favorite_players WHERE user_id = ? AND player_id = ?').run(userId, playerId);
}

export function getUserWithFavorites(userId: number): AuthenticatedUser | null {
  const db = getDb();
  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId) as { id: number; username: string } | undefined;
  if (!user) return null;

  const teamIds = getFavoriteTeams(userId);
  const playerIds = getFavoritePlayers(userId);

  return {
    id: user.id,
    username: user.username,
    favoriteTeamIds: teamIds,
    favoritePlayerIds: playerIds,
  };
}
