import { useState } from 'react';
import type { StreakWindow, BatterDailyStat } from '../../api/playerApi';
import { ComparisonStat } from '../../components/ui/ComparisonStat';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Sparkline } from './Sparkline';
import { TrendArrow } from './TrendArrow';
import { classifyBatterTrend, formatBA, formatPct } from './streakUtils';
import styles from './StreakIndicator.module.css';

interface BatterStreakProps {
  windows: StreakWindow[];
  dailyStats: BatterDailyStat[];
}

const WINDOW_OPTIONS = [
  { value: '7d', label: '7 Day' },
  { value: '14d', label: '14 Day' },
];

export function BatterStreak({ windows, dailyStats }: BatterStreakProps) {
  const [selectedWindow, setSelectedWindow] = useState('7d');

  const rolling = windows.find((w) => w.window === selectedWindow);
  const season = windows.find((w) => w.window === 'season');

  const trend = classifyBatterTrend(rolling?.woba ?? null, season?.woba ?? null);
  const insufficientData = (rolling?.gamesPlayed ?? 0) < 2;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Batter Trend</span>
        <TrendArrow trend={trend} />
      </div>

      <SegmentedControl
        value={selectedWindow}
        onChange={setSelectedWindow}
        options={WINDOW_OPTIONS}
      />

      {insufficientData ? (
        <div className={styles.noData}>Insufficient data ({rolling?.gamesPlayed ?? 0} games)</div>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <ComparisonStat
              label="BA"
              current={rolling?.ba ?? null}
              baseline={season?.ba ?? null}
              format={formatBA}
            />
            <ComparisonStat
              label="SLG"
              current={rolling?.slg ?? null}
              baseline={season?.slg ?? null}
              format={formatBA}
            />
            <ComparisonStat
              label="wOBA"
              current={rolling?.woba ?? null}
              baseline={season?.woba ?? null}
              format={formatBA}
            />
            <ComparisonStat
              label="K%"
              current={rolling?.kPct ?? null}
              baseline={season?.kPct ?? null}
              format={formatPct}
              invertColor
            />
          </div>

          <Sparkline
            values={dailyStats.map((d) => d.woba)}
            baseline={season?.woba ?? null}
            trend={trend}
          />
        </>
      )}
    </div>
  );
}
