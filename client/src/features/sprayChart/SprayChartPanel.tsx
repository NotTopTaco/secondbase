import { useState, useMemo } from 'react';
import { Panel } from '../../components/ui/Panel';
import { FilterBar } from '../../components/ui/FilterBar';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Spinner } from '../../components/ui/Spinner';
import { usePanelStore } from '../../stores/panelStore';
import { useMatchupStore } from '../../stores/matchupStore';
import { RESULT_COLORS } from '../../theme/colors';
import { sprayDirection } from './sprayChartUtils';
import { SprayChartCanvas } from './SprayChartCanvas';
import { DirectionSummary } from './DirectionSummary';

const RESULT_LEGEND: { label: string; color: string }[] = [
  { label: '1B', color: RESULT_COLORS.single },
  { label: '2B', color: RESULT_COLORS.double },
  { label: '3B', color: RESULT_COLORS.triple },
  { label: 'HR', color: RESULT_COLORS.homeRun },
  { label: 'Out', color: RESULT_COLORS.out },
];

const PANEL_ID = 'sprayChart';

const PITCH_FILTER = [
  { value: 'all', label: 'All' },
  { value: 'FF', label: 'Fastball' },
  { value: 'SL', label: 'Slider' },
  { value: 'CU', label: 'Curve' },
  { value: 'CH', label: 'Change' },
];

const HAND_FILTER = [
  { value: 'all', label: 'All' },
  { value: 'L', label: 'vs LHP' },
  { value: 'R', label: 'vs RHP' },
];

export function SprayChartPanel() {
  const [pitchType, setPitchType] = useState('all');
  const [hand, setHand] = useState('all');
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const sprayChart = useMatchupStore((s) => s.sprayChart);
  const loading = useMatchupStore((s) => s.loadingSprayChart);

  const filtered = useMemo(() => {
    let hits = sprayChart;
    if (pitchType !== 'all') {
      hits = hits.filter((h) => h.pitchType === pitchType);
    }
    if (hand !== 'all') {
      hits = hits.filter((h) => h.pitcherHand === hand);
    }
    return hits;
  }, [sprayChart, pitchType, hand]);

  const directionCounts = useMemo(() => {
    let pull = 0;
    let center = 0;
    let oppo = 0;
    filtered.forEach((h) => {
      const dir = sprayDirection(h.coordX, h.coordY);
      if (dir === 'pull') pull++;
      else if (dir === 'center') center++;
      else oppo++;
    });
    return { pull, center, oppo };
  }, [filtered]);

  if (!panel) return null;

  return (
    <Panel
      id={PANEL_ID}
      title={panel.title}
      collapsed={panel.collapsed}
      onToggleCollapse={() => toggleCollapse(PANEL_ID)}
      sortable
    >
      <FilterBar>
        <SegmentedControl options={PITCH_FILTER} value={pitchType} onChange={setPitchType} />
        <SegmentedControl options={HAND_FILTER} value={hand} onChange={setHand} />
      </FilterBar>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <SprayChartCanvas hits={filtered} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', padding: '8px 0', flexWrap: 'wrap' }}>
            {RESULT_LEGEND.map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color, display: 'inline-block' }} />
                {item.label}
              </div>
            ))}
          </div>
          <DirectionSummary
            pull={directionCounts.pull}
            center={directionCounts.center}
            oppo={directionCounts.oppo}
          />
        </>
      )}
    </Panel>
  );
}
