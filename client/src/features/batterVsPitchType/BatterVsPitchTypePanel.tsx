import { useState } from 'react';
import { Panel } from '../../components/ui/Panel';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Spinner } from '../../components/ui/Spinner';
import { usePanelStore } from '../../stores/panelStore';
import { useMatchupStore } from '../../stores/matchupStore';
import { StatsTable } from './StatsTable';

const PANEL_ID = 'batterVsPitchType';

const HAND_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'L', label: 'vs LHP' },
  { value: 'R', label: 'vs RHP' },
];

const SEASON_OPTIONS = [
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
];

export function BatterVsPitchTypePanel() {
  const [hand, setHand] = useState('all');
  const [season, setSeason] = useState('2025');
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const batterVsPitch = useMatchupStore((s) => s.batterVsPitch);
  const loading = useMatchupStore((s) => s.loadingBatterVsPitch);

  if (!panel) return null;

  return (
    <Panel
      id={PANEL_ID}
      title={panel.title}
      collapsed={panel.collapsed}
      onToggleCollapse={() => toggleCollapse(PANEL_ID)}
      sortable
    >
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)', flexWrap: 'wrap' }}>
        <SegmentedControl options={HAND_OPTIONS} value={hand} onChange={setHand} />
        <SegmentedControl options={SEASON_OPTIONS} value={season} onChange={setSeason} />
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <StatsTable rows={batterVsPitch} />
      )}
    </Panel>
  );
}
