import styles from './ZoneGrid.module.css';

interface ZoneGridProps {
  zones: Map<number, number>; // zone (1-25) -> frequency (0-1)
  color: string;
}

const GRID_SIZE = 5;

export function ZoneGrid({ zones, color }: ZoneGridProps) {
  const maxFreq = Math.max(...zones.values(), 0.01);

  const cells = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const zone = row * GRID_SIZE + col + 1;
      const freq = zones.get(zone) ?? 0;
      const opacity = freq > 0 ? 0.15 + (freq / maxFreq) * 0.85 : 0;
      const pct = (freq * 100).toFixed(0);
      cells.push(
        <div
          key={zone}
          className={styles.cell}
          style={{
            background: freq > 0 ? color : undefined,
            opacity: freq > 0 ? opacity : undefined,
          }}
        >
          {freq > 0 && <span className={styles.pct}>{pct}%</span>}
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
