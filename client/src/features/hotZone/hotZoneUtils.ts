import * as d3 from 'd3';
import { ZONE_SCALE } from '../../theme/colors';

// 5x5 grid geometry for hot zone display
export const GRID_ROWS = 5;
export const GRID_COLS = 5;

export interface ZoneRect {
  zone: number;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function computeGridRects(
  totalWidth: number,
  totalHeight: number,
  padding: number = 2,
): ZoneRect[] {
  const cellW = (totalWidth - padding * (GRID_COLS + 1)) / GRID_COLS;
  const cellH = (totalHeight - padding * (GRID_ROWS + 1)) / GRID_ROWS;
  const rects: ZoneRect[] = [];

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const zone = row * GRID_COLS + col + 1;
      rects.push({
        zone,
        row,
        col,
        x: padding + col * (cellW + padding),
        y: padding + row * (cellH + padding),
        width: cellW,
        height: cellH,
      });
    }
  }

  return rects;
}

export function createDivergingScale() {
  return d3.scaleLinear<string>()
    .domain([0, 0.5, 1])
    .range([ZONE_SCALE.cold, ZONE_SCALE.neutral, ZONE_SCALE.hot])
    .clamp(true);
}

export function formatMetricValue(value: number, metric: string): string {
  switch (metric) {
    case 'BA':
    case 'wOBA':
      return value.toFixed(3).replace(/^0/, '');
    case 'SLG':
      return value.toFixed(3).replace(/^0/, '');
    default:
      return value.toFixed(3).replace(/^0/, '');
  }
}

export function normalizeValue(
  value: number,
  metric: string,
): number {
  // Normalize to 0-1 for color scale
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
