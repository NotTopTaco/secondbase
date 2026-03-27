export type Trend = 'hot' | 'neutral' | 'cold';

export function classifyBatterTrend(
  rollingWoba: number | null,
  seasonWoba: number | null,
): Trend {
  if (rollingWoba == null || seasonWoba == null) return 'neutral';
  const diff = rollingWoba - seasonWoba;
  if (diff >= 0.020) return 'hot';
  if (diff <= -0.020) return 'cold';
  return 'neutral';
}

export function classifyPitcherTrend(
  recentAvgGameScore: number | null,
  seasonAvgGameScore: number | null,
): Trend {
  if (recentAvgGameScore == null || seasonAvgGameScore == null) return 'neutral';
  const diff = recentAvgGameScore - seasonAvgGameScore;
  if (diff >= 5) return 'hot';
  if (diff <= -5) return 'cold';
  return 'neutral';
}

export function formatBA(v: number | null): string {
  if (v == null || isNaN(v)) return '---';
  return v.toFixed(3).replace(/^0/, '');
}

export function formatPct(v: number | null): string {
  if (v == null || isNaN(v)) return '---';
  return `${(v * 100).toFixed(1)}%`;
}

export function formatGameScore(v: number | null): string {
  if (v == null) return '---';
  return String(Math.round(v));
}

export function formatIP(outsRecorded: number): string {
  const fullInnings = Math.floor(outsRecorded / 3);
  const partialOuts = outsRecorded % 3;
  return `${fullInnings}.${partialOuts}`;
}
