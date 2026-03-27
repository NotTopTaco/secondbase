import { useState, useMemo } from 'react';
import { Panel } from '../../components/ui/Panel';
import { usePanelStore } from '../../stores/panelStore';
import { useGameStore } from '../../stores/gameStore';
import { useGameAnalyticsStore } from '../../stores/gameAnalyticsStore';
import { useMatchupStore } from '../../stores/matchupStore';
import { Spinner } from '../../components/ui/Spinner';
import { FilterBar } from '../../components/ui/FilterBar';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { DefensiveFieldCanvas } from './DefensiveFieldCanvas';
import { ShiftBadge } from './ShiftBadge';
import { AlignmentSummary } from './AlignmentSummary';
import { computeOptimalPositions } from './defensivePositioningUtils';
import styles from './DefensiveFieldCanvas.module.css';

const PANEL_ID = 'defensivePositioning';

const SPRAY_OPTIONS = [
  { value: 'on', label: 'Spray On' },
  { value: 'off', label: 'Spray Off' },
];

const OPTIMAL_OPTIONS = [
  { value: 'off', label: 'Optimal Off' },
  { value: 'on', label: 'Optimal On' },
];

export function DefensivePositioningPanel() {
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const batter = useGameStore((s) => s.batter);
  const pitcher = useGameStore((s) => s.pitcher);
  const data = useGameAnalyticsStore((s) => s.defensivePositioning);
  const loading = useGameAnalyticsStore((s) => s.loadingDefensivePositioning);
  const sprayChart = useMatchupStore((s) => s.sprayChart);

  const panelPlayers = [batter, pitcher].filter(Boolean).map(p => ({ id: p!.id, name: p!.name }));

  const [showSpray, setShowSpray] = useState('on');
  const [showOptimal, setShowOptimal] = useState('off');

  const optimalPositions = useMemo(
    () => (showOptimal === 'on' ? computeOptimalPositions(sprayChart) : []),
    [sprayChart, showOptimal],
  );

  if (!panel) return null;

  const fielders = data?.fielders ?? [];
  const alignment = data?.alignment;

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
      ) : (
        <div className={styles.panelContent}>
          {data?.shiftDetected && data.shiftDescription && (
            <ShiftBadge description={data.shiftDescription} />
          )}

          <FilterBar>
            <SegmentedControl value={showSpray} onChange={setShowSpray} options={SPRAY_OPTIONS} />
            <SegmentedControl value={showOptimal} onChange={setShowOptimal} options={OPTIMAL_OPTIONS} />
          </FilterBar>

          <DefensiveFieldCanvas
            fielders={fielders.map(f => ({
              position: f.position,
              svgX: f.svgX,
              svgY: f.svgY,
              playerName: f.playerName,
            }))}
            hits={sprayChart}
            optimalPositions={optimalPositions}
            showSprayDots={showSpray === 'on'}
            showOptimal={showOptimal === 'on'}
          />

          {alignment && (
            <AlignmentSummary
              pullPct={alignment.pullPct}
              centerPct={alignment.centerPct}
              oppoPct={alignment.oppoPct}
            />
          )}
        </div>
      )}
    </Panel>
  );
}
