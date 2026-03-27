import { Panel } from '../../components/ui/Panel';
import { Spinner } from '../../components/ui/Spinner';
import { usePanelStore } from '../../stores/panelStore';
import { useGameStore } from '../../stores/gameStore';
import { useMatchupStore } from '../../stores/matchupStore';
import { MatchupSummary } from './MatchupSummary';
import { AtBatLog } from './AtBatLog';
import styles from './HeadToHeadPanel.module.css';

const PANEL_ID = 'headToHead';

export function HeadToHeadPanel() {
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const batter = useGameStore((s) => s.batter);
  const pitcher = useGameStore((s) => s.pitcher);
  const h2h = useMatchupStore((s) => s.h2h);
  const loading = useMatchupStore((s) => s.loadingH2H);

  const panelPlayers = [batter, pitcher].filter(Boolean).map(p => ({ id: p!.id, name: p!.name }));

  if (!panel) return null;

  return (
    <Panel
      id={PANEL_ID}
      title={panel.title}
      collapsed={panel.collapsed}
      onToggleCollapse={() => toggleCollapse(PANEL_ID)}
      players={panelPlayers}
      sortable
    >
      {loading ? (
        <Spinner />
      ) : h2h === null || h2h.totalPA === 0 ? (
        <div className={styles.firstMeeting}>First career meeting</div>
      ) : (
        <>
          <MatchupSummary data={h2h} />
          <hr className={styles.divider} />
          <div className={styles.sectionLabel}>At-Bat Log</div>
          <AtBatLog atBats={h2h.atBats} />
        </>
      )}
    </Panel>
  );
}
