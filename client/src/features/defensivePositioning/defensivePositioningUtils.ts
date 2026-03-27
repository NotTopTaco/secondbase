import { FIELD, fieldOutlinePath, infieldPath, statcastToSvg } from '../sprayChart/sprayChartUtils';
import type { SprayChartHit } from '../../stores/matchupStore';

// Re-export field utilities for the canvas
export { FIELD, fieldOutlinePath, infieldPath, statcastToSvg };

// Standard positions in SVG space
export const STANDARD_POSITIONS: Record<string, { x: number; y: number }> = {
  P:   { x: 125, y: 195 },
  C:   { x: 125, y: 228 },
  '1B': { x: 152, y: 190 },
  '2B': { x: 137, y: 175 },
  SS:  { x: 113, y: 175 },
  '3B': { x: 98, y: 190 },
  LF:  { x: 72, y: 115 },
  CF:  { x: 125, y: 90 },
  RF:  { x: 178, y: 115 },
};

// Sector angle boundaries (degrees from center field, clockwise is positive)
// Used for computing optimal positions per fielder
const INFIELD_DISTANCE = 50; // SVG units from home plate
const OUTFIELD_DISTANCE_MIN = 60;

interface SectorDef {
  position: string;
  minAngle: number;
  maxAngle: number;
  isOutfield: boolean;
}

const SECTORS: SectorDef[] = [
  { position: 'LF', minAngle: -45, maxAngle: -15, isOutfield: true },
  { position: 'CF', minAngle: -15, maxAngle: 15, isOutfield: true },
  { position: 'RF', minAngle: 15, maxAngle: 45, isOutfield: true },
  { position: '3B', minAngle: -45, maxAngle: -20, isOutfield: false },
  { position: 'SS', minAngle: -20, maxAngle: 0, isOutfield: false },
  { position: '2B', minAngle: 0, maxAngle: 20, isOutfield: false },
  { position: '1B', minAngle: 20, maxAngle: 45, isOutfield: false },
];

/**
 * Compute optimal fielder positions based on spray chart density.
 * Returns center-of-mass for each fielding sector.
 */
export function computeOptimalPositions(
  hits: SprayChartHit[],
): Array<{ position: string; x: number; y: number }> {
  const results: Array<{ position: string; x: number; y: number }> = [];

  for (const sector of SECTORS) {
    const sectorHits = hits.filter((hit) => {
      const svg = statcastToSvg(hit.coordX, hit.coordY);
      const dx = svg.x - FIELD.homeX;
      const dy = FIELD.homeY - svg.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dx, dy) * (180 / Math.PI);

      const inAngle = angle >= sector.minAngle && angle <= sector.maxAngle;
      if (!inAngle) return false;

      if (sector.isOutfield) return dist > OUTFIELD_DISTANCE_MIN;
      return dist <= INFIELD_DISTANCE && dist > 15;
    });

    if (sectorHits.length < 3) continue;

    let sumX = 0, sumY = 0;
    for (const hit of sectorHits) {
      const svg = statcastToSvg(hit.coordX, hit.coordY);
      sumX += svg.x;
      sumY += svg.y;
    }

    results.push({
      position: sector.position,
      x: sumX / sectorHits.length,
      y: sumY / sectorHits.length,
    });
  }

  return results;
}
