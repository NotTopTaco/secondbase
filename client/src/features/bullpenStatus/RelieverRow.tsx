import styles from './RelieverRow.module.css';

interface Reliever {
  id: number;
  name: string;
  hand: string;
  era: number | null;
  pitchesToday: number;
  pitchesYesterday: number;
  availability: string;
  role: string;
}

interface RelieverRowProps {
  reliever: Reliever;
}

const availabilityClass: Record<string, string> = {
  Available: styles.available,
  Limited: styles.limited,
  Unavailable: styles.unavailable,
};

export function RelieverRow({ reliever }: RelieverRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.nameCol}>
        <span className={styles.name}>{reliever.name}</span>
        <span className={styles.hand}>{reliever.hand}</span>
      </div>
      <div className={styles.statsCol}>
        <span className={styles.stat}>
          {reliever.era !== null ? reliever.era.toFixed(2) : '-.--'}
        </span>
        <span className={styles.stat}>{reliever.pitchesToday}p</span>
        <span className={styles.stat}>{reliever.pitchesYesterday}y</span>
      </div>
      <span className={`${styles.badge} ${availabilityClass[reliever.availability] ?? ''}`}>
        {reliever.availability}
      </span>
    </div>
  );
}
