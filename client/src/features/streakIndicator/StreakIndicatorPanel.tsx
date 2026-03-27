import { Panel } from '../../components/ui/Panel';
import { usePanelStore } from '../../stores/panelStore';
import { useAnalyticsDataStore } from '../../stores/analyticsDataStore';
import { Spinner } from '../../components/ui/Spinner';
import { BatterStreak } from './BatterStreak';
import { PitcherStreak } from './PitcherStreak';
import styles from './StreakIndicator.module.css';

const PANEL_ID = 'streakIndicator';

export function StreakIndicatorPanel() {
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const streakData = useAnalyticsDataStore((s) => s.streakData);
  const loading = useAnalyticsDataStore((s) => s.loadingStreak);

  if (!panel) return null;

  return (
    <Panel
      id={PANEL_ID}
      title={panel.title}
      collapsed={panel.collapsed}
      onToggleCollapse={() => toggleCollapse(PANEL_ID)}
      sortable
    >
      {loading ? (
        <Spinner />
      ) : !streakData ? (
        <div className={styles.noData}>No streak data available</div>
      ) : (
        <div className={styles.container}>
          <BatterStreak
            windows={streakData.batter.windows}
            dailyStats={streakData.batter.dailyStats}
          />
          <PitcherStreak
            recentStarts={streakData.pitcher.recentStarts}
            seasonAvgGameScore={streakData.pitcher.seasonAvgGameScore}
          />
        </div>
      )}
    </Panel>
  );
}
