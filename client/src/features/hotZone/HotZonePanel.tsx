import { useState } from 'react';
import { Panel } from '../../components/ui/Panel';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Spinner } from '../../components/ui/Spinner';
import { usePanelStore } from '../../stores/panelStore';
import { useMatchupStore } from '../../stores/matchupStore';
import { HotZoneCanvas } from './HotZoneCanvas';

const PANEL_ID = 'hotZone';

const METRIC_OPTIONS = [
  { value: 'wOBA', label: 'wOBA' },
  { value: 'BA', label: 'BA' },
  { value: 'SLG', label: 'SLG' },
];

const PERIOD_OPTIONS = [
  { value: 'season', label: 'Season' },
  { value: 'last30', label: 'Last 30' },
  { value: 'career', label: 'Career' },
];

export function HotZonePanel() {
  const [metric, setMetric] = useState('wOBA');
  const [period, setPeriod] = useState('season');
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const hotZones = useMatchupStore((s) => s.hotZones);
  const loading = useMatchupStore((s) => s.loadingHotZones);

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
        <SegmentedControl options={METRIC_OPTIONS} value={metric} onChange={setMetric} />
        <SegmentedControl options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <HotZoneCanvas zones={hotZones} metric={metric} />
      )}
    </Panel>
  );
}
