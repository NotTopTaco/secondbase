import { useMemo } from 'react';
import { ComparisonStat } from '../../components/ui/ComparisonStat';
import { PITCH_LABELS } from '../../theme/colors';
import type { PitcherPitch } from '../../stores/gameAnalyticsStore';

interface VelocitySummaryProps {
  pitches: PitcherPitch[];
  seasonAverages: Record<string, number>;
}

export function VelocitySummary({ pitches, seasonAverages }: VelocitySummaryProps) {
  const stats = useMemo(() => {
    const byType = new Map<string, number[]>();
    for (const p of pitches) {
      const arr = byType.get(p.pitchType) ?? [];
      arr.push(p.velocity);
      byType.set(p.pitchType, arr);
    }

    const result: Array<{
      pitchType: string;
      label: string;
      gameAvg: number;
      seasonAvg: number | null;
    }> = [];

    for (const [type, velos] of byType) {
      const gameAvg = velos.reduce((s, v) => s + v, 0) / velos.length;
      result.push({
        pitchType: type,
        label: PITCH_LABELS[type] ?? type,
        gameAvg,
        seasonAvg: seasonAverages[type] ?? null,
      });
    }

    // Sort by frequency (most thrown first)
    result.sort((a, b) => {
      const aCount = byType.get(a.pitchType)?.length ?? 0;
      const bCount = byType.get(b.pitchType)?.length ?? 0;
      return bCount - aCount;
    });

    return result;
  }, [pitches, seasonAverages]);

  if (stats.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
      {stats.map((s) => (
        <ComparisonStat
          key={s.pitchType}
          label={s.label}
          current={s.gameAvg}
          baseline={s.seasonAvg}
          format={(v) => v.toFixed(1)}
        />
      ))}
    </div>
  );
}
