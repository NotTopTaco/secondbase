import { apiFetch } from './client';

export interface ScheduleGame {
  gamePk: number;
  gameDate: string;
  status: { abstractGameState: string; detailedState: string };
  teams: {
    away: {
      team: { id: number; name: string; abbreviation?: string };
      score?: number;
      leagueRecord?: { wins: number; losses: number };
      probablePitcher?: { id: number; fullName: string };
    };
    home: {
      team: { id: number; name: string; abbreviation?: string };
      score?: number;
      leagueRecord?: { wins: number; losses: number };
      probablePitcher?: { id: number; fullName: string };
    };
  };
  linescore?: {
    currentInning?: number;
    inningHalf?: string;
    currentInningOrdinal?: string;
    offense?: { batter?: { id: number; fullName: string } };
    defense?: { pitcher?: { id: number; fullName: string } };
  };
  venue?: { name: string };
}

export interface ScheduleResponse {
  dates: Array<{
    date: string;
    games: ScheduleGame[];
  }>;
}

export function fetchSchedule(date?: string): Promise<ScheduleResponse> {
  const params = date ? `?date=${date}` : '';
  return apiFetch<ScheduleResponse>(`/schedule${params}`);
}

export function fetchLiveFeed(gamePk: number): Promise<unknown> {
  return apiFetch<unknown>(`/game/${gamePk}/live`);
}
