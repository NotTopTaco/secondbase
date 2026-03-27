import { useMemo } from 'react';
import type { PitcherPitch } from '../../stores/gameAnalyticsStore';

interface FatigueAlertProps {
  pitches: PitcherPitch[];
  seasonAverages: Record<string, number>;
}

const ROLLING_WINDOW = 5;
const YELLOW_THRESHOLD = 1.5;
const RED_THRESHOLD = 2.5;

export function FatigueAlert({ pitches, seasonAverages }: FatigueAlertProps) {
  const alert = useMemo(() => {
    if (pitches.length < ROLLING_WINDOW) return null;

    // Check each pitch type for fatigue
    const byType = new Map<string, PitcherPitch[]>();
    for (const p of pitches) {
      const arr = byType.get(p.pitchType) ?? [];
      arr.push(p);
      byType.set(p.pitchType, arr);
    }

    let worstDrop = 0;
    let worstType = '';

    for (const [type, typePitches] of byType) {
      const seasonAvg = seasonAverages[type];
      if (seasonAvg == null || typePitches.length < ROLLING_WINDOW) continue;

      // Calculate 5-pitch rolling average from the most recent pitches
      const recent = typePitches.slice(-ROLLING_WINDOW);
      const rollingAvg = recent.reduce((s, p) => s + p.velocity, 0) / ROLLING_WINDOW;
      const drop = seasonAvg - rollingAvg;

      if (drop > worstDrop) {
        worstDrop = drop;
        worstType = type;
      }
    }

    if (worstDrop >= RED_THRESHOLD) {
      return { level: 'red' as const, drop: worstDrop, pitchType: worstType };
    }
    if (worstDrop >= YELLOW_THRESHOLD) {
      return { level: 'yellow' as const, drop: worstDrop, pitchType: worstType };
    }
    return null;
  }, [pitches, seasonAverages]);

  if (!alert) return null;

  const isRed = alert.level === 'red';

  return (
    <div
      style={{
        padding: '8px 12px',
        marginBottom: 8,
        borderRadius: 6,
        background: isRed ? 'rgba(231, 76, 60, 0.15)' : 'rgba(241, 196, 15, 0.15)',
        border: `1px solid ${isRed ? 'rgba(231, 76, 60, 0.4)' : 'rgba(241, 196, 15, 0.4)'}`,
        color: isRed ? '#e74c3c' : '#f1c40f',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span style={{ marginRight: 6 }}>{isRed ? '\u26A0' : '\u26A0'}</span>
      Velocity down {alert.drop.toFixed(1)} mph ({alert.pitchType}) vs season avg
    </div>
  );
}
