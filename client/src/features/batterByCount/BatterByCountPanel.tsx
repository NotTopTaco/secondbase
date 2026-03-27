import { Panel } from '../../components/ui/Panel';
import { Spinner } from '../../components/ui/Spinner';
import { usePanelStore } from '../../stores/panelStore';
import { useGameStore } from '../../stores/gameStore';
import { useAnalyticsDataStore } from '../../stores/analyticsDataStore';
import { CountGrid } from './CountGrid';

const PANEL_ID = 'batterByCount';

export function BatterByCountPanel() {
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const batter = useGameStore((s) => s.batter);
  const batterCountStats = useAnalyticsDataStore((s) => s.batterCountStats);
  const loading = useAnalyticsDataStore((s) => s.loadingCountStats);
  const count = useGameStore((s) => s.count);

  if (!panel) return null;

  return (
    <Panel
      id={PANEL_ID}
      title={panel.title}
      collapsed={panel.collapsed}
      onToggleCollapse={() => toggleCollapse(PANEL_ID)}
      players={batter ? [{ id: batter.id, name: batter.name }] : []}
      sortable
    >
      {loading ? (
        <Spinner />
      ) : (
        <CountGrid
          counts={batterCountStats}
          currentBalls={count.balls}
          currentStrikes={count.strikes}
        />
      )}
    </Panel>
  );
}
