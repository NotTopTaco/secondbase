import { normalizeValue, formatMetricValue } from './hotZoneUtils';
import type { HotZoneCell } from '../../stores/matchupStore';
import styles from './HotZoneCanvas.module.css';

interface HotZoneCanvasProps {
  zones: HotZoneCell[];
  metric: string;
}

const GRID_SIZE = 5;

function getZoneColor(norm: number): { background: string; glow?: string } {
  if (norm > 0.5) {
    // Hot: red with increasing intensity
    const intensity = (norm - 0.5) * 2; // 0 → 1
    const r = 177;
    const g = Math.round(24 * (1 - intensity));
    const b = Math.round(43 * (1 - intensity));
    const alpha = 0.15 + intensity * 0.7;
    return {
      background: `rgba(${r}, ${g}, ${b}, ${alpha})`,
      glow: intensity > 0.4 ? `0 0 12px rgba(178, 24, 43, ${intensity * 0.4})` : undefined,
    };
  }
  if (norm < 0.5) {
    // Cold: blue with increasing intensity
    const intensity = (0.5 - norm) * 2; // 0 → 1
    const alpha = 0.15 + intensity * 0.6;
    return {
      background: `rgba(33, 102, 172, ${alpha})`,
    };
  }
  // Neutral
  return { background: 'rgba(255, 255, 255, 0.03)' };
}

export function HotZoneCanvas({ zones, metric }: HotZoneCanvasProps) {
  const metricKey = metric === 'BA' ? 'ba' : metric === 'SLG' ? 'slg' : 'woba';
  const zoneMap = new Map(zones.map((z) => [z.zone, z]));

  const cells = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const zone = row * GRID_SIZE + col + 1;
      const cell = zoneMap.get(zone);
      const value = (cell?.[metricKey as keyof HotZoneCell] as number) ?? 0;
      const sampleSize = cell?.sampleSize ?? 0;
      const norm = normalizeValue(value, metric);
      const { background, glow } = getZoneColor(norm);
      const lowSample = sampleSize < 5;

      cells.push(
        <div
          key={zone}
          className={`${styles.cell} ${lowSample ? styles.lowSample : ''}`}
          style={{
            background,
            boxShadow: glow,
          }}
        >
          {sampleSize > 0 && (
            <span className={styles.value}>{formatMetricValue(value, metric)}</span>
          )}
          {sampleSize > 0 && (
            <span className={styles.sample}>{sampleSize}</span>
          )}
        </div>
      );
    }
  }

  return (
    <div className={styles.grid}>
      {cells}
    </div>
  );
}
