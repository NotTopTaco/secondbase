import type { H2HData } from '../../stores/matchupStore';
import styles from './MatchupSummary.module.css';

interface MatchupSummaryProps {
  data: H2HData;
}

function fmtBA(v: number | null | undefined): string {
  if (v == null) return '---';
  return v.toFixed(3).replace(/^0/, '');
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '---';
  return `${v.toFixed(1)}%`;
}

export function MatchupSummary({ data }: MatchupSummaryProps) {
  return (
    <div className={styles.container}>
      <div className={styles.stat}>
        <span className={styles.value}>{data.totalPA}</span>
        <span className={styles.label}>PA</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.value}>{fmtBA(data.ba)}</span>
        <span className={styles.label}>BA</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.value}>{fmtBA(data.slg)}</span>
        <span className={styles.label}>SLG</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.value}>{fmtPct(data.kPct)}</span>
        <span className={styles.label}>K%</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.value}>{fmtPct(data.bbPct)}</span>
        <span className={styles.label}>BB%</span>
      </div>
    </div>
  );
}
