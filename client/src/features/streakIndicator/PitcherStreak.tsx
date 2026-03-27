import type { PitcherRecentStart } from '../../api/playerApi';
import { StatBlock } from '../../components/ui/StatBlock';
import { TrendArrow } from './TrendArrow';
import { classifyPitcherTrend, formatIP, formatGameScore } from './streakUtils';
import styles from './StreakIndicator.module.css';

interface PitcherStreakProps {
  recentStarts: PitcherRecentStart[];
  seasonAvgGameScore: number | null;
}

function gameScoreColor(gs: number | null): string {
  if (gs == null) return 'var(--text-muted)';
  if (gs >= 60) return 'var(--success)';
  if (gs >= 40) return 'var(--text-secondary)';
  return 'var(--danger)';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function PitcherStreak({ recentStarts, seasonAvgGameScore }: PitcherStreakProps) {
  const scores = recentStarts.map((s) => s.gameScore).filter((v): v is number => v != null);
  const recentAvg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const trend = classifyPitcherTrend(recentAvg, seasonAvgGameScore);

  const maxScore = Math.max(100, ...scores);

  if (recentStarts.length === 0) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Pitcher Recent Games</span>
        </div>
        <div className={styles.noData}>No game data available</div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Pitcher Last {recentStarts.length} Games</span>
        <TrendArrow trend={trend} />
      </div>

      <div className={styles.startsList}>
        {recentStarts.map((start) => (
          <div key={start.gameDate} className={styles.startRow}>
            <span className={styles.startDate}>{formatDate(start.gameDate)}</span>
            <div className={styles.gameScoreBarOuter}>
              <div
                className={styles.gameScoreBarInner}
                style={{
                  width: `${Math.max(0, ((start.gameScore ?? 0) / maxScore) * 100)}%`,
                  backgroundColor: gameScoreColor(start.gameScore),
                }}
              />
            </div>
            <span className={styles.gameScoreValue} style={{ color: gameScoreColor(start.gameScore) }}>
              {formatGameScore(start.gameScore)}
            </span>
            <span className={styles.startMeta}>
              {formatIP(start.outsRecorded)} IP, {start.k}K
            </span>
          </div>
        ))}
      </div>

      <div className={styles.seasonAvg}>
        <StatBlock label="Season Avg GS" value={formatGameScore(seasonAvgGameScore)} size="sm" />
      </div>
    </div>
  );
}
