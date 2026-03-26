import styles from './DiamondRunners.module.css';

interface DiamondRunnersProps {
  runners: { first: boolean; second: boolean; third: boolean };
  outs: number;
}

export function DiamondRunners({ runners, outs }: DiamondRunnersProps) {
  const s = 36;
  const cx = s / 2;
  const cy = s / 2;
  const r = 10;

  const bases = [
    { x: cx + r, y: cy, occupied: runners.first },
    { x: cx, y: cy - r, occupied: runners.second },
    { x: cx - r, y: cy, occupied: runners.third },
  ];

  return (
    <div className={styles.container}>
      <svg className={styles.diamond} width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        {bases.map((b, i) => (
          <rect
            key={i}
            x={b.x - 5}
            y={b.y - 5}
            width={10}
            height={10}
            rx={1}
            transform={`rotate(45, ${b.x}, ${b.y})`}
            className={b.occupied ? styles.baseOccupied : styles.base}
          />
        ))}
      </svg>
      <div className={styles.outs}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${styles.outDot} ${i < outs ? styles.outActive : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
