import styles from './DirectionSummary.module.css';

interface DirectionSummaryProps {
  pull: number;
  center: number;
  oppo: number;
}

export function DirectionSummary({ pull, center, oppo }: DirectionSummaryProps) {
  const total = pull + center + oppo;
  if (total === 0) return null;

  const pPct = (pull / total) * 100;
  const cPct = (center / total) * 100;
  const oPct = (oppo / total) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.label}>Spray Direction</div>
      <div className={styles.barWrapper}>
        <div
          className={`${styles.segment} ${styles.pull}`}
          style={{ width: `${pPct}%` }}
        >
          {pPct >= 10 ? `${pPct.toFixed(0)}%` : ''}
        </div>
        <div
          className={`${styles.segment} ${styles.center}`}
          style={{ width: `${cPct}%` }}
        >
          {cPct >= 10 ? `${cPct.toFixed(0)}%` : ''}
        </div>
        <div
          className={`${styles.segment} ${styles.oppo}`}
          style={{ width: `${oPct}%` }}
        >
          {oPct >= 10 ? `${oPct.toFixed(0)}%` : ''}
        </div>
      </div>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.pull}`} style={{ background: '#e74c3c' }} />
          Pull
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.center}`} style={{ background: '#f39c12' }} />
          Center
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.oppo}`} style={{ background: '#3498db' }} />
          Oppo
        </span>
      </div>
    </div>
  );
}
