import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: 'Live' | 'Preview' | 'Final' | 'Delayed';
}

const statusMap: Record<string, string> = {
  Live: styles.live,
  Preview: styles.preview,
  Final: styles.final,
  Delayed: styles.delayed,
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${statusMap[status] ?? styles.preview}`}>
      {status === 'Live' && <span className={styles.dot} />}
      {status}
    </span>
  );
}
