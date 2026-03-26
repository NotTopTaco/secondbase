import * as d3 from 'd3';

// Statcast coordinate system: home plate at (125.42, 198.27)
// Y increases downward in Statcast coords
export const HOME_PLATE = { x: 125.42, y: 198.27 } as const;

// Outfield fence distance in feet
export const FENCE_DISTANCE = 330;

// Field geometry in SVG space
export const FIELD = {
  // SVG viewBox dimensions
  width: 250,
  height: 250,
  // Home plate position in SVG space
  homeX: 125,
  homeY: 220,
  // Foul line angles from home plate (looking out)
  leftFoulAngle: -45, // degrees from vertical
  rightFoulAngle: 45,
} as const;

/**
 * Transform Statcast hc_x/hc_y coordinates to SVG x/y.
 * Statcast coords: home plate at (125.42, 198.27), y increases downward,
 * the field extends upward (lower y values).
 */
export function statcastToSvg(
  hcX: number,
  hcY: number,
): { x: number; y: number } {
  // Center around home plate, then map to SVG space
  const dx = hcX - HOME_PLATE.x;
  const dy = HOME_PLATE.y - hcY; // Flip y axis

  // Scale factor: Statcast coordinates roughly map to field layout
  const scale = 1.0;

  return {
    x: FIELD.homeX + dx * scale,
    y: FIELD.homeY - dy * scale,
  };
}

/**
 * Create the field outline path (foul lines + outfield arc)
 */
export function fieldOutlinePath(): string {
  const cx = FIELD.homeX;
  const cy = FIELD.homeY;
  const r = 180; // Outfield arc radius in SVG units

  // Foul line endpoints
  const leftX = cx - r * Math.sin(Math.PI / 4);
  const leftY = cy - r * Math.cos(Math.PI / 4);
  const rightX = cx + r * Math.sin(Math.PI / 4);
  const rightY = cy - r * Math.cos(Math.PI / 4);

  return `M ${cx} ${cy} L ${leftX} ${leftY} A ${r} ${r} 0 0 1 ${rightX} ${rightY} Z`;
}

/**
 * Create the infield diamond path
 */
export function infieldPath(): string {
  const cx = FIELD.homeX;
  const cy = FIELD.homeY;
  const s = 25; // Base distance in SVG units

  return `M ${cx} ${cy}
    L ${cx - s} ${cy - s}
    L ${cx} ${cy - 2 * s}
    L ${cx + s} ${cy - s}
    Z`;
}

/**
 * Determine spray direction: pull, center, or opposite.
 * Angles are measured from center field.
 */
export function sprayDirection(
  hcX: number,
  _hcY: number,
  _batterSide: 'L' | 'R' = 'R',
): 'pull' | 'center' | 'oppo' {
  const dx = hcX - HOME_PLATE.x;
  // For a RHB: pull = left field (negative dx), oppo = right field
  // For a LHB: pull = right field (positive dx), oppo = left field
  const threshold = 30;

  if (Math.abs(dx) < threshold) return 'center';
  if (dx < 0) return 'pull'; // left field for RHB default
  return 'oppo';
}

/**
 * Radius scale for exit velocity dots
 */
export function exitVeloRadius(): d3.ScaleLinear<number, number> {
  return d3.scaleLinear().domain([60, 120]).range([3, 8]).clamp(true);
}
