import { fetchBoxscore, fetchPlayerGameLog } from '../mlb/mlbClient.js';
import { cacheGet, cacheSet } from '../cache/cache.js';
import type { BullpenResponse, RelieverInfo } from '../types/analytics.js';
import type { MlbBoxscorePlayer } from '../mlb/mlbTypes.js';

function estimateRole(era: number | null, name: string): string {
  // Simple heuristic — in a real app this would use roster data
  return 'MR';
}

function estimateAvailability(pitchesToday: number, pitchesYesterday: number, recentGames: number): RelieverInfo['availability'] {
  if (pitchesToday > 0) return 'Unavailable';
  if (pitchesYesterday > 30) return 'Limited';
  if (recentGames >= 2) return 'Limited';
  return 'Available';
}

async function buildRelieverList(
  bullpenIds: number[],
  players: Record<string, MlbBoxscorePlayer>,
  season: number,
): Promise<RelieverInfo[]> {
  const relievers: RelieverInfo[] = [];

  for (const id of bullpenIds) {
    const playerKey = `ID${id}`;
    const player = players[playerKey];
    if (!player) continue;

    const pitchingStats = player.stats?.pitching;
    const pitchesToday = pitchingStats?.numberOfPitches ?? 0;
    const eraStr = player.seasonStats?.pitching?.era;
    const era = eraStr ? parseFloat(eraStr) : null;

    // Try to get recent game log for availability
    let pitchesYesterday = 0;
    let recentGames = 0;
    try {
      const log = await fetchPlayerGameLog(id, season);
      const splits = log.stats?.[0]?.splits ?? [];
      const recent = splits.slice(-3);
      if (recent.length >= 1) {
        pitchesYesterday = recent[recent.length - 1]?.stat?.numberOfPitches ?? 0;
      }
      // Count games in last 3 days
      recentGames = recent.filter(s => (s.stat?.numberOfPitches ?? 0) > 0).length;
    } catch {
      // Game log not available
    }

    relievers.push({
      id,
      name: player.person.fullName,
      hand: player.position?.abbreviation ?? '',
      era,
      pitchesToday,
      pitchesYesterday,
      availability: estimateAvailability(pitchesToday, pitchesYesterday, recentGames),
      role: estimateRole(era, player.person.fullName),
    });
  }

  // Sort: CL -> SU -> MR
  const roleOrder: Record<string, number> = { CL: 0, SU: 1, MR: 2 };
  relievers.sort((a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3));

  return relievers;
}

export async function getBullpenStatus(gamePk: number): Promise<BullpenResponse> {
  const cacheKey = `bullpen:${gamePk}`;
  const cached = cacheGet<BullpenResponse>(cacheKey);
  if (cached) return cached;

  const season = new Date().getFullYear();

  try {
    const boxscore = await fetchBoxscore(gamePk);

    const [away, home] = await Promise.all([
      buildRelieverList(boxscore.teams.away.bullpen, boxscore.teams.away.players, season),
      buildRelieverList(boxscore.teams.home.bullpen, boxscore.teams.home.players, season),
    ]);

    const result: BullpenResponse = { away, home };
    cacheSet(cacheKey, result, 30);
    return result;
  } catch {
    return { away: [], home: [] };
  }
}
