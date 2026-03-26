import { PITCH_COLORS, PITCH_LABELS } from '../../theme/colors';
import styles from './UsageAnnotation.module.css';

interface UsageItem {
  pitchType: string;
  percentage: number;
}

interface UsageAnnotationProps {
  items: UsageItem[];
}

export function UsageAnnotation({ items }: UsageAnnotationProps) {
  const sorted = [...items].sort((a, b) => b.percentage - a.percentage);
  const total = sorted.reduce((s, item) => s + item.percentage, 0);

  if (total === 0) return null;

  return (
    <div>
      <div className={styles.label}>Pitch Usage</div>
      <div className={styles.container}>
        {sorted.map((item) => {
          const widthPct = (item.percentage / total) * 100;
          if (widthPct < 3) return null;
          return (
            <div
              key={item.pitchType}
              className={styles.pill}
              style={{
                width: `${widthPct}%`,
                backgroundColor: PITCH_COLORS[item.pitchType] ?? '#9898a8',
              }}
              title={`${PITCH_LABELS[item.pitchType] ?? item.pitchType}: ${item.percentage.toFixed(1)}%`}
            >
              {widthPct > 8 ? `${PITCH_LABELS[item.pitchType] ?? item.pitchType} ${item.percentage.toFixed(0)}%` : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
