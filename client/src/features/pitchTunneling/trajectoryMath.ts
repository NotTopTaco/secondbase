export interface TrajectoryParams {
  releaseX: number;     // feet
  releaseZ: number;     // feet
  extension: number;    // feet
  velocity: number;     // mph
  pfxX: number;         // inches
  pfxZ: number;         // inches
  plateX: number;       // feet
  plateZ: number;       // feet
}

export interface TrajectoryPoint {
  y: number;  // distance from plate (feet)
  x: number;  // horizontal position (feet)
  z: number;  // vertical height (feet)
  tFraction: number;
}

const PLATE_Y = 17 / 12;   // front of plate in feet
const RUBBER_Y = 60.5;     // pitcher's rubber distance

export function computeTrajectory(params: TrajectoryParams, numPoints = 60): TrajectoryPoint[] {
  const { releaseX: x0, releaseZ: z0, extension, pfxX, pfxZ, plateX, plateZ } = params;

  const y0 = RUBBER_Y - extension;
  const yDistance = y0 - PLATE_Y;
  const pfxXFt = pfxX / 12;
  const pfxZFt = pfxZ / 12;

  const points: TrajectoryPoint[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const frac = i / numPoints;

    const y = y0 - yDistance * frac;
    const xLin = x0 + (plateX - x0 - pfxXFt) * frac;
    const zLin = z0 + (plateZ - z0 - pfxZFt) * frac;
    const x = xLin + pfxXFt * frac * frac;
    const z = zLin + pfxZFt * frac * frac;

    points.push({ y, x, z, tFraction: frac });
  }

  return points;
}

export function computeDecisionFraction(velocityMph: number, extensionFt: number): number {
  const y0 = RUBBER_Y - extensionFt;
  const yDistance = y0 - PLATE_Y;
  const vFps = velocityMph * 1.467;
  if (vFps <= 0) return 0.5;
  const tTotal = yDistance / vFps;
  if (tTotal <= 0) return 0.5;
  return Math.max(0, 1 - 0.175 / tTotal);
}
