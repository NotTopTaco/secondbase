import styles from './DefensiveFieldCanvas.module.css';

interface ShiftBadgeProps {
  description: string;
}

export function ShiftBadge({ description }: ShiftBadgeProps) {
  return (
    <div className={styles.shiftBadge}>
      {description}
    </div>
  );
}
