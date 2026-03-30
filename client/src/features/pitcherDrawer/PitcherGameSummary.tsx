import { useMemo } from 'react';
import { useReviewStore, type DrawerAtBat } from '../../stores/reviewStore';
import { VelocityChart } from '../pitcherFatigue/VelocityChart';
import { VelocitySummary } from '../pitcherFatigue/VelocitySummary';
import styles from './PitcherGameSummary.module.css';

// ── Result formatting ───────────────────────────────────────

const K_EVENTS = new Set(['Strikeout', 'Strikeout Double Play']);
const BB_EVENTS = new Set(['Walk', 'Intent Walk', 'Hit By Pitch']);
const HIT_EVENTS = new Set(['Single', 'Double', 'Triple', 'Home Run']);
const HR_EVENTS = new Set(['Home Run']);

function getResultLabel(result: string): string {
  if (K_EVENTS.has(result)) return 'K';
  if (BB_EVENTS.has(result)) return 'BB';
  if (HR_EVENTS.has(result)) return 'HR';
  if (HIT_EVENTS.has(result)) return result === 'Single' ? '1B' : result === 'Double' ? '2B' : '3B';
  return 'OUT';
}

function getResultStyle(result: string): string {
  if (HR_EVENTS.has(result)) return styles.resultHR;
  if (HIT_EVENTS.has(result)) return styles.resultHit;
  if (K_EVENTS.has(result)) return styles.resultK;
  if (BB_EVENTS.has(result)) return styles.resultBB;
  return styles.resultOut;
}

// ── Component ───────────────────────────────────────────────

function AtBatRow({ ab }: { ab: DrawerAtBat }) {
  const arrow = ab.halfInning === 'top' ? '\u25B2' : '\u25BC';
  const label = getResultLabel(ab.result);
  return (
    <div className={styles.abRow}>
      <span className={styles.abBatter}>{ab.batter.name}</span>
      <span className={styles.abInning}>{arrow}{ab.inning}</span>
      <span className={`${styles.abResult} ${getResultStyle(ab.result)}`}>{label}</span>
    </div>
  );
}

export function PitcherGameSummary() {
  const pitches = useReviewStore((s) => s.drawerPitcherPitches);
  const atBats = useReviewStore((s) => s.drawerPitcherAtBats);

  // Compute season averages from first-inning pitches (same approach as PitcherFatiguePanel)
  const seasonAverages = useMemo(() => {
    const avgs: Record<string, number> = {};
    if (pitches.length === 0) return avgs;

    const firstInningPitches = pitches.filter((p) => p.inning <= pitches[0].inning);
    const source = firstInningPitches.length > 0 ? firstInningPitches : pitches.slice(0, 15);
    const byType = new Map<string, number[]>();
    for (const p of source) {
      const arr = byType.get(p.pitchType) ?? [];
      arr.push(p.velocity);
      byType.set(p.pitchType, arr);
    }
    for (const [type, velos] of byType) {
      avgs[type] = velos.reduce((s, v) => s + v, 0) / velos.length;
    }
    return avgs;
  }, [pitches]);

  if (pitches.length === 0 && atBats.length === 0) {
    return <div className={styles.empty}>No data for this pitcher</div>;
  }

  return (
    <>
      {pitches.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Velocity</div>
          <VelocityChart pitches={pitches} />
          <VelocitySummary pitches={pitches} seasonAverages={seasonAverages} />
        </div>
      )}

      {atBats.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Batters Faced ({atBats.length})</div>
          <div className={styles.abLog}>
            {atBats.map((ab, i) => (
              <AtBatRow key={i} ab={ab} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
