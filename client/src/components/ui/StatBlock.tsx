import styles from './StatBlock.module.css';

interface StatBlockProps {
  label: string;
  value: string | number | null;
  suffix?: string;
  highlight?: boolean;
  size?: 'sm' | 'md';
}

export function StatBlock({
  label,
  value,
  suffix,
  highlight = false,
  size = 'md',
}: StatBlockProps) {
  return (
    <div className={`${styles.block} ${styles[size]} ${highlight ? styles.highlight : ''}`}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>
        {value ?? '—'}
        {suffix && value != null && <span className={styles.suffix}>{suffix}</span>}
      </span>
    </div>
  );
}
