import styles from './DefensiveFieldCanvas.module.css';

interface AlignmentSummaryProps {
  pullPct: number | null;
  centerPct: number | null;
  oppoPct: number | null;
}

function fmt(v: number | null): string {
  if (v == null) return '---';
  return `${Math.round(v)}%`;
}

export function AlignmentSummary({ pullPct, centerPct, oppoPct }: AlignmentSummaryProps) {
  return (
    <div className={styles.alignmentBar}>
      <span className={styles.alignmentSegment}>Pull {fmt(pullPct)}</span>
      <span className={styles.alignmentSegment}>Center {fmt(centerPct)}</span>
      <span className={styles.alignmentSegment}>Oppo {fmt(oppoPct)}</span>
    </div>
  );
}
