import { getDb } from '../db/connection.js';
import { getLatestSeasonFor } from './seasonCache.js';
import { cacheGet, cacheSet } from '../cache/cache.js';
import type { PitcherCountTendency, NextPitchResponse, NextPitchPrediction } from '../types/analytics.js';

// In-memory accuracy tracking per game (resets on server restart)
const accuracyMap = new Map<number, { correct: number; total: number; lastPrediction: string | null }>();

function getLatestSeason(): number {
  return getLatestSeasonFor('pitcher_count_tendencies');
}

const BAYESIAN_PRIOR_WEIGHT = 20;

export function getNextPitchPredictions(
  pitcherId: number,
  batterHand: string,
  balls: number,
  strikes: number,
  gamePk: number,
  lastPitchType?: string,
): NextPitchResponse {
  // Phase 1: Accuracy tracking — always runs
  if (lastPitchType) {
    const tracker = accuracyMap.get(gamePk);
    if (tracker?.lastPrediction) {
      tracker.total++;
      if (tracker.lastPrediction === lastPitchType) {
        tracker.correct++;
      }
    }
  }

  // Phase 2: Prediction computation — cached by pitcher/hand/count
  const cacheKey = `nextpitch:${pitcherId}:${batterHand}:${balls}:${strikes}`;
  let predictions = cacheGet<NextPitchPrediction[]>(cacheKey);

  if (predictions === undefined) {
    const db = getDb();
    const season = getLatestSeason();

    const countRows = db.prepare(
      `SELECT * FROM pitcher_count_tendencies
       WHERE player_id = ? AND season = ? AND batter_hand = ? AND balls = ? AND strikes = ?`
    ).all(pitcherId, season, batterHand, balls, strikes) as PitcherCountTendency[];

    const overallRows = db.prepare(
      `SELECT pitch_type, SUM(usage_pct * sample_size) / SUM(sample_size) as usage_pct,
              SUM(sample_size) as sample_size
       FROM pitcher_count_tendencies
       WHERE player_id = ? AND season = ? AND batter_hand = ?
       GROUP BY pitch_type`
    ).all(pitcherId, season, batterHand) as Array<{ pitch_type: string; usage_pct: number; sample_size: number }>;

    const overallMap = new Map(overallRows.map(r => [r.pitch_type, r.usage_pct]));
    const totalCountSample = countRows.reduce((sum, r) => sum + r.sample_size, 0);

    if (totalCountSample < 10 && overallRows.length > 0) {
      const blendWeight = totalCountSample / (totalCountSample + BAYESIAN_PRIOR_WEIGHT);
      const countMap = new Map(countRows.map(r => [r.pitch_type, r.usage_pct ?? 0]));

      const allPitchTypes = new Set([...countMap.keys(), ...overallMap.keys()]);
      predictions = Array.from(allPitchTypes).map(pt => {
        const countPct = countMap.get(pt) ?? 0;
        const overallPct = overallMap.get(pt) ?? 0;
        const blended = blendWeight * countPct + (1 - blendWeight) * overallPct;
        const zoneRow = countRows.find(r => r.pitch_type === pt);
        return {
          pitchType: pt,
          probability: Math.round(blended * 10) / 10,
          zoneDistribution: zoneRow?.zone_distribution ? JSON.parse(zoneRow.zone_distribution) : null,
        };
      });
    } else if (countRows.length > 0) {
      predictions = countRows.map(r => ({
        pitchType: r.pitch_type,
        probability: r.usage_pct ?? 0,
        zoneDistribution: r.zone_distribution ? JSON.parse(r.zone_distribution) : null,
      }));
    } else {
      predictions = overallRows.map(r => ({
        pitchType: r.pitch_type,
        probability: r.usage_pct,
        zoneDistribution: null,
      }));
    }

    predictions.sort((a, b) => b.probability - a.probability);
    cacheSet(cacheKey, predictions, 10);
  }

  // Phase 3: Update lastPrediction — always runs
  let tracker = accuracyMap.get(gamePk);
  if (!tracker) {
    tracker = { correct: 0, total: 0, lastPrediction: null };
    accuracyMap.set(gamePk, tracker);
  }
  tracker.lastPrediction = predictions[0]?.pitchType ?? null;

  const total = tracker.total;
  const correct = tracker.correct;

  return {
    predictions,
    accuracy: {
      correct,
      total,
      pct: total > 0 ? Math.round(correct / total * 1000) / 10 : 0,
    },
    batterHand,
    count: { balls, strikes },
  };
}
