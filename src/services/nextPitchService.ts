import { getDb } from '../db/connection.js';
import type { PitcherCountTendency, NextPitchResponse, NextPitchPrediction } from '../types/analytics.js';

// In-memory accuracy tracking per game (resets on server restart)
const accuracyMap = new Map<number, { correct: number; total: number; lastPrediction: string | null }>();

function getLatestSeason(): number {
  const db = getDb();
  const row = db.prepare('SELECT MAX(season) as s FROM pitcher_count_tendencies').get() as { s: number | null } | undefined;
  return row?.s || new Date().getFullYear();
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
  const db = getDb();
  const season = getLatestSeason();

  // Track accuracy: if we had a previous prediction and a new pitch came in
  if (lastPitchType) {
    const tracker = accuracyMap.get(gamePk);
    if (tracker?.lastPrediction) {
      tracker.total++;
      if (tracker.lastPrediction === lastPitchType) {
        tracker.correct++;
      }
    }
  }

  // Query count-specific tendencies
  const countRows = db.prepare(
    `SELECT * FROM pitcher_count_tendencies
     WHERE player_id = ? AND season = ? AND batter_hand = ? AND balls = ? AND strikes = ?`
  ).all(pitcherId, season, batterHand, balls, strikes) as PitcherCountTendency[];

  // Query overall pitcher tendencies for Bayesian blending
  const overallRows = db.prepare(
    `SELECT pitch_type, SUM(usage_pct * sample_size) / SUM(sample_size) as usage_pct,
            SUM(sample_size) as sample_size
     FROM pitcher_count_tendencies
     WHERE player_id = ? AND season = ? AND batter_hand = ?
     GROUP BY pitch_type`
  ).all(pitcherId, season, batterHand) as Array<{ pitch_type: string; usage_pct: number; sample_size: number }>;

  const overallMap = new Map(overallRows.map(r => [r.pitch_type, r.usage_pct]));
  const totalCountSample = countRows.reduce((sum, r) => sum + r.sample_size, 0);

  let predictions: NextPitchPrediction[];

  if (totalCountSample < 10 && overallRows.length > 0) {
    // Sparse count data — blend with overall tendencies using Bayesian prior
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
    // Fallback to overall tendencies
    predictions = overallRows.map(r => ({
      pitchType: r.pitch_type,
      probability: r.usage_pct,
      zoneDistribution: null,
    }));
  }

  // Sort by probability descending
  predictions.sort((a, b) => b.probability - a.probability);

  // Store top prediction for next accuracy check
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
