export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface Session {
  token: string;
  user_id: number;
  expires_at: string;
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  favoriteTeamIds: number[];
  favoritePlayerIds: number[];
}
