import * as d3 from 'd3';

// Standard strike zone dimensions in feet from plate center
export const ZONE = {
  left: -0.83,   // left edge
  right: 0.83,   // right edge
  top: 3.5,      // typical top of zone
  bottom: 1.5,   // typical bottom of zone
} as const;

// Padding around the zone for the rendered area
export const VIEW = {
  left: -2.0,
  right: 2.0,
  top: 4.5,
  bottom: 0.5,
} as const;

export function createXScale(width: number, margin: { left: number; right: number }) {
  return d3.scaleLinear()
    .domain([VIEW.left, VIEW.right])
    .range([margin.left, width - margin.right]);
}

export function createYScale(height: number, margin: { top: number; bottom: number }) {
  return d3.scaleLinear()
    .domain([VIEW.bottom, VIEW.top])
    .range([height - margin.bottom, margin.top]);
}

export const MARGIN = { top: 20, right: 20, bottom: 30, left: 20 } as const;

export function pitchShape(isStrike: boolean, isBall: boolean, isInPlay: boolean): string {
  if (isInPlay) return 'diamond';
  if (isStrike) return 'filled';
  if (isBall) return 'open';
  return 'filled';
}
