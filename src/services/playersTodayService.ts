import { getFavoritePlayers } from './favoritesService.js';
import { getSchedule } from './scheduleService.js';
import { fetchBoxscore } from '../mlb/mlbClient.js';
import { cacheGet, cacheSet } from '../cache/cache.js';
import type { MlbScheduleGame, MlbBoxscorePlayer } from '../mlb/mlbTypes.js';

export interface PlayerTodayEntry {
  playerId: number;
  fullName: string;
  gamePk: number;
  gameState: 'Live' | 'Final' | 'Preview';
  teamAbbreviation: string;
  opponentAbbreviation: string;
  isHome: boolean;
  gameTime?: string;
  batting?: { hits: number; atBats: number; homeRuns: number; rbi: number };
  pitching?: { inningsPitched: string; strikeOuts: number; earnedRuns: number };
  role: 'batter' | 'pitcher';
}

const CACHE_TTL = 15;

function getTeamAbbr(name: string): string {
  // MLB API hydrates team name but not always abbreviation in schedule;
  // abbreviation comes through on the frontend type but the backend MlbTeamInfo
  // doesn't include it. Use a quick extraction from team name as fallback.
  const words = name.split(' ');
  return words[words.length - 1].slice(0, 3).toUpperCase();
}

function extractPlayerStats(
  player: MlbBoxscorePlayer
): { role: 'batter' | 'pitcher'; batting?: PlayerTodayEntry['batting']; pitching?: PlayerTodayEntry['pitching'] } {
  if (player.stats?.pitching?.inningsPitched !== undefined) {
    return {
      role: 'pitcher',
      pitching: {
        inningsPitched: player.stats.pitching.inningsPitched || '0.0',
        strikeOuts: player.stats.pitching.strikeOuts ?? 0,
        earnedRuns: player.stats.pitching.earnedRuns ?? 0,
      },
    };
  }
  return {
    role: 'batter',
    batting: {
      hits: player.stats?.batting?.hits ?? 0,
      atBats: player.stats?.batting?.atBats ?? 0,
      homeRuns: player.stats?.batting?.homeRuns ?? 0,
      rbi: player.stats?.batting?.rbi ?? 0,
    },
  };
}

export async function getPlayersToday(userId: number): Promise<PlayerTodayEntry[]> {
  const cacheKey = `players-today:${userId}`;
  const cached = cacheGet<PlayerTodayEntry[]>(cacheKey);
  if (cached) return cached;

  const favoriteIds = getFavoritePlayers(userId);
  if (favoriteIds.length === 0) return [];

  const favSet = new Set(favoriteIds);
  const schedule = await getSchedule();
  const games = schedule.dates?.flatMap((d) => d.games) ?? [];

  const entries: PlayerTodayEntry[] = [];

  // Split games by state
  const previewGames: MlbScheduleGame[] = [];
  const activeGames: MlbScheduleGame[] = [];

  for (const game of games) {
    if (game.status.abstractGameState === 'Preview') {
      previewGames.push(game);
    } else {
      activeGames.push(game);
    }
  }

  // Preview games: only probable pitchers
  for (const game of previewGames) {
    for (const side of ['away', 'home'] as const) {
      const pp = game.teams[side].probablePitcher;
      if (pp && favSet.has(pp.id)) {
        const oppSide = side === 'away' ? 'home' : 'away';
        entries.push({
          playerId: pp.id,
          fullName: pp.fullName,
          gamePk: game.gamePk,
          gameState: 'Preview',
          teamAbbreviation: getTeamAbbr(game.teams[side].team.name),
          opponentAbbreviation: getTeamAbbr(game.teams[oppSide].team.name),
          isHome: side === 'home',
          gameTime: game.gameDate,
          role: 'pitcher',
        });
      }
    }
  }

  // Live/Final games: fetch boxscores
  const boxscores = await Promise.all(
    activeGames.map(async (game) => {
      try {
        const box = await fetchBoxscore(game.gamePk);
        return { game, box };
      } catch {
        return null;
      }
    })
  );

  for (const result of boxscores) {
    if (!result) continue;
    const { game, box } = result;
    const gameState = game.status.abstractGameState === 'Live' ? 'Live' : 'Final';

    for (const side of ['away', 'home'] as const) {
      const oppSide = side === 'away' ? 'home' : 'away';
      const players = box.teams[side].players;

      for (const [, player] of Object.entries(players)) {
        if (!favSet.has(player.person.id)) continue;

        const stats = extractPlayerStats(player);
        entries.push({
          playerId: player.person.id,
          fullName: player.person.fullName,
          gamePk: game.gamePk,
          gameState,
          teamAbbreviation: getTeamAbbr(game.teams[side].team.name),
          opponentAbbreviation: getTeamAbbr(game.teams[oppSide].team.name),
          isHome: side === 'home',
          ...stats,
        });
      }
    }
  }

  // Sort: Live first, then Final, then Preview
  const stateOrder = { Live: 0, Final: 1, Preview: 2 };
  entries.sort((a, b) => stateOrder[a.gameState] - stateOrder[b.gameState]);

  cacheSet(cacheKey, entries, CACHE_TTL);
  return entries;
}
