import type { BatterVsPitchRow } from '../../stores/matchupStore';
import { PITCH_COLORS, PITCH_LABELS } from '../../theme/colors';
import styles from './StatsTable.module.css';

interface StatsTableProps {
  rows: BatterVsPitchRow[];
  highlightPitchTypes?: string[];
}

function fmtBA(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '---';
  return v.toFixed(3).replace(/^0/, '');
}

function fmtPct(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '---';
  return `${v.toFixed(1)}%`;
}

function fmtVelo(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '---';
  return v.toFixed(1);
}

function fmtAngle(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '---';
  return `${v.toFixed(1)}`;
}

export function StatsTable({ rows, highlightPitchTypes = [] }: StatsTableProps) {
  const sorted = [...rows].sort((a, b) => b.pa - a.pa);
  const highlightSet = new Set(highlightPitchTypes);

  if (sorted.length === 0) {
    return <div className={styles.empty}>No pitch type data available</div>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Pitch Type</th>
          <th>PA</th>
          <th>BA</th>
          <th>SLG</th>
          <th>wOBA</th>
          <th>Whiff%</th>
          <th>Exit Velo</th>
          <th>LA</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((row, idx) => (
          <tr
            key={`${row.pitchType}-${idx}`}
            className={highlightSet.has(row.pitchType) ? styles.highlight : undefined}
          >
            <td>
              <span
                className={styles.pitchDot}
                style={{ backgroundColor: PITCH_COLORS[row.pitchType] ?? '#9898a8' }}
              />
              {PITCH_LABELS[row.pitchType] ?? row.pitchType}
            </td>
            <td>{row.pa}</td>
            <td>{fmtBA(row.ba)}</td>
            <td>{fmtBA(row.slg)}</td>
            <td>{fmtBA(row.wOBA)}</td>
            <td>{fmtPct(row.whiffPct)}</td>
            <td>{fmtVelo(row.exitVelo)}</td>
            <td>{fmtAngle(row.launchAngle)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
