import { useMemo } from 'react';
import type { TTOSplitRow } from '../../stores/analyticsDataStore';
import styles from './SplitColumns.module.css';

interface SplitColumnsProps {
  splits: TTOSplitRow[];
  currentPass: number;
}

const PASS_LABELS = ['1st', '2nd', '3rd'];

function fmtBA(v: number | null): string {
  if (v == null || isNaN(v)) return '---';
  return v.toFixed(3).replace(/^0/, '');
}

function fmtPct(v: number | null): string {
  if (v == null || isNaN(v)) return '---';
  return `${v.toFixed(1)}%`;
}

function fmtEV(v: number | null): string {
  if (v == null || isNaN(v)) return '---';
  return v.toFixed(1);
}

/**
 * Returns 'better' if the pitcher is performing better (lower offensive numbers)
 * than the season average across all passes, 'worse' if higher, or null if no
 * comparison is possible.
 */
function performanceClass(
  stat: number | null,
  allSplits: TTOSplitRow[],
  key: keyof Pick<TTOSplitRow, 'ba' | 'slg' | 'woba' | 'kPct' | 'bbPct' | 'avgExitVelo'>,
): string | null {
  if (stat == null) return null;

  const vals = allSplits.map((s) => s[key]).filter((v): v is number => v != null);
  if (vals.length < 2) return null;

  const avg = vals.reduce((sum, v) => sum + v, 0) / vals.length;
  const diff = stat - avg;
  const threshold = Math.abs(avg) * 0.03 || 0.005;

  // For K% higher is better for the pitcher; for everything else, lower is better
  if (key === 'kPct') {
    return diff > threshold ? 'better' : diff < -threshold ? 'worse' : null;
  }
  // For BB%, lower is better for pitcher
  return diff < -threshold ? 'better' : diff > threshold ? 'worse' : null;
}

interface StatRowProps {
  label: string;
  value: string;
  colorClass: string | null;
}

function StatRow({ label, value, colorClass }: StatRowProps) {
  const className = [
    styles.statValue,
    colorClass === 'better' ? styles.better : undefined,
    colorClass === 'worse' ? styles.worse : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.statRow}>
      <span className={styles.statLabel}>{label}</span>
      <span className={className}>{value}</span>
    </div>
  );
}

export function SplitColumns({ splits, currentPass }: SplitColumnsProps) {
  const ordered = useMemo(() => {
    const byPass: (TTOSplitRow | null)[] = [null, null, null];
    for (const s of splits) {
      if (s.timesThrough >= 1 && s.timesThrough <= 3) {
        byPass[s.timesThrough - 1] = s;
      }
    }
    return byPass;
  }, [splits]);

  if (splits.length === 0) {
    return <div className={styles.empty}>No time-through-order data available</div>;
  }

  return (
    <div className={styles.grid}>
      {ordered.map((split, idx) => {
        const pass = idx + 1;
        const isCurrent = pass === currentPass;
        const columnClass = [styles.column, isCurrent ? styles.highlighted : undefined]
          .filter(Boolean)
          .join(' ');

        if (!split) {
          return (
            <div key={pass} className={columnClass}>
              <div className={styles.passLabel}>{PASS_LABELS[idx]} Time</div>
              <div className={styles.noData}>No data</div>
            </div>
          );
        }

        return (
          <div key={pass} className={columnClass}>
            <div className={styles.passLabel}>{PASS_LABELS[idx]} Time</div>
            <StatRow label="PA" value={String(split.pa)} colorClass={null} />
            <StatRow
              label="BA"
              value={fmtBA(split.ba)}
              colorClass={performanceClass(split.ba, splits, 'ba')}
            />
            <StatRow
              label="SLG"
              value={fmtBA(split.slg)}
              colorClass={performanceClass(split.slg, splits, 'slg')}
            />
            <StatRow
              label="wOBA"
              value={fmtBA(split.woba)}
              colorClass={performanceClass(split.woba, splits, 'woba')}
            />
            <StatRow
              label="K%"
              value={fmtPct(split.kPct)}
              colorClass={performanceClass(split.kPct, splits, 'kPct')}
            />
            <StatRow
              label="BB%"
              value={fmtPct(split.bbPct)}
              colorClass={performanceClass(split.bbPct, splits, 'bbPct')}
            />
            <StatRow
              label="Avg EV"
              value={fmtEV(split.avgExitVelo)}
              colorClass={performanceClass(split.avgExitVelo, splits, 'avgExitVelo')}
            />
          </div>
        );
      })}
    </div>
  );
}
