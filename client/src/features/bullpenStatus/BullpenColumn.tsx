import { RelieverRow } from './RelieverRow';
import styles from './BullpenColumn.module.css';

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

interface BullpenColumnProps {
  relievers: Reliever[];
}

export function BullpenColumn({ relievers }: BullpenColumnProps) {
  if (relievers.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 'var(--space-sm) 0' }}>
        No relievers
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {relievers.map((r) => (
        <RelieverRow key={r.id} reliever={r} />
      ))}
    </div>
  );
}
