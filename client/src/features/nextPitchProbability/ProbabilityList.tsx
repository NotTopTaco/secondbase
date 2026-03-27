import { PITCH_COLORS, PITCH_LABELS } from '../../theme/colors';
import styles from './ProbabilityList.module.css';

interface ProbabilityListProps {
  predictions: Array<{ pitchType: string; probability: number }>;
}

export function ProbabilityList({ predictions }: ProbabilityListProps) {
  const sorted = [...predictions].sort((a, b) => b.probability - a.probability);
  const maxProbability = sorted.length > 0 ? sorted[0].probability : 1;

  return (
    <div className={styles.list}>
      {sorted.map((p) => {
        const color = PITCH_COLORS[p.pitchType] ?? '#9898a8';
        const label = PITCH_LABELS[p.pitchType] ?? p.pitchType;
        const widthPct = maxProbability > 0 ? (p.probability / maxProbability) * 100 : 0;

        return (
          <div key={p.pitchType} className={styles.row}>
            <span className={styles.label}>{label}</span>
            <div className={styles.barArea}>
              <div
                className={styles.bar}
                style={{ width: `${widthPct}%`, backgroundColor: color }}
              />
            </div>
            <span className={styles.pct}>{(p.probability * 100).toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );
}
