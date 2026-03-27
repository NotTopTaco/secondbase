import styles from './CountGrid.module.css';

interface CountRow {
  balls: number;
  strikes: number;
  pa: number;
  ba: number | null;
  slg: number | null;
  kPct: number | null;
  bbPct: number | null;
}

interface CountGridProps {
  counts: CountRow[];
  currentBalls: number;
  currentStrikes: number;
}

function fmtBA(v: number | null): string {
  if (v == null || isNaN(v)) return '---';
  return v.toFixed(3).replace(/^0/, '');
}

function fmtPct(v: number | null): string {
  if (v == null || isNaN(v)) return '---';
  return `${v.toFixed(1)}%`;
}

function baCellClass(v: number | null): string {
  if (v == null || isNaN(v)) return '';
  if (v >= 0.3) return styles.hot;
  if (v < 0.2) return styles.cold;
  return '';
}

const ALL_COUNTS: Array<[number, number]> = [
  [0, 0], [0, 1], [0, 2],
  [1, 0], [1, 1], [1, 2],
  [2, 0], [2, 1], [2, 2],
  [3, 0], [3, 1], [3, 2],
];

export function CountGrid({ counts, currentBalls, currentStrikes }: CountGridProps) {
  const lookup = new Map<string, CountRow>();
  for (const row of counts) {
    lookup.set(`${row.balls}-${row.strikes}`, row);
  }

  if (counts.length === 0) {
    return <div className={styles.empty}>No count data available</div>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Count</th>
          <th>PA</th>
          <th>BA</th>
          <th>SLG</th>
          <th>K%</th>
          <th>BB%</th>
        </tr>
      </thead>
      <tbody>
        {ALL_COUNTS.map(([b, s]) => {
          const key = `${b}-${s}`;
          const row = lookup.get(key);
          const isCurrent = b === currentBalls && s === currentStrikes;
          return (
            <tr
              key={key}
              className={isCurrent ? styles.highlight : undefined}
            >
              <td>{key}</td>
              <td>{row?.pa ?? 0}</td>
              <td className={baCellClass(row?.ba ?? null)}>{fmtBA(row?.ba ?? null)}</td>
              <td>{fmtBA(row?.slg ?? null)}</td>
              <td>{fmtPct(row?.kPct ?? null)}</td>
              <td>{fmtPct(row?.bbPct ?? null)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
