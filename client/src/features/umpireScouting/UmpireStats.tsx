import styles from './UmpireStats.module.css';

interface UmpireStatsProps {
  stats: {
    accuracyPct: number;
    expandedZoneRate: number;
    consistencyRating: number;
  };
}

export function UmpireStats({ stats }: UmpireStatsProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.stat}>
        <span className={styles.value}>{stats.accuracyPct.toFixed(1)}%</span>
        <span className={styles.label}>Accuracy</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.value}>{stats.expandedZoneRate.toFixed(1)}%</span>
        <span className={styles.label}>Expanded Zone</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.value}>{stats.consistencyRating.toFixed(2)}</span>
        <span className={styles.label}>Consistency</span>
      </div>
    </div>
  );
}
