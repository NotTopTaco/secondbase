import { getDb } from '../db/connection.js';
import { getLiveFeed } from './gameService.js';
import type { WinProbabilityResponse, WinProbabilityEvent, WinExpectancyRow } from '../types/analytics.js';

function lookupWp(
  inning: number,
  half: string,
  outs: number,
  runnerState: string,
  scoreDiff: number,
): number {
  const db = getDb();
  const clampedInning = Math.min(inning, 12);
  const clampedDiff = Math.max(-10, Math.min(10, scoreDiff));

  const row = db.prepare(
    `SELECT home_wp FROM win_expectancy
     WHERE inning = ? AND half = ? AND outs = ? AND runner_state = ? AND score_diff = ?`
  ).get(clampedInning, half, outs, runnerState, clampedDiff) as WinExpectancyRow | undefined;

  if (row) return row.home_wp;

  // Fallback: estimate from score diff alone
  if (clampedDiff > 5) return 0.95;
  if (clampedDiff < -5) return 0.05;
  return 0.5 + clampedDiff * 0.05;
}

function runnerStateFromPlay(play: {
  runners?: Array<{ movement?: { start?: string } }>;
  matchup?: { batSide?: { code: string } };
  about?: { halfInning?: string; inning?: number };
  count?: { outs?: number };
}): string {
  // Default: bases empty
  return '000';
}

export async function getWinProbability(gamePk: number): Promise<WinProbabilityResponse> {
  const feed = await getLiveFeed(gamePk);
  const allPlays = feed.liveData?.plays?.allPlays ?? [];

  const events: WinProbabilityEvent[] = [];
  let prevWp = 0.5; // start at 50/50

  for (const play of allPlays) {
    if (!play.about?.isComplete) continue;

    const inning = play.about.inning;
    const halfInning = play.about.halfInning === 'top' ? 'top' : 'bottom';
    const outs = play.count?.outs ?? 0;

    // Build runner state from matchup context
    let runnerState = '000';

    // Score diff from home perspective
    // In the live feed, we need to track score changes through plays
    // Use the result description to determine the state
    const homeScore = feed.liveData?.linescore?.teams?.home?.runs ?? 0;
    const awayScore = feed.liveData?.linescore?.teams?.away?.runs ?? 0;

    // Walk through plays to get running score
    let awayRuns = 0;
    let homeRuns = 0;
    for (const p of allPlays) {
      if (p.about.atBatIndex > play.about.atBatIndex) break;
      if (!p.about.isComplete) continue;
      const runs = p.result?.type === 'atBat'
        ? (p as any).runners?.filter((r: any) => r.movement?.end === 'score').length ?? 0
        : 0;
      if (p.about.halfInning === 'top') {
        awayRuns += runs;
      } else {
        homeRuns += runs;
      }
    }

    const scoreDiff = homeRuns - awayRuns;
    const wp = lookupWp(inning, halfInning, outs, runnerState, scoreDiff);
    const delta = wp - prevWp;

    events.push({
      playIndex: play.about.atBatIndex,
      inning,
      halfInning,
      event: play.result?.event ?? '',
      description: play.result?.description ?? '',
      homeWp: Math.round(wp * 1000) / 10,
      delta: Math.round(delta * 1000) / 10,
    });

    prevWp = wp;
  }

  // Find biggest swing
  let biggestSwing: WinProbabilityEvent | null = null;
  for (const e of events) {
    if (!biggestSwing || Math.abs(e.delta) > Math.abs(biggestSwing.delta)) {
      biggestSwing = e;
    }
  }

  const currentWp = events.length > 0 ? events[events.length - 1].homeWp : 50;

  return {
    currentHomeWp: currentWp,
    events,
    biggestSwing,
  };
}
