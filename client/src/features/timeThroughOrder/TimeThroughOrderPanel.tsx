import { Panel } from '../../components/ui/Panel';
import { usePanelStore } from '../../stores/panelStore';
import { useGameStore } from '../../stores/gameStore';
import { useGameAnalyticsStore } from '../../stores/gameAnalyticsStore';
import { useAnalyticsDataStore } from '../../stores/analyticsDataStore';
import { Spinner } from '../../components/ui/Spinner';
import { SplitColumns } from './SplitColumns';

const PANEL_ID = 'timeThroughOrder';

export function TimeThroughOrderPanel() {
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const pitcher = useGameStore((s) => s.pitcher);
  const currentPass = useGameAnalyticsStore((s) => s.currentBatterTTOPass);
  const splits = useAnalyticsDataStore((s) => s.pitcherTTOSplits);
  const loading = useAnalyticsDataStore((s) => s.loadingTTOSplits);

  if (!panel) return null;

  return (
    <Panel
      id={PANEL_ID}
      title={panel.title}
      collapsed={panel.collapsed}
      onToggleCollapse={() => toggleCollapse(PANEL_ID)}
      players={pitcher ? [{ id: pitcher.id, name: pitcher.name }] : []}
      sortable
    >
      {loading ? (
        <Spinner />
      ) : (
        <SplitColumns splits={splits} currentPass={currentPass} />
      )}
    </Panel>
  );
}
