import type { H2HAtBat } from '../../stores/matchupStore';
import { PITCH_COLORS } from '../../theme/colors';
import styles from './AtBatLog.module.css';

interface AtBatLogProps {
  atBats: H2HAtBat[];
}

export function AtBatLog({ atBats }: AtBatLogProps) {
  if (atBats.length === 0) {
    return <div className={styles.empty}>No at-bat data</div>;
  }

  return (
    <div className={styles.list}>
      {atBats.map((ab, idx) => (
        <div key={idx} className={styles.item}>
          <span className={styles.date}>{ab.date}</span>
          <span className={styles.pitchCount}>{ab.pitchCount}P</span>
          <div className={styles.sequence}>
            {ab.pitchSequence.map((pt, i) => (
              <span
                key={i}
                className={styles.pitchDot}
                style={{ backgroundColor: PITCH_COLORS[pt] ?? '#9898a8' }}
                title={pt}
              />
            ))}
          </div>
          <span className={styles.result}>{ab.result}</span>
        </div>
      ))}
    </div>
  );
}
