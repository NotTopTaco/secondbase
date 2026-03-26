import { PITCH_COLORS, PITCH_LABELS } from '../../theme/colors';
import styles from './PitchLegend.module.css';

export function PitchLegend() {
  const activePitchTypes = Object.keys(PITCH_COLORS);

  return (
    <div className={styles.legend}>
      {activePitchTypes.map((type) => (
        <div key={type} className={styles.item}>
          <span
            className={styles.dot}
            style={{ backgroundColor: PITCH_COLORS[type] }}
          />
          <span>{PITCH_LABELS[type] ?? type}</span>
        </div>
      ))}
      <div className={styles.shapeGroup}>
        <span className={styles.shapeItem}>
          <svg width="10" height="10">
            <circle cx="5" cy="5" r="4" fill="#9898a8" />
          </svg>
          Strike
        </span>
        <span className={styles.shapeItem}>
          <svg width="10" height="10">
            <circle cx="5" cy="5" r="4" fill="none" stroke="#9898a8" strokeWidth="1.5" />
          </svg>
          Ball
        </span>
        <span className={styles.shapeItem}>
          <svg width="10" height="10">
            <rect
              x="1" y="1" width="8" height="8" rx="0.5"
              fill="#9898a8"
              transform="rotate(45, 5, 5)"
            />
          </svg>
          In Play
        </span>
      </div>
    </div>
  );
}
