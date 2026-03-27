import { getLiveFeed } from './gameService.js';
import { getDb } from '../db/connection.js';
import { getLatestSeasonFor } from './seasonCache.js';
import type { VelocityResponse, VelocityDataPoint } from '../types/analytics.js';

export async function getVelocityData(gamePk: number): Promise<VelocityResponse> {
  const feed = await getLiveFeed(gamePk);
  const allPlays = feed.liveData?.plays?.allPlays ?? [];
  const currentPitcherId = feed.liveData?.linescore?.defense?.pitcher?.id;

  if (!currentPitcherId) {
    return { pitches: [], seasonAverages: {} };
  }

  // Collect all pitches by the current pitcher in this game
  const pitches: VelocityDataPoint[] = [];
  let pitchNum = 0;

  for (const play of allPlays) {
    if (play.matchup?.pitcher?.id !== currentPitcherId) continue;

    for (const event of play.playEvents) {
      if (!event.isPitch || !event.pitchData?.startSpeed) continue;
      pitchNum++;
      pitches.push({
        pitchNumber: pitchNum,
        pitchType: event.details?.type?.code ?? '',
        velocity: event.pitchData.startSpeed,
        inning: play.about?.inning ?? 0,
      });
    }
  }

  // Get season averages from pitcher_tendencies
  const db = getDb();
  const season = getLatestSeasonFor('pitcher_tendencies');

  const tendencies = db.prepare(
    `SELECT pitch_type, avg_velocity FROM pitcher_tendencies
     WHERE player_id = ? AND season = ?`
  ).all(currentPitcherId, season) as Array<{ pitch_type: string; avg_velocity: number | null }>;

  const seasonAverages: Record<string, number> = {};
  for (const t of tendencies) {
    if (t.avg_velocity != null) {
      seasonAverages[t.pitch_type] = t.avg_velocity;
    }
  }

  return { pitches, seasonAverages };
}
