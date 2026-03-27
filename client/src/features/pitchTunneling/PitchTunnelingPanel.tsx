import { useState, useMemo } from 'react';
import { Panel } from '../../components/ui/Panel';
import { usePanelStore } from '../../stores/panelStore';
import { useGameStore } from '../../stores/gameStore';
import { useAnalyticsDataStore } from '../../stores/analyticsDataStore';
import { Spinner } from '../../components/ui/Spinner';
import { FilterBar } from '../../components/ui/FilterBar';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { TunnelingCanvas } from './TunnelingCanvas';
import { TunnelInsight } from './TunnelInsight';
import { PITCH_LABELS } from '../../theme/colors';
import styles from './tunneling.module.css';

const PANEL_ID = 'pitchTunneling';

const VIEW_OPTIONS = [
  { value: 'side', label: 'Side' },
  { value: 'batter', label: 'Batter' },
];

export function PitchTunnelingPanel() {
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const pitcher = useGameStore((s) => s.pitcher);
  const tunneling = useAnalyticsDataStore((s) => s.pitchTunneling);
  const loading = useAnalyticsDataStore((s) => s.loadingTunneling);

  const [selectedPairIdx, setSelectedPairIdx] = useState(0);
  const [viewMode, setViewMode] = useState('side');

  const pairOptions = useMemo(() => {
    if (!tunneling?.pairs.length) return [];
    return tunneling.pairs.slice(0, 6).map((p, i) => ({
      value: String(i),
      label: `${PITCH_LABELS[p.pitchTypeA] ?? p.pitchTypeA} / ${PITCH_LABELS[p.pitchTypeB] ?? p.pitchTypeB}`,
    }));
  }, [tunneling]);

  // Reset selection when data changes
  const selectedPair = tunneling?.pairs[Number(selectedPairIdx)] ?? tunneling?.bestPair;

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
      ) : !tunneling || tunneling.pairs.length === 0 ? (
        <div className={styles.noData}>No tunneling data available</div>
      ) : (
        <div className={styles.content}>
          <FilterBar>
            {pairOptions.length > 1 && (
              <SegmentedControl
                value={String(selectedPairIdx)}
                onChange={(v) => setSelectedPairIdx(Number(v))}
                options={pairOptions}
              />
            )}
            <SegmentedControl
              value={viewMode}
              onChange={setViewMode}
              options={VIEW_OPTIONS}
            />
          </FilterBar>

          {selectedPair && (
            <>
              <TunnelingCanvas
                pair={selectedPair}
                viewMode={viewMode as 'side' | 'batter'}
              />
              <TunnelInsight pair={selectedPair} />
            </>
          )}
        </div>
      )}
    </Panel>
  );
}
