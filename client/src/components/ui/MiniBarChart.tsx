import styles from './MiniBarChart.module.css';

interface MiniBarChartItem {
  label: string;
  value: number;
  color?: string;
}

interface MiniBarChartProps {
  items: MiniBarChartItem[];
  maxValue?: number;
}

export function MiniBarChart({ items, maxValue }: MiniBarChartProps) {
  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1);

  return (
    <div className={styles.chart}>
      {items.map((item) => (
        <div key={item.label} className={styles.row}>
          <span className={styles.label}>{item.label}</span>
          <div className={styles.track}>
            <div
              className={styles.bar}
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color ?? 'var(--accent)',
              }}
            />
          </div>
          <span className={styles.value}>{item.value}%</span>
        </div>
      ))}
    </div>
  );
}
