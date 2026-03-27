import { Panel } from '../../components/ui/Panel';
import { usePanelStore } from '../../stores/panelStore';
import { useAnalyticsDataStore } from '../../stores/analyticsDataStore';
import { Spinner } from '../../components/ui/Spinner';
import { MovementChart } from './MovementChart';

const PANEL_ID = 'pitchMovement';

export function PitchMovementPanel() {
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const pitchMovement = useAnalyticsDataStore((s) => s.pitchMovement);
  const loading = useAnalyticsDataStore((s) => s.loadingPitchMovement);

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
      ) : pitchMovement ? (
        <MovementChart
          pitcher={pitchMovement.pitcher}
          leagueAvg={pitchMovement.leagueAvg}
        />
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-lg)', fontSize: '13px' }}>
          No pitch movement data available
        </div>
      )}
    </Panel>
  );
}
