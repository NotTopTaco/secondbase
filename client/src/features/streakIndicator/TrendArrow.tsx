import type { Trend } from './streakUtils';
import styles from './StreakIndicator.module.css';

interface TrendArrowProps {
  trend: Trend;
}

const ARROWS: Record<Trend, string> = {
  hot: '\u25B2',
  neutral: '\u25B6',
  cold: '\u25BC',
};

const LABELS: Record<Trend, string> = {
  hot: 'HOT',
  neutral: '',
  cold: 'COLD',
};

export function TrendArrow({ trend }: TrendArrowProps) {
  return (
    <span className={`${styles.trendArrow} ${styles[trend]}`}>
      {ARROWS[trend]}
      {LABELS[trend] && <span className={styles.trendLabel}>{LABELS[trend]}</span>}
    </span>
  );
}
