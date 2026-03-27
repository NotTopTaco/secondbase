import styles from './AccuracyBadge.module.css';

interface AccuracyBadgeProps {
  correct: number;
  total: number;
  pct: number;
}

export function AccuracyBadge({ correct, total, pct }: AccuracyBadgeProps) {
  return (
    <span className={styles.badge}>
      Model: {pct.toFixed(0)}% accuracy ({correct}/{total})
    </span>
  );
}
