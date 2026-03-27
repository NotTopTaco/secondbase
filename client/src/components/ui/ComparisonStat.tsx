import styles from './ComparisonStat.module.css';

interface ComparisonStatProps {
  label: string;
  current: number | null;
  baseline: number | null;
  format?: (v: number) => string;
  invertColor?: boolean;
}

export function ComparisonStat({
  label,
  current,
  baseline,
  format = (v) => v.toFixed(3),
  invertColor = false,
}: ComparisonStatProps) {
  const hasBoth = current != null && baseline != null;
  const diff = hasBoth ? current - baseline : null;

  let dirClass = '';
  if (diff != null && diff !== 0) {
    const positive = invertColor ? diff < 0 : diff > 0;
    dirClass = positive ? styles.up : styles.down;
  }

  return (
    <div className={styles.stat}>
      <span className={styles.label}>{label}</span>
      <span className={styles.current}>
        {current != null ? format(current) : '—'}
      </span>
      {hasBoth && (
        <span className={`${styles.diff} ${dirClass}`}>
          <span className={styles.arrow}>{diff! > 0 ? '\u25B2' : '\u25BC'}</span>
          {' '}{format(Math.abs(diff!))}
        </span>
      )}
      <span className={styles.baseline}>
        avg {baseline != null ? format(baseline) : '—'}
      </span>
    </div>
  );
}
