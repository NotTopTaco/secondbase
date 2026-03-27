export function formatMetricValue(value: number, _metric: string): string {
  return value.toFixed(3).replace(/^0/, '');
}

export function normalizeValue(value: number, metric: string): number {
  switch (metric) {
    case 'BA':
      return Math.min(1, value / 0.4);
    case 'SLG':
      return Math.min(1, value / 0.8);
    case 'wOBA':
      return Math.min(1, value / 0.5);
    default:
      return Math.min(1, value / 0.5);
  }
}
